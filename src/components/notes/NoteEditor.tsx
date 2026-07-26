"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useNoteStore, NoteColor } from "@/store/useNoteStore";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Undo,
  Redo,
  Palette,
  Trash2,
  X,
  RotateCcw,
} from "lucide-react";

interface NoteEditorProps {
  noteId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

const colorMap: Record<NoteColor, string> = {
  default: "border-zinc-800 shadow-xl shadow-black",
  red: "border-red-500/50 shadow-2xl shadow-red-900/10",
  orange: "border-orange-500/50 shadow-2xl shadow-orange-900/10",
  yellow: "border-yellow-500/50 shadow-2xl shadow-yellow-900/10",
  green: "border-green-500/50 shadow-2xl shadow-green-900/10",
  blue: "border-blue-500/50 shadow-2xl shadow-blue-900/10",
  purple: "border-purple-500/50 shadow-2xl shadow-purple-900/10",
};

const bgColors: { name: NoteColor; class: string }[] = [
  { name: "default", class: "bg-zinc-800" },
  { name: "red", class: "bg-red-500" },
  { name: "orange", class: "bg-orange-500" },
  { name: "yellow", class: "bg-yellow-500" },
  { name: "green", class: "bg-green-500" },
  { name: "blue", class: "bg-blue-500" },
  { name: "purple", class: "bg-purple-500" },
];

interface ToolbarButtonProps {
  onClick: () => void;
  isActive: boolean;
  icon: React.ElementType;
}

const ToolbarButton = ({
  onClick,
  isActive,
  icon: Icon,
}: ToolbarButtonProps) => (
  <button
    onClick={onClick}
    className={`p-1.5 rounded-lg transition-colors ${
      isActive
        ? "bg-zinc-800 text-zinc-100"
        : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
    }`}
  >
    <Icon className="h-4 w-4" />
  </button>
);

export function NoteEditor({ noteId, isOpen, onClose }: NoteEditorProps) {
  const {
    notes,
    updateNote,
    moveToTrash,
    restoreFromTrash,
    permanentlyDelete,
    changeColor,
  } = useNoteStore();
  const note = notes.find((n) => n.id === noteId);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing..." }),
    ],
    content: note?.content || "",
    onUpdate: ({ editor }) => {
      if (noteId) updateNote(noteId, { content: editor.getHTML() });
    },
  });

  useEffect(() => {
    if (editor && note && editor.getHTML() !== note.content) {
      editor.commands.setContent(note.content);
    }
  }, [noteId, editor, note]);

  if (!note) return null;

  const formattedDate = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const handleTrashAction = () => {
    if (note.isDeleted) {
      permanentlyDelete(note.id);
    } else {
      moveToTrash(note.id);
    }
    onClose();
  };

  const handleRestore = () => {
    restoreFromTrash(note.id);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`sm:max-w-3xl bg-[#121215] p-0 gap-0 transition-colors duration-300 ${colorMap[note.color]}`}
      >
        <DialogTitle className="sr-only">Edit Note</DialogTitle>

        <div className="flex justify-between items-start p-8 pb-4">
          <div className="flex-1 mr-8">
            <input
              value={note.title}
              onChange={(e) => updateNote(note.id, { title: e.target.value })}
              placeholder="Note Title"
              className="w-full bg-transparent text-3xl font-bold text-zinc-100 outline-none placeholder:text-zinc-700 mb-2"
            />
            <p className="text-xs text-zinc-500 font-medium tracking-wide">
              Last edited: {formattedDate}
            </p>
          </div>

          <div className="flex items-center gap-2 text-zinc-400">
            {note.isDeleted && (
              <button
                onClick={handleRestore}
                className="p-2 hover:bg-zinc-800/60 hover:text-green-400 rounded-lg transition-colors"
                title="Restore Note"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            {!note.isDeleted && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 hover:bg-zinc-800/60 hover:text-zinc-200 rounded-lg transition-colors">
                    <Palette className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-auto p-3 bg-[#18181b] border-zinc-800 rounded-xl"
                  align="end"
                >
                  <div className="flex gap-2">
                    {bgColors.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => changeColor(note.id, c.name)}
                        className={`h-6 w-6 rounded-full cursor-pointer transition-transform hover:scale-110 ${c.class} ${
                          note.color === c.name
                            ? "ring-2 ring-white ring-offset-2 ring-offset-[#18181b]"
                            : ""
                        }`}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}

            <ConfirmDialog
              title={note.isDeleted ? "Permanently Delete?" : "Move to Trash?"}
              description={
                note.isDeleted
                  ? "This note will be permanently deleted. This action cannot be undone."
                  : "This note will be moved to the trash bin."
              }
              onConfirm={handleTrashAction}
              destructive
            >
              <button className="p-2 hover:bg-zinc-800/60 hover:text-red-400 rounded-lg transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </ConfirmDialog>

            <div className="w-px h-5 bg-zinc-800 mx-1" />

            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-800/60 hover:text-zinc-200 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {editor && (
          <div className="px-8 pb-4 mb-4 border-b border-zinc-800/60 flex items-center gap-1.5 flex-wrap">
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              icon={Bold}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              icon={Italic}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive("strike")}
              icon={Strikethrough}
            />
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 1 }).run()
              }
              isActive={editor.isActive("heading", { level: 1 })}
              icon={Heading1}
            />
            <ToolbarButton
              onClick={() =>
                editor.chain().focus().toggleHeading({ level: 2 }).run()
              }
              isActive={editor.isActive("heading", { level: 2 })}
              icon={Heading2}
            />
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              icon={List}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              icon={ListOrdered}
            />
            <div className="w-px h-4 bg-zinc-800 mx-1" />
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              isActive={false}
              icon={Undo}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              isActive={false}
              icon={Redo}
            />
          </div>
        )}

        <div className="px-8 pb-8 overflow-y-auto max-h-[60vh] custom-scrollbar">
          <EditorContent editor={editor} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
