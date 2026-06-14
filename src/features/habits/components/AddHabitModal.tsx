import { useState } from "react";
import { X, Check, Target, ChevronDown, ChevronRight } from "lucide-react";
import { useGoalsStore } from "@/features/goals/store/goals.store";
import { format } from "date-fns";
import { useHabitsStore } from "../store/habits.store";
import { Select } from "@/components/ui/Select";
import { DatePicker } from "@/components/ui/DatePicker";
import type { HabitFrequencyType, HabitGoalType } from "@/types";
import { cn } from "@/lib/utils";

interface AddHabitModalProps {
  isOpen: boolean;
  habitIdToEdit?: string | null;
  onClose: () => void;
}

const WEEK_DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const GOAL_OPTIONS = [
  { value: "7", label: "7 Days" },
  { value: "21", label: "21 Days" },
  { value: "30", label: "30 Days" },
  { value: "100", label: "100 Days" },
  { value: "custom", label: "Custom Days" },
];

export function AddHabitModal({
  isOpen,
  habitIdToEdit,
  onClose,
}: AddHabitModalProps) {
  const { habits, addHabit, updateHabit } = useHabitsStore();

  const [title, setTitle] = useState("");
  const [color, setColor] = useState("bg-accent-primary");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [freqType, setFreqType] = useState<HabitFrequencyType>("daily");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [intervalDays, setIntervalDays] = useState(3);

  const [goalType, setGoalType] = useState<HabitGoalType>("forever");
  const [goalPreset, setGoalPreset] = useState("21");
  const [customGoal, setCustomGoal] = useState(21);

  // NEW: Goal Integration State
  const [linkedGoalId, setLinkedGoalId] = useState<string>("none");
  const [goalContribution, setGoalContribution] = useState<number | "">(1);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const goals = useGoalsStore((state) => state.goals);
  const goalOptions = [
    {
      value: "none",
      label: "No Goal",
      icon: <Target className="w-4 h-4 text-text-secondary" />,
    },
    ...goals.map((g) => ({
      value: g.id,
      label: g.title,
      icon: <Target className="w-4 h-4 text-blue-500" />,
    })),
  ];
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevHabitId, setPrevHabitId] = useState(habitIdToEdit);

  
  if (isOpen !== prevIsOpen || habitIdToEdit !== prevHabitId) {
    setPrevIsOpen(isOpen);
    setPrevHabitId(habitIdToEdit);

    if (isOpen) {
      if (habitIdToEdit) {
        const existingHabit = habits.find((h) => h.id === habitIdToEdit);
        if (existingHabit) {
          setTitle(existingHabit.title);
          setColor(existingHabit.color || "bg-accent-primary");
          setStartDate(existingHabit.startDate);
          setFreqType(existingHabit.frequency.type);
          setDaysOfWeek(
            existingHabit.frequency.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
          );
          setDaysPerWeek(existingHabit.frequency.daysPerWeek || 5);
          setIntervalDays(existingHabit.frequency.intervalDays || 3);
          setGoalType(existingHabit.goal.type);
          setLinkedGoalId(existingHabit.linkedGoalId || "none");
          setGoalContribution(existingHabit.goalContribution || 1);
          setIsAdvancedOpen(!!existingHabit.linkedGoalId);

          if (existingHabit.goal.type === "cycle" && existingHabit.goal.days) {
            const isPreset = ["7", "21", "30", "100"].includes(
              existingHabit.goal.days.toString(),
            );
            if (isPreset) {
              setGoalPreset(existingHabit.goal.days.toString());
            } else {
              setGoalPreset("custom");
              setCustomGoal(existingHabit.goal.days);
            }
          } else {
            setGoalPreset("21");
          }
        }
      } else {
        setTitle("");
        setColor("bg-accent-primary");
        setStartDate(format(new Date(), "yyyy-MM-dd"));
        setFreqType("daily");
        setDaysOfWeek([0, 1, 2, 3, 4, 5, 6]);
        setDaysPerWeek(5);
        setIntervalDays(3);
        setGoalType("forever");
        setGoalPreset("21");
        setCustomGoal(21);
        setLinkedGoalId("none");
        setGoalContribution(1);
        setIsAdvancedOpen(false);
      }
    }
  }

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!title.trim()) return;

    const habitData = {
      title: title.trim(),
      color,
      startDate: startDate || format(new Date(), "yyyy-MM-dd"),
      frequency: {
        type: freqType,
        daysOfWeek: freqType === "daily" ? daysOfWeek : undefined,
        daysPerWeek: freqType === "weekly" ? daysPerWeek : undefined,
        intervalDays: freqType === "interval" ? intervalDays : undefined,
      },
      goal: {
        type: goalType,
        days:
          goalType === "cycle"
            ? goalPreset === "custom"
              ? customGoal
              : parseInt(goalPreset)
            : undefined,
      },
      linkedGoalId: linkedGoalId === "none" ? undefined : linkedGoalId,
      goalContribution:
        linkedGoalId === "none" ? undefined : Number(goalContribution),
    };

    if (habitIdToEdit) {
      const existingHabit = habits.find((h) => h.id === habitIdToEdit);
      let status = existingHabit?.status || "active";

      // Load current periods or create a fallback baseline
      const trackingPeriods = existingHabit?.trackingPeriods
        ? [...existingHabit.trackingPeriods]
        : [{ start: existingHabit?.startDate || habitData.startDate }];

      if (existingHabit) {
        const goalChanged =
          existingHabit.goal.type !== habitData.goal.type ||
          existingHabit.goal.days !== habitData.goal.days;
        const freqChanged =
          JSON.stringify(existingHabit.frequency) !==
          JSON.stringify(habitData.frequency);

        // SYNC FIX: If editing a stopped habit to continue it, officially open a new period starting TODAY!
        if (
          existingHabit.status === "stopped" &&
          (goalChanged || freqChanged)
        ) {
          status = "active";
          trackingPeriods.push({ start: format(new Date(), "yyyy-MM-dd") });
        }
        // If actively running but they changed the start date, shift the current period to match
        else if (habitData.startDate !== existingHabit.startDate) {
          trackingPeriods[trackingPeriods.length - 1].start =
            habitData.startDate;
        }
      }

      updateHabit(habitIdToEdit, {
        ...habitData,
        status,
        trackingPeriods,
      });
    } else {
      // NEW HABIT: Initialize the tracking period baseline
      addHabit({
        ...habitData,
        id: crypto.randomUUID(),
        completedDates: [],
        createdAt: new Date().toISOString(),
        status: "active",
        trackingPeriods: [{ start: habitData.startDate }],
      });
    }

    onClose();
  };

  const colors = [
    "bg-accent-primary",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-purple-500",
  ];

  return (
    <div className="fixed inset-0 z-60 overflow-y-auto scrollbar-none">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="relative w-full max-w-md bg-background-surface border border-border-subtle rounded-3xl shadow-2xl p-6 md:p-8 text-left animate-in fade-in zoom-in-95 duration-200 my-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-text-primary">
              {habitIdToEdit ? "Edit Habit" : "New Habit"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-text-secondary hover:bg-background-main rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to build?"
                className="w-full bg-background-main border-none rounded-xl py-3 px-4 text-text-primary text-lg font-medium focus:ring-2 focus:ring-accent-primary/50 outline-none"
              />
              <div className="flex items-center gap-2 pt-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer",
                      c,
                      color === c
                        ? "ring-2 ring-offset-2 ring-offset-background-surface ring-accent-primary scale-110"
                        : "opacity-80 hover:opacity-100",
                    )}
                  >
                    {color === c && <Check className="w-4 h-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <hr className="border-border-subtle" />

            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
                Frequency
              </h3>
              <div className="flex bg-background-main p-1 rounded-xl">
                {(["daily", "weekly", "interval"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFreqType(type)}
                    className={cn(
                      "flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all cursor-pointer",
                      freqType === type
                        ? "bg-background-surface shadow-sm text-text-primary"
                        : "text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <div className="bg-background-main/50 p-4 rounded-xl border border-border-subtle">
                {freqType === "daily" && (
                  <div className="flex justify-between gap-1">
                    {WEEK_DAYS.map((day, idx) => {
                      const isSelected = daysOfWeek.includes(idx);
                      return (
                        <button
                          key={idx}
                          onClick={() =>
                            setDaysOfWeek((prev) =>
                              isSelected
                                ? prev.filter((d) => d !== idx)
                                : [...prev, idx].sort(),
                            )
                          }
                          className={cn(
                            "w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer",
                            isSelected
                              ? "bg-accent-primary text-white"
                              : "bg-background-surface text-text-secondary hover:bg-background-main border border-border-subtle",
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                )}
                {freqType === "weekly" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      Days per week
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="7"
                      value={daysPerWeek}
                      onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                      className="w-16 bg-background-surface border border-border-subtle rounded-lg px-2 py-1 text-center font-bold text-text-primary outline-none"
                    />
                  </div>
                )}
                {freqType === "interval" && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-text-primary">
                      Repeat every X days
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={intervalDays}
                      onChange={(e) => setIntervalDays(Number(e.target.value))}
                      className="w-16 bg-background-surface border border-border-subtle rounded-lg px-2 py-1 text-center font-bold text-text-primary outline-none"
                    />
                  </div>
                )}
              </div>
            </div>

            <hr className="border-border-subtle" />

            <div className="space-y-4">
              <h3 className="font-semibold text-text-primary text-sm uppercase tracking-wider">
                Goal & Start Date
              </h3>
              <div className="flex flex-col sm:grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 z-20">
                  <span className="text-xs font-medium text-text-secondary ml-1">
                    Start Date
                  </span>
                  <DatePicker
                    value={startDate}
                    onChange={(d) =>
                      setStartDate(d || format(new Date(), "yyyy-MM-dd"))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5 z-10">
                  <span className="text-xs font-medium text-text-secondary ml-1">
                    Goal
                  </span>
                  <Select
                    value={goalType === "forever" ? "forever" : goalPreset}
                    onChange={(val) => {
                      if (val === "forever") setGoalType("forever");
                      else {
                        setGoalType("cycle");
                        setGoalPreset(val);
                      }
                    }}
                    options={[
                      { value: "forever", label: "Forever" },
                      ...GOAL_OPTIONS,
                    ]}
                    align="right"
                  />
                </div>
              </div>
              {goalType === "cycle" && goalPreset === "custom" && (
                <div className="flex items-center justify-between bg-background-main/50 p-4 rounded-xl border border-border-subtle animate-in fade-in">
                  <span className="text-sm font-medium text-text-primary">
                    Custom Goal Days
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(Number(e.target.value))}
                    className="w-20 bg-background-surface border border-border-subtle rounded-lg px-2 py-1 text-center font-bold text-text-primary outline-none"
                  />
                </div>
              )}
            </div>

{/* Advanced Settings: Goal Linkage */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                {isAdvancedOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Advanced Settings
              </button>

              {isAdvancedOpen && (
                <div className="mt-4 space-y-4 p-4 bg-background-main/30 border border-border-subtle rounded-xl animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-text-secondary">
                      Contributes To
                    </span>
                    <div className="flex-1">
                      <Select
                        value={linkedGoalId}
                        onChange={(val) => setLinkedGoalId(val)}
                        options={goalOptions}
                        align="right"
                      />
                    </div>
                  </div>

                  {linkedGoalId !== "none" && (
                    <div className="flex items-center animate-in fade-in">
                      <span className="w-32 text-sm text-text-secondary">
                        Contribution
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={goalContribution}
                          onChange={(e) =>
                            setGoalContribution(Number(e.target.value))
                          }
                          className="w-20 bg-background-main border border-border-subtle rounded-lg px-3 py-1.5 text-sm font-bold text-text-primary outline-none focus:ring-2 focus:ring-accent-primary/20 transition-all"
                        />
                        <span className="text-xs font-medium text-text-secondary">
                          added per completion
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full py-3.5 bg-accent-primary text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-4"
            >
              {habitIdToEdit ? "Save Changes" : "Create Habit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
