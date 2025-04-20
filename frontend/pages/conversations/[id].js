import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Title, Text, Stack, Box } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import ChatInput from '../../components/ChatInput';

export default function ConversationPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const { data: conv, isLoading } = useQuery(
    ['conversation', id],
    () => api.get(`/conversations/${id}`).then((res) => res.data),
    { enabled: !!id && !isNew }
  );

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (conv && conv.messages) {
      setMessages(conv.messages);
    } else if (isNew) {
      setMessages([]);
    }
  }, [conv, isNew]);

  const handleSend = (message) => setMessages((prev) => [...prev, message]);
  const handleReceive = (message) => setMessages((prev) => [...prev, message]);

  return (
    <Container fluid mt="md">
      <Stack spacing="md">
        <Title order={2}>{conv?.title || '새 대화'}</Title>
        <Box style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {isLoading ? (
            <Text align="center">로딩 중...</Text>
          ) : messages.length === 0 ? (
            <Text align="center" size="lg">안녕하세요!</Text>
          ) : (
            messages.map((msg, idx) => (
              <Box key={idx} sx={{ textAlign: msg.role === 'user' ? 'right' : 'left', marginBottom: 8 }}>
                <Text color={msg.role === 'user' ? 'blue' : 'gray'}>{msg.content}</Text>
              </Box>
            ))
          )}
        </Box>
        <ChatInput
          conversationId={isNew ? undefined : id}
          onSend={handleSend}
          onReceive={handleReceive}
          onNewConversation={(newId) => {
            router.replace(`/conversations/${newId}`);
          }}
        />
      </Stack>
    </Container>
  );
} 