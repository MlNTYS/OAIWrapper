import { useState, useEffect } from 'react';
import { AppShell, MantineProvider, ColorSchemeProvider, createStyles } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import Sidebar from './Sidebar';
import { Splash } from './Splash';
import Head from 'next/head';
import { useRouter } from 'next/router';
import api from '../utils/api';
import { useQueryClient } from '@tanstack/react-query';

const useStyles = createStyles((theme) => ({
  appShell: {
    backgroundColor: theme.colors.dark[9],
    backgroundImage: 'linear-gradient(to bottom right, rgba(34, 35, 43, 0.7), rgba(20, 21, 26, 0.9))',
    transition: 'all 0.3s ease',
    position: 'relative',
    
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '100%',
      background: 'radial-gradient(circle at 15% 50%, rgba(88, 101, 242, 0.03), transparent 25%), radial-gradient(circle at 85% 30%, rgba(101, 242, 155, 0.03), transparent 25%)',
      pointerEvents: 'none',
      zIndex: 0,
    }
  },
  
  main: {
    position: 'relative',
    zIndex: 1,
    padding: '0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    overflowY: 'auto',
    backgroundColor: theme.colors.dark[8],
  },
}));

export default function Layout({ children }) {
  const [colorScheme, setColorScheme] = useState('dark');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { classes } = useStyles();

  const toggleColorScheme = (value) => {
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.get('/auth/me');
        setUser(res.data);
        
        // 로그인 상태에서 로그인/가입 페이지 접근 시 리다이렉트
        if (router.pathname === '/login' || router.pathname === '/signup') {
          router.push('/');
        }
      } catch (error) {
        // 비로그인 상태에서 접근 제한 페이지 접근 시 리다이렉트
        if (router.pathname !== '/login' && router.pathname !== '/signup') {
          router.push('/login');
        }
      } finally {
        // 인증 체크 후 로딩 상태 해제
        setLoading(false);
      }
    };

    checkAuth();
  }, [router.pathname]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('accessToken');
      
      // 캐시 초기화
      queryClient.clear();
      
      // 로그인 페이지로 리다이렉트
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 실패:', error);
    }
  };

  // 로딩 중일 때 스플래시 화면 표시
  if (loading) {
    return <Splash />;
  }

  return (
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme}>
      <MantineProvider
        theme={{
          colorScheme,
          colors: {
            // 커스텀 색상
            'royal-blue': [
              '#E8EAFF', '#D1D6FF', '#B9C2FF', '#A3AEFF', '#8C9BFF',
              '#7587FF', '#5E73FF', '#4760F6', '#304BE6', '#1A37D6'
            ],
            'lavender': [
              '#F2E8FF', '#E5D1FF', '#D8B9FF', '#CBA3FF', '#BE8CFF',
              '#B175FF', '#A45EFF', '#8F47F6', '#7A30E6', '#651AD6'
            ],
            'sage-green': [
              '#E8FFF4', '#D1FFE9', '#B9FFDE', '#A3FFD3', '#8CFFC8',
              '#75FFBD', '#5EFFB2', '#47F699', '#30E680', '#1AD667'
            ],
            'burgundy': [
              '#FFE8EC', '#FFD1D8', '#FFB9C5', '#FFA3B1', '#FF8C9D',
              '#FF758A', '#FF5E76', '#F64760', '#E63047', '#D61A2E'
            ],
          },
          primaryColor: 'royal-blue',
          primaryShade: 6,
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
          fontFamilyMonospace: 'JetBrains Mono, Monaco, Courier, monospace',
          headings: { fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif' },
          spacing: { xs: 8, sm: 12, md: 16, lg: 24, xl: 32 },
          radius: { xs: 4, sm: 6, md: 8, lg: 12, xl: 16 },
          shadows: {
            xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
            sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
            md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
          other: {
            navbarWidth: 280,
          },
        }}
        defaultProps={{
          Container: {
            sizes: {
              xs: 540,
              sm: 720,
              md: 960,
              lg: 1140,
              xl: 1320,
            },
          },
          Button: {
            size: 'md',
            radius: 'md',
          },
          TextInput: {
            size: 'md',
            radius: 'md',
          },
          Select: {
            size: 'md',
            radius: 'md',
          },
        }}
      >
        <Notifications position="top-right" />
        <AppShell
          padding={0}
          navbar={user && <Sidebar user={user} onLogout={handleLogout} />}
          classNames={{
            root: classes.appShell,
            main: classes.main,
          }}
        >
          <Head>
            <title>AI 채팅 서비스</title>
            <meta name="description" content="AI 채팅 서비스" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          {children}
        </AppShell>
      </MantineProvider>
    </ColorSchemeProvider>
  );
} 