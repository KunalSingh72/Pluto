export type HabitFrequencyType = "daily" | "weekly" | "interval";

export interface HabitFrequency {
  type: HabitFrequencyType;
  daysOfWeek?: number[]; 
  daysPerWeek?: number; 
  intervalDays?: number; 
}

export type HabitGoalType = "forever" | "cycle";

export interface HabitGoal {
  type: HabitGoalType;
  days?: number; 
}

export interface HabitCycleRecord {
  id: string;
  startDate: string; 
  endDate: string; 
  goalDays: number; 
  action: "continued" | "stopped" | "failed";
  flagDate?: string; 
}

export interface HabitTrackingPeriod {
  start: string;
  end?: string;
}

export interface Habit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  goal: HabitGoal;
  startDate: string; 
  completedDates: string[]; 
  createdAt: string;
  deletedAt?: string;
  color?: string; 
  status?: "active" | "stopped"; 
  pastCycles?: HabitCycleRecord[]; 
  trackingPeriods?: HabitTrackingPeriod[]; 
}