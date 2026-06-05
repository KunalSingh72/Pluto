import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
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
} from "lucide-react";
import { useNotesStore } from "../store/notes.store";

interface RichTextEditorProps {
  noteId: string;
  initialContent: string;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border-subtle/50 pb-3 mb-3">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("bold") ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("italic") ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("strike") ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("heading", { level: 1 }) ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <Heading2 className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("bulletList") ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <List className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded-lg transition-colors ${editor.isActive("orderedList") ? "bg-accent-primary/20 text-accent-primary" : "text-text-secondary hover:bg-background-main hover:text-text-primary"}`}
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-border-subtle mx-1" />

      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 rounded-lg text-text-secondary hover:bg-background-main hover:text-text-primary disabled:opacity-30 transition-colors"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 rounded-lg text-text-secondary hover:bg-background-main hover:text-text-primary disabled:opacity-30 transition-colors"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function RichTextEditor({
  noteId,
  initialContent,
}: RichTextEditorProps) {
  const updateNote = useNotesStore((state) => state.updateNote);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[300px] text-text-primary [&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_p]:leading-relaxed",
      },
    },
    onUpdate: ({ editor }) => {
      updateNote(noteId, { content: editor.getHTML() });
    },
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="order-2 md:order-1 border-t md:border-t-0 md:border-b border-border-subtle/50 pt-3 md:pt-0 md:pb-3 mt-2 md:mt-0 md:mb-3 shrink-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
        <MenuBar editor={editor} />
      </div>

      <div className="order-1 md:order-2 flex-1 overflow-y-auto pb-2 md:pb-0">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
