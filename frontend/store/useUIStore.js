import create from 'zustand';

const useUIStore = create((set) => ({
  loading: false,
  error: null,
  setLoading: (state) => set({ loading: state }),
  setError: (err) => set({ error: err }),
  clearError: () => set({ error: null }),
}));

export default useUIStore; 