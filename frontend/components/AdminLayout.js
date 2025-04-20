import { Box } from '@mantine/core';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ children }) {
  return (
    <Box style={{ minHeight: '100vh' }}>
      <AdminHeader />
      <Box p="md">
        {children}
      </Box>
    </Box>
  );
} 