import type { NoteColor } from "@/types";

export const getNoteColorClasses = (color: NoteColor) => {
  switch (color) {
    case "red": return "bg-red-500/10 border-red-500/30";
    case "blue": return "bg-blue-500/10 border-blue-500/30";
    case "green": return "bg-green-500/10 border-green-500/30";
    case "yellow": return "bg-yellow-500/10 border-yellow-500/30";
    case "purple": return "bg-purple-500/10 border-purple-500/30";
    default: return "bg-background-surface border-border-subtle";
  }
};