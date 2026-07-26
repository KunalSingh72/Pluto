import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NoteColor = "default" | "red" | "orange" | "yellow" | "green" | "blue" | "purple";

export interface Note {
  id: string;
  title: string;
  content: string; // Stored as HTML string
  color: NoteColor;
  isPinned: boolean;
  isDeleted: boolean;
  updatedAt: string;
  createdAt: string;
}

interface NoteState {
  notes: Note[];
  
  // Core Actions
  addNote: (title?: string, content?: string) => string; // returns the new note ID
  updateNote: (id: string, updates: Partial<Note>) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  
  // Quick Actions
  togglePin: (id: string) => void;
  changeColor: (id: string, color: NoteColor) => void;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set) => ({
      notes: [],

      addNote: (title = "", content = "") => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        const newNote: Note = {
          id,
          title,
          content,
          color: "default",
          isPinned: false,
          isDeleted: false,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({ notes: [newNote, ...state.notes] }));
        return id;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id 
              ? { ...note, ...updates, updatedAt: new Date().toISOString() } 
              : note
          ),
        }));
      },

      moveToTrash: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isDeleted: true, isPinned: false } : note
          ),
        }));
      },

      restoreFromTrash: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isDeleted: false } : note
          ),
        }));
      },

      permanentlyDelete: (id) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.id !== id),
        }));
      },

      emptyTrash: () => {
        set((state) => ({
          notes: state.notes.filter((note) => !note.isDeleted),
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, isPinned: !note.isPinned } : note
          ),
        }));
      },

      changeColor: (id, color) => {
        set((state) => ({
          notes: state.notes.map((note) =>
            note.id === id ? { ...note, color, updatedAt: new Date().toISOString() } : note
          ),
        }));
      },
    }),
    {
      name: "pluto-notes-storage",
    }
  )
);