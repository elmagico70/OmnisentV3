import { create } from "zustand";

interface Tab {
  id: string;
  title: string;
  path: string;
  icon?: string;
  closable?: boolean;
}

interface User {
  name: string;
  role: string;
}

interface AppState {
  tabs: Tab[];
  activeTabId: string;
  sidebarCollapsed: boolean;
  theme: "dark" | "light";
  user: User | null;

  // Actions
  addTab: (tab: Tab) => void;
  removeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: "dark" | "light") => void;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tabs: [],
  activeTabId: "",
  sidebarCollapsed: false,
  theme: "dark",
  user: null,

  addTab: (tab) => {
    const existing = get().tabs.find((t) => t.id === tab.id);
    if (!existing) {
      set((state) => ({ tabs: [...state.tabs, tab] }));
    }
    set({ activeTabId: tab.id });
  },

  removeTab: (tabId) => {
    set((state) => {
      const filtered = state.tabs.filter((t) => t.id !== tabId);
      const newActive = state.activeTabId === tabId && filtered.length > 0
        ? filtered[filtered.length - 1].id
        : state.activeTabId;
      return {
        tabs: filtered,
        activeTabId: newActive,
      };
    });
  },

  setActiveTab: (tabId) => set({ activeTabId: tabId }),

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setTheme: (theme) => set({ theme }),

  setUser: (user) => set({ user }),
}));
