import create from 'zustand';

const useAuthStore = create((set) => ({
  accessToken: typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null,
  user: null,
  setAccessToken: (token) => {
    localStorage.setItem('accessToken', token);
    set({ accessToken: token });
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ accessToken: null, user: null });
  },
}));

export default useAuthStore; 