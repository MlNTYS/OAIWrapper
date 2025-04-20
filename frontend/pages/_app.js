import { useState, useEffect } from 'react';
import { MantineProvider, ColorSchemeProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '../styles/globals.css';

export default function App({ Component, pageProps }) {
  const [colorScheme, setColorScheme] = useState('light');

  useEffect(() => {
    const stored = localStorage.getItem('color-scheme');
    if (stored) setColorScheme(stored);
  }, []);

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
          <Component {...pageProps} />
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </MantineProvider>
    </ColorSchemeProvider>
  );
} 