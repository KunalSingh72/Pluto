"use client";

import { useState, useMemo } from "react";
import { SidePanel } from "@/components/shared/SidePanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useHabitStore, HabitColor } from "@/store/useHabitStore";
import { Button } from "@/components/ui/button";
import { getLocalDateString } from "@/lib/utils";
import { 
  Pencil, 
  Trash2, 
  Flag, 
  Play, 
  Check, 
  XCircle, 
  AlertCircle,
  Flame,
  Target,
  Trophy,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { HabitFormDialog } from "./HabitFormDialog";
import { RestartHabitDialog } from "./RestartHabitDialog";

interface HabitSidePanelProps {
  habitId: string | null;
  onClose: () => void;
}

const colorMap: Record<HabitColor, string> = {
  default: "bg-zinc-700 text-zinc-100 ring-zinc-700/20",
  red: "bg-red-500 text-white ring-red-500/20",
  orange: "bg-orange-500 text-white ring-orange-500/20",
  yellow: "bg-yellow-500 text-yellow-950 ring-yellow-500/20",
  green: "bg-green-500 text-white ring-green-500/20",
  blue: "bg-blue-500 text-white ring-blue-500/20",
  purple: "bg-purple-500 text-white ring-purple-500/20",
};

export function HabitSidePanel({ habitId, onClose }: HabitSidePanelProps) {
  const { 
    habits, 
    deleteHabit, 
    stopEarly 
  } = useHabitStore();
  const habit = habits.find((h) => h.id === habitId);

  const [isEditing, setIsEditing] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const today = getLocalDateString();

  const cycleProgress = useMemo(() => {
    if (!habit) return { completedDays: 0, targetDays: 0, percentage: 0 };
    const currentCycle = habit.cycles[habit.cycles.length - 1];
    
    if (currentCycle.length === "forever") {
      return { completedDays: habit.currentStreak, targetDays: "∞", percentage: 100 };
    }

    const start = new Date(currentCycle.startDate);
    start.setHours(0, 0, 0, 0);
    
    // Calculate how many days have been completed *in this cycle*
    // It's basically the streak if the streak started on or after startDate,
    // or we can count "completed" statuses since startDate.
    let count = 0;
    const todayDate = new Date(today);
    todayDate.setHours(0,0,0,0);
    
    const curr = new Date(start);
    while (curr <= todayDate) {
      const status = habit.history[getLocalDateString(curr)];
      if (status === "completed" || status === "cycle_completed" || status === "habit_completed") {
        count++;
      }
      curr.setDate(curr.getDate() + 1);
    }
    
    const percentage = Math.min(100, Math.round((count / (currentCycle.length as number)) * 100));
    
    return { 
      completedDays: count, 
      targetDays: currentCycle.length, 
      percentage 
    };
  }, [habit, today]);

  const isCycleComplete = useMemo(() => {
    if (!habit || habit.state !== "active") return false;
    const { targetDays, completedDays } = cycleProgress;
    return targetDays !== "∞" && completedDays >= (targetDays as number);
  }, [habit, cycleProgress]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, [currentMonth]);

  if (!habit) return null;

  // Calendar logic
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));

  return (
    <>
      <SidePanel isOpen={!!habitId} onClose={onClose} title="Habit Details">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-zinc-800/60 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${colorMap[habit.color].split(" ")[0]} ring-4 ${colorMap[habit.color].split(" ")[2]}`} />
                <div>
                  <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                    {habit.title}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 capitalize">
                    {habit.state} • Started {new Date(habit.trackingStartDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(true)}
                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-8">
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Target className="w-5 h-5 text-blue-500 mb-2" />
                <span className="text-2xl font-bold text-zinc-100">{habit.totalCompletedDays}</span>
                <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mt-1">Total</span>
              </div>
              <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Flame className="w-5 h-5 text-orange-500 mb-2" />
                <span className="text-2xl font-bold text-zinc-100">{habit.currentStreak}</span>
                <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mt-1">Streak</span>
              </div>
              <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Trophy className="w-5 h-5 text-yellow-500 mb-2" />
                <span className="text-2xl font-bold text-zinc-100">{habit.highestStreak}</span>
                <span className="text-[10px] font-semibold text-zinc-500 tracking-wider uppercase mt-1">Highest</span>
              </div>
            </div>

            {/* Current Cycle Progress */}
            <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">Current Cycle</h4>
                  <p className="text-xs text-zinc-500">
                    Day {cycleProgress.completedDays} of {cycleProgress.targetDays}
                  </p>
                </div>
                <Flag className="w-4 h-4 text-zinc-500" />
              </div>
              
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${colorMap[habit.color].split(" ")[0]}`} 
                  style={{ width: `${cycleProgress.percentage}%` }} 
                />
              </div>
            </div>



            {/* Heatmap Calendar */}
            <div className="bg-[#121215] border border-zinc-800/80 rounded-xl p-5">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-semibold text-zinc-200">
                  {currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                </h4>
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-1 text-zinc-500 hover:text-zinc-200"><ChevronLeft className="w-4 h-4" /></button>
                  <button onClick={nextMonth} className="p-1 text-zinc-500 hover:text-zinc-200"><ChevronRight className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-2">
                {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map(d => (
                  <div key={d} className="text-[10px] font-bold text-zinc-600">{d}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center">
                {calendarDays.map((dateStr, i) => {
                  if (!dateStr) return <div key={`empty-${i}`} />;
                  const day = new Date(dateStr).getDate();
                  const status = habit.history[dateStr];
                  const isFuture = dateStr > today;
                  
                  let icon = <span className="text-xs text-zinc-400 font-medium">{day}</span>;
                  
                  if (status === "completed" || status === "cycle_completed" || status === "habit_completed") {
                    if (dateStr === today && habit.currentStreak > 1) {
                      icon = <Flame className="w-4 h-4 text-orange-500 mx-auto" fill="currentColor" />;
                    } else if (status === "completed") {
                      icon = <Check className="w-4 h-4 text-green-500 mx-auto" />;
                    } else if (status === "cycle_completed") {
                      icon = <Flag className="w-4 h-4 text-yellow-500 mx-auto" fill="currentColor" />;
                    } else if (status === "habit_completed") {
                      icon = <Flag className="w-4 h-4 text-green-500 mx-auto" fill="currentColor" />;
                    }
                  } else if (status === "missed") {
                    icon = <AlertCircle className="w-4 h-4 text-red-500 mx-auto" />;
                  } else if (status === "stopped_early") {
                    icon = <Flag className="w-4 h-4 text-red-500 mx-auto" fill="currentColor" />;
                  }

                  return (
                    <div 
                      key={dateStr} 
                      className={`h-6 flex items-center justify-center ${isFuture ? "opacity-30" : ""}`}
                      title={status ? `${dateStr}: ${status}` : dateStr}
                    >
                      {icon}
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Context Actions */}
            <div className="flex flex-col gap-2 mt-4">
              {habit.state === "active" && !isCycleComplete && (
                <ConfirmDialog
                  title="Stop Habit Early?"
                  description="This will mark the habit as stopped. Your history will be preserved."
                  onConfirm={() => { stopEarly(habit.id, today); onClose(); }}
                >
                  <Button variant="outline" className="w-full border-zinc-800 hover:bg-zinc-900 text-zinc-400 rounded-xl h-12">
                    <XCircle className="w-4 h-4 mr-2" /> Stop Habit Early
                  </Button>
                </ConfirmDialog>
              )}

              {(habit.state === "completed" || habit.state === "stopped") && (
                <Button 
                  onClick={() => setIsRestarting(true)}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl h-12"
                >
                  <Play className="w-4 h-4 mr-2" /> Restart Habit
                </Button>
              )}

              <ConfirmDialog
                title="Delete Habit Permanently?"
                description="This will destroy all history, streaks, and cycles for this habit. This cannot be undone."
                onConfirm={() => { deleteHabit(habit.id); onClose(); }}
                destructive
              >
                <Button variant="outline" className="w-full border-zinc-800 hover:bg-red-950/30 text-red-500 rounded-xl h-12">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Habit
                </Button>
              </ConfirmDialog>
            </div>
          </div>
        </div>
      </SidePanel>

      {isEditing && (
        <HabitFormDialog 
          isOpen={isEditing} 
          onClose={() => setIsEditing(false)} 
          habitToEdit={habit}
        />
      )}

      {isRestarting && (
        <RestartHabitDialog
          habit={habit}
          onClose={() => { setIsRestarting(false); onClose(); }}
        />
      )}
    </>
  );
}
