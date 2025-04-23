import axios from 'axios';
import useUIStore from '../store/useUIStore';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
  withCredentials: true, // RefreshToken & CSRF cookie 자동 전송
  xsrfCookieName: 'XSRF-TOKEN', // 쿠키에 저장된 CSRF 토큰 이름
  xsrfHeaderName: 'X-XSRF-TOKEN' // 요청 헤더에 실어보낼 이름
});

// Request interceptor: set loading and attach token
api.interceptors.request.use((config) => {
  const { setLoading, clearError } = useUIStore.getState();
  setLoading(true);
  clearError();
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle loading and errors
api.interceptors.response.use(
  (response) => {
    useUIStore.getState().setLoading(false);
    return response;
  },
  (error) => {
    const ui = useUIStore.getState();
    ui.setLoading(false);
    ui.setError(error.response?.data?.message || error.message);
    return Promise.reject(error);
  }
);

export default api; 