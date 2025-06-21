import { create } from "zustand";

type Status = "pendiente" | "haciendo" | "terminado";

interface KanbanCard {
  id: string;
  title: string;
  content?: string;
}

interface KanbanState {
  columns: Record<Status, KanbanCard[]>;
  addCard: (status: Status, card: KanbanCard) => void;
  moveCard: (from: Status, to: Status, cardId: string) => void;
  removeCard: (status: Status, cardId: string) => void;
}

export const useKanbanStore = create<KanbanState>((set) => ({
  columns: {
    pendiente: [],
    haciendo: [],
    terminado: [],
  },

  addCard: (status, card) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [status]: [...state.columns[status], card],
      },
    })),

  moveCard: (from, to, cardId) =>
    set((state) => {
      const card = state.columns[from].find((c) => c.id === cardId);
      if (!card) return state;

      return {
        columns: {
          ...state.columns,
          [from]: state.columns[from].filter((c) => c.id !== cardId),
          [to]: [...state.columns[to], card],
        },
      };
    }),

  removeCard: (status, cardId) =>
    set((state) => ({
      columns: {
        ...state.columns,
        [status]: state.columns[status].filter((c) => c.id !== cardId),
      },
    })),
}));
