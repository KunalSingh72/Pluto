"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Search, FileText, Trash2, LayoutGrid, X } from "lucide-react";
import { useNoteStore } from "@/store/useNoteStore";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { NoteCard } from "@/components/notes/NoteCard";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Button } from "@/components/ui/button";

type Tab = "active" | "trash";

export default function NotesPage() {
  const {
    notes,
    addNote,
    togglePin,
    emptyTrash,
    restoreFromTrash,
    permanentlyDelete,
    moveToTrash,
  } = useNoteStore();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // Selection State
  const [selectedNoteIds, setSelectedNoteIds] = useState<string[]>([]);
  const isSelectionMode = selectedNoteIds.length > 0;

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Clear selections when switching tabs (pushed to next tick to avoid cascading render)
  useEffect(() => {
    const timer = setTimeout(() => setSelectedNoteIds([]), 0);
    return () => clearTimeout(timer);
  }, [activeTab]);
  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return notes.filter((note) => {
      const matchesTab =
        activeTab === "trash" ? note.isDeleted : !note.isDeleted;
      const matchesSearch =
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query);
      return matchesTab && matchesSearch;
    });
  }, [notes, activeTab, searchQuery]);

  const pinnedNotes = useMemo(
    () => filteredNotes.filter((n) => n.isPinned),
    [filteredNotes],
  );
  const otherNotes = useMemo(
    () => filteredNotes.filter((n) => !n.isPinned),
    [filteredNotes],
  );

  const handleCreateNote = () => {
    const newNoteId = addNote("", "");
    setEditingNoteId(newNoteId);
  };

  // --- Bulk Selection Handlers ---
  const toggleNoteSelection = (id: string) => {
    setSelectedNoteIds((prev) =>
      prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedNoteIds.length === filteredNotes.length) {
      setSelectedNoteIds([]); // Deselect all
    } else {
      setSelectedNoteIds(filteredNotes.map((n) => n.id)); // Select all
    }
  };

  const handleBulkDelete = () => {
    if (activeTab === "trash") {
      selectedNoteIds.forEach((id) => permanentlyDelete(id));
    } else {
      selectedNoteIds.forEach((id) => moveToTrash(id));
    }
    setSelectedNoteIds([]);
  };

  // A helper function to manage clicking cards contextually
  const handleCardClick = (id: string) => {
    if (isSelectionMode) {
      toggleNoteSelection(id);
    } else {
      setEditingNoteId(id);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-2 relative">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-10 pt-2">
        <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-br from-white to-purple-500 drop-shadow-sm">
          Notes
        </h2>

        <div className="flex bg-[#121215] p-1 rounded-xl border border-zinc-800/60">
          <button
            onClick={() => setActiveTab("active")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "active"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <FileText className="h-4 w-4" /> Active
          </button>
          <button
            onClick={() => setActiveTab("trash")}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "trash"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Trash2 className="h-4 w-4" /> Trash
          </button>
        </div>
      </div>

      {/* Action Bar (Search & Create) */}
      {activeTab === "active" && (
        <div className="flex justify-center mb-12">
          <div className="relative w-full max-w-2xl group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full h-14 bg-[#121215] border border-zinc-800/80 rounded-2xl pl-12 pr-32 text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/10 transition-all shadow-sm"
            />
            <button
              onClick={handleCreateNote}
              className="absolute inset-y-2 right-2 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 rounded-xl text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" /> Take a note...
            </button>
          </div>
        </div>
      )}

      {/* Trash Empty Action */}
      {activeTab === "trash" && filteredNotes.length > 0 && (
        <div className="flex justify-end mb-8">
          <ConfirmDialog
            title="Empty Trash?"
            description="All deleted notes will be permanently erased. This cannot be undone."
            onConfirm={emptyTrash}
            destructive
          >
            <Button
              variant="destructive"
              className="rounded-xl shadow-lg shadow-red-900/20"
            >
              Empty Trash
            </Button>
          </ConfirmDialog>
        </div>
      )}

      {/* Note Grids Container */}
      <div className="flex-1 overflow-y-auto pb-32 custom-scrollbar pr-2">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
            <LayoutGrid className="h-12 w-12 mb-4 opacity-20" />
            <p>No notes found.</p>
          </div>
        ) : activeTab === "active" ? (
          <div className="flex flex-col gap-10">
            {/* Pinned Section */}
            {pinnedNotes.length > 0 && (
              <section>
                <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4 ml-2">
                  Pinned
                </h3>
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {pinnedNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isSelected={selectedNoteIds.includes(note.id)}
                      isSelectionMode={isSelectionMode}
                      onToggleSelect={() => toggleNoteSelection(note.id)}
                      onClick={() => handleCardClick(note.id)}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        togglePin(note.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Others Section */}
            {otherNotes.length > 0 && (
              <section>
                {pinnedNotes.length > 0 && (
                  <h3 className="text-xs font-bold text-zinc-500 tracking-widest uppercase mb-4 ml-2">
                    Others
                  </h3>
                )}
                <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
                  {otherNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isSelected={selectedNoteIds.includes(note.id)}
                      isSelectionMode={isSelectionMode}
                      onToggleSelect={() => toggleNoteSelection(note.id)}
                      onClick={() => handleCardClick(note.id)}
                      onTogglePin={(e) => {
                        e.stopPropagation();
                        togglePin(note.id);
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          /* Trash Section */
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note.id}
                note={note}
                isSelected={selectedNoteIds.includes(note.id)}
                isSelectionMode={isSelectionMode}
                onToggleSelect={() => toggleNoteSelection(note.id)}
                onClick={() => handleCardClick(note.id)}
                onTogglePin={() => {}}
                onRestore={(e) => {
                  e.stopPropagation();
                  restoreFromTrash(note.id);
                }}
                onPermanentDelete={() => permanentlyDelete(note.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {isSelectionMode && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-40 flex items-center gap-4 bg-[#18181b] border border-zinc-700/80 px-6 py-3 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-8 fade-in duration-200">
          <span className="text-sm font-semibold text-purple-400 whitespace-nowrap">
            {selectedNoteIds.length} selected
          </span>

          <div className="w-px h-5 bg-zinc-700" />

          <button
            onClick={handleSelectAll}
            className="text-sm font-medium text-zinc-300 hover:text-white transition-colors whitespace-nowrap"
          >
            {selectedNoteIds.length === filteredNotes.length
              ? "Deselect All"
              : "Select All"}
          </button>

          <div className="w-px h-5 bg-zinc-700" />

          <ConfirmDialog
            title={
              activeTab === "trash"
                ? "Permanently Delete Selected?"
                : "Move Selected to Trash?"
            }
            description={`Are you sure you want to delete ${selectedNoteIds.length} note(s)?`}
            onConfirm={handleBulkDelete}
            destructive
          >
            <button className="text-sm font-medium text-red-400 hover:text-red-300 transition-colors flex items-center gap-1.5 whitespace-nowrap">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </ConfirmDialog>

          <div className="w-px h-5 bg-zinc-700" />

          <button
            onClick={() => setSelectedNoteIds([])}
            className="p-1 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800"
            title="Cancel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Rich Text Editor Component */}
      <NoteEditor
        noteId={editingNoteId}
        isOpen={!!editingNoteId}
        onClose={() => setEditingNoteId(null)}
      />
    </div>
  );
}
