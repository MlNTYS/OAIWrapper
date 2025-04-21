import { Header, Group, Anchor, Text, useMantineTheme } from '@mantine/core';
import Link from 'next/link';
import { useRouter } from 'next/router';
import useAuthStore from '../store/useAuthStore';

export default function AdminHeader() {
  const theme = useMantineTheme();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <Header height={60} p="xs" bg={theme.black}>
      <Group position="apart" align="center" sx={{ height: '100%' }}>
        <Group>
          <Link href="/admin/users" passHref>
            <Anchor c={theme.colors['royal-blue'][4]}>
              <Text weight={500}>Users</Text>
            </Anchor>
          </Link>
          <Link href="/admin/models" passHref>
            <Anchor c={theme.colors['royal-blue'][4]}>
              <Text weight={500}>Models</Text>
            </Anchor>
          </Link>
          <Link href="/admin/conversations" passHref>
            <Anchor c={theme.colors['royal-blue'][4]}>
              <Text weight={500}>Conversations</Text>
            </Anchor>
          </Link>
        </Group>
        <Group>
          <Anchor color="burgundy" onClick={handleLogout}>
            Logout
          </Anchor>
        </Group>
      </Group>
    </Header>
  );
} 