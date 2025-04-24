import React, { useState } from 'react';
import { Modal, TextInput, Button, Group, ActionIcon, Text } from '@mantine/core';
import { IconTrash, IconCheck, IconX } from '@tabler/icons-react';

export default function ConversationEditModal({ opened, onClose, conversation, onRename, onDelete }) {
  const [title, setTitle] = useState(conversation?.title || '');
  const [loading, setLoading] = useState(false);

  // 대화가 바뀌면 타이틀 초기화
  React.useEffect(() => {
    setTitle(conversation?.title || '');
  }, [conversation]);

  const handleRename = async () => {
    setLoading(true);
    const result = await onRename(title);
    setLoading(false);
    if (result !== false) {
      onClose();
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    await onDelete();
    setLoading(false);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title="대화 수정" centered>
      <TextInput
        label="대화 이름"
        value={title}
        onChange={e => setTitle(e.currentTarget.value)}
        mb="md"
        autoFocus
        disabled={loading}
      />
      <Group position="apart">
        <Button
          color="red"
          leftIcon={<IconTrash size={16} />}
          onClick={handleDelete}
          loading={loading}
          variant="light"
        >
          삭제
        </Button>
        <Group>
          <Button variant="default" onClick={onClose} leftIcon={<IconX size={16} />} disabled={loading}>
            취소
          </Button>
          <Button 
            color="blue" 
            leftIcon={<IconCheck size={16} />} 
            onClick={handleRename} 
            loading={loading}
            disabled={loading || !title.trim() || title === conversation?.title}
          >
            저장
          </Button>
        </Group>
      </Group>
    </Modal>
  );
}
