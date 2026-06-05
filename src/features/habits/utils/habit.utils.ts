import { 
  parseISO, startOfDay, isBefore, differenceInDays, 
  getDay, format, isAfter, eachDayOfInterval, 
  startOfWeek, endOfWeek, isSameDay
} from "date-fns";
import type { Habit } from "@/types";

export const isHabitCompletedOnDate = (habit: Habit, date: Date | string) => {
  const dateStr = typeof date === "string" ? date : format(date, "yyyy-MM-dd");
  return habit.completedDates.includes(dateStr);
};

export const isHabitScheduledOnDate = (habit: Habit, date: Date): boolean => {
  if (habit.deletedAt) return false;
  const targetDate = startOfDay(date);

  // NEW: Check if the date falls within ANY active tracking period
  let isWithinTrackingPeriod = false;
  
  if (habit.trackingPeriods && habit.trackingPeriods.length > 0) {
    for (const period of habit.trackingPeriods) {
      const pStart = startOfDay(parseISO(period.start));
      const pEnd = period.end ? startOfDay(parseISO(period.end)) : null;
      
      if (!isBefore(targetDate, pStart) && (!pEnd || !isAfter(targetDate, pEnd))) {
        isWithinTrackingPeriod = true;
        break;
      }
    }
  } else {
    // Fallback for habits created before the update
    const startDate = startOfDay(parseISO(habit.startDate));
    if (!isBefore(targetDate, startDate)) {
      if (habit.status === "stopped") {
        const sortedDates = [...habit.completedDates].sort();
        if (sortedDates.length > 0) {
          const lastCompletedDate = startOfDay(parseISO(sortedDates[sortedDates.length - 1]));
          if (!isAfter(targetDate, lastCompletedDate)) {
            isWithinTrackingPeriod = true;
          }
        }
      } else {
        isWithinTrackingPeriod = true;
      }
    }
  }

  if (!isWithinTrackingPeriod) return false;

  const dateStr = format(targetDate, "yyyy-MM-dd");
  const isCompletedToday = habit.completedDates.includes(dateStr);

  switch (habit.frequency.type) {
    case "daily": {
      const dayOfWeek = getDay(targetDate);
      return habit.frequency.daysOfWeek?.includes(dayOfWeek) ?? true;
    }
    case "interval": {
      const startDate = startOfDay(parseISO(habit.startDate));
      const diff = differenceInDays(targetDate, startDate);
      const interval = habit.frequency.intervalDays || 1;
      return diff % interval === 0;
    }
    case "weekly": {
      if (isCompletedToday) return true; 

      const weekStart = startOfWeek(targetDate, { weekStartsOn: 0 }); 
      const weekEnd = endOfWeek(targetDate, { weekStartsOn: 0 });
      
      let completionsThisWeek = 0;
      habit.completedDates.forEach(d => {
        const compDate = parseISO(d);
        if (!isBefore(compDate, weekStart) && !isAfter(compDate, weekEnd)) {
          completionsThisWeek++;
        }
      });

      const targetPerWeek = habit.frequency.daysPerWeek || 1;
      return completionsThisWeek < targetPerWeek;
    }
    default:
      return false;
  }
};

export const calculateHabitStats = (habit: Habit, todayDate: Date = new Date()) => {
  const today = startOfDay(todayDate);
  const startDate = startOfDay(parseISO(habit.startDate));
  
  let currentStreak = 0;
  let highestStreak = 0;
  const totalCheckIns = habit.completedDates.length;

  if (isAfter(startDate, today) || habit.completedDates.length === 0) {
    return { currentStreak, highestStreak, totalCheckIns };
  }

  const daysToTest = eachDayOfInterval({ start: startDate, end: today });
  let tempStreak = 0;
  
  for (const day of daysToTest) {
    const isCompleted = isHabitCompletedOnDate(habit, day);
    const isScheduled = isHabitScheduledOnDate(habit, day);
    const isToday = isSameDay(day, today);

    if (isCompleted) {
      tempStreak++;
      highestStreak = Math.max(highestStreak, tempStreak);
    } else if (isScheduled && !isToday) {
      tempStreak = 0;
    }
  }

  currentStreak = tempStreak;
  return { currentStreak, highestStreak, totalCheckIns };
};

// NEW: Isolates progress strictly to the current active cycle
export const calculateGoalProgress = (habit: Habit) => {
  if (habit.goal.type === "forever" || !habit.goal.days) return null;
  const cycleDays = habit.goal.days;

  const lastCycleEndDateStr = habit.pastCycles?.length 
    ? habit.pastCycles[habit.pastCycles.length - 1].endDate 
    : null;

  // Only count check-ins that happened AFTER the last cycle was completed
  const validDatesInCurrentCycle = habit.completedDates.filter(d => {
    if (!lastCycleEndDateStr) return true;
    return isAfter(startOfDay(parseISO(d)), startOfDay(parseISO(lastCycleEndDateStr)));
  });

  const progress = validDatesInCurrentCycle.length;
  const percentage = Math.min((progress / cycleDays) * 100, 100);

  return {
    cycleDays,
    currentProgress: progress,
    percentage,
    isFinishLine: progress === cycleDays - 1,
    isReadyToCelebrate: progress >= cycleDays
  };
};