import { Header, Group, Anchor, Text } from '@mantine/core';
import Link from 'next/link';
import { useMantineColorScheme } from '@mantine/core';
import { useRouter } from 'next/router';
import useAuthStore from '../store/useAuthStore';

export default function AdminHeader() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <Header height={60} p="xs">
      <Group position="apart" align="center" sx={{ height: '100%' }}>
        <Group>
          <Link href="/admin/users" passHref>
            <Anchor><Text weight={500}>Users</Text></Anchor>
          </Link>
          <Link href="/admin/models" passHref>
            <Anchor><Text weight={500}>Models</Text></Anchor>
          </Link>
          <Link href="/admin/conversations" passHref>
            <Anchor><Text weight={500}>Conversations</Text></Anchor>
          </Link>
        </Group>
        <Group>
          <Anchor onClick={() => toggleColorScheme()}>
            {colorScheme === 'dark' ? '☀️' : '🌙'}
          </Anchor>
          <Anchor color="red" onClick={handleLogout}>
            Logout
          </Anchor>
        </Group>
      </Group>
    </Header>
  );
} 