import { useState, useEffect } from 'react';
import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';

export default function App({ Component, pageProps }) {
  const [colorScheme, setColorScheme] = useState('light');
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    const stored = localStorage.getItem('color-scheme');
    if (stored) setColorScheme(stored);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const publicPaths = ['/login'];
    if (!token && !publicPaths.includes(router.pathname)) {
      router.replace('/login');
    } else if (token && router.pathname === '/login') {
      router.replace('/conversations/new');
    }
    if (token && !user) {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => {
          useAuthStore.getState().logout();
          router.replace('/login');
        });
    }
    const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH;
    if (token && router.pathname.startsWith(`/${adminPath}`)) {
      if (user && user.role_id !== 'ADMIN') {
        router.replace('/login');
      }
    }
  }, [router.pathname, user]);

  const toggleColorScheme = (value) => {
    const next = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(next);
    localStorage.setItem('color-scheme', next);
  };

  const [queryClient] = useState(() => new QueryClient());

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider withGlobalStyles withNormalizeCSS theme={{ colorScheme }}>
        <QueryClientProvider client={queryClient}>
          {router.pathname === '/login' || router.pathname.startsWith(`/${process.env.NEXT_PUBLIC_ADMIN_PATH}`) ? (
            <Component {...pageProps} />
          ) : (
            <Layout>
              <Component {...pageProps} />
            </Layout>
          )}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
} 