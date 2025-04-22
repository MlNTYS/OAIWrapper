import { useState } from 'react';
import { Modal, TextInput, NumberInput, Switch, Select, Textarea } from '@mantine/core';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Title, Table, Switch as InlineSwitch, NumberInput as InlineNumberInput, Select as InlineSelect, TextInput as InlineTextInput, Button, Group, Text } from '@mantine/core';
import AdminLayout from '../../../components/AdminLayout';
import api from '../../../utils/api';

export default function AdminModelsPage() {
  const [costEdits, setCostEdits] = useState({});
  const [enabledEdits, setEnabledEdits] = useState({});
  const [inferenceEdits, setInferenceEdits] = useState({});
  const [effortEdits, setEffortEdits] = useState({});
  const [createOpened, setCreateOpened] = useState(false);
  const [newApiName, setNewApiName] = useState('');
  const [newName, setNewName] = useState('');
  const [newCost, setNewCost] = useState(0);
  const [newEnabled, setNewEnabled] = useState(true);
  const [newInferenceModel, setNewInferenceModel] = useState(false);
  const [newReasoningEffort, setNewReasoningEffort] = useState('medium');
  const [newSystemMessage, setNewSystemMessage] = useState('');
  const [systemEdits, setSystemEdits] = useState({});
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

  // State and handler for editing modal
  const [editOpened, setEditOpened] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [editApiName, setEditApiName] = useState('');
  const [editName, setEditName] = useState('');
  const [editCost, setEditCost] = useState(0);
  const [editEnabled, setEditEnabled] = useState(true);
  const [editInferenceModel, setEditInferenceModel] = useState(false);
  const [editReasoningEffort, setEditReasoningEffort] = useState('medium');
  const [editSystemMessage, setEditSystemMessage] = useState('');
  const openEdit = (model) => {
    setEditingModel(model);
    setEditApiName(model.api_name);
    setEditName(model.name);
    setEditCost(model.cost);
    setEditEnabled(model.is_enabled);
    setEditInferenceModel(model.is_inference_model);
    setEditReasoningEffort(model.reasoning_effort ?? 'medium');
    setEditSystemMessage(model.system_message ?? '');
    setEditOpened(true);
  };

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
            <Switch label="Inference Model" ml="xl" checked={newInferenceModel} onChange={(e) => setNewInferenceModel(e.currentTarget.checked)} />
          </Group>
          <Select
            label="Reasoning Effort"
            mt="md"
            data={[
              { value: 'low', label: 'low' },
              { value: 'medium', label: 'medium' },
              { value: 'high', label: 'high' },
            ]}
            value={newReasoningEffort || 'medium'}
            onChange={(value) => setNewReasoningEffort(value || 'medium')}
            disabled={!newInferenceModel}
            clearable={false}
          />
          <Textarea
            label="System Message"
            placeholder="Optional system prompt"
            mt="md"
            value={newSystemMessage}
            onChange={(e) => setNewSystemMessage(e.currentTarget.value)}
            disabled={!newInferenceModel}
          />
          <Button
            fullWidth
            mt="md"
            onClick={() => {
              const data = { api_name: newApiName, name: newName, cost: newCost, is_enabled: newEnabled, is_inference_model: newInferenceModel };
              if (newInferenceModel) data.reasoning_effort = newReasoningEffort;
              if (newSystemMessage) data.system_message = newSystemMessage;
              createModel.mutate(data);
            }}
            loading={createModel.isLoading}
          >생성</Button>
        </Modal>
        <Modal opened={editOpened} onClose={() => setEditOpened(false)} title="모델 수정">
          <TextInput label="API Name" value={editApiName} onChange={(e) => setEditApiName(e.currentTarget.value)} required />
          <TextInput label="Name" mt="md" value={editName} onChange={(e) => setEditName(e.currentTarget.value)} required />
          <NumberInput label="Cost" mt="md" min={0} value={editCost} onChange={setEditCost} />
          <Group mt="md" align="center">
            <Switch label="Enabled" checked={editEnabled} onChange={(e) => setEditEnabled(e.currentTarget.checked)} />
            <Switch label="Inference Model" ml="xl" checked={editInferenceModel} onChange={(e) => setEditInferenceModel(e.currentTarget.checked)} />
          </Group>
          <Select
            label="Reasoning Effort"
            mt="md"
            data={[{ value: 'low', label: 'low' }, { value: 'medium', label: 'medium' }, { value: 'high', label: 'high' }]}
            value={editReasoningEffort || 'medium'}
            onChange={(value) => setEditReasoningEffort(value || 'medium')}
            disabled={!editInferenceModel}
            clearable={false}
          />
          <Textarea
            label="System Message"
            placeholder="Optional system prompt"
            mt="md"
            value={editSystemMessage}
            onChange={(e) => setEditSystemMessage(e.currentTarget.value)}
          />
          <Button
            fullWidth
            mt="md"
            onClick={() => {
              const data = {
                id: editingModel.id,
                api_name: editApiName,
                name: editName,
                cost: editCost,
                is_enabled: editEnabled,
                is_inference_model: editInferenceModel,
                reasoning_effort: editReasoningEffort,
                system_message: editSystemMessage,
              };
              updateModel.mutate(data, { onSuccess: () => setEditOpened(false) });
            }}
            loading={updateModel.isLoading}
          >수정</Button>
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
                <th>추론 모델</th>
                <th>추론 노력</th>
                <th>System Message</th>
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
                      checked={enabledEdits[m.id] ?? m.is_enabled}
                      onChange={(e) => setEnabledEdits((prev) => ({ ...prev, [m.id]: e.currentTarget.checked }))}
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
                    <InlineSwitch
                      checked={inferenceEdits[m.id] ?? m.is_inference_model}
                      onChange={(e) => setInferenceEdits((prev) => ({ ...prev, [m.id]: e.currentTarget.checked }))}
                    />
                  </td>
                  <td>
                    <InlineSelect
                      data={[
                        { value: 'low', label: 'low' },
                        { value: 'medium', label: 'medium' },
                        { value: 'high', label: 'high' },
                      ]}
                      value={effortEdits[m.id] ?? m.reasoning_effort ?? 'medium'}
                      onChange={(value) => setEffortEdits((prev) => ({ ...prev, [m.id]: value || 'medium' }))}
                      disabled={!(inferenceEdits[m.id] ?? m.is_inference_model)}
                      clearable={false}
                      style={{ width: 120 }}
                    />
                  </td>
                  <td>
                    <InlineTextInput
                      value={systemEdits[m.id] ?? m.system_message ?? ''}
                      onChange={(e) => setSystemEdits((prev) => ({ ...prev, [m.id]: e.currentTarget.value }))}
                      style={{ width: 200 }}
                    />
                  </td>
                  <td>
                    <Group spacing="xs">
                      <Button size="sm" onClick={() => openEdit(m)} loading={updateModel.isLoading}>수정</Button>
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