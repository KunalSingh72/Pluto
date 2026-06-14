import {
  Target,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Flag,
} from "lucide-react";
import type { Goal } from "@/types";
import { calculateGoalMetrics } from "../utils/goal.utils";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
}

export function GoalCard({ goal, onClick }: GoalCardProps) {
  const { percentage, isAchieved, daysRemaining, isOverdue, formattedDeadline } = calculateGoalMetrics(goal);

  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case "high":
        return (
          <Flag className="w-3.5 h-3.5 text-red-500/60" fill="currentColor" />
        );
      case "low":
        return (
          <Flag className="w-3.5 h-3.5 text-green-500/60" fill="currentColor" />
        );
      case "medium":
      default:
        return (
          <Flag
            className="w-3.5 h-3.5 text-yellow-500/60"
            fill="currentColor"
          />
        );
    }
  };
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex flex-col p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md bg-background-surface",
        isAchieved
          ? "border-green-500/30 bg-green-500/5"
          : "border-border-subtle hover:border-accent-primary/50",
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col min-w-0 pr-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-widest text-text-secondary bg-background-main border border-border-subtle px-1.5 py-0.5 rounded-md uppercase">
              {goal.category || "personal"}
            </span>
            {/* Minimal Priority Indicator */}
            <div
              title={`${goal.priority || "medium"} priority`}
              className="flex items-center"
            >
              {getPriorityIcon(goal.priority)}
            </div>
          </div>
          <h3 className="font-bold text-lg text-text-primary truncate">
            {goal.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs font-medium text-text-secondary">
            <Target className="w-3.5 h-3.5" />
            <span>
              {goal.currentValue} / {goal.targetValue} {goal.unit}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isAchieved ? (
            <div
              title={`Deadline was ${formattedDeadline}`}
              className="flex items-center gap-1 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-md"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Achieved
            </div>
          ) : isOverdue ? (
            <div
              title={`Missed deadline: ${formattedDeadline}`}
              className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Overdue
            </div>
          ) : (
            <div
              title={`Deadline: ${formattedDeadline}`}
              className="flex items-center gap-1 text-xs font-bold text-text-secondary bg-background-main border border-border-subtle px-2 py-1 rounded-md"
            >
              <Calendar className="w-3.5 h-3.5" />
              {daysRemaining === 0 ? "Due Today" : `${daysRemaining}d left`}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-background-main rounded-full overflow-hidden mb-2 relative">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out absolute left-0 top-0",
            isAchieved
              ? "bg-green-500"
              : isOverdue
                ? "bg-red-500"
                : "bg-accent-primary",
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Milestones Preview (if any) */}
      {goal.milestones && goal.milestones.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-subtle flex justify-between items-center text-xs text-text-secondary font-medium">
          <span>Milestones</span>
          <span>
            {goal.milestones.filter((m) => m.completed).length} /{" "}
            {goal.milestones.length}
          </span>
        </div>
      )}
    </div>
  );
}