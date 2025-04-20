import { Box, LoadingOverlay, Notification, AppShell } from '@mantine/core';
import useUIStore from '../store/useUIStore';
import AppHeader from './AppHeader';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const { loading, error, clearError } = useUIStore();

  return (
    <Box style={{ position: 'relative', minHeight: '100vh' }}>
      <LoadingOverlay visible={loading} overlayBlur={2} zIndex={1000} />

      {error && (
        <Notification
          onClose={clearError}
          title="오류"
          color="red"
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 1100 }}
        >
          {error}
        </Notification>
      )}

      <AppShell padding="md" header={<AppHeader />} navbar={<Sidebar />}>
        {children}
      </AppShell>
    </Box>
  );
} 