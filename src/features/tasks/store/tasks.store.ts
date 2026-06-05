import { create } from "zustand";
import { persist } from "zustand/middleware";
import { format } from "date-fns";
import type { Task, Category } from "@/types";

interface TasksState {
  tasks: Task[];
  categories: Category[];
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  bulkUpdateTasks: (ids: string[], updates: Partial<Task>) => void;
  bulkDeleteTasks: (ids: string[]) => void;
  toggleTaskCompletionOnDate: (id: string, date: Date) => void; // NEW
  addCategory: (category: Category) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set) => ({
      tasks: [],
      categories: [
        { id: "cat-work", name: "Work", color: "bg-blue-500" },
        { id: "cat-personal", name: "Personal", color: "bg-green-500" },
        { id: "cat-family", name: "Family", color: "bg-yellow-500" }
      ],
      addTask: (task) => set((state) => ({ tasks: [task, ...state.tasks] })),
      updateTask: (id, updates) => set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t))
      })),
      deleteTask: (id) => set((state) => ({
        tasks: state.tasks.filter((t) => t.id !== id)
      })),
      bulkUpdateTasks: (ids, updates) => set((state) => ({
        tasks: state.tasks.map(t => ids.includes(t.id) ? { ...t, ...updates } : t)
      })),
      bulkDeleteTasks: (ids) => set((state) => ({
        tasks: state.tasks.filter(t => !ids.includes(t.id))
      })),
      
      // NEW: Intelligent completion toggler
      toggleTaskCompletionOnDate: (id, date) => set((state) => ({
        tasks: state.tasks.map((t) => {
          if (t.id !== id) return t;
          if (t.recurrence === "none" || !t.recurrence) {
            return { ...t, completed: !t.completed };
          }
          const dateString = format(date, "yyyy-MM-dd");
          const completedDates = t.completedDates || [];
          const isCompleted = completedDates.includes(dateString);
          return {
            ...t,
            completedDates: isCompleted 
              ? completedDates.filter(d => d !== dateString) 
              : [...completedDates, dateString]
          };
        })
      })),

      addCategory: (category) => set((state) => ({ categories: [...state.categories, category] })),
      updateCategory: (id, updates) => set((state) => ({
        categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c))
      })),
      deleteCategory: (id) => set((state) => ({
        categories: state.categories.filter((c) => c.id !== id)
      })),
    }),
    { name: "life-tracker-global-tasks" }
  )
);