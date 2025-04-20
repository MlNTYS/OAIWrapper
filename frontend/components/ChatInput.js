import { useState, useRef } from 'react';
import { Textarea, Button, Group } from '@mantine/core';
import useModelStore from '../store/useModelStore';
import api from '../utils/api';

export default function ChatInput({ conversationId, onSend, onReceive, onNewConversation }) {
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const controllerRef = useRef(null);
  let newIdCalled = false;
  const model = useModelStore((state) => state.selectedModel);

  const handleSubmit = async () => {
    if (!input.trim() || isStreaming) return;
    const userMessage = { role: 'user', content: input };
    onSend(userMessage);
    setInput('');
    setIsStreaming(true);

    // prepare request body
    const body = {
      model: model.api_name,
      messages: [userMessage],
    };
    if (conversationId) body.conversationId = conversationId;

    controllerRef.current = new AbortController();
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
        signal: controllerRef.current.signal,
      });
      if (!response.body) throw new Error('스트리밍을 지원하지 않는 환경입니다.');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        buffer += chunk;
        const parts = buffer.split('\n\n');
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i].replace(/^data: ?/, '').trim();
          buffer = parts.slice(i + 1).join('\n\n');
          if (part === '[DONE]') continue;
          try {
            const data = JSON.parse(part);
            // handle new conversation id
            const newId = data.conversationId || data.id;
            if (!conversationId && !newIdCalled && newId) {
              onNewConversation(newId);
              newIdCalled = true;
            }
            onReceive({ role: 'assistant', content: data.content });
          } catch (err) {
            console.error('Parsing SSE chunk failed', err);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAbort = () => {
    if (controllerRef.current) controllerRef.current.abort();
    setIsStreaming(false);
  };

  return (
    <Group position="apart" spacing="sm" mt="md" align="flex-end">
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
      />
      {isStreaming ? (
        <Button color="red" onClick={handleAbort} loading>
          중단
        </Button>
      ) : (
        <Button onClick={handleSubmit}>전송</Button>
      )}
    </Group>
  );
} 