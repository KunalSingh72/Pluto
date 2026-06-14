import { useState } from "react";
import { startOfDay } from "date-fns";
import { Menu, Plus, CalendarDays, List } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useHabitsStore } from "./store/habits.store";
import { isHabitScheduledOnDate, calculateGoalProgress } from "./utils/habit.utils";
import { HabitTopNav } from "./components/HabitTopNav";
import { HabitBlock } from "./components/HabitBlock";
import { AddHabitModal } from "./components/AddHabitModal";
import { HabitDetails } from "./components/HabitDetails";
import { CycleConfirmationModal } from "./components/CycleConfirmationModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { cn } from "@/lib/utils";

type HabitView = "daily" | "all";

export default function HabitPage() {
  const openMobileMenu = useUiStore((state) => state.openMobileMenu);
  const habits = useHabitsStore((state) => state.habits);
  const bulkDeleteHabits = useHabitsStore((state) => state.bulkDeleteHabits);
  const [activeView, setActiveView] = useState<HabitView>("daily");
  const [selectedDate, setSelectedDate] = useState<Date>(
    startOfDay(new Date()),
  );

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);

  // Bulk Delete State
  const [isDeleteCompletedModalOpen, setIsDeleteCompletedModalOpen] =
    useState(false);
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);

  const celebratingHabit =
    habits.find((h) => {
      if (h.status === "stopped") return false;
      const stats = calculateGoalProgress(h);
      return stats?.isReadyToCelebrate;
    }) || null;

  const scheduledHabits = habits.filter((h) =>
    isHabitScheduledOnDate(h, selectedDate),
  );

  const handleOpenNewHabit = () => {
    setEditingHabitId(null);
    setIsAddModalOpen(true);
  };

  const handleEditHabit = () => {
    setEditingHabitId(selectedHabitId);
    setIsAddModalOpen(true);
  };

  const handleDeleteCompleted = () => {
    const completedIds = habits
      .filter((h) => h.status === "stopped")
      .map((h) => h.id);
    bulkDeleteHabits(completedIds);
    setIsDeleteCompletedModalOpen(false);
  };

  const handleDeleteAll = () => {
    const allIds = habits.map((h) => h.id);
    bulkDeleteHabits(allIds);
    setIsDeleteAllModalOpen(false);
  };

  return (
    <div className="flex h-full w-full absolute inset-0 z-20 bg-background-main md:static md:bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        <div className="flex flex-col h-full max-w-4xl w-full mx-auto relative px-0 md:px-8">
          <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border-subtle shrink-0 bg-background-surface z-10">
            <div className="flex items-center gap-3">
              <button
                onClick={openMobileMenu}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
                Habits
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex bg-background-main p-1 rounded-lg">
                <button
                  onClick={() => setActiveView("daily")}
                  className={cn(
                    "p-1.5 rounded-md",
                    activeView === "daily"
                      ? "bg-background-surface shadow-sm text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveView("all")}
                  className={cn(
                    "p-1.5 rounded-md",
                    activeView === "all"
                      ? "bg-background-surface shadow-sm text-text-primary"
                      : "text-text-secondary",
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <button
                onClick={handleOpenNewHabit}
                className="p-1.5 text-accent-primary hover:bg-accent-subtle rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex pt-8 pb-6 items-center justify-between shrink-0">
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
                Habits
              </span>
            </h1>

            <div className="flex items-center gap-4">
              <div className="flex bg-background-surface border border-border-subtle p-1 rounded-xl">
                <button
                  onClick={() => setActiveView("daily")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    activeView === "daily"
                      ? "bg-background-main text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  <CalendarDays className="w-4 h-4" /> Daily View
                </button>
                <button
                  onClick={() => setActiveView("all")}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                    activeView === "all"
                      ? "bg-background-main text-text-primary shadow-sm"
                      : "text-text-secondary hover:text-text-primary",
                  )}
                >
                  <List className="w-4 h-4" /> All Habits
                </button>
              </div>

              <button
                onClick={handleOpenNewHabit}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-primary text-white font-medium rounded-xl hover:opacity-90 transition-opacity cursor-pointer shadow-sm shadow-accent-primary/20"
              >
                <Plus className="w-5 h-5" />
                New Habit
              </button>
            </div>
          </div>

          {activeView === "daily" && (
            <div className="px-2 md:px-0 py-4 shrink-0 border-b border-border-subtle md:border-none bg-background-surface md:bg-transparent flex justify-center">
              <HabitTopNav
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 md:px-0 py-6 scrollbar-none flex flex-col">
            {activeView === "all" && habits.length > 0 && (
              <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                <span className="text-sm font-medium text-text-secondary">
                  Tracking History
                </span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsDeleteCompletedModalOpen(true)}
                    className="text-sm font-medium text-text-secondary hover:text-red-500 transition-colors cursor-pointer"
                  >
                    Delete Completed
                  </button>
                  <button
                    onClick={() => setIsDeleteAllModalOpen(true)}
                    className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors cursor-pointer"
                  >
                    Delete All
                  </button>
                </div>
              </div>
            )}

            {habits.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-text-secondary opacity-60">
                <p className="text-lg font-medium mb-2">Build Better Habits</p>
                <p className="text-sm">
                  Click the plus button to track your first habit.
                </p>
              </div>
            ) : activeView === "daily" && scheduledHabits.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-text-secondary text-sm">
                No habits scheduled for this day.
              </div>
            ) : (
              <div className="space-y-3 pb-8">
                {(activeView === "daily" ? scheduledHabits : habits).map(
                  (habit) => (
                    <HabitBlock
                      key={habit.id}
                      habit={habit}
                      selectedDate={
                        activeView === "daily"
                          ? selectedDate
                          : startOfDay(new Date())
                      }
                      onClick={() => setSelectedHabitId(habit.id)}
                      isReadOnly={activeView === "all"}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <HabitDetails
        habitId={selectedHabitId}
        onClose={() => setSelectedHabitId(null)}
        onEdit={handleEditHabit}
      />

      <AddHabitModal
        isOpen={isAddModalOpen}
        habitIdToEdit={editingHabitId}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingHabitId(null);
        }}
      />

      <CycleConfirmationModal habit={celebratingHabit} onClose={() => {}} />

      {/* Bulk Delete Confirmations */}
      <ConfirmModal
        isOpen={isDeleteCompletedModalOpen}
        onClose={() => setIsDeleteCompletedModalOpen(false)}
        onConfirm={handleDeleteCompleted}
        title="Delete Completed Habits"
        message="Are you sure you want to permanently delete all completed (stopped) habits? This history cannot be recovered."
        confirmText="Delete"
        isDanger={true}
      />
      <ConfirmModal
        isOpen={isDeleteAllModalOpen}
        onClose={() => setIsDeleteAllModalOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Habits"
        message="Are you sure you want to permanently delete ALL habits? This will erase everything."
        confirmText="Delete All"
        isDanger={true}
      />
    </div>
  );
}
