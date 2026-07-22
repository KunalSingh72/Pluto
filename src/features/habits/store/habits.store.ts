import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, isAfter, startOfDay, parseISO } from "date-fns";
import type { Habit } from "@/types";
import { useGoalsStore } from "@/features/goals/store/goals.store"; // ADD IMPORT

interface HabitsState {
  habits: Habit[];
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void; 
  bulkDeleteHabits: (ids: string[]) => void;
  toggleHabitCompletionOnDate: (id: string, date: Date) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({ // ADD 'get' to access current state
      habits: [] as Habit[],
      
      addHabit: (habit) => set((state) => ({ 
        habits: [habit, ...state.habits] 
      })),
      
      updateHabit: (id, updates) => {
        const state = get();
        const h = state.habits.find(x => x.id === id);
        if (h) {
            const goalsStore = useGoalsStore.getState();
            const oldGoalId = h.linkedGoalId;
            const oldContribution = h.goalContribution || 1;
            const newGoalId = updates.linkedGoalId !== undefined ? updates.linkedGoalId : h.linkedGoalId;
            const newContribution = updates.goalContribution !== undefined ? updates.goalContribution : (h.goalContribution || 1);

            const numCompleted = h.completedDates.length;

            if (numCompleted > 0) {
                if (oldGoalId === newGoalId && oldGoalId && oldGoalId !== "none") {
                    const delta = (newContribution * numCompleted) - (oldContribution * numCompleted);
                    if (delta !== 0) {
                        const goal = goalsStore.goals.find(g => g.id === oldGoalId);
                        if (goal) {
                            goalsStore.updateProgress(goal.id, goal.currentValue + delta, "habit", id);
                        }
                    }
                } else {
                    if (oldGoalId && oldGoalId !== "none") {
                        const oldGoal = goalsStore.goals.find(g => g.id === oldGoalId);
                        if (oldGoal) {
                            goalsStore.updateProgress(oldGoal.id, oldGoal.currentValue - (oldContribution * numCompleted), "habit", id);
                        }
                    }

                    if (newGoalId && newGoalId !== "none") {
                        const freshGoalsStore = useGoalsStore.getState();
                        const newGoal = freshGoalsStore.goals.find(g => g.id === newGoalId);
                        if (newGoal) {
                            freshGoalsStore.updateProgress(newGoal.id, newGoal.currentValue + (newContribution * numCompleted), "habit", id);
                        }
                    }
                }
            }
        }
        set((state) => ({
            habits: state.habits.map((habit) => (habit.id === id ? { ...habit, ...updates } : habit))
        }));
      },
      
      deleteHabit: (id) => {
        const state = get();
        const h = state.habits.find(x => x.id === id);
        if (h && h.linkedGoalId && h.linkedGoalId !== "none") {
            const goalsStore = useGoalsStore.getState();
            const goal = goalsStore.goals.find(g => g.id === h.linkedGoalId);
            if (goal) {
                const contribution = h.goalContribution || 1;
                const numCompleted = h.completedDates.length;
                if (numCompleted > 0) {
                    goalsStore.updateProgress(goal.id, goal.currentValue - (contribution * numCompleted), "habit", id);
                }
            }
        }
        set((state) => ({
            habits: state.habits.filter((h) => h.id !== id)
        }));
      },

      bulkDeleteHabits: (ids) => {
        const state = get();
        ids.forEach(id => {
            state.deleteHabit(id);
        });
      },
      
      toggleHabitCompletionOnDate: (id, date) => {
        const state = get();
        const h = state.habits.find((x) => x.id === id);
        if (!h) return;

        // PROTECT HISTORICAL CYCLES
        const lastCycleEndDateStr = h.pastCycles?.length 
          ? h.pastCycles[h.pastCycles.length - 1].endDate 
          : null;

        if (lastCycleEndDateStr && !isAfter(startOfDay(date), startOfDay(parseISO(lastCycleEndDateStr)))) {
          return;
        }

        const dateString = format(date, "yyyy-MM-dd");
        const isCompleted = h.completedDates.includes(dateString);

        // INTERCEPT: Automate Goal Progress
        if (h.linkedGoalId && h.linkedGoalId !== "none") {
          const contribution = h.goalContribution || 1;
          const goalsStore = useGoalsStore.getState();
          const goal = goalsStore.goals.find((g) => g.id === h.linkedGoalId);
          
          if (goal) {
            // If already completed, we are un-checking -> subtract. Otherwise, add.
            const modifier = isCompleted ? -contribution : contribution;
            goalsStore.updateProgress(goal.id, goal.currentValue + modifier, "habit", id);
          }
        }

        set((state) => ({
          habits: state.habits.map((habit) => {
            if (habit.id !== id) return habit;
            return {
              ...habit,
              completedDates: isCompleted 
                ? habit.completedDates.filter(d => d !== dateString) 
                : [...habit.completedDates, dateString].sort() 
            };
          })
        }));
      },
    }),
    { name: "life-tracker-habits" }
  )
);