import create from 'zustand';

const useModelStore = create((set) => ({
  models: [],
  selectedModel: null,
  setModels: (list) => set({ models: list }),
  setSelectedModel: (model) => set({ selectedModel: model }),
}));

export default useModelStore; 