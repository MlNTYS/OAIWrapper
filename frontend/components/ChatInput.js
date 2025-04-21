import { useState, useRef, useEffect } from 'react';
import { Textarea, Button, Group, useMantineTheme, Flex, Box } from '@mantine/core';
import useModelStore from '../store/useModelStore';
import api from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';
import ModelSelect from './ModelSelect';

export default function ChatInput({ conversationId, onSend, onReceive, onNewConversation, onTitle }) {
  const queryClient = useQueryClient();
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showRetry, setShowRetry] = useState(false);
  const lastUserMessageRef = useRef(null);
  const controllerRef = useRef(null);
  const model = useModelStore((state) => state.selectedModel);
  const theme = useMantineTheme();

  // 로컬 conversationId 유지
  const localConvIdRef = useRef(conversationId);
  useEffect(() => {
    localConvIdRef.current = conversationId;
  }, [conversationId]);

  // SSE 스트리밍 시작
  const startStream = async (message, convId) => {
    // 사이드바 대화 리스트 새로고침
    queryClient.invalidateQueries(['conversations']);
    setIsStreaming(true);
    setShowRetry(false);
    controllerRef.current = new AbortController();
    // 스트림 시작 시 대화 제목 요청
    if (onTitle && convId) {
      api.get(`/conversations/${convId}`)
        .then((res) => {
          onTitle(res.data.title);
        })
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
          body: JSON.stringify({ model: model.api_name, messages: [message], conversationId: convId }),
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
    if (!input.trim() || isStreaming || !model?.api_name) return;
    const message = { role: 'user', content: input };
    onSend(message);
    setInput('');
    lastUserMessageRef.current = message;

    // conversationId 없으면 생성
    let convId = localConvIdRef.current;
    if (!convId) {
      try {
        const res = await api.post('/conversations');
        convId = res.data.id;
        localConvIdRef.current = convId;
        onNewConversation(convId);
        // 사이드바 대화 리스트 갱신
        queryClient.invalidateQueries(['conversations']);
      } catch (err) {
        console.error('Conversation 생성 실패', err);
        setShowRetry(true);
      }
      return;
    }

    // 이미 conversationId 있으면 바로 스트림 시작
    startStream(message, convId);
  };

  // URL 변경 후 저장된 메시지로 스트림 시작
  useEffect(() => {
    const convId = conversationId;
    const message = lastUserMessageRef.current;
    if (convId && message) {
      startStream(message, convId);
    }
  }, [conversationId]);

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

  return (
    <Box>
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
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          sx={(theme) => ({
            '& textarea': {
              backgroundColor: theme.colors.dark[7],
              color: theme.white,
              border: `1px solid ${theme.colors.dark[6]}`,
              '&::placeholder': {
                color: theme.colors.dark[3]
              }
            },
            '& textarea:focus': {
              borderColor: theme.colors['lavender'][6],
              boxShadow: `0 0 0 2px ${theme.fn.rgba(theme.colors['lavender'][7], 0.25)}`,
            }
          })}
        />
        {isStreaming ? (
          <Button 
            color="burgundy" 
            onClick={handleAbort} 
            loading
            sx={{
              '&:hover': {
                backgroundColor: theme.colors['burgundy'][7],
              }
            }}
          >
            중단
          </Button>
        ) : showRetry ? (
          <Button 
            onClick={handleRetry} 
            color="sage-green"
            variant="outline"
            sx={{
              borderColor: theme.colors['sage-green'][7],
              color: theme.colors['sage-green'][4],
              '&:hover': {
                backgroundColor: theme.fn.rgba(theme.colors['sage-green'][9], 0.25),
              }
            }}
          >
            재시도
          </Button>
        ) : (
          <Button 
            onClick={handleSubmit} 
            disabled={!model?.api_name}
            color="royal-blue"
            sx={{
              backgroundColor: theme.colors['royal-blue'][7],
              transition: 'background-color 200ms ease',
              '&:hover': {
                backgroundColor: theme.colors['royal-blue'][6],
              },
              '&:disabled': {
                backgroundColor: theme.colors.dark[6],
                color: theme.colors.dark[3],
                opacity: 0.6
              }
            }}
          >
            전송
          </Button>
        )}
      </Group>
    </Box>
  );
} 