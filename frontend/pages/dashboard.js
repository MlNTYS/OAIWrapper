import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Title, Button, Text } from '@mantine/core';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    router.replace('/');
  };

  return (
    <Container size={600} my={40}>
      <Title align="center">대시보드</Title>
      <Text align="center" mt="md">환영합니다! 로그인에 성공하였습니다.</Text>
      <Button fullWidth mt="xl" color="red" onClick={handleLogout}>
        로그아웃
      </Button>
    </Container>
  );
} 