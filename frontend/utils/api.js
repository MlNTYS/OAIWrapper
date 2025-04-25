import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  withCredentials: true, // RefreshToken & CSRF cookie 자동 전송
  xsrfCookieName: 'XSRF-TOKEN', // 쿠키에 저장된 CSRF 토큰 이름
  xsrfHeaderName: 'X-XSRF-TOKEN' // 요청 헤더에 실어보낼 이름
});

// Request interceptor: set loading and attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle loading and errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api; 