import { useState, useRef, useEffect } from "react";
import { X, Palette, Trash2, ChevronLeft } from "lucide-react";
import { format, parseISO } from "date-fns";
import RichTextEditor from "./RichTextEditor";
import { useNotesStore } from "../store/notes.store";
import type { NoteColor } from "@/types";
import { cn } from "@/lib/utils";

interface NoteEditorModalProps {
  noteId: string | null;
  onClose: () => void;
}

const editorBorderColors: Record<NoteColor, string> = {
  default: "border-border-subtle",
  red: "border-red-500 shadow-red-500/10",
  blue: "border-blue-500 shadow-blue-500/10",
  green: "border-green-500 shadow-green-500/10",
  yellow: "border-yellow-500 shadow-yellow-500/10",
  purple: "border-purple-500 shadow-purple-500/10",
};

export default function NoteEditorModal({
  noteId,
  onClose,
}: NoteEditorModalProps) {
  const { notes, updateNote, changeColor, softDeleteNote } = useNotesStore();
  const note = notes.find((n) => n.id === noteId);

  const [title, setTitle] = useState(note?.title || "");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(event.target as Node)
      ) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColorPicker]);

  if (!note || !noteId) return null;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      updateNote(noteId, { title: newTitle });
    }, 500);
  };

  const handleDelete = () => {
    softDeleteNote(noteId);
    onClose();
  };

  const colors: { value: NoteColor; class: string }[] = [
    { value: "default", class: "bg-background-surface border-border-subtle" },
    { value: "red", class: "bg-red-500 border-red-500" },
    { value: "blue", class: "bg-blue-500 border-blue-500" },
    { value: "green", class: "bg-green-500 border-green-500" },
    { value: "yellow", class: "bg-yellow-500 border-yellow-500" },
    { value: "purple", class: "bg-purple-500 border-purple-500" },
  ];

  const lastEdited = format(parseISO(note.updatedAt), "MMM d, h:mm a");

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 md:p-6 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className={cn(
          "relative flex h-full md:h-[85vh] w-full max-w-4xl flex-col overflow-hidden md:rounded-2xl border-2 bg-background-surface shadow-2xl transition-all duration-300",
          editorBorderColors[note.color],
        )}
      >
        <div className="relative z-20 flex items-center gap-2 border-b border-border-subtle/50 p-3 md:p-5 shrink-0">
          {/* Mobile Back Button */}
          <button
            onClick={onClose}
            className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-xl transition-colors shrink-0"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>

          <div className="flex-1 flex flex-col">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Title"
              className="bg-transparent text-xl md:text-3xl font-bold text-text-primary outline-none placeholder:text-text-secondary"
            />
            <span className="text-xs text-text-secondary font-medium mt-1">
              Last edited: {lastEdited}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            {/* Full Color Picker Block */}
            <div className="relative" ref={colorPickerRef}>
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-text-secondary transition-colors hover:bg-background-main hover:text-text-primary"
              >
                <Palette className="h-5 w-5" />
              </button>

              {showColorPicker && (
                <div className="absolute right-0 top-12 z-50 flex gap-2 rounded-xl border border-border-subtle bg-background-surface p-3 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                  {colors.map((c) => (
                    <button
                      key={c.value}
                      onClick={() => {
                        changeColor(noteId, c.value);
                        setShowColorPicker(false);
                      }}
                      className={cn(
                        "h-6 w-6 rounded-full border opacity-80 transition-all hover:scale-110 hover:opacity-100",
                        c.class,
                        note.color === c.value &&
                          "ring-2 ring-accent-primary ring-offset-2 ring-offset-background-surface opacity-100",
                      )}
                    />
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleDelete}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-text-secondary transition-colors hover:bg-red-500/10 hover:text-red-500"
              title="Move to Trash"
            >
              <Trash2 className="h-5 w-5" />
            </button>
            <div className="w-px h-6 bg-border-subtle mx-1 hidden md:block" />

            {/* Hide X on mobile */}
            <button
              onClick={onClose}
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-transparent text-text-secondary transition-colors hover:bg-background-main hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4 md:p-5">
          <RichTextEditor noteId={note.id} initialContent={note.content} />
        </div>
      </div>
    </div>
  );
}
