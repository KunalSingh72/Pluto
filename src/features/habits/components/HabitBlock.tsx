import { Check, Flame, Target } from "lucide-react";
import { startOfDay, isAfter, parseISO } from "date-fns";
import type { Habit } from "@/types";
import { useHabitsStore } from "../store/habits.store";
import {
  calculateHabitStats,
  isHabitCompletedOnDate,
} from "../utils/habit.utils";
import { cn } from "@/lib/utils";

interface HabitBlockProps {
  habit: Habit;
  selectedDate: Date;
  onClick: () => void;
  isReadOnly?: boolean;
}

export function HabitBlock({
  habit,
  selectedDate,
  onClick,
  isReadOnly = false,
}: HabitBlockProps) {
  const { toggleHabitCompletionOnDate } = useHabitsStore();

  const { currentStreak, totalCheckIns } = calculateHabitStats(
    habit,
    new Date(),
  );
  const isCompleted = isHabitCompletedOnDate(habit, selectedDate);

  const lastCycleEndDateStr = habit.pastCycles?.length
    ? habit.pastCycles[habit.pastCycles.length - 1].endDate
    : null;
  const isLockedHistory = Boolean(
    lastCycleEndDateStr &&
    !isAfter(
      startOfDay(selectedDate),
      startOfDay(parseISO(lastCycleEndDateStr)),
    ),
  );
  const isStopped = habit.status === "stopped";

  // A day is "history" if it belongs to a past cycle OR the habit is stopped entirely.
  const isHistorical = isStopped || isLockedHistory;
  const isFuture = isAfter(startOfDay(selectedDate), startOfDay(new Date()));
  const disableInteraction = isReadOnly || isHistorical || isFuture;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disableInteraction) return;
    toggleHabitCompletionOnDate(habit.id, selectedDate);
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center justify-between p-4 md:p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-md",
        isHistorical
          ? "bg-background-main border-border-subtle opacity-70"
          : "bg-background-surface border-border-subtle hover:border-accent-primary/50",
      )}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={cn(
            "w-3 h-10 rounded-full shrink-0",
            habit.color || "bg-accent-primary",
          )}
        />

        <div className="flex flex-col truncate">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-bold text-base md:text-lg truncate transition-colors",
                isCompleted && !disableInteraction
                  ? "text-text-secondary line-through"
                  : "text-text-primary",
              )}
            >
              {habit.title}
            </span>

            {/* Historical Badges */}
            {isHistorical && isCompleted && (
              <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-500 text-[10px] font-bold uppercase tracking-wider border border-green-500/20 shrink-0">
                Completed
              </span>
            )}
            {isHistorical && !isCompleted && !isFuture && (
              <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider border border-red-500/20 shrink-0">
                Incomplete
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 mt-1 text-xs font-medium text-text-secondary">
            <div className="flex items-center gap-1">
              <Flame
                className={cn(
                  "w-3.5 h-3.5",
                  currentStreak > 0 && "text-orange-500 fill-orange-500/20",
                )}
              />
              <span>{currentStreak} Day Streak</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              <span>{totalCheckIns} Total</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hide the button completely if it is in Read-Only or Historical mode */}
      {!disableInteraction && (
        <button
          onClick={handleToggle}
          className={cn(
            "shrink-0 flex items-center justify-center w-8 h-8 rounded-full border-2 transition-all cursor-pointer ml-4",
            isCompleted
              ? "bg-green-500 border-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]"
              : "border-border-subtle hover:border-accent-primary text-transparent hover:bg-accent-subtle",
          )}
        >
          <Check className={cn("w-5 h-5", isCompleted && "opacity-100")} />
        </button>
      )}
    </div>
  );
}
