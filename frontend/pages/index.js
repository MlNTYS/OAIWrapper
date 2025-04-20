import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.replace('/conversations/new');
    } else {
      router.replace('/login');
    }
  }, []);

  return null;
} 