import { useState } from 'react';
import { Modal, TextInput, NumberInput, Switch } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Table, Switch as InlineSwitch, NumberInput as InlineNumberInput, Button, Group, Text } from '@mantine/core';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../utils/api';

export default function AdminModelsPage() {
  const [costEdits, setCostEdits] = useState({});
  const [createOpened, setCreateOpened] = useState(false);
  const [newApiName, setNewApiName] = useState('');
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState(0);
  const [newEnabled, setNewEnabled] = useState(true);
  const queryClient = useQueryClient();
  const { data: models = [], isLoading } = useQuery(
    ['adminModels'],
    () => api.get('/models').then((res) => res.data),
    { staleTime: 1000 * 60 }
  );

  const updateModel = useMutation(
    (data) => api.patch(`/models/${data.id}`, data),
    {
      onSuccess: () => queryClient.invalidateQueries(['adminModels']),
    }
  );
  const deleteModel = useMutation(
    (id) => api.delete(`/models/${id}`),
    { onSuccess: () => queryClient.invalidateQueries(['adminModels']) }
  );
  const createModel = useMutation(
    (data) => api.post('/models', data),
    { onSuccess: () => { queryClient.invalidateQueries(['adminModels']); setCreateOpened(false); } }
  );

  return (
    <AdminLayout>
      <Container mt="md">
        <Group position="apart" mb="md">
          <Title order={3}>모델 관리</Title>
          <Button onClick={() => setCreateOpened(true)}>모델 추가</Button>
        </Group>
        <Modal opened={createOpened} onClose={() => setCreateOpened(false)} title="모델 생성">
          <TextInput label="API Name" value={newApiName} onChange={(e) => setNewApiName(e.currentTarget.value)} required />
          <TextInput label="Name" mt="md" value={newName} onChange={(e) => setNewName(e.currentTarget.value)} required />
          <NumberInput label="Cost" mt="md" min={0} value={newCost} onChange={setNewCost} />
          <Group mt="md" align="center">
            <Switch label="Enabled" checked={newEnabled} onChange={(e) => setNewEnabled(e.currentTarget.checked)} />
          </Group>
          <Button fullWidth mt="md" onClick={() => createModel.mutate({ api_name: newApiName, name: newName, cost: newCost, is_enabled: newEnabled })} loading={createModel.isLoading}>생성</Button>
        </Modal>
        {isLoading ? (
          <Text>로딩 중...</Text>
        ) : (
          <Table highlightOnHover>
            <thead>
              <tr>
                <th>ID</th>
                <th>이름</th>
                <th>API 이름</th>
                <th>활성화</th>
                <th>비용</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td>{m.id}</td>
                  <td>{m.name}</td>
                  <td>{m.api_name}</td>
                  <td>
                    <InlineSwitch
                      checked={m.is_enabled}
                      onChange={(e) => updateModel.mutate({ id: m.id, is_enabled: e.currentTarget.checked })}
                    />
                  </td>
                  <td>
                    <InlineNumberInput
                      value={costEdits[m.id] ?? m.cost}
                      onChange={(v) => setCostEdits((prev) => ({ ...prev, [m.id]: v }))}
                      min={0}
                      style={{ width: 100 }}
                    />
                  </td>
                  <td>
                    <Group spacing="xs">
                      <Button
                        size="sm"
                        onClick={() => updateModel.mutate({ id: m.id, cost: costEdits[m.id] ?? m.cost })}
                        loading={updateModel.isLoading}
                      >
                        저장
                      </Button>
                      <Button
                        size="sm"
                        color="red"
                        onClick={() => deleteModel.mutate(m.id)}
                        loading={deleteModel.isLoading}
                      >
                        삭제
                      </Button>
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