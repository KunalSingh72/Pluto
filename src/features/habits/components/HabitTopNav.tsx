import { format, subDays, isSameDay, startOfDay } from "date-fns";
import { useHabitsStore } from "../store/habits.store";
import {
  isHabitScheduledOnDate,
  isHabitCompletedOnDate,
} from "../utils/habit.utils";
import { cn } from "@/lib/utils";

interface HabitTopNavProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

export function HabitTopNav({ selectedDate, onSelectDate }: HabitTopNavProps) {
  const habits = useHabitsStore((state) => state.habits);
  const today = startOfDay(new Date());

  const last7Days = Array.from({ length: 7 }).map((_, i) =>
    subDays(today, 6 - i),
  );

  return (
    // FIXED: Enforced justify-between and width expansion for perfect spacing
    <div className="flex items-center justify-between w-full overflow-x-auto scrollbar-none gap-1 sm:gap-2 px-1">
      {last7Days.map((date) => {
        const isSelected = isSameDay(date, selectedDate);
        const isCurrentDay = isSameDay(date, today);

        const scheduledHabits = habits.filter((h) =>
          isHabitScheduledOnDate(h, date),
        );
        const completedHabits = scheduledHabits.filter((h) =>
          isHabitCompletedOnDate(h, date),
        );

        const progress =
          scheduledHabits.length > 0
            ? (completedHabits.length / scheduledHabits.length) * 100
            : 0;

        const radius = 16;
        const circumference = 2 * Math.PI * radius;
        const strokeDashoffset =
          circumference - (progress / 100) * circumference;

        return (
          <button
            key={date.toISOString()}
            onClick={() => onSelectDate(date)}
            className={cn(
              // FIXED: Added flex-1 and min-w constraints so they stretch evenly on mobile
              "relative flex flex-col items-center justify-center p-2 rounded-2xl flex-1 min-w-12 max-w-16 shrink-0 transition-all cursor-pointer",
              isSelected ? "bg-accent-subtle/50" : "hover:bg-background-main",
            )}
          >
            <span
              className={cn(
                "text-[10px] md:text-xs font-semibold uppercase tracking-wider mb-1",
                isSelected ? "text-accent-primary" : "text-text-secondary",
              )}
            >
              {format(date, "EEE")}
            </span>

            <div className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 shrink-0">
              <svg
                className="absolute inset-0 w-full h-full -rotate-90"
                viewBox="0 0 40 40"
              >
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  className={
                    isSelected
                      ? "stroke-accent-primary/20"
                      : "stroke-border-subtle"
                  }
                  strokeWidth="3"
                  fill="none"
                />
                {scheduledHabits.length > 0 && (
                  <circle
                    cx="20"
                    cy="20"
                    r={radius}
                    className={
                      progress === 100
                        ? "stroke-green-500"
                        : "stroke-accent-primary"
                    }
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: "stroke-dashoffset 0.5s ease-in-out" }}
                  />
                )}
              </svg>
              <span
                className={cn(
                  "relative z-10 text-sm md:text-base font-bold",
                  isSelected ? "text-accent-primary" : "text-text-primary",
                  isCurrentDay && !isSelected && "text-accent-primary",
                )}
              >
                {format(date, "d")}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
