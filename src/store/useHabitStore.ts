import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idbStorage";
import { getLocalDateString } from "@/lib/utils";

export type HabitColor =
  | "default"
  | "red"
  | "orange"
  | "yellow"
  | "green"
  | "blue"
  | "purple";
export type HabitState = "active" | "completed" | "stopped";
export type CycleLength = 7 | 21 | 30 | 100 | "forever" | number;
export type DayStatus =
  | "completed"
  | "missed"
  | "cycle_completed"
  | "habit_completed"
  | "stopped_early";

export interface HabitCycle {
  id: string;
  startDate: string;
  length: CycleLength;
}

export interface Habit {
  id: string;
  title: string;
  color: HabitColor;
  createdAt: string;
  trackingStartDate: string; // Date of creation or last restart
  state: HabitState;
  cycles: HabitCycle[];
  history: Record<string, DayStatus>;
  currentStreak: number;
  highestStreak: number;
  totalCompletedDays: number;
}

interface HabitStateStore {
  habits: Habit[];
  lastAccessedDate: string;

  // Actions
  addHabit: (title: string, cycleLength: CycleLength, color: HabitColor) => void;
  updateHabit: (id: string, updates: Partial<Pick<Habit, "title" | "color">>) => void;
  updateCurrentCycleLength: (id: string, length: CycleLength) => void;
  deleteHabit: (id: string) => void;

  toggleDay: (id: string, date: string) => void;
  stopEarly: (id: string, date: string) => void;
  completeCycleAndContinue: (id: string, date: string) => void;
  completeCycleAndStop: (id: string, date: string) => void;
  restartHabit: (id: string, cycleLength: CycleLength, date: string) => void;

  processMissedDays: () => void;
}

// Helper to get dates between two dates
const getDatesBetween = (startDateStr: string, endDateStr: string) => {
  const dates = [];
  const curr = new Date(startDateStr);
  const end = new Date(endDateStr);
  curr.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  while (curr < end) {
    dates.push(getLocalDateString(curr));
    curr.setDate(curr.getDate() + 1);
  }
  return dates;
};

// Helper to recalculate streaks
const recalculateStreaks = (habit: Habit, today: string) => {
  let current = 0;
  let highest = habit.highestStreak;
  let total = 0;

  // Calculate totals from entire history
  Object.values(habit.history).forEach((status) => {
    if (
      status === "completed" ||
      status === "cycle_completed" ||
      status === "habit_completed"
    ) {
      total++;
    }
  });

  // Calculate current streak from trackingStartDate to today
  const currDate = new Date(habit.trackingStartDate);
  const endDate = new Date(today);
  currDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  while (currDate <= endDate) {
    const dStr = getLocalDateString(currDate);
    const status = habit.history[dStr];

    if (
      status === "completed" ||
      status === "cycle_completed" ||
      status === "habit_completed"
    ) {
      current++;
      highest = Math.max(highest, current);
    } else if (status === "missed") {
      current = 0;
    }
    // "stopped_early" also breaks streak since it means they gave up
    else if (status === "stopped_early") {
      current = 0;
    }
    // If no status, it's either today (unmarked) or a bug. We just don't increment.
    
    currDate.setDate(currDate.getDate() + 1);
  }

  return { currentStreak: current, highestStreak: highest, totalCompletedDays: total };
};

export const useHabitStore = create<HabitStateStore>()(
  persist(
    (set) => ({
      habits: [],
      lastAccessedDate: getLocalDateString(),

      addHabit: (title, cycleLength, color) => {
        const today = getLocalDateString();
        const newHabit: Habit = {
          id: crypto.randomUUID(),
          title,
          color,
          createdAt: today,
          trackingStartDate: today,
          state: "active",
          cycles: [
            {
              id: crypto.randomUUID(),
              startDate: today,
              length: cycleLength,
            },
          ],
          history: {},
          currentStreak: 0,
          highestStreak: 0,
          totalCompletedDays: 0,
        };
        set((state) => ({ habits: [newHabit, ...state.habits] }));
      },

      updateHabit: (id, updates) => {
        set((state) => ({
          habits: state.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
        }));
      },

      updateCurrentCycleLength: (id, length) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            const updatedCycles = [...h.cycles];
            if (updatedCycles.length > 0) {
              updatedCycles[updatedCycles.length - 1] = {
                ...updatedCycles[updatedCycles.length - 1],
                length,
              };
            }
            return { ...h, cycles: updatedCycles };
          }),
        }));
      },

      deleteHabit: (id) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        }));
      },

      toggleDay: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            if (h.state !== "active" && date === getLocalDateString()) return h; // Can't toggle if not active, unless it's past? Actually, if stopped, can't toggle today.

            const newHistory = { ...h.history };
            const currentStatus = newHistory[date];

            if (currentStatus === "completed") {
              delete newHistory[date];
            } else {
              newHistory[date] = "completed";
            }

            const updatedHabit = { ...h, history: newHistory };
            const streaks = recalculateStreaks(updatedHabit, getLocalDateString());

            return { ...updatedHabit, ...streaks };
          }),
        }));
      },

      stopEarly: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id || h.state !== "active") return h;
            const newHistory = { ...h.history };
            newHistory[date] = "stopped_early";
            
            const updatedHabit = { ...h, state: "stopped" as HabitState, history: newHistory };
            const streaks = recalculateStreaks(updatedHabit, getLocalDateString());
            return { ...updatedHabit, ...streaks };
          }),
        }));
      },

      completeCycleAndContinue: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id || h.state !== "active") return h;
            
            const newHistory = { ...h.history };
            newHistory[date] = "cycle_completed";

            const currentCycle = h.cycles[h.cycles.length - 1];
            
            // Start new cycle tomorrow
            const tomorrow = new Date(date);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const newCycle: HabitCycle = {
              id: crypto.randomUUID(),
              startDate: getLocalDateString(tomorrow),
              length: currentCycle.length, // Inherit length
            };

            const updatedHabit = {
              ...h,
              history: newHistory,
              cycles: [...h.cycles, newCycle]
            };
            const streaks = recalculateStreaks(updatedHabit, getLocalDateString());
            
            return { ...updatedHabit, ...streaks };
          }),
        }));
      },

      completeCycleAndStop: (id, date) => {
        set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id || h.state !== "active") return h;
            const newHistory = { ...h.history };
            newHistory[date] = "habit_completed";
            
            const updatedHabit = { ...h, state: "completed" as HabitState, history: newHistory };
            const streaks = recalculateStreaks(updatedHabit, getLocalDateString());
            return { ...updatedHabit, ...streaks };
          }),
        }));
      },

      restartHabit: (id, cycleLength, date) => {
         set((state) => ({
          habits: state.habits.map((h) => {
            if (h.id !== id) return h;
            
            const newCycle: HabitCycle = {
              id: crypto.randomUUID(),
              startDate: date,
              length: cycleLength,
            };

            return {
              ...h,
              state: "active" as HabitState,
              trackingStartDate: date, // New tracking period begins
              cycles: [...h.cycles, newCycle],
              // Recalculate streaks immediately to reset current streak to 0
              currentStreak: 0,
            };
          }),
        }));
      },

      processMissedDays: () => {
        const today = getLocalDateString();
        
        set((state) => {
          if (state.lastAccessedDate === today) return state;

          const updatedHabits = state.habits.map((h) => {
            if (h.state !== "active") return h;

            let modified = false;
            const newHistory = { ...h.history };
            
            // Get all days from tracking start up to yesterday
            const pastDates = getDatesBetween(h.trackingStartDate, today);
            
            pastDates.forEach(d => {
              if (!newHistory[d]) {
                newHistory[d] = "missed";
                modified = true;
              }
            });

            if (!modified) return h;

            const updatedHabit = { ...h, history: newHistory };
            const streaks = recalculateStreaks(updatedHabit, today);
            return { ...updatedHabit, ...streaks };
          });

          return {
            habits: updatedHabits,
            lastAccessedDate: today,
          };
        });
      },
    }),
    {
      name: "pluto-habits-storage",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
