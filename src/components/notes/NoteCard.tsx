"use client";

import { Pin, Trash2, RotateCcw } from "lucide-react";
import { Note, NoteColor } from "@/store/useNoteStore";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Checkbox } from "@/components/ui/checkbox";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  onTogglePin: (e: React.MouseEvent) => void;
  onRestore?: (e: React.MouseEvent) => void;
  onPermanentDelete?: () => void;
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onToggleSelect?: () => void;
}

const cardColors: Record<NoteColor, string> = {
  default:
    "bg-[#121215] border-zinc-800/80 hover:border-zinc-700 text-zinc-100",
  red: "bg-[#2a1215] border-red-900/40 hover:border-red-800/80 text-red-50",
  orange:
    "bg-[#2a1a12] border-orange-900/40 hover:border-orange-800/80 text-orange-50",
  yellow:
    "bg-[#2a2412] border-yellow-900/40 hover:border-yellow-800/80 text-yellow-50",
  green:
    "bg-[#122a18] border-green-900/40 hover:border-green-800/80 text-green-50",
  blue: "bg-[#121c2a] border-blue-900/40 hover:border-blue-800/80 text-blue-50",
  purple:
    "bg-[#1e122a] border-purple-900/40 hover:border-purple-800/80 text-purple-50",
};

const iconColors: Record<NoteColor, string> = {
  default: "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
  red: "text-red-500 hover:text-red-300 hover:bg-red-950",
  orange: "text-orange-500 hover:text-orange-300 hover:bg-orange-950",
  yellow: "text-yellow-500 hover:text-yellow-300 hover:bg-yellow-950",
  green: "text-green-500 hover:text-green-300 hover:bg-green-950",
  blue: "text-blue-500 hover:text-blue-300 hover:bg-blue-950",
  purple: "text-purple-500 hover:text-purple-300 hover:bg-purple-950",
};

export function NoteCard({
  note,
  onClick,
  onTogglePin,
  onRestore,
  onPermanentDelete,
  isSelected,
  isSelectionMode,
  onToggleSelect,
}: NoteCardProps) {
  const previewText = note.content
    .replace(/<[^>]*>?/gm, " ")
    .replace(/\s+/g, " ")
    .trim();

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col p-5 rounded-2xl border transition-all duration-300 cursor-pointer break-inside-avoid shadow-sm hover:shadow-md mb-4 ${cardColors[note.color]} ${isSelected ? "ring-2 ring-inset ring-purple-500 border-transparent" : ""}`}
    >
      <div className="flex justify-between items-start gap-2 mb-3">
        <div className="flex items-start gap-3 overflow-hidden flex-1">
          {/* Select Checkbox (Appears on hover or when active) */}
          <div
            className={`shrink-0 pt-0.5 transition-opacity duration-200 ${isSelected || isSelectionMode ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
            onClick={(e) => e.stopPropagation()} // Prevent card click when clicking checkbox
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={onToggleSelect}
              className="h-5 w-5 rounded-md data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 border-zinc-500"
            />
          </div>
          <h3 className="font-semibold text-base leading-tight truncate mt-0.5">
            {note.title || "Untitled Note"}
          </h3>
        </div>

        {/* Contextual Top-Right Actions */}
        {!note.isDeleted ? (
          <button
            onClick={onTogglePin}
            className={`shrink-0 p-1.5 rounded-full transition-all duration-200 ${
              note.isPinned
                ? "opacity-100 bg-black/20"
                : "opacity-0 group-hover:opacity-100"
            } ${iconColors[note.color]}`}
            title={note.isPinned ? "Unpin note" : "Pin note"}
          >
            <Pin className={`h-4 w-4 ${note.isPinned ? "fill-current" : ""}`} />
          </button>
        ) : (
          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onRestore}
              className="p-1.5 rounded-full transition-all duration-200 hover:bg-black/20 text-zinc-400 hover:text-green-400"
              title="Restore Note"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <ConfirmDialog
              title="Permanently Delete?"
              description="This note will be deleted forever. This action cannot be undone."
              onConfirm={onPermanentDelete!}
              destructive
            >
              <button
                className="p-1.5 rounded-full transition-all duration-200 hover:bg-black/20 text-zinc-400 hover:text-red-400"
                title="Delete forever"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </ConfirmDialog>
          </div>
        )}
      </div>

      <p className="text-sm opacity-70 line-clamp-6 whitespace-pre-wrap leading-relaxed">
        {previewText || (
          <span className="italic opacity-50">Empty note...</span>
        )}
      </p>
    </div>
  );
}
