import { Box, useMantineTheme } from '@mantine/core';
import AdminHeader from './AdminHeader';

export default function AdminLayout({ children }) {
  const theme = useMantineTheme();
  
  return (
    <Box style={{ minHeight: '100vh', backgroundColor: theme.colors.dark[8] }}>
      <AdminHeader />
      <Box p="md">
        {children}
      </Box>
    </Box>
  );
} 