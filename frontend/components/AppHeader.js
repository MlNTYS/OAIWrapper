import { Header, Group, Title, Button, Space } from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import useAuthStore from '../store/useAuthStore';
import { useRouter } from 'next/router';
import ModelSelect from './ModelSelect';

export default function AppHeader() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.replace('/');
  };

  return (
    <Header height={60} p="xs">
      <Group position="apart" align="center" sx={{ height: '100%' }}>
        <Title order={4}>GPTWrapper</Title>
        <Group>
          <ModelSelect />
          <Space w="md" />
          <Button variant="outline" onClick={() => toggleColorScheme()}>
            {colorScheme === 'dark' ? '☀️' : '🌙'}
          </Button>
          <Button color="red" onClick={handleLogout}>
            로그아웃
          </Button>
        </Group>
      </Group>
    </Header>
  );
} 