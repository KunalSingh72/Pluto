import { differenceInDays, parseISO, startOfDay, format } from "date-fns";
import type { Goal } from "@/types";

export const calculateGoalMetrics = (goal: Goal) => {
  const progress = Math.max(0, goal.currentValue);
  const target = Math.max(0.01, goal.targetValue); // Prevent division by zero
  
  // Cap percentage at 100% for the visual progress bar
  const rawPercentage = (progress / target) * 100;
  const percentage = Math.min(Math.max(rawPercentage, 0), 100);
  
  const isAchieved = progress >= target;

  // Deadline calculations
  const today = startOfDay(new Date());
  const deadlineDate = startOfDay(parseISO(goal.deadline));
  const daysRemaining = differenceInDays(deadlineDate, today);
  
  const isOverdue = daysRemaining < 0 && !isAchieved;

  return {
    percentage,
    isAchieved,
    daysRemaining,
    isOverdue,
    formattedDeadline: format(deadlineDate, "MMM d, yyyy")
  };
};