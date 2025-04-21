import { useEffect, useState } from 'react';
import { Navbar, ScrollArea, Button, NavLink, Text, useMantineTheme, Menu, UnstyledButton, Group, Avatar, Badge } from '@mantine/core';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import useConversationStore from '../store/useConversationStore';
import useAuthStore from '../store/useAuthStore';

export default function Sidebar() {
  const router = useRouter();
  const { conversations, setConversations } = useConversationStore();
  const theme = useMantineTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [credit, setCredit] = useState(0);

  const { data, isLoading } = useQuery(
    ['conversations'],
    () => api.get('/conversations').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );

  // 사용자 크레딧 정보 로드
  const { data: userData, refetch: refetchUserData } = useQuery(
    ['user-credit'],
    () => api.get('/auth/me').then((res) => res.data),
    { 
      staleTime: 1000 * 30,
      onSuccess: (data) => {
        setUser(data);
        setCredit(data.current_credit || 0);
      }
    }
  );

  // 10초마다 크레딧 정보 갱신
  useEffect(() => {
    const intervalId = setInterval(() => {
      refetchUserData();
    }, 10000);
    
    return () => clearInterval(intervalId);
  }, [refetchUserData]);

  useEffect(() => {
    if (data) setConversations(data);
  }, [data]);

  useEffect(() => {
    if (user?.current_credit !== undefined) {
      setCredit(user.current_credit);
    }
  }, [user]);

  const handleSelect = (id) => {
    router.push(`/conversations/${id}`);
  };

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <Navbar 
      width={{ base: 250 }} 
      p="xs" 
      height="100%" 
      bg={theme.colors.dark[8]}
      sx={{
        borderRight: `1px solid ${theme.colors.dark[7]}`,
      }}
    >
      <Navbar.Section>
        <Group position="apart" align="center" mb="xs">
          <Badge
            color="royal-blue"
            variant="filled"
            radius="sm"
            size="md"
            sx={{
              paddingLeft: 12,
              paddingRight: 12
            }}
          >
            크레딧: {credit}
          </Badge>
          <Menu
            position="bottom-end"
            withArrow
            shadow="md"
            width={200}
          >
            <Menu.Target>
              <UnstyledButton>
                <Avatar 
                  size="md" 
                  color="royal-blue" 
                  radius="xl"
                  sx={{
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'scale(1.1)'
                    }
                  }}
                />
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label>계정</Menu.Label>
              <Menu.Item disabled>{user?.email || '로딩 중...'}</Menu.Item>
              <Menu.Item disabled>크레딧: {credit}</Menu.Item>
              <Menu.Divider />
              <Menu.Item color="burgundy" onClick={handleLogout}>로그아웃</Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Button 
          fullWidth 
          mb="sm" 
          onClick={() => router.push('/conversations/new')}
          color="royal-blue"
          variant="filled"
          sx={{
            backgroundColor: theme.colors['royal-blue'][7],
            transition: 'background-color 200ms ease',
            '&:hover': {
              backgroundColor: theme.colors['royal-blue'][6],
            }
          }}
        >
          새 대화
        </Button>
      </Navbar.Section>
      <Navbar.Section grow component={ScrollArea} mx="-xs" px="xs">
        {isLoading && <Text align="center" color="dimmed">로딩 중...</Text>}
        {!isLoading && conversations.length === 0 && <Text align="center" color="dimmed">대화 없음</Text>}
        {!isLoading && conversations.map((conv) => (
          <NavLink
            key={conv.id}
            label={conv.title || 'Untitled'}
            description={new Date(conv.updated_at).toLocaleString()}
            onClick={() => handleSelect(conv.id)}
            color="sage-green"
            active={router.query.id === conv.id}
            sx={(theme) => ({
              borderRadius: theme.radius.sm,
              marginBottom: 8,
              transition: 'all 0.2s ease',
              border: router.query.id === conv.id ? 
                `1px solid ${theme.colors['sage-green'][6]}` : 
                '1px solid transparent',
              '&:hover': {
                backgroundColor: theme.colors.dark[7],
                transform: 'translateX(2px)',
              },
              '&[data-active]': {
                backgroundColor: `${theme.fn.rgba(theme.colors['sage-green'][9], 0.3)} !important`,
              }
            })}
          />
        ))}
      </Navbar.Section>
    </Navbar>
  );
} 