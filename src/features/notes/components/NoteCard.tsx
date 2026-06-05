import { Pin, Circle, CheckCircle2, RotateCcw, Trash2 } from "lucide-react";
import type { Note } from "@/types";
import { getNoteColorClasses } from "../utils/note.utils";
import { useNotesStore } from "../store/notes.store";
import { cn } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  onClick: () => void;
  isTrashView?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
}

export function NoteCard({
  note,
  onClick,
  isTrashView = false,
  isSelected = false,
  onToggleSelect,
}: NoteCardProps) {
  const { togglePin, restoreNote, hardDeleteNote } = useNotesStore();
  const activeColorClasses = getNoteColorClasses(note.color);

  // TipTap stores empty paragraphs as '<p></p>'. We strip HTML to check for true emptiness.
  const rawText = note.content.replace(/<[^>]*>?/gm, "").trim();
  const isEmpty =
    !note.title.trim() && !rawText && !note.content.includes("<img");

  return (
    <div
      onClick={onClick}
      className={cn(
        "group relative flex flex-col p-5 rounded-2xl border transition-all cursor-pointer break-inside-avoid mb-4 hover:shadow-lg",
        activeColorClasses,
        note.color === "default" &&
          "bg-background-surface hover:border-text-secondary/30",
        isSelected &&
          "ring-2 ring-accent-primary ring-offset-2 ring-offset-background-main border-accent-primary",
      )}
    >
      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-1 z-10">
        {!isTrashView ? (
          <>
            {/* Multi-Select Checkbox */}
            {onToggleSelect && (
              <button
                onClick={(e) => onToggleSelect(note.id, e)}
                // Changed: opacity-100 on mobile, hover opacity on desktop (md:)
                className={`p-1.5 rounded-full transition-all duration-200 ${
                  isSelected
                    ? "opacity-100 text-accent-primary"
                    : "opacity-100 md:opacity-0 md:group-hover:opacity-100 text-text-secondary hover:text-text-primary"
                }`}
              >
                {isSelected ? (
                  <CheckCircle2 className="w-5 h-5 fill-accent-primary/20" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>
            )}

            {/* Pin Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                togglePin(note.id);
              }}
              // Changed: opacity-100 on mobile, hover opacity on desktop (md:)
              className={`p-1.5 rounded-full transition-all duration-200 ${
                note.isPinned
                  ? "opacity-100 bg-accent-primary/10 text-accent-primary"
                  : "opacity-100 md:opacity-0 md:group-hover:opacity-100 bg-background-main/50 text-text-secondary hover:text-text-primary"
              }`}
            >
              <Pin
                className={`w-4 h-4 ${note.isPinned ? "fill-current" : ""}`}
              />
            </button>
          </>
        ) : (
          /* Trash View Actions */
          // Changed: opacity-100 on mobile, hover opacity on desktop (md:)
          <div className="flex bg-background-surface/80 backdrop-blur-sm rounded-lg border border-border-subtle p-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => {
                e.stopPropagation();
                restoreNote(note.id);
              }}
              className="p-1.5 text-text-secondary hover:text-accent-primary rounded-md hover:bg-background-main transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                hardDeleteNote(note.id);
              }}
              className="p-1.5 text-text-secondary hover:text-red-500 rounded-md hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div
        className={cn(
          "transition-opacity",
          isEmpty ? "opacity-40" : "opacity-100",
        )}
      >
        {isEmpty ? (
          <div className="py-4 text-center italic text-text-secondary font-medium min-h-20 flex items-center justify-center">
            Empty
          </div>
        ) : (
          <>
            {note.title && (
              <h3 className="text-lg font-bold text-text-primary mb-2 pr-16 line-clamp-2">
                {note.title}
              </h3>
            )}
            <div className="relative overflow-hidden line-clamp-6 text-sm text-text-secondary">
              <div
                dangerouslySetInnerHTML={{ __html: note.content }}
                className="[&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-1"
              />
              <div
                className={`absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t to-transparent ${note.color === "default" ? "from-background-surface" : "from-transparent"}`}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
