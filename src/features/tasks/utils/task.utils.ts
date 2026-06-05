import { isSameDay, isBefore, parseISO, getDay, getDate, getMonth, startOfDay, addDays, format } from "date-fns";
import type { Task } from "@/types";

export const isTaskOnDate = (task: Task, targetDate: Date) => {
  if (task.deletedAt) return false;

  const startDate = parseISO(task.dueDate || task.createdAt);
  const start = startOfDay(startDate);
  const target = startOfDay(targetDate);

  if (isBefore(target, start)) return false;

  switch (task.recurrence) {
    case "daily": return true;
    case "weekly": return getDay(target) === getDay(start);
    case "monthly": return getDate(target) === getDate(start);
    case "yearly": return getDate(target) === getDate(start) && getMonth(target) === getMonth(start);
    case "none":
    default: return isSameDay(start, target);
  }
};

// NEW: Checks if a specific date is marked as completed
export const isTaskCompletedOnDate = (task: Task, date: Date) => {
  if (task.recurrence === "none" || !task.recurrence) return task.completed;
  return task.completedDates?.includes(format(date, "yyyy-MM-dd")) || false;
};

// NEW: Calculates only the NEXT valid occurrence to prevent infinite UI spam
export const getNextOccurrence = (task: Task, fromDate: Date): Date | null => {
  if (task.recurrence === "none" || !task.recurrence) {
    const dueDate = parseISO(task.dueDate || task.createdAt);
    return isBefore(startOfDay(dueDate), startOfDay(fromDate)) ? null : startOfDay(dueDate);
  }

  let checkDate = startOfDay(fromDate);
  // Cap search to 365 days to prevent mathematical infinite loops
  for (let i = 0; i < 365; i++) {
    if (isTaskOnDate(task, checkDate) && !isTaskCompletedOnDate(task, checkDate)) {
      return checkDate;
    }
    checkDate = addDays(checkDate, 1);
  }
  return null;
};