import { useState, useRef, useEffect } from 'react';
import { Textarea, Group, Button, Flex, Box, createStyles, keyframes, ActionIcon } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import ModelSelect from './ModelSelect';
import useModelStore from '../store/useModelStore';
import { useRouter } from 'next/router';
import { showNotification } from '@mantine/notifications';
import { IconPhoto } from '@tabler/icons-react';

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

export default function Footer({ conversationId, onSend, onReceive, onTitle, lastModelId }) {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const { classes } = useStyles({ offsetLeft: isDesktop ? SIDEBAR_WIDTH : 0 });
  const theme = useMantineTheme();
  const queryClient = useQueryClient();
  const selectedModel = useModelStore((state) => state.selectedModel);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const controllerRef = useRef(null);
  const localConvIdRef = useRef(conversationId);
  const router = useRouter();
  
  // 이미지 업로드 상태
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);

  // 마지막 전송 메시지 배열 저장
  const lastMessagesRef = useRef([]);

  // Skip abort on first conversationId change (initial conversation creation)
  const isFirstConvChange = useRef(true);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) { setSelectedFile(file); setPreviewUrl(URL.createObjectURL(file)); }
    e.target.value = null;
  };
  const handleRemoveFile = () => { if (previewUrl) URL.revokeObjectURL(previewUrl); setSelectedFile(null); setPreviewUrl(null); };

  useEffect(() => { localConvIdRef.current = conversationId; }, [conversationId]);
  useEffect(() => {
    // Skip first run to avoid aborting initial stream
    if (isFirstConvChange.current) {
      isFirstConvChange.current = false;
      return;
    }
    // Reset controller on conversation change
    controllerRef.current?.abort();
    setIsStreaming(false);
    setShowRetry(false);
    setLimitExceeded(false);
  }, [conversationId]);
  useEffect(() => { lastMessagesRef.current = []; }, [conversationId]);
  
  // 메시지 전송 및 스트리밍 처리 함수
  const startStream = async (messagesParam, convId) => {
    queryClient.invalidateQueries(['conversations']);
    setIsStreaming(true);
    setShowRetry(false);
    setLimitExceeded(false);
    controllerRef.current = new AbortController();
    if (onTitle && convId) {
      api.get(`/conversations/${convId}`)
        .then((res) => onTitle(res.data.title))
        .catch((err) => console.error('제목 요청 실패', err));
    }
    try {
      const accessToken = localStorage.getItem('accessToken');
      // CSRF 토큰 읽기
      const xsrfToken = document.cookie.split('; ').find(c => c.trim().startsWith('XSRF-TOKEN='))?.split('=')[1];
      const headers = {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(xsrfToken ? { 'X-XSRF-TOKEN': xsrfToken } : {}),
      };
      // Construct absolute stream URL to avoid BodyStreamBuffer aborted errors
      const streamUrl = `${window.location.origin}/api/chat/stream`;
      const response = await fetch(
        streamUrl,
        {
          method: 'POST',
          headers,
          credentials: 'include',
          body: JSON.stringify({ model: selectedModel?.api_name, messages: messagesParam, conversationId: convId }),
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
          const raw = parts[i];
          buffer = parts.slice(i + 1).join('\n\n');
          const lines = raw.split('\n');
          let eventType = 'message';
          let dataLine = null;
          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.replace('event: ', '').trim();
            } else if (line.startsWith('data:')) {
              dataLine = line.replace(/^data:\s*/, '');
            }
          }
          if (!dataLine) continue;
          if (dataLine === '[DONE]' && eventType === 'message') continue;
          try {
            const data = JSON.parse(dataLine);
            if (eventType === 'message' && data.content !== undefined) {
              onReceive({ role: 'assistant', content: data.content });
            } else if (eventType === 'warning' && data.warning) {
              showNotification({ title: '경고', message: data.warning, color: 'yellow', position: 'top-right' });
            } else if (eventType === 'error' && data.error) {
              onReceive({ role: 'assistant', content: data.error });
              setLimitExceeded(true);
              controllerRef.current?.abort();
            }
          } catch (e) {
            console.error('Failed to parse SSE data', e);
          }
        }
      }
    } catch (err) {
      // Ignore fetch read AbortError and body stream abort
      if (err.name === 'AbortError' || (err.message && err.message.includes('BodyStreamBuffer was aborted'))) return;
      console.error(err);
      setShowRetry(true);
    } finally {
      setIsStreaming(false);
    }
  };

  // 최초 메시지 전송 핸들러 (첫번째 방식)
  const handleSubmit = async () => {
    if (isStreaming || !selectedModel?.api_name || limitExceeded || (!input.trim() && !selectedFile)) return;

    let convId = localConvIdRef.current;
    if (!convId) {
      try {
        // 1) 새 대화 생성
        const res = await api.post('/conversations');
        convId = res.data.id;
        localConvIdRef.current = convId;
        // 2) URL 업데이트 대기 (shallow routing)
        await router.replace(`/conversations/${convId}`, undefined, { shallow: true });
      } catch (err) {
        console.error('Conversation 생성 실패', err);
        setShowRetry(true);
        return;
      }
    }

    const messagesToSend = [];
    // 이미지 업로드
    if (selectedFile) {
      const formData = new FormData();
      formData.append('file', selectedFile);
      try {
        // Upload image and get full URL from backend
        console.log('Attempting to upload image to:', '/images');
        console.log('API baseURL:', api.defaults.baseURL);
        const uploadRes = await api.post('/images', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        const { assetId, url } = uploadRes.data;
        onSend({ role: 'user', type: 'image', assetId, url });
        messagesToSend.push({ role: 'user', type: 'image', assetId, url });
        handleRemoveFile();
      } catch (err) {
        showNotification({ title: '오류', message: '이미지 업로드 실패', color: 'red', position: 'top-right' });
        return;
      }
    }
    // 텍스트 메시지
    if (input.trim()) {
      const messageObj = { role: 'user', content: input };
      onSend(messageObj);
      messagesToSend.push(messageObj);
      setInput('');
    }
    // 마지막 전송 메시지 보관
    lastMessagesRef.current = messagesToSend;
    startStream(lastMessagesRef.current, convId);
  };

  // 스트림 중단 핸들러
  const handleAbort = () => {
    controllerRef.current?.abort();
    setIsStreaming(false);
  };

  // 재시도 핸들러
  const handleRetry = () => {
    const convId = localConvIdRef.current;
    const messages = lastMessagesRef.current;
    if (convId && messages.length > 0) {
      startStream(messages, convId);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.currentTarget.value);
  };

  return (
    <Box className={classes.footer}>
      <Box className={classes.footerContent}>
        <Box mb="xs" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ModelSelect lastModelId={lastModelId} />
          <ActionIcon size="lg" variant="light" onClick={() => fileInputRef.current?.click()}>
            <IconPhoto size={20} />
          </ActionIcon>
          {previewUrl && (
            <>
              <Box ml="sm" sx={{ position: 'relative', display: 'inline-block' }}>
                <img src={previewUrl} alt="preview" style={{ maxHeight: '80px', maxWidth: '80px', borderRadius: 4 }} />
                <Button size="xs" color="red" variant="filled" onClick={handleRemoveFile} sx={{ position: 'absolute', top: -4, right: -4, minWidth: 0 }}>X</Button>
              </Box>
              <Box ml="xs" sx={{ display: 'inline-block', color: '#ffec99', fontSize: 13, fontWeight: 500 }}>
                아직 이미지는 하나만 첨부할 수 있습니다.
              </Box>
            </>
          )}
        </Box>
        {/* 숨겨진 파일 입력 */}
        <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
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
            disabled={isStreaming || limitExceeded}
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
            <Button onClick={handleSubmit} disabled={!selectedModel?.api_name || limitExceeded} color="royal-blue" sx={{ backgroundColor: theme.colors['royal-blue'][7], transition: 'background-color 200ms ease', '&:hover': { backgroundColor: theme.colors['royal-blue'][6] }, '&:disabled': { backgroundColor: theme.colors.dark[6], color: theme.colors.dark[3], opacity: 0.6 } }}>
              전송
            </Button>
          )}
        </Group>
      </Box>
      {/* 안내 문구 추가 */}
      <div style={{ marginTop: '8px', textAlign: 'center', color: '#ffb300', fontSize: '0.95em', opacity: 0.85 }}>
        AI는 실수할 수 있습니다. 중요한 정보는 확인하세요.
      </div>
    </Box>
  );
} 