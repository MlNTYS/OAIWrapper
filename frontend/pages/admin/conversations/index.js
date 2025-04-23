import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { Container, Title, Table, Button, Text, Group } from '@mantine/core';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../utils/api';

export default function AdminConversationsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: convs = [], isLoading } = useQuery(
    ['adminConversations'],
    () => api.get('/conversations').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );

  const deleteConv = useMutation(
    (id) => api.delete(`/conversations/${id}`),
    {
      onSuccess: () => queryClient.invalidateQueries(['adminConversations']),
    }
  );

  return (
    <AdminLayout>
      <Container mt="md">
        <Group position="apart" mb="md">
          <Title order={3}>대화 관리</Title>
        </Group>
        {isLoading ? (
          <Text>로딩 중...</Text>
        ) : (
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>ID</th>
                <th>제목</th>
                <th>토큰 사용량</th>
                <th>마지막 업데이트</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {convs.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>{c.title}</td>
                  <td>{c.total_tokens}</td>
                  <td>{new Date(c.updated_at).toLocaleString()}</td>
                  <td>
                    <Group spacing="xs">
                      <Button size="xs" onClick={() => router.push(`/conversations/${c.id}`)}>보기</Button>
                      <Button color="red" size="xs" loading={deleteConv.isLoading} onClick={() => deleteConv.mutate(c.id)}>삭제</Button>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>
    </AdminLayout>
  );
} 