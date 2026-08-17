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
  autoCompleteOnSubtasks?: boolean; // Controls automatic completion based on subtasks
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
          autoCompleteOnSubtasks: false,
        };
        set((state) => ({ tasks: [newTask, ...state.tasks] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== id) return task;
            
            const updatedTask = { ...task, ...updates };
            
            // If auto-complete is explicitly toggled, evaluate it immediately
            if (updates.autoCompleteOnSubtasks !== undefined) {
              if (updatedTask.autoCompleteOnSubtasks && updatedTask.subtasks.length > 0) {
                updatedTask.completed = updatedTask.subtasks.every(st => st.completed);
              }
            }
            
            return updatedTask;
          }),
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
            completed: false, // Fix: Reset parent completion status
            subtasks: taskToCopy.subtasks.map(st => ({ ...st, id: crypto.randomUUID(), completed: false })) // Fix: Reset subtask completion status
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
            
            const newSubtasks = [...task.subtasks, { id: crypto.randomUUID(), title, completed: false }];
            const updatedTask = { ...task, subtasks: newSubtasks };
            
            // Adding an uncompleted subtask uncompletes the parent if auto-complete is active
            if (updatedTask.autoCompleteOnSubtasks) {
              updatedTask.completed = false;
            }
            
            return updatedTask;
          }),
        }));
      },

      updateSubtask: (taskId, subtaskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            
            const newSubtasks = task.subtasks.map((st) =>
              st.id === subtaskId ? { ...st, ...updates } : st
            );
            const updatedTask = { ...task, subtasks: newSubtasks };
            
            // Evaluate parent auto-completion
            if (updatedTask.autoCompleteOnSubtasks && newSubtasks.length > 0) {
              updatedTask.completed = newSubtasks.every(st => st.completed);
            }
            
            return updatedTask;
          }),
        }));
      },

      deleteSubtask: (taskId, subtaskId) => {
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id !== taskId) return task;
            
            const newSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
            const updatedTask = { ...task, subtasks: newSubtasks };
            
            // Evaluate parent auto-completion
            if (updatedTask.autoCompleteOnSubtasks && newSubtasks.length > 0) {
              updatedTask.completed = newSubtasks.every(st => st.completed);
            }
            
            return updatedTask;
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