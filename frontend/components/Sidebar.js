import { useEffect } from 'react';
import { Navbar, ScrollArea, Button, NavLink, Text } from '@mantine/core';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import useConversationStore from '../store/useConversationStore';

export default function Sidebar() {
  const router = useRouter();
  const { conversations, setConversations } = useConversationStore();

  const { data, isLoading } = useQuery(
    ['conversations'],
    () => api.get('/conversations').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );

  useEffect(() => {
    if (data) setConversations(data);
  }, [data]);

  const handleSelect = (id) => {
    router.push(`/conversations/${id}`);
  };

  return (
    <Navbar width={{ base: 250 }} p="xs" height="100%">
      <Navbar.Section>
        <Button fullWidth mb="sm" onClick={() => router.push('/conversations/new')}>
          새 대화
        </Button>
      </Navbar.Section>
      <Navbar.Section grow component={ScrollArea} mx="-xs" px="xs">
        {isLoading && <Text align="center">로딩 중...</Text>}
        {!isLoading && conversations.length === 0 && <Text align="center">대화 없음</Text>}
        {!isLoading && conversations.map((conv) => (
          <NavLink
            key={conv.id}
            label={conv.title || 'Untitled'}
            description={new Date(conv.updated_at).toLocaleString()}
            onClick={() => handleSelect(conv.id)}
          />
        ))}
      </Navbar.Section>
    </Navbar>
  );
} 