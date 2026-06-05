export type NoteColor = "default" | "red" | "blue" | "green" | "yellow" | "purple";

export interface Note {
  id: string;
  title: string;
  content: string; 
  color: NoteColor;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; 
}