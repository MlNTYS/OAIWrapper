import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Title, Text, Stack, Box, Divider } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Footer from '../../components/Footer';
import MessageCard from '../../components/MessageCard';

export default function ConversationPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState('새 대화');

  const { data: conv, isLoading } = useQuery(
    ['conversation', id],
    () => api.get(`/conversations/${id}`).then((res) => res.data),
    { enabled: !!id && !isNew }
  );

  // conversationId가 변경되면 이전 메시지 초기화
  useEffect(() => {
    setMessages([]);
  }, [id]);

  // 서버 데이터 로드 시 메시지 및 타이틀 설정
  useEffect(() => {
    if (isNew) {
      setTitle('새 대화');
    } else if (conv && conv.messages) {
      setTitle(conv.title);
      setMessages(conv.messages);
    }
  }, [conv, isNew]);

  const handleSend = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const handleReceive = (message) => {
    const { role, content } = message;
    if (role === 'assistant') {
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].role === 'assistant') {
          const last = prev[prev.length - 1];
          const updated = { ...last, content: last.content + content };
          return [...prev.slice(0, -1), updated];
        }
        return [...prev, { role, content }];
      });
    } else {
      setMessages((prev) => [...prev, message]);
    }
  };

  const handleNewConversation = (convId) => {
    // 전체 페이지 리렌더링을 위해 shallow 옵션 제거
    router.replace(`/conversations/${convId}`);
  };

  const handleTitle = (newTitle) => {
    setTitle(newTitle);
  };

  return (
    <Box sx={(theme) => ({
      backgroundColor: theme.colors.dark[8],
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      // 페이지 스크롤 사용
    })}>
      {/* 메시지 리스트 */}
      <Box sx={(theme) => ({
        flex: 1,
        padding: theme.spacing.md,
        paddingBottom: 140, // footer 높이 공간 확보 (내부 패딩)
        width: '100%',
        maxWidth: 800,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
      })}>
        {isLoading && !isNew && <Text align="center">로딩 중...</Text>}
        {(isNew || (!isNew && !isLoading && messages.length === 0)) && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Text align="center" size="lg">안녕하세요! 어떤 질문이 있으신가요?</Text>
          </Box>
        )}
        {/* isLoading 중에는 메시지 매핑 건너뜀 */}
        {!isLoading && messages.map((msg, idx) => (
          <MessageCard key={idx} content={msg.content} isUser={msg.role === 'user'} />
        ))}
      </Box>
      {/* Footer 고정 */}
      <Footer
        conversationId={isNew ? undefined : id}
        onSend={handleSend}
        onReceive={handleReceive}
        onNewConversation={handleNewConversation}
        onTitle={handleTitle}
      />
    </Box>
  );
} 