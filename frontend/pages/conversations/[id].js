import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { Container, Title, Text, Stack, Box, Divider } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/api';
import Footer from '../../components/Footer';
import MessageCard from '../../components/MessageCard';
import useModelStore from '../../store/useModelStore';

export default function ConversationPage() {
  const router = useRouter();
  const { id } = router.query;
  const isNew = id === 'new';

  const [messages, setMessages] = useState([]);
  const [title, setTitle] = useState('새 대화');
  const [lastModelId, setLastModelId] = useState(null);
  const setSelectedModel = useModelStore(state => state.setSelectedModel);

  const { data: conv, isLoading } = useQuery(
    ['conversation', id],
    () => api.get(`/conversations/${id}`).then((res) => res.data),
    { enabled: !!id && !isNew }
  );

  // conversation id 변경 시 이전 메시지 초기화 (new->conv 케이스만 제외)
  const prevIdRef = useRef(id);
  useEffect(() => {
    const oldId = prevIdRef.current;
    const newId = id;
    if (newId !== oldId && !(oldId === 'new' && newId !== 'new')) {
      setMessages([]);
    }
    prevIdRef.current = newId;
  }, [id]);

  // 서버 데이터 로드 시 메시지 및 타이틀 설정
  useEffect(() => {
    if (isNew) {
      setTitle('새 대화');
      setLastModelId(null);
      // Reset model for new conversation if needed
      // Optionally, uncomment to reset global model: setSelectedModel(null);
    } else if (conv && conv.messages) {
      setTitle(conv.title);
      // 로컬 메시지가 없을 때만 서버 메시지로 초기화
      setMessages((prev) => prev.length === 0 ? conv.messages : prev);
      // 저장된 마지막 모델 ID 설정
      if (conv.last_model) {
        setLastModelId(conv.last_model.id);
        setSelectedModel(conv.last_model);
      }
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
        {/* 메시지 리스트: 로컬 state가 있으면 바로 표시 */}
        {messages.map((msg, idx) => (
          <MessageCard key={idx} content={msg.content} isUser={msg.role === 'user'} />
        ))}
        {/* 서버 로딩 중이고 메시지 없을 때만 로딩 표시 */}
        {isLoading && messages.length === 0 && !isNew && (
          <Text align="center">로딩 중...</Text>
        )}
        {/* 메시지 없고 로딩도 아니면 플레이스홀더 */}
        {messages.length === 0 && (isNew || (!isNew && !isLoading)) && (
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
            <Text align="center" size="lg">안녕하세요! 어떤 질문이 있으신가요?</Text>
          </Box>
        )}
      </Box>
      {/* Footer 고정 */}
      <Footer
        conversationId={isNew ? undefined : id}
        onSend={handleSend}
        onReceive={handleReceive}
        onTitle={handleTitle}
        lastModelId={lastModelId}
      />
    </Box>
  );
} 