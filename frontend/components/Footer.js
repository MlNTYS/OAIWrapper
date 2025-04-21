import { useState, useRef, useEffect } from 'react';
import { Textarea, Group, Button, Flex, Box, createStyles, keyframes } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import ModelSelect from './ModelSelect';
import useModelStore from '../store/useModelStore';

const SIDEBAR_WIDTH = 256;          // 사이드바 실제 너비(px)

const typingAnimation = keyframes({
  '0%': { opacity: 0.3 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.3 },
});

const useStyles = createStyles((theme, { offsetLeft }) => ({
  footer: {
    position: 'fixed',
    bottom: 0,
    left: offsetLeft,                         // ← 미디어쿼리로 넘겨줌
    width: `calc(100% - ${offsetLeft}px)`,   // ← 남은 가로 영역
    zIndex: 200,
    borderTop: `1px solid ${theme.fn.rgba(theme.colors.dark[5], 0.5)}`,
    backgroundColor: theme.colors.dark[8],
    padding: theme.spacing.md,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    boxSizing: 'border-box',
  },
  
  textarea: {
    backgroundColor: theme.colors.dark[7],
    borderColor: theme.colors.dark[5],
    borderRadius: theme.radius.md,
    transition: 'all 0.2s ease',
    fontSize: theme.fontSizes.md,
    flex: 1,
    height: 48,
    minHeight: 48,
    maxHeight: 48,
    resize: 'none',
    
    '&:focus': {
      borderColor: theme.colors['royal-blue'][6],
      boxShadow: `0 0 0 2px ${theme.fn.rgba(theme.colors['royal-blue'][5], 0.2)}`,
    }
  },
  
  sendButton: {
    backgroundColor: theme.colors['royal-blue'][7],
    borderRadius: theme.radius.md,
    height: 38,
    width: 38,
    marginLeft: theme.spacing.xs,
    alignSelf: 'flex-end',
    
    '&:hover': {
      backgroundColor: theme.colors['royal-blue'][6],
    },
    
    '&:disabled': {
      opacity: 0.6,
    }
  },
  
  modelSelect: {
    width: 220,
    [theme.fn.smallerThan('sm')]: {
      width: 150,
    },
    '.mantine-Select-input': {
      backgroundColor: theme.colors.dark[7],
      height: 36,
      minHeight: 36,
      border: `1px solid ${theme.colors.dark[5]}`,
      fontSize: theme.fontSizes.sm,
    },
    '.mantine-Select-dropdown': {
      backgroundColor: theme.colors.dark[7],
      border: `1px solid ${theme.colors.dark[5]}`,
    },
    '.mantine-Select-item': {
      fontSize: theme.fontSizes.sm,
      '&[data-selected]': {
        backgroundColor: theme.fn.rgba(theme.colors['royal-blue'][7], 0.2),
      },
      '&[data-hovered]': {
        backgroundColor: theme.fn.rgba(theme.colors.dark[5], 0.7),
      }
    }
  },
  
  modelInfo: {
    color: theme.colors.blue[4],
    fontWeight: 500,
    fontSize: theme.fontSizes.xs,
    marginLeft: 8,
  },
  
  typingIndicator: {
    height: 8,
    width: 8,
    borderRadius: '50%',
    backgroundColor: theme.colors['sage-green'][5],
    display: 'inline-block',
    margin: '0 2px',
    animation: `${typingAnimation} 1s infinite ease-in-out`,
  },
  
  typingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  
  formContainer: {
    flex: 1,
    width: '100%',
    maxWidth: '100%',
  },

  statusContainer: {
    minWidth: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 36
  },
  
  footerContent: {
    width: '100%',
    maxWidth: 1200,
    margin: '0 auto',
  }
}));

export default function Footer({ conversationId, onSend, onReceive, onNewConversation, onTitle }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { classes } = useStyles({ offsetLeft: isDesktop ? SIDEBAR_WIDTH : 0 });
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const lastUserMessageRef = useRef(null);
  const controllerRef = useRef(null);
  const localConvIdRef = useRef(conversationId);
  
  useEffect(() => { localConvIdRef.current = conversationId; }, [conversationId]);
  useEffect(() => {
    const convId = conversationId;
    const message = lastUserMessageRef.current;
    if (convId && message) {
      startStream(message, convId);
    }
  }, [conversationId]);
  
  // 메시지 전송 및 스트리밍 처리 함수
  const startStream = async (message, convId) => {
    queryClient.invalidateQueries(['conversations']);
    setIsStreaming(true);
    setShowRetry(false);
    controllerRef.current = new AbortController();
    if (onTitle && convId) {
      api.get(`/conversations/${convId}`)
        .then((res) => onTitle(res.data.title))
        .catch((err) => console.error('제목 요청 실패', err));
    }
    try {
      const accessToken = localStorage.getItem('accessToken');
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ model: selectedModel?.api_name, messages: [message], conversationId: convId }),
          signal: controllerRef.current.signal,
        }
      );
      if (!response.body) throw new Error('스트리밍을 지원하지 않는 환경입니다.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value);
        const parts = buffer.split('\n\n');
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i].replace(/^data: ?/, '').trim();
          buffer = parts.slice(i + 1).join('\n\n');
          if (part === '[DONE]') continue;
          try {
            const data = JSON.parse(part);
            if (data.content !== undefined) {
              onReceive({ role: 'assistant', content: data.content });
            }
          } catch {
            // ignore
          }
        }
      }
    } catch (err) {
      console.error(err);
      setShowRetry(true);
    } finally {
      setIsStreaming(false);
    }
  };

  // 최초 메시지 전송 핸들러
  const handleSubmit = async () => {
    if (!input.trim() || isStreaming || !selectedModel?.api_name) return;
    const messageObj = { role: 'user', content: input };
    onSend(messageObj);
    setInput('');
    lastUserMessageRef.current = messageObj;
    let convId = localConvIdRef.current;
    if (!convId) {
      try {
        const res = await api.post('/conversations');
        convId = res.data.id;
        localConvIdRef.current = convId;
        onNewConversation(convId);
        queryClient.invalidateQueries(['conversations']);
      } catch (err) {
        console.error('Conversation 생성 실패', err);
        setShowRetry(true);
      }
      return;
    }
    startStream(messageObj, convId);
  };

  // 스트림 중단 핸들러
  const handleAbort = () => {
    controllerRef.current?.abort();
    setIsStreaming(false);
  };

  // 재시도 핸들러
  const handleRetry = () => {
    const convId = localConvIdRef.current;
    const message = lastUserMessageRef.current;
    if (convId && message) {
      startStream(message, convId);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.currentTarget.value);
  };

  return (
    <Box className={classes.footer}>
      <Box className={classes.footerContent}>
        <Flex justify="flex-end" align="center" mb="xs">
          <ModelSelect />
        </Flex>
        <Group position="apart" spacing="sm" align="flex-end">
          <Textarea
            placeholder="메시지를 입력하세요..."
            autosize
            minRows={2}
            maxRows={6}
            style={{ flex: 1 }}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isStreaming}
            sx={(theme) => ({
              '& textarea': {
                backgroundColor: theme.colors.dark[7],
                color: theme.white,
                border: `1px solid ${theme.colors.dark[6]}`,
                '&::placeholder': { color: theme.colors.dark[3] },
              },
              '& textarea:focus': {
                borderColor: theme.colors['lavender'][6],
                boxShadow: `0 0 0 2px ${theme.fn.rgba(theme.colors['lavender'][7], 0.25)}`,
              },
            })}
          />
          {isStreaming ? (
            <Button color="burgundy" onClick={handleAbort} loading sx={{ '&:hover': { backgroundColor: theme.colors['burgundy'][7] } }}>
              중단
            </Button>
          ) : showRetry ? (
            <Button onClick={handleRetry} color="sage-green" variant="outline" sx={{ borderColor: theme.colors['sage-green'][7], color: theme.colors['sage-green'][4], '&:hover': { backgroundColor: theme.fn.rgba(theme.colors['sage-green'][9], 0.25) } }}>
              재시도
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!selectedModel?.api_name} color="royal-blue" sx={{ backgroundColor: theme.colors['royal-blue'][7], transition: 'background-color 200ms ease', '&:hover': { backgroundColor: theme.colors['royal-blue'][6] }, '&:disabled': { backgroundColor: theme.colors.dark[6], color: theme.colors.dark[3], opacity: 0.6 } }}>
              전송
            </Button>
          )}
        </Group>
      </Box>
    </Box>
  );
} 