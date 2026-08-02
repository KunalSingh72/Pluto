import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idbStorage";
import { getLocalDateString } from "@/lib/utils";

export type Priority = "none" | "low" | "medium" | "high";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  subtasks: Subtask[];
  date: string; // Stored as YYYY-MM-DD
  isDeleted: boolean; // For the Trash bin
}

interface TaskState {
  tasks: Task[];
  lastAccessedDate: string;
  
  // Core Actions
  addTask: (title: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  duplicateTask: (id: string) => void;
  moveToTrash: (id: string) => void;
  restoreFromTrash: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  
  // Subtask Actions
  addSubtask: (taskId: string, title: string) => void;
  updateSubtask: (taskId: string, subtaskId: string, updates: Partial<Subtask>) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  
  // Automated Logic
  processDayEnd: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      lastAccessedDate: getLocalDateString(),

      addTask: (title) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title,
          completed: false,
          priority: "none",
          subtasks: [],
          date: getLocalDateString(),
          isDeleted: false,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },

      duplicateTask: (id) => {
        set((state) => {
          const taskToCopy = state.tasks.find((t) => t.id === id);
          if (!taskToCopy) return state;

          const duplicatedTask: Task = {
            ...taskToCopy,
            id: crypto.randomUUID(),
            title: `${taskToCopy.title} (Copy)`,
            date: getLocalDateString(), // Duplicates are added to "Today"
            subtasks: taskToCopy.subtasks.map(st => ({ ...st, id: crypto.randomUUID() }))
          };
          
          return { tasks: [duplicatedTask, ...state.tasks] };
        });
      },

      moveToTrash: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, isDeleted: true } : task
          ),
        }));
      },

      restoreFromTrash: (id) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, isDeleted: false } : task
          ),
        }));
      },

      permanentlyDelete: (id) => {
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
        }));
      },

      emptyTrash: () => {
        set((state) => ({
          tasks: state.tasks.filter((task) => !task.isDeleted),
        }));
      },

      addSubtask: (taskId, title) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              subtasks: [...task.subtasks, { id: crypto.randomUUID(), title, completed: false }],
            };
          }),
        }));
      },

      updateSubtask: (taskId, subtaskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              subtasks: task.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, ...updates } : st
              ),
            };
          }),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            return {
              ...task,
              subtasks: task.subtasks.filter((st) => st.id !== subtaskId),
            };
          }),
        }));
      },

      processDayEnd: () => {
        const today = getLocalDateString();
        set((state) => {
          if (state.lastAccessedDate === today) return state;

          const updatedTasks = state.tasks.filter((task) => {
            if (task.isDeleted) return true;
            if (task.completed && task.date !== today) return false;
            return true;
          });

          return {
            tasks: updatedTasks,
            lastAccessedDate: today,
          };
        });
      },
    }),
    {
      name: "pluto-tasks-storage",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);