import { useState, useEffect } from 'react';
import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function App({ Component, pageProps }) {
  const [colorScheme, setColorScheme] = useState('light');
  const router = useRouter();

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
  }, [router.pathname]);

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
          {router.pathname === '/login' ? (
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