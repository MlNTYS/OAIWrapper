import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function AdminIndexPage() {
  const router = useRouter();
  
  useEffect(() => {
    const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH;
    router.replace(`/${adminPath}/users`);
  }, []);
  
  return null;
} 