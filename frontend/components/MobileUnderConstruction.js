import { Center, Text, Stack, Title, Space } from '@mantine/core';

export default function MobileUnderConstruction() {
  return (
    <Center style={{ height: '100vh', padding: '1rem' }}>
      <Stack align="center" spacing="xl">
        <Title order={1} align="center">모바일 버전</Title>
        <Title order={2} align="center">준비중입니다</Title>
        <Space h="md" />
        <Text align="center">PC 환경에서 접속해 주세요.</Text>
      </Stack>
    </Center>
  );
} 