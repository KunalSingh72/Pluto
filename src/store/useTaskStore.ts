import { create } from "zustand";
import { persist } from "zustand/middleware";

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

const getTodayString = () => new Date().toISOString().split("T")[0];

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: [],
      lastAccessedDate: getTodayString(),

      addTask: (title) => {
        const newTask: Task = {
          id: crypto.randomUUID(),
          title,
          completed: false,
          priority: "none",
          subtasks: [],
          date: getTodayString(),
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
            date: getTodayString(), // Duplicates are added to "Today"
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
            task.id === id ? { ...task, isDeleted: false, date: getTodayString() } : task
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

      // Simulates the end of the day cron-job logic
      processDayEnd: () => {
        const today = getTodayString();
        set((state) => {
          if (state.lastAccessedDate === today) return state; // Day hasn't changed

          const updatedTasks = state.tasks.filter((task) => {
            if (task.isDeleted) return true; // Keep trash as is
            // If it's completed and from a previous day, remove it entirely
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
    }
  )
);