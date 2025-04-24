import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container, Title, TextInput, PasswordInput, Button, Paper, Box } from '@mantine/core';
import { useMutation } from '@tanstack/react-query';
import { showNotification } from '@mantine/notifications';
import api from '../utils/api';

export default function SettingsPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
    }
  }, []);

  const mutation = useMutation(
    ({ currentPassword, newPassword }) => api.put('/auth/me/password', { currentPassword, newPassword }),
    {
      onSuccess: () => {
        showNotification({ title: '성공', message: '비밀번호가 변경되었습니다.', color: 'green' });
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      },
      onError: (error) => {
        const message = error.response?.data?.error || error.message;
        showNotification({ title: '오류', message, color: 'red' });
      },
    }
  );

  const handleSubmit = () => {
    if (!currentPassword || !newPassword) {
      showNotification({ title: '오류', message: '모든 필드를 입력해주세요.', color: 'red' });
      return;
    }
    if (newPassword.length < 8) {
      showNotification({ title: '오류', message: '새 비밀번호는 최소 8자 이상이어야 합니다.', color: 'red' });
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification({ title: '오류', message: '새 비밀번호가 일치하지 않습니다.', color: 'red' });
      return;
    }
    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <Container size={740} my={60} px={0} sx={{ maxWidth: 740, minWidth: 340 }}>
      <Title align="center" size="h1" mb={40}>설정</Title>
      <Paper 
        withBorder 
        shadow="lg" 
        p={50} 
        mt={30} 
        radius="lg"
        sx={{ maxWidth: 700, minWidth: 340, margin: '0 auto' }}
      >
        <PasswordInput
          label="현재 비밀번호"
          placeholder="현재 비밀번호를 입력하세요"
          required
          size="lg"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          styles={{ input: { fontSize: '16px', padding: '16px 12px' } }}
          mb={10}
        />
        <PasswordInput
          label="새 비밀번호"
          placeholder="새 비밀번호를 입력하세요"
          required
          mt="xl"
          size="lg"
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
          styles={{ input: { fontSize: '16px', padding: '16px 12px' } }}
          mb={10}
        />
        <PasswordInput
          label="새 비밀번호 확인"
          placeholder="새 비밀번호를 다시 입력하세요"
          required
          mt="xl"
          size="lg"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          styles={{ input: { fontSize: '16px', padding: '16px 12px' } }}
        />
        <Button 
          fullWidth 
          mt={50} 
          size="lg"
          py="lg"
          onClick={handleSubmit} 
          loading={mutation.isLoading}
          sx={{ fontSize: '18px', height: 'auto', minHeight: '60px' }}
        >
          비밀번호 변경
        </Button>
      </Paper>
    </Container>
  );
}
