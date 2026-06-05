import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format, isAfter, startOfDay, parseISO } from "date-fns";
import type { Habit } from "@/types";

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
    (set) => ({
      habits: [] as Habit[], // FIXED: Explicitly cast the empty array
      
      addHabit: (habit) => set((state) => ({ 
        habits: [habit, ...state.habits] 
      })),
      
      updateHabit: (id, updates) => set((state) => ({
        habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h))
      })),
      
      deleteHabit: (id) => set((state) => ({
        habits: state.habits.filter((h) => h.id !== id)
      })),

      bulkDeleteHabits: (ids) => set((state) => ({
        habits: state.habits.filter((h) => !ids.includes(h.id))
      })),
      
      toggleHabitCompletionOnDate: (id, date) => set((state) => ({
        habits: state.habits.map((h) => {
          if (h.id !== id) return h;
          
          // PROTECT HISTORICAL CYCLES: Cannot uncheck dates that belong to an already completed cycle
          const lastCycleEndDateStr = h.pastCycles?.length 
            ? h.pastCycles[h.pastCycles.length - 1].endDate 
            : null;
            
          if (lastCycleEndDateStr && !isAfter(startOfDay(date), startOfDay(parseISO(lastCycleEndDateStr)))) {
            return h; 
          }

          const dateString = format(date, "yyyy-MM-dd");
          const isCompleted = h.completedDates.includes(dateString);
          
          return {
            ...h,
            completedDates: isCompleted 
              ? h.completedDates.filter(d => d !== dateString) 
              : [...h.completedDates, dateString].sort() 
          };
        })
      })),
    }),
    { name: "life-tracker-habits" }
  )
);