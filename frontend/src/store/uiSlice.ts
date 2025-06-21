import { create } from 'zustand';

interface UIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}

export const useUiSlice = create<UIState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
