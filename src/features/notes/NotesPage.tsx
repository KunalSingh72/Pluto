import { useState, useEffect } from "react";
import { Menu, Plus, Trash2, StickyNote, X } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useNotesStore } from "./store/notes.store";
import NoteEditorModal from "./components/NoteEditorModal";
import { NoteCard } from "./components/NoteCard";
import type { Note } from "@/types";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

type NotesView = "active" | "trash";

export default function NotesPage() {
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const notes = useNotesStore((state) => state.notes);
  const addNote = useNotesStore((state) => state.addNote);
  const cleanOldTrash = useNotesStore((state) => state.cleanOldTrash);
  const softDeleteMultiple = useNotesStore((state) => state.softDeleteMultiple);

  const [activeView, setActiveView] = useState<NotesView>("active");
  const [prevActiveView, setPrevActiveView] = useState<NotesView>("active");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);

  // Multi-select state
  const [selectedNotes, setSelectedNotes] = useState<Set<string>>(new Set());
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  if (activeView !== prevActiveView) {
    setPrevActiveView(activeView);
    setSelectedNotes(new Set());
  }

  useEffect(() => {
    cleanOldTrash();
  }, [cleanOldTrash]);

  const activeNotes = notes.filter((n) => !n.deletedAt);
  const trashedNotes = notes.filter((n) => !!n.deletedAt);

  const pinnedNotes = activeNotes.filter((n) => n.isPinned);
  const otherNotes = activeNotes.filter((n) => !n.isPinned);

  const handleCreateNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: "",
      content: "",
      color: "default",
      isPinned: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addNote(newNote);
    setActiveNoteId(newNote.id);
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedNotes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedNotes(next);
  };

  const handleSelectAll = () => {
    if (selectedNotes.size === activeNotes.length) {
      setSelectedNotes(new Set());
    } else {
      setSelectedNotes(new Set(activeNotes.map((n) => n.id)));
    }
  };

  const handleBatchDelete = () => {
    softDeleteMultiple(Array.from(selectedNotes));
    setSelectedNotes(new Set());
    setIsConfirmDeleteOpen(false);
  };

  return (
    <div className="flex h-full w-full absolute inset-0 z-20 bg-background-main md:static md:bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300 relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border-subtle shrink-0 bg-background-surface z-10">
          {selectedNotes.size > 0 ? (
            <div className="flex items-center justify-between w-full animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedNotes(new Set())}
                  className="p-1.5 -ml-1 text-text-secondary hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-bold text-text-primary text-lg">
                  {selectedNotes.size} Selected
                </span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleSelectAll}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary"
                >
                  {selectedNotes.size === activeNotes.length
                    ? "Deselect"
                    : "Select All"}
                </button>
                <button
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full animate-in fade-in zoom-in-95">
              <div className="flex items-center gap-3">
                <button
                  onClick={openMobileMenu}
                  className="p-2 -ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                >
                  <Menu className="w-6 h-6" />
                </button>
                <span className="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
                  Notes
                </span>
              </div>
              <div className="flex bg-background-main p-1 rounded-lg">
                <button
                  onClick={() => setActiveView("active")}
                  className={`p-1.5 rounded-md ${activeView === "active" ? "bg-background-surface shadow-sm text-text-primary" : "text-text-secondary"}`}
                >
                  <StickyNote className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveView("trash")}
                  className={`p-1.5 rounded-md ${activeView === "trash" ? "bg-background-surface shadow-sm text-red-500" : "text-text-secondary"}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Header & View Toggles */}
        <div className="hidden md:flex pt-8 pb-6 px-8 items-center justify-between shrink-0">
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
              Notes
            </span>
          </h1>
          <div className="flex bg-background-surface border border-border-subtle p-1 rounded-xl">
            <button
              onClick={() => setActiveView("active")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === "active" ? "bg-background-main text-text-primary shadow-sm" : "text-text-secondary hover:text-text-primary"}`}
            >
              <StickyNote className="w-4 h-4" /> Active
            </button>
            <button
              onClick={() => setActiveView("trash")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeView === "trash" ? "bg-red-500/10 text-red-500 shadow-sm" : "text-text-secondary hover:text-red-500"}`}
            >
              <Trash2 className="w-4 h-4" /> Trash
            </button>
          </div>
        </div>

        {/* Note Input Trigger (Hidden in Trash View) */}
        {activeView === "active" && (
          <div className="px-4 md:px-8 max-w-2xl mx-auto w-full mb-8 shrink-0 mt-4 md:mt-0">
            <div
              onClick={handleCreateNote}
              className="flex items-center gap-4 bg-background-surface border border-border-subtle rounded-2xl p-4 text-text-secondary cursor-pointer shadow-sm hover:shadow-md hover:border-accent-primary/50 transition-all group"
            >
              <div className="p-2 rounded-xl bg-background-main group-hover:bg-accent-subtle group-hover:text-accent-primary transition-colors">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-medium text-lg">Take a note...</span>
            </div>
          </div>
        )}

        {/* Trash Notice */}
        {activeView === "trash" && (
          <div className="px-4 md:px-8 mb-6 shrink-0 text-center">
            <p className="text-sm font-medium text-text-secondary bg-background-surface inline-block px-4 py-2 rounded-full border border-border-subtle">
              Notes in Trash are deleted after 30 days.
            </p>
          </div>
        )}

        {/* Masonry Layout Area */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-24 md:pb-8">
          {(activeView === "active"
            ? activeNotes.length
            : trashedNotes.length) === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-text-secondary opacity-60">
              {activeView === "active" ? (
                <>
                  <StickyNote className="w-16 h-16 mb-4 stroke-[1.5]" />
                  <p className="text-lg font-medium">
                    Notes you add appear here
                  </p>
                </>
              ) : (
                <>
                  <Trash2 className="w-16 h-16 mb-4 stroke-[1.5]" />
                  <p className="text-lg font-medium">Trash is empty</p>
                </>
              )}
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              {activeView === "active" ? (
                <>
                  {/* Pinned Section */}
                  {pinnedNotes.length > 0 && (
                    <div className="mb-10">
                      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 ml-2">
                        Pinned
                      </h3>
                      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                        {pinnedNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={() => setActiveNoteId(note.id)}
                            isSelected={selectedNotes.has(note.id)}
                            onToggleSelect={handleToggleSelect}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Others Section */}
                  {otherNotes.length > 0 && (
                    <div>
                      {pinnedNotes.length > 0 && (
                        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-widest mb-4 ml-2">
                          Others
                        </h3>
                      )}
                      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                        {otherNotes.map((note) => (
                          <NoteCard
                            key={note.id}
                            note={note}
                            onClick={() => setActiveNoteId(note.id)}
                            isSelected={selectedNotes.has(note.id)}
                            onToggleSelect={handleToggleSelect}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* Trash Section */
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {trashedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onClick={() => {}}
                      isTrashView={true}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Multi-Select Floating Action Bar */}
        {selectedNotes.size > 0 && (
          <div className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 items-center gap-4 bg-background-surface border border-border-subtle shadow-2xl rounded-2xl px-5 py-3 z-30 animate-in slide-in-from-bottom-8">
            <span className="font-bold text-text-primary whitespace-nowrap">
              {selectedNotes.size} Selected
            </span>
            <div className="w-px h-6 bg-border-subtle" />
            <button
              onClick={handleSelectAll}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
            >
              {selectedNotes.size === activeNotes.length
                ? "Deselect All"
                : "Select All"}
            </button>
            <button
              onClick={() => setIsConfirmDeleteOpen(true)}
              className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors whitespace-nowrap"
            >
              Delete
            </button>
            <div className="w-px h-6 bg-border-subtle" />
            <button
              onClick={() => setSelectedNotes(new Set())}
              className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Editor Modal Overlay */}
      {activeNoteId && (
        <NoteEditorModal
          noteId={activeNoteId}
          onClose={() => setActiveNoteId(null)}
        />
      )}

      {/* Batch Delete Confirmation */}
      <ConfirmModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleBatchDelete}
        title="Delete Selected Notes"
        message={`Are you sure you want to move ${selectedNotes.size} note${selectedNotes.size > 1 ? "s" : ""} to the trash?`}
        confirmText="Move to Trash"
        isDanger={true}
      />
    </div>
  );
}
