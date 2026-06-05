export type Priority = "none" | "low" | "medium" | "high";
export type Recurrence = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type TaskType = "task" | "event"; // NEW: Defines the item's origin

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: Priority;
  dueDate?: string;
  subtasks: Subtask[];
  createdAt: string; 
  deletedAt?: string; 
  categoryId?: string;
  recurrence?: Recurrence;
  completedDates?: string[]; 
  type?: TaskType; 
}