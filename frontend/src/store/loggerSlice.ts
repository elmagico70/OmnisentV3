import { create } from "zustand";

interface LoggerState {
  logs: string[];
  addLog: (log: string) => void;
  clearLogs: () => void;
}

export const useLoggerSlice = create<LoggerState>((set) => ({
  logs: [],
  addLog: (log) => set((state) => ({ logs: [...state.logs, log] })),
  clearLogs: () => set({ logs: [] }),
}));
