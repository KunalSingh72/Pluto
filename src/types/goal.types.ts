export type GoalStatus = "not_started" | "in_progress" | "achieved" | "abandoned";

export type GoalCategory = "career" | "learning" | "health" | "finance" | "personal";

export type GoalPriority = "low" | "medium" | "high"; 

export interface GoalProgressEntry {
  value: number; 
  source: "manual" | "task" | "habit";
  sourceId?: string;
  timestamp: string;
}

export interface GoalMilestone {
  id: string;
  title: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  deadline: string; 
  milestones: GoalMilestone[];
  status: GoalStatus;
  category: GoalCategory;             
  priority: GoalPriority;
  progressHistory: GoalProgressEntry[]; 
  createdAt: string;
  deletedAt?: string;
}