import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { TextInput, PasswordInput, Button, Paper, Title, Container, Notification } from '@mantine/core';
import api from '../utils/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.replace('/');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { email, password });
      let token = null;
      if (res.headers.authorization) {
        token = res.headers.authorization.split(' ')[1];
      } else if (res.data.accessToken) {
        token = res.data.accessToken;
      }
      if (!token) throw new Error('토큰을 찾을 수 없습니다.');
      localStorage.setItem('accessToken', token);
      router.replace('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size={420} my={40}>
      <Title align="center">로그인</Title>
      {error && (
        <Notification color="red" onClose={() => setError('')} mt="md">
          {error}
        </Notification>
      )}
      <Paper withBorder shadow="sm" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
          <TextInput
            label="Email"
            placeholder="your@email.com"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />
          <PasswordInput
            label="Password"
            placeholder="Password"
            required
            mt="md"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
          />
          <Button fullWidth mt="xl" type="submit" loading={loading}>
            로그인
          </Button>
        </form>
      </Paper>
    </Container>
  );
} 