import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Modal, TextInput, PasswordInput, Select, Switch, NumberInput } from '@mantine/core';
import { Container, Title, Table, Button, Group, Text } from '@mantine/core';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../utils/api';
import { useState, useEffect } from 'react';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useQuery(
    ['adminUsers'],
    () => api.get('/users').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );

  // Create user modal state
  const [createOpened, setCreateOpened] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [newVerified, setNewVerified] = useState(false);
  const createUser = useMutation(
    (data) => api.post('/users', data),
    { onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); setCreateOpened(false); } }
  );
  // Edit user modal state
  const [editOpened, setEditOpened] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [editRole, setEditRole] = useState('USER');
  const [editVerified, setEditVerified] = useState(false);
  const [editCredit, setEditCredit] = useState(0);
  const updateUser = useMutation(
    ({ id, data }) => api.patch(`/users/${id}`, data),
    { onSuccess: () => { queryClient.invalidateQueries(['adminUsers']); setEditOpened(false); } }
  );

  const deleteUser = useMutation(
    (id) => api.delete(`/users/${id}`),
    {
      onSuccess: () => queryClient.invalidateQueries(['adminUsers']),
    }
  );

  const [confirmUserToDelete, setConfirmUserToDelete] = useState(null);

  return (
    <AdminLayout>
      <Container mt="md">
        <Group position="apart" mb="md">
          <Title order={3}>사용자 관리</Title>
          <Button onClick={() => setCreateOpened(true)}>유저 추가</Button>
        </Group>
        {/* Create User Modal */}
        <Modal opened={createOpened} onClose={() => setCreateOpened(false)} title="유저 생성">
          <TextInput label="Email" value={newEmail} onChange={(e) => setNewEmail(e.currentTarget.value)} />
          <PasswordInput label="Password" mt="md" value={newPassword} onChange={(e) => setNewPassword(e.currentTarget.value)} />
          <Select data={[{ value: 'USER', label: 'USER' }, { value: 'ADMIN', label: 'ADMIN' }]} label="Role" mt="md" value={newRole} onChange={setNewRole} />
          <Group mt="md" align="center">
            <Switch label="Verified" checked={newVerified} onChange={(e) => setNewVerified(e.currentTarget.checked)} />
          </Group>
          <Button fullWidth mt="md" onClick={() => createUser.mutate({ email: newEmail, password: newPassword, role_id: newRole, is_verified: newVerified })} loading={createUser.isLoading}>생성</Button>
        </Modal>
        {/* Edit User Modal */}
        <Modal opened={editOpened} onClose={() => setEditOpened(false)} title="유저 수정">
          <TextInput label="Email" value={editUser?.email || ''} disabled />
          <PasswordInput label="Password" placeholder="Leave blank to keep" mt="md" value={editUser?.password || ''} onChange={(e) => setEditVerified(false)} />
          <Select data={[{ value: 'USER', label: 'USER' }, { value: 'ADMIN', label: 'ADMIN' }]} label="Role" mt="md" value={editRole} onChange={setEditRole} />
          <Group mt="md" align="center">
            <Switch label="Verified" checked={editVerified} onChange={(e) => setEditVerified(e.currentTarget.checked)} />
          </Group>
          <NumberInput label="Credit" mt="md" min={0} value={editCredit} onChange={(value) => setEditCredit(value)} />
          <Button fullWidth mt="md" onClick={() => updateUser.mutate({ id: editUser.id, data: { role_id: editRole, is_verified: editVerified, current_credit: editCredit } })} loading={updateUser.isLoading}>저장</Button>
        </Modal>

        {isLoading ? (
          <Text>로딩 중...</Text>
        ) : (
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Credit</th>
                <th>Verified</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.email}</td>
                  <td>{user.role_id}</td>
                  <td>{user.current_credit}</td>
                  <td>{user.is_verified ? 'Yes' : 'No'}</td>
                  <td>
                    <Group spacing="xs">
                      <Button size="xs" onClick={() => { setEditUser(user); setEditRole(user.role_id); setEditVerified(user.is_verified); setEditCredit(user.current_credit); setEditOpened(true); }}>수정</Button>
                      <Button color="red" size="xs" loading={deleteUser.isLoading} onClick={() => setConfirmUserToDelete(user.id)}>삭제</Button>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <Modal opened={!!confirmUserToDelete} onClose={() => setConfirmUserToDelete(null)} title="정말 삭제하시겠습니까?" centered>
          <Text>삭제하면 복구할 수 없습니다.</Text>
          <Group position="right" mt="md">
            <Button variant="default" onClick={() => setConfirmUserToDelete(null)}>취소</Button>
            <Button color="red" loading={deleteUser.isLoading} onClick={() => { deleteUser.mutate(confirmUserToDelete); setConfirmUserToDelete(null); }}>삭제</Button>
          </Group>
        </Modal>
      </Container>
    </AdminLayout>
  );
} 