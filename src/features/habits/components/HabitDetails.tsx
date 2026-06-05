import { useState } from "react";
import {
  format,
  subMonths,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  isAfter,
  startOfDay,
  parseISO,
  addDays,
} from "date-fns";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Flame,
  Target,
  Trophy,
  AlertCircle,
  Check,
  Flag,
  Pencil,
  RotateCcw,
  History,
  StopCircle,
} from "lucide-react";
import { useHabitsStore } from "../store/habits.store";
import {
  calculateHabitStats,
  calculateGoalProgress,
  isHabitScheduledOnDate,
} from "../utils/habit.utils";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import type { HabitCycleRecord } from "@/types";
import { cn } from "@/lib/utils";

interface HabitDetailsProps {
  habitId: string | null;
  onClose: () => void;
  onEdit: () => void;
}

export function HabitDetails({ habitId, onClose, onEdit }: HabitDetailsProps) {
  const { habits, toggleHabitCompletionOnDate, deleteHabit, updateHabit } =
    useHabitsStore();
  const habit = habits.find((h) => h.id === habitId);

  const [currentMonth, setCurrentMonth] = useState(startOfDay(new Date()));
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isStopEarlyModalOpen, setIsStopEarlyModalOpen] = useState(false);

  if (!habit || !habitId) return null;

  const today = startOfDay(new Date());
  const { currentStreak, highestStreak, totalCheckIns } = calculateHabitStats(
    habit,
    today,
  );
  const goalStats = calculateGoalProgress(habit);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const handleToggleDate = (date: Date) => {
    const lastCycleEndDateStr = habit.pastCycles?.length
      ? habit.pastCycles[habit.pastCycles.length - 1].endDate
      : null;

    if (
      lastCycleEndDateStr &&
      !isAfter(startOfDay(date), startOfDay(parseISO(lastCycleEndDateStr)))
    )
      return;
    if (isAfter(startOfDay(date), today)) return;

    toggleHabitCompletionOnDate(habit.id, date);
  };

  const handleDelete = () => {
    deleteHabit(habit.id);
    onClose();
  };

  const handleRestartHabit = () => {
    const todayStr = format(today, "yyyy-MM-dd");
    const periods = habit.trackingPeriods
      ? [...habit.trackingPeriods]
      : [{ start: habit.startDate }];
    periods.push({ start: todayStr });

    updateHabit(habit.id, {
      status: "active",
      trackingPeriods: periods,
    });
  };

  const handleStopEarly = () => {
    const todayStr = format(today, "yyyy-MM-dd");
    const isCompletedToday = habit.completedDates.includes(todayStr);

    const currentPeriod =
      habit.trackingPeriods?.[habit.trackingPeriods.length - 1];
    const periodStartStr = currentPeriod?.start || habit.startDate;
    const lastCycleEndStr = habit.pastCycles?.length
      ? habit.pastCycles[habit.pastCycles.length - 1].endDate
      : null;

    let cycleStartDate = startOfDay(parseISO(periodStartStr));
    if (lastCycleEndStr) {
      const lastCycleEndDate = startOfDay(parseISO(lastCycleEndStr));
      if (!isBefore(lastCycleEndDate, cycleStartDate)) {
        cycleStartDate = addDays(lastCycleEndDate, 1);
      }
    }

    if (isAfter(cycleStartDate, today)) cycleStartDate = today;

    const daysToTest = eachDayOfInterval({ start: cycleStartDate, end: today });

    let flagDateStr = todayStr;
    let action: "stopped" | "failed" = "stopped";

    if (!isCompletedToday) {
      let lastMissedStr: string | null = null;
      let lastCompletedStr: string | null = null;

      for (const day of daysToTest) {
        const dStr = format(day, "yyyy-MM-dd");
        const isComp = habit.completedDates.includes(dStr);
        const isSched = isHabitScheduledOnDate(habit, day);

        if (isComp) {
          lastCompletedStr = dStr;
        } else if (isSched && (isBefore(day, today) || isSameDay(day, today))) {
          lastMissedStr = dStr;
        }
      }

      if (
        lastMissedStr &&
        (!lastCompletedStr ||
          isAfter(
            startOfDay(parseISO(lastMissedStr)),
            startOfDay(parseISO(lastCompletedStr)),
          ))
      ) {
        flagDateStr = lastMissedStr;
        action = "failed";
      } else if (lastCompletedStr) {
        flagDateStr = lastCompletedStr;
      }
    }

    if (
      isBefore(
        startOfDay(parseISO(flagDateStr)),
        startOfDay(parseISO(periodStartStr)),
      )
    ) {
      flagDateStr = periodStartStr;
    }

    const newCycle: HabitCycleRecord = {
      id: crypto.randomUUID(),
      startDate: format(cycleStartDate, "yyyy-MM-dd"),
      endDate: todayStr,
      goalDays: habit.goal.days || 0,
      action,
      flagDate: flagDateStr, // Assign the computed position to the cycle
    };

    const periods = habit.trackingPeriods
      ? [...habit.trackingPeriods]
      : [{ start: habit.startDate }];
    periods[periods.length - 1] = {
      ...periods[periods.length - 1],
      end: todayStr,
    };

    updateHabit(habit.id, {
      status: "stopped",
      pastCycles: [...(habit.pastCycles || []), newCycle],
      trackingPeriods: periods,
    });

    setIsStopEarlyModalOpen(false);
  };

  return (
    <>
      <aside
        className={cn(
          "fixed inset-0 z-50 w-full bg-background-surface transform transition-all duration-300 ease-in-out flex flex-col rounded-2xl md:static md:z-auto md:h-full md:border-l border-border-subtle md:shadow-none md:transform-none",
          habitId
            ? "translate-x-0 md:w-110 md:min-w-110 md:opacity-100"
            : "translate-x-full md:w-0 md:min-w-0 md:opacity-0 md:border-none md:overflow-hidden",
        )}
      >
        <div className="w-full md:w-110 h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between p-4 md:p-6 border-b border-border-subtle shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer md:hidden shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div
                className={cn(
                  "w-4 h-4 rounded-full shrink-0",
                  habit.color || "bg-accent-primary",
                )}
              />

              <div className="flex flex-col min-w-0">
                <h2 className="font-bold text-xl text-text-primary truncate leading-tight">
                  {habit.title}
                </h2>
                <span className="text-xs text-text-secondary font-medium">
                  Started {format(parseISO(habit.startDate), "MMM d, yyyy")}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onEdit}
                className="p-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer"
              >
                <Pencil className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 -mr-2 text-text-secondary hover:text-text-primary rounded-md transition-colors cursor-pointer hidden md:block"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
            {habit.status === "stopped" && (
              <div className="bg-accent-subtle/50 border border-accent-primary/20 rounded-2xl p-5 flex flex-col items-center justify-center text-center shadow-sm">
                <div className="w-12 h-12 bg-background-surface rounded-full flex items-center justify-center mb-3 shadow-sm border border-border-subtle">
                  <RotateCcw className="w-6 h-6 text-text-secondary" />
                </div>
                <h3 className="font-bold text-text-primary mb-1">
                  Habit is currently stopped
                </h3>
                <p className="text-sm text-text-secondary mb-4">
                  You can restart this habit anytime to begin a new cycle while
                  preserving your past history.
                </p>
                <button
                  onClick={handleRestartHabit}
                  className="px-5 py-2.5 bg-accent-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm cursor-pointer"
                >
                  Restart Habit Now
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-background-main border border-border-subtle rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Target className="w-5 h-5 text-blue-500 mb-1" />
                <span className="text-xl font-bold text-text-primary">
                  {totalCheckIns}
                </span>
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  Total
                </span>
              </div>
              <div className="bg-background-main border border-border-subtle rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Flame
                  className={cn(
                    "w-5 h-5 mb-1",
                    currentStreak > 0
                      ? "text-orange-500"
                      : "text-text-secondary opacity-50",
                  )}
                />
                <span className="text-xl font-bold text-text-primary">
                  {currentStreak}
                </span>
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  Streak
                </span>
              </div>
              <div className="bg-background-main border border-border-subtle rounded-2xl p-4 flex flex-col items-center justify-center text-center">
                <Trophy className="w-5 h-5 text-yellow-500 mb-1" />
                <span className="text-xl font-bold text-text-primary">
                  {highestStreak}
                </span>
                <span className="text-[10px] text-text-secondary font-medium uppercase tracking-wider">
                  Highest
                </span>
              </div>
            </div>

            {goalStats && habit.status === "active" && (
              <div className="bg-background-surface border border-border-subtle rounded-2xl p-5 shadow-sm">
                <div className="flex justify-between items-end mb-3">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary">
                      Current Cycle
                    </h4>
                    <p className="text-xs text-text-secondary font-medium">
                      Day {goalStats.currentProgress} of {goalStats.cycleDays}
                    </p>
                  </div>
                  <Flag
                    className={cn(
                      "w-5 h-5",
                      goalStats.isFinishLine || goalStats.percentage === 100
                        ? "text-green-500"
                        : "text-text-secondary opacity-50",
                    )}
                  />
                </div>
                <div className="w-full h-2.5 bg-background-main rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent-primary transition-all duration-500 ease-out"
                    style={{ width: `${goalStats.percentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="bg-background-surface border border-border-subtle rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="font-bold text-text-primary">
                  {format(currentMonth, "MMMM yyyy")}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={prevMonth}
                    className="p-1.5 rounded-md hover:bg-background-main text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextMonth}
                    className="p-1.5 rounded-md hover:bg-background-main text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 mb-2 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-bold text-text-secondary uppercase tracking-wider"
                  >
                    {d}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {days.map((day, idx) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isFuture = isAfter(startOfDay(day), today);
                  const isCurrentDay = isSameDay(day, today);

                  const isScheduled = isHabitScheduledOnDate(habit, day);
                  const isCompleted = habit.completedDates.includes(dateStr);

                  // TARGETS EXACT FLAG DATE OR FALLS BACK TO END DATE
                  const historicalCycle = habit.pastCycles?.find(
                    (c) => (c.flagDate || c.endDate) === dateStr,
                  );
                  const isMissed =
                    isScheduled &&
                    !isCompleted &&
                    isBefore(startOfDay(day), today);
                  const isHighestStreak =
                    currentStreak > 0 && currentStreak >= highestStreak;

                  let Icon = null;
                  let iconColor = "";

                  if (historicalCycle) {
                    Icon = Flag;
                    iconColor =
                      historicalCycle.action === "stopped"
                        ? "text-green-500 fill-green-500/20"
                        : historicalCycle.action === "failed"
                          ? "text-red-500 fill-red-500/20"
                          : "text-yellow-500 fill-yellow-500/20";
                  } else if (isCompleted) {
                    if (isCurrentDay && isHighestStreak) {
                      Icon = Flame;
                      iconColor = "text-orange-500 fill-orange-500/20";
                    } else if (isCurrentDay && !isHighestStreak) {
                      Icon = Check;
                      iconColor = "text-blue-500";
                    } else {
                      Icon = Check;
                      iconColor = "text-green-500";
                    }
                  } else if (isMissed) {
                    Icon = AlertCircle;
                    iconColor = "text-red-500";
                  }

                  const lastCycleEndDateStr = habit.pastCycles?.length
                    ? habit.pastCycles[habit.pastCycles.length - 1].endDate
                    : null;
                  const isLockedHistory = Boolean(
                    lastCycleEndDateStr &&
                    !isAfter(
                      startOfDay(day),
                      startOfDay(parseISO(lastCycleEndDateStr)),
                    ),
                  );
                  const isDisabled = isFuture || isLockedHistory;

                  return (
                    <button
                      key={idx}
                      onClick={() => handleToggleDate(day)}
                      disabled={isDisabled}
                      className={cn(
                        "group relative flex flex-col items-center justify-center h-10 w-full transition-all",
                        isDisabled ? "cursor-default" : "cursor-pointer",
                      )}
                    >
                      <span
                        className={cn(
                          "text-xs font-semibold z-10 transition-colors",
                          !isCurrentMonth
                            ? "text-text-secondary/30"
                            : "text-text-primary",
                          isFuture ? "opacity-30" : "",
                          Icon ? "opacity-0" : "opacity-100",
                        )}
                      >
                        {format(day, "d")}
                      </span>

                      {Icon && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 animate-in zoom-in">
                          <Icon
                            className={cn("w-5 h-5", iconColor)}
                            strokeWidth={2.5}
                          />
                        </div>
                      )}

                      {!Icon && isScheduled && !isFuture && (
                        <div className="absolute w-1.5 h-1.5 rounded-full bg-border-subtle group-hover:bg-accent-primary/50 bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {habit.pastCycles && habit.pastCycles.length > 0 && (
              <div className="bg-background-main border border-border-subtle rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4 text-text-primary">
                  <History className="w-5 h-5" />
                  <h4 className="font-bold">Cycle Ledger</h4>
                </div>
                <div className="space-y-3">
                  {habit.pastCycles.map((cycle, idx) => (
                    <div
                      key={cycle.id}
                      className="flex items-center justify-between bg-background-surface border border-border-subtle p-3 rounded-xl"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-text-primary">
                          Cycle {idx + 1}
                        </span>
                        <span className="text-xs font-medium text-text-secondary">
                          {format(parseISO(cycle.startDate), "MMM d, yyyy")} -{" "}
                          {format(parseISO(cycle.endDate), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5">
                          <Flag
                            className={cn(
                              "w-3.5 h-3.5",
                              cycle.action === "stopped"
                                ? "text-green-500 fill-green-500/20"
                                : cycle.action === "failed"
                                  ? "text-red-500 fill-red-500/20"
                                  : "text-yellow-500 fill-yellow-500/20",
                            )}
                          />
                          <span className="text-sm font-bold text-text-primary">
                            {cycle.goalDays} Days
                          </span>
                        </div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-text-secondary mt-0.5">
                          {cycle.action}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-6 border-t border-border-subtle flex flex-col gap-3">
              {habit.status === "active" && (
                <button
                  onClick={() => setIsStopEarlyModalOpen(true)}
                  className="text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-background-main px-4 py-2.5 rounded-xl transition-colors cursor-pointer border border-border-subtle flex items-center justify-center gap-2 w-full"
                >
                  <StopCircle className="w-4 h-4" /> Stop Habit Early
                </button>
              )}
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-sm font-medium text-red-500 hover:text-red-600 hover:bg-red-500/10 px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center w-full"
              >
                Delete Habit Permanently
              </button>
            </div>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Delete Habit"
        message={`Are you sure you want to permanently delete "${habit.title}"? This will erase all history, streaks, and check-ins.`}
        confirmText="Delete Habit"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={isStopEarlyModalOpen}
        onClose={() => setIsStopEarlyModalOpen(false)}
        onConfirm={handleStopEarly}
        title="Stop Habit Early"
        message={`Are you sure you want to stop tracking "${habit.title}"? This will freeze its history up to the last relevant day in this cycle.`}
        confirmText="Stop Habit"
        isDanger={false}
      />
    </>
  );
}
