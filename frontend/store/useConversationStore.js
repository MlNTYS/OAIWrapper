import create from 'zustand';

const useConversationStore = create((set) => ({
  conversations: [],
  currentConversationId: null,
  setConversations: (list) => set({ conversations: list }),
  addConversation: (conv) => set((state) => ({ conversations: [conv, ...state.conversations] })),
  setCurrentConversationId: (id) => set({ currentConversationId: id }),
  removeConversation: (id) => set((state) => ({ conversations: state.conversations.filter((c) => c.id !== id) })),
}));

export default useConversationStore; 