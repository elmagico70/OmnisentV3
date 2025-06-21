import { create } from 'zustand';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
}

interface NotesState {
  notes: NoteItem[];
  addNote: (note: NoteItem) => void;
  removeNote: (id: string) => void;
}

export const useNotesSlice = create<NotesState>((set) => ({
  notes: [],
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  removeNote: (id) => set((state) => ({ notes: state.notes.filter(n => n.id !== id) })),
}));
