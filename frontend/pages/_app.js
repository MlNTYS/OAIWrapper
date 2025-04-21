import { useState, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import '../styles/globals.css';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import api from '../utils/api';
import useAuthStore from '../store/useAuthStore';
import MobileUnderConstruction from '../components/MobileUnderConstruction';

export default function App({ Component, pageProps }) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const [queryClient] = useState(() => new QueryClient());
  const [isSmallMobile, setIsSmallMobile] = useState(false);

  // 모바일 디바이스 감지 (작은 화면만 제한)
  useEffect(() => {
    const checkDevice = () => {
      // 사용자 에이전트 기반 모바일 기기 감지
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileDevices = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
      const isMobileDevice = mobileDevices.test(userAgent);
      
      // 화면 크기 기반 감지 (768px 미만인 경우만 제한)
      const isSmallScreen = window.innerWidth < 768;
      
      // 모바일 기기이면서 작은 화면인 경우만 제한
      setIsSmallMobile(isMobileDevice && isSmallScreen);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
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

  // 작은 화면 모바일 접속시만 준비 중 페이지 표시
  if (isSmallMobile) {
    return (
      <MantineProvider 
        theme={{ 
          colorScheme: 'dark', 
          primaryColor: 'royal-blue',
          colors: {
            dark: [
              '#c1c2c5',
              '#a1a2a6',
              '#909296',
              '#6e7075',
              '#555860',
              '#3e4046',
              '#2c2e33',
              '#1a1b1e',
              '#141517',
              '#0c0d0e',
            ],
            'royal-blue': ['#E5EEFF', '#C7D9F2', '#A9C5E6', '#8BA0D9', '#6D7CCC', '#4F58BF', '#3E48A3', '#2D3887', '#1C286A', '#0D184E'],
            'lavender': ['#F2E6FF', '#D9CCEC', '#C0B3D9', '#A799C6', '#8F80B3', '#766899', '#5D5180', '#443B66', '#2B264D', '#131133'],
            'sage-green': ['#E6F2E6', '#CCE5CC', '#B3D9B3', '#99CC99', '#7FB37F', '#669966', '#4D804D', '#336633', '#1A4D1A', '#003300'],
            'burgundy': ['#FFE6E9', '#F2CCD2', '#E6B3BB', '#D999A3', '#CC808C', '#BF6675', '#994D59', '#73333D', '#4D1A20', '#260D10'],
          },
          black: '#0a0a0a',
        }} 
        withGlobalStyles 
        withNormalizeCSS
      >
        <MobileUnderConstruction />
      </MantineProvider>
    );
  }

  return (
    <MantineProvider 
      theme={{ 
        colorScheme: 'dark', 
        primaryColor: 'royal-blue',
        colors: {
          dark: [
            '#c1c2c5',
            '#a1a2a6',
            '#909296',
            '#6e7075',
            '#555860',
            '#3e4046',
            '#2c2e33',
            '#1a1b1e',
            '#141517',
            '#0c0d0e',
          ],
          'royal-blue': ['#E5EEFF', '#C7D9F2', '#A9C5E6', '#8BA0D9', '#6D7CCC', '#4F58BF', '#3E48A3', '#2D3887', '#1C286A', '#0D184E'],
          'lavender': ['#F2E6FF', '#D9CCEC', '#C0B3D9', '#A799C6', '#8F80B3', '#766899', '#5D5180', '#443B66', '#2B264D', '#131133'],
          'sage-green': ['#E6F2E6', '#CCE5CC', '#B3D9B3', '#99CC99', '#7FB37F', '#669966', '#4D804D', '#336633', '#1A4D1A', '#003300'],
          'burgundy': ['#FFE6E9', '#F2CCD2', '#E6B3BB', '#D999A3', '#CC808C', '#BF6675', '#994D59', '#73333D', '#4D1A20', '#260D10'],
        },
        black: '#0a0a0a',
        components: {
          AppShell: {
            styles: (theme) => ({
              main: {
                backgroundColor: theme.colors.dark[8]
              }
            })
          }
        }
      }} 
      withGlobalStyles 
      withNormalizeCSS
    >
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
  );
} 