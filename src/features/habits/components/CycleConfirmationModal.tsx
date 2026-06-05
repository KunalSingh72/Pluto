import { PartyPopper, CheckCircle2, StopCircle } from "lucide-react";
import {
  parseISO,
  startOfDay,
  isAfter,
  eachDayOfInterval,
  format,
  addDays,
} from "date-fns";
import type { Habit, HabitCycleRecord } from "@/types";
import { useHabitsStore } from "../store/habits.store";
import { isHabitScheduledOnDate } from "../utils/habit.utils";
import { cn } from "@/lib/utils";

interface CycleCelebrationModalProps {
  habit: Habit | null;
  onClose: () => void;
}

export function CycleConfirmationModal({
  habit,
  onClose,
}: CycleCelebrationModalProps) {
  const { updateHabit } = useHabitsStore();

  if (!habit || !habit.goal.days) return null;

  const createCycleRecord = (
    requestedAction: "continued" | "stopped",
  ): HabitCycleRecord => {
    const lastCycleEndDateStr = habit.pastCycles?.length
      ? habit.pastCycles[habit.pastCycles.length - 1].endDate
      : null;

    const validDates = [...habit.completedDates].sort().filter((d) => {
      if (!lastCycleEndDateStr) return true;
      return isAfter(
        startOfDay(parseISO(d)),
        startOfDay(parseISO(lastCycleEndDateStr)),
      );
    });

    const completionDateStr = validDates[habit.goal.days! - 1];
    let cycleStartDateStr = validDates[0] || habit.startDate;

    // Accurately find the start date (the day after the last cycle ended)
    if (lastCycleEndDateStr) {
      cycleStartDateStr = format(
        addDays(parseISO(lastCycleEndDateStr), 1),
        "yyyy-MM-dd",
      );
    }

    // THE RED FLAG SCANNER: Checks if any scheduled days were missed during this cycle
    const daysToTest = eachDayOfInterval({
      start: parseISO(cycleStartDateStr),
      end: parseISO(completionDateStr),
    });
    let lastMissedStr: string | null = null;

    for (const day of daysToTest) {
      const dStr = format(day, "yyyy-MM-dd");
      const isComp = habit.completedDates.includes(dStr);
      const isSched = isHabitScheduledOnDate(habit, day);
      if (isSched && !isComp) {
        lastMissedStr = dStr;
      }
    }

    const action = lastMissedStr ? "failed" : requestedAction;
    const flagDate = lastMissedStr || completionDateStr; // Place the flag precisely on the missed day if failed

    return {
      id: crypto.randomUUID(),
      startDate: cycleStartDateStr,
      endDate: completionDateStr,
      goalDays: habit.goal.days!,
      action,
      flagDate,
    };
  };

  const handleContinue = () => {
    const newCycle = createCycleRecord("continued");
    updateHabit(habit.id, {
      pastCycles: [...(habit.pastCycles || []), newCycle],
    });
    onClose();
  };

  const handleStop = () => {
    const newCycle = createCycleRecord("stopped");
    const currentPeriods = habit.trackingPeriods
      ? [...habit.trackingPeriods]
      : [];

    if (currentPeriods.length > 0) {
      const lastIndex = currentPeriods.length - 1;
      currentPeriods[lastIndex] = {
        ...currentPeriods[lastIndex],
        end: newCycle.endDate,
      };
    } else {
      currentPeriods.push({ start: habit.startDate, end: newCycle.endDate });
    }

    updateHabit(habit.id, {
      pastCycles: [...(habit.pastCycles || []), newCycle],
      status: "stopped",
      trackingPeriods: currentPeriods,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto scrollbar-none">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity" />

        <div className="relative w-full max-w-sm bg-background-surface border border-border-subtle rounded-3xl shadow-2xl p-6 md:p-8 text-center animate-in fade-in zoom-in-95 duration-300 my-8">
          <div className="mx-auto w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mb-5">
            <PartyPopper className="w-8 h-8 text-yellow-500" />
          </div>

          <h2 className="text-2xl font-black text-text-primary mb-2">
            Goal Reached!
          </h2>
          <p className="text-sm text-text-secondary font-medium mb-6 leading-relaxed">
            Incredible work! You successfully completed your{" "}
            <strong className="text-text-primary">{habit.goal.days}-day</strong>{" "}
            cycle for{" "}
            <strong className="text-text-primary">"{habit.title}"</strong>.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleContinue}
              className={cn(
                "w-full flex items-center justify-center gap-2 py-3.5 text-white font-bold rounded-xl transition-all hover:opacity-90 shadow-lg cursor-pointer",
                habit.color || "bg-accent-primary",
              )}
            >
              <CheckCircle2 className="w-5 h-5" />
              Start Next Cycle
            </button>

            <button
              onClick={handleStop}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-background-main text-text-secondary font-bold rounded-xl border border-border-subtle hover:text-text-primary hover:border-text-secondary/50 transition-all cursor-pointer"
            >
              <StopCircle className="w-5 h-5" />
              Complete & Stop Habit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
