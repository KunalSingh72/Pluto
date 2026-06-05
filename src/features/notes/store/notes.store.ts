import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Note, NoteColor } from "@/types";

interface NotesState {
  notes: Note[];
  addNote: (note: Note) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  softDeleteNote: (id: string) => void;
  softDeleteMultiple: (ids: string[]) => void;
  hardDeleteNote: (id: string) => void;
  hardDeleteMultiple: (ids: string[]) => void;
  restoreNote: (id: string) => void;
  changeColor: (id: string, color: NoteColor) => void;
  togglePin: (id: string) => void;
  cleanOldTrash: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (note) => set((state) => ({ notes: [note, ...state.notes] })),
      updateNote: (id, updates) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        })),
      softDeleteNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, deletedAt: new Date().toISOString(), isPinned: false } : n
          ),
        })),
      softDeleteMultiple: (ids) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            ids.includes(n.id) ? { ...n, deletedAt: new Date().toISOString(), isPinned: false } : n
          ),
        })),
      hardDeleteNote: (id) =>
        set((state) => ({ notes: state.notes.filter((n) => n.id !== id) })),
      hardDeleteMultiple: (ids) =>
        set((state) => ({ notes: state.notes.filter((n) => !ids.includes(n.id)) })),
      restoreNote: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, deletedAt: undefined, updatedAt: new Date().toISOString() } : n
          ),
        })),
      changeColor: (id, color) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, color, updatedAt: new Date().toISOString() } : n)),
        })),
      togglePin: (id) =>
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
          ),
        })),
      cleanOldTrash: () =>
        set((state) => {
          const now = new Date();
          return {
            notes: state.notes.filter((n) => {
              if (!n.deletedAt) return true;
              const deletedDate = new Date(n.deletedAt);
              const diffTime = Math.abs(now.getTime() - deletedDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              return diffDays <= 30; // Keep if deleted less than 30 days ago
            }),
          };
        }),
    }),
    { name: "life-tracker-notes" }
  )
);