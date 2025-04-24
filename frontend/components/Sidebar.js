import { useEffect, useState } from 'react';
import { 
  Navbar, ScrollArea, Button, NavLink, Text, 
  useMantineTheme, Menu, UnstyledButton, 
  Group, Avatar, createStyles, 
  Tooltip, Divider, Box, ActionIcon, Loader
} from '@mantine/core';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { 
  IconPlus, IconMessage, IconChevronRight, 
  IconSettings, IconLogout, IconCoin
} from '@tabler/icons-react';
import { IconEdit, IconTrash, IconCheck, IconX } from '@tabler/icons-react';
import ConversationEditModal from './ConversationEditModal';
import api from '../utils/api';
import useConversationStore from '../store/useConversationStore';
import useAuthStore from '../store/useAuthStore';

const useStyles = createStyles((theme) => ({
  navbar: {
    backgroundColor: theme.colors.dark[9],
    borderRight: '1px solid rgba(42, 42, 45, 0.7)',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.1)',
    width: 260,
  },

  userSection: {
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.fn.rgba(theme.colors.dark[7], 0.5)}`,
    marginBottom: theme.spacing.sm,
  },

  creditInfo: {
    padding: '6px 8px',
    borderRadius: theme.radius.sm,
    backgroundColor: theme.fn.rgba(theme.colors.dark[6], 0.6),
    fontSize: theme.fontSizes.sm,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  
  creditAmount: {
    color: theme.colors.blue[4],
    fontWeight: 500,
  },
  
  avatar: {
    cursor: 'pointer',
    backgroundColor: theme.colors.dark[7],
  },
  
  newChatButton: {
    backgroundColor: theme.colors['royal-blue'][7],
    height: 38,
    borderRadius: theme.radius.md,
    fontWeight: 500,
    
    '&:hover': {
      backgroundColor: theme.colors['royal-blue'][6],
    }
  },
  
  navLinkItem: {
    borderRadius: theme.radius.md,
    marginBottom: 6,
    padding: '10px 12px',
    
    '&:hover': {
      backgroundColor: theme.fn.rgba(theme.colors.dark[7], 0.8),
    },
    
    '&[data-active]': {
      backgroundColor: `${theme.fn.rgba(theme.colors['sage-green'][9], 0.2)} !important`,
      borderLeft: `2px solid ${theme.colors['sage-green'][5]}`,
    }
  },
  
  scrollArea: {
    padding: `${theme.spacing.xs}px ${theme.spacing.xs}px`,
  },
  
  menuDropdown: {
    border: `1px solid ${theme.colors.dark[6]}`,
    backgroundColor: theme.colors.dark[8],
  },
  
  menuItem: {
    borderRadius: theme.radius.sm,
    
    '&:hover': {
      backgroundColor: theme.colors.dark[7],
    }
  },
  
  chevronIcon: {
    color: theme.colors.dark[3],
  },
  
  conversationIcon: {
    color: theme.colors.dark[3],
  }
}));

export default function Sidebar() {
  const router = useRouter();
  const { conversations, setConversations, removeConversation } = useConversationStore();
  const theme = useMantineTheme();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [credit, setCredit] = useState(0);
  const { classes } = useStyles();
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data, isLoading } = useQuery(
    ['conversations'],
    () => api.get('/conversations').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );

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
      width={{ base: 260 }} 
      p={0} 
      height="100%" 
      className={classes.navbar}
    >
      <Navbar.Section className={classes.userSection}>
        <Group position="apart" align="center" mb="sm">
          <Group spacing="sm">
            <Avatar 
              size="sm" 
              radius="xl"
              className={classes.avatar}
            >
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
            <Text size="sm" lineClamp={1}>
              {user?.email || '로딩 중...'}
            </Text>
          </Group>
          
          <Menu
            position="bottom-end"
            withArrow
            shadow="md"
            width={180}
            styles={{
              dropdown: classes.menuDropdown,
              item: classes.menuItem,
            }}
          >
            <Menu.Target>
              <ActionIcon size="sm" variant="subtle" radius="xl">
                <IconSettings size={14} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item 
                icon={<IconSettings size={14} stroke={1.5} />}
                onClick={() => router.push('/settings')}
              >
                설정
              </Menu.Item>
              
              <Menu.Item 
                color="red"
                icon={<IconLogout size={14} stroke={1.5} />}
                onClick={handleLogout}
              >
                로그아웃
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
        
        <Group position="apart" mb="md">
          <div className={classes.creditInfo}>
            <IconCoin size={14} stroke={1.5} />
            <Text size="sm">
              Credit: <span className={classes.creditAmount}>{credit.toLocaleString()}</span>
            </Text>
          </div>
        </Group>
        
        <Button 
          fullWidth 
          onClick={() => router.push('/conversations/new')}
          className={classes.newChatButton}
          leftIcon={<IconPlus size={16} />}
        >
          새 대화
        </Button>
      </Navbar.Section>
      
      <Navbar.Section grow component={ScrollArea} className={classes.scrollArea}>
        {isLoading && (
          <Text align="center" color="dimmed" size="sm" py="lg">
            대화 내역 로딩 중...
          </Text>
        )}
        
        {!isLoading && conversations.length === 0 && (
          <Text align="center" color="dimmed" size="sm" py="lg">
            대화 내역이 없습니다
          </Text>
        )}
        
        {!isLoading && conversations.map((conv) => (
          <NavLink
            key={conv.id}
            label={<Text fw={500} fz="sm" lineClamp={1}>{conv.title || '제목 없음'}</Text>}
            description={<Text size="xs" color="dimmed">{new Date(conv.updated_at).toLocaleString('ko-KR', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</Text>}
            onClick={() => handleSelect(conv.id)}
            color="sage-green"
            active={router.query.id === conv.id}
            className={classes.navLinkItem}
            icon={
              <IconMessage size={16} className={classes.conversationIcon} />
            }
            rightSection={
              <Group spacing={2} noWrap>
                <ActionIcon
  size="sm"
  variant="subtle"
  color="gray"
  onClick={e => {
    e.stopPropagation();
    setSelectedConv(conv);
    setEditModalOpened(true);
  }}
>
  <IconEdit size={15} />
</ActionIcon>
                <IconChevronRight size={14} className={classes.chevronIcon} />
              </Group>
            }
          />
        ))}
      </Navbar.Section>
      
      <ConversationEditModal
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        conversation={selectedConv}
        onRename={async (newTitle) => {
          if (!selectedConv) return false;
          setLoading(true);
          try {
            await api.patch(`/conversations/${selectedConv.id}`, { title: newTitle });
            setConversations(
              conversations.map(c => c.id === selectedConv.id ? { ...c, title: newTitle } : c)
            );
            setLoading(false);
            return true;
          } catch (e) {
            if (typeof window !== 'undefined') {
              const { showNotification } = await import('@mantine/notifications');
              showNotification({
                title: '이름 변경 실패',
                message: e?.response?.data?.message || e?.message || '알 수 없는 오류',
                color: 'red',
              });
            }
            setLoading(false);
            return false;
          }
        }}
        onDelete={async () => {
          if (!selectedConv) return;
          setLoading(true);
          try {
            await api.delete(`/conversations/${selectedConv.id}`);
            removeConversation(selectedConv.id);
            // 삭제된 대화가 현재 선택된 대화라면 라우팅
            if (router.query.id === selectedConv.id) {
              router.push('/');
            }
          } catch (e) {
            // TODO: notification
          }
          setLoading(false);
        }}
      />
    </Navbar>
  );
}