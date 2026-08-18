"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, LayoutGrid, Check, Flame } from "lucide-react";
import { useHabitStore, HabitColor } from "@/store/useHabitStore";
import { getLocalDateString } from "@/lib/utils";
import { HabitFormDialog } from "@/components/habits/HabitFormDialog";
import { HabitSidePanel } from "@/components/habits/HabitSidePanel";
import { CycleCompleteDialog } from "@/components/habits/CycleCompleteDialog";

type Tab = "daily" | "all";

const colorMap: Record<HabitColor, string> = {
  default: "bg-zinc-700 ring-zinc-700/20 text-zinc-100",
  red: "bg-red-500 ring-red-500/20 text-white",
  orange: "bg-orange-500 ring-orange-500/20 text-white",
  yellow: "bg-yellow-500 ring-yellow-500/20 text-yellow-950",
  green: "bg-green-500 ring-green-500/20 text-white",
  blue: "bg-blue-500 ring-blue-500/20 text-white",
  purple: "bg-purple-500 ring-purple-500/20 text-white",
};

// SVG Progress Ring Component
const ProgressRing = ({ percentage, colorClass, isSelected }: { percentage: number, colorClass: string, isSelected: boolean }) => {
  const radius = 18;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;
  
  // Extract stroke color from standard tailwind class names mapped above roughly
  let strokeColor = "#a1a1aa"; // default zinc-400
  if (colorClass.includes("red")) strokeColor = "#ef4444";
  if (colorClass.includes("orange")) strokeColor = "#f97316";
  if (colorClass.includes("yellow")) strokeColor = "#eab308";
  if (colorClass.includes("green")) strokeColor = "#22c55e";
  if (colorClass.includes("blue")) strokeColor = "#3b82f6";
  if (colorClass.includes("purple")) strokeColor = "#a855f7";

  return (
    <svg 
      viewBox="0 0 48 48" 
      className="w-full h-full -rotate-90 transform absolute inset-0 pointer-events-none"
    >
      <circle
        className={`transition-colors ${isSelected ? "stroke-zinc-800" : "stroke-zinc-800/50"}`}
        strokeWidth="3"
        fill="transparent"
        r={radius}
        cx="24"
        cy="24"
      />
      <circle
        className="transition-all duration-500 ease-out"
        stroke={percentage > 0 ? strokeColor : "transparent"}
        strokeWidth="3"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        fill="transparent"
        r={radius}
        cx="24"
        cy="24"
      />
    </svg>
  );
};
export default function HabitsPage() {
  const { habits, processMissedDays, toggleDay } = useHabitStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("daily");
  
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [dismissedHabits, setDismissedHabits] = useState<Set<string>>(new Set());

  useEffect(() => {
    processMissedDays();
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, [processMissedDays]);

  // Generate 7-day nav array (today + 6 previous days)
  const navDays = useMemo(() => {
    const days = [];
    const today = new Date();
    today.setHours(0,0,0,0);
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(getLocalDateString(d));
    }
    return days;
  }, []);

  // Habits active on the selected date
  const selectedDayHabits = useMemo(() => {
    return habits.filter(h => {
      // Habit must be active (or we could show historical habits if they were active on this day, 
      // but for simplicity we show currently active habits that were created before/on this date)
      if (h.state !== "active") return false;
      return h.trackingStartDate <= selectedDate;
    });
  }, [habits, selectedDate]);

  const completedCycleHabit = useMemo(() => {
    const today = getLocalDateString();
    return habits.find(h => {
      if (h.state !== "active") return false;
      if (dismissedHabits.has(h.id)) return false;
      
      const currentCycle = h.cycles[h.cycles.length - 1];
      if (currentCycle.length === "forever") return false;

      const start = new Date(currentCycle.startDate);
      start.setHours(0, 0, 0, 0);
      let count = 0;
      const todayDate = new Date(today);
      todayDate.setHours(0,0,0,0);
      
      const curr = new Date(start);
      while (curr <= todayDate) {
        const status = h.history[getLocalDateString(curr)];
        if (status === "completed" || status === "cycle_completed" || status === "habit_completed") {
          count++;
        }
        curr.setDate(curr.getDate() + 1);
      }
      
      return count >= (currentCycle.length as number);
    }) || null;
  }, [habits, dismissedHabits]);

  // Calculate progress percentages for the 7 nav days
  const progressByDay = useMemo(() => {
    const map: Record<string, { percentage: number, color: string }> = {};
    
    navDays.forEach(dateStr => {
      const activeForDay = habits.filter(h => h.state === "active" && h.trackingStartDate <= dateStr);
      if (activeForDay.length === 0) {
        map[dateStr] = { percentage: 0, color: "default" };
        return;
      }
      
      const completed = activeForDay.filter(h => {
        const s = h.history[dateStr];
        return s === "completed" || s === "cycle_completed" || s === "habit_completed";
      }).length;
      
      map[dateStr] = { 
        percentage: Math.round((completed / activeForDay.length) * 100),
        // Use color of the first active habit just to give the ring some personality, or fallback to purple
        color: activeForDay.length > 0 ? activeForDay[0].color : "purple" 
      };
    });
    
    return map;
  }, [habits, navDays]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto px-4 relative">
      
      {/* Header & Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 pt-2">
        <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-purple-500 drop-shadow-sm">
          Habits
        </h2>

        <div className="flex items-center gap-4">
          <div className="flex bg-[#121215] p-1 rounded-xl border border-zinc-800/60">
            <button
              onClick={() => setActiveTab("daily")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "daily" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Daily View
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "all" ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              All Habits
            </button>
          </div>

          <button 
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-purple-900/20"
          >
            <Plus className="h-4 w-4" /> New Habit
          </button>
        </div>
      </div>

      {activeTab === "daily" ? (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {/* 7-Day Navigation */}
          <div className="flex items-center justify-between w-full mt-2">
            {navDays.map(dateStr => {
              const d = new Date(dateStr);
              const dayName = d.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const dayNum = d.getDate();
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === getLocalDateString();
              
              const pData = progressByDay[dateStr];

              return (
                <div 
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className="flex flex-col items-center gap-2 cursor-pointer group flex-1"
                >
                  <span className={`text-xs font-bold tracking-wider transition-colors ${isSelected ? "text-purple-400" : "text-zinc-500 group-hover:text-zinc-400"}`}>
                    {isToday ? "TODAY" : dayName}
                  </span>
                  
                  <div className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isSelected 
                      ? "bg-[#16161a] border border-purple-500/30 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-105" 
                      : "bg-transparent hover:bg-zinc-900/60"
                  }`}>
                    <span className={`text-base sm:text-lg font-bold z-10 transition-colors ${isSelected ? "text-purple-100" : "text-zinc-400"}`}>
                      {dayNum}
                    </span>
                    <ProgressRing 
                      percentage={pData.percentage} 
                      colorClass={colorMap[pData.color as HabitColor]} 
                      isSelected={isSelected}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Habit Blocks */}
          <div className="flex flex-col gap-3 mt-4">
            {selectedDayHabits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <LayoutGrid className="h-10 w-10 mb-4 opacity-20" />
                <p>No active habits for this day.</p>
              </div>
            ) : (
              selectedDayHabits.map(habit => {
                const status = habit.history[selectedDate];
                const isCompleted = status === "completed" || status === "cycle_completed" || status === "habit_completed";
                const isMissed = status === "missed";
                
                return (
                  <div 
                    key={habit.id}
                    onClick={() => setSelectedHabitId(habit.id)}
                    className="group flex items-center justify-between p-4 rounded-2xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-8 rounded-full ${colorMap[habit.color].split(" ")[0]}`} />
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-zinc-100">{habit.title}</span>
                        <div className="flex items-center gap-3 text-xs font-medium text-zinc-500">
                          {habit.currentStreak >= 2 && (
                            <span className="flex items-center text-orange-500 gap-1">
                              <Flame className="w-3.5 h-3.5 fill-orange-500" /> {habit.currentStreak} Day Streak
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <span className="text-blue-400 text-[10px]">◎</span> {habit.totalCompletedDays} Total
                          </span>
                        </div>
                      </div>
                    </div>

                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleDay(habit.id, selectedDate);
                      }}
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        isCompleted 
                          ? `bg-green-500 border-green-500 text-white shadow-lg shadow-green-900/20`
                          : isMissed
                          ? "border-red-500/50 bg-red-950/20 hover:border-red-500 hover:bg-red-900/40"
                          : "border-zinc-700 text-transparent hover:border-zinc-500 hover:bg-zinc-800"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      ) : (
        /* ALL HABITS VIEW */
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          {["active", "completed", "stopped"].map(state => {
            const list = habits.filter(h => h.state === state);
            if (list.length === 0) return null;
            
            return (
              <div key={state} className="flex flex-col gap-3">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                  {state}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {list.map(habit => (
                    <div
                      key={habit.id}
                      onClick={() => setSelectedHabitId(habit.id)}
                      className="flex flex-col gap-3 p-5 rounded-2xl bg-[#121215] border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${colorMap[habit.color].split(" ")[0]} ring-4 ${colorMap[habit.color].split(" ")[1]}`} />
                        <h4 className="font-bold text-zinc-100 truncate">{habit.title}</h4>
                      </div>
                      <div className="flex items-center justify-between text-xs text-zinc-500 font-medium bg-[#09090b] p-2 rounded-lg border border-zinc-800/50">
                        <span>{habit.currentStreak} Streak</span>
                        <span>{habit.totalCompletedDays} Total</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {habits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
              <LayoutGrid className="h-10 w-10 mb-4 opacity-20" />
              <p>You haven&apos;t created any habits yet.</p>
            </div>
          )}

        </div>
      )}

      {/* Modals & Panels */}
      <CycleCompleteDialog
        habit={completedCycleHabit}
        onClose={() => {
          if (completedCycleHabit) {
            setDismissedHabits(prev => {
              const newSet = new Set(prev);
              newSet.add(completedCycleHabit.id);
              return newSet;
            });
          }
        }}
      />

      <HabitFormDialog 
        isOpen={isFormOpen} 
        onClose={() => setIsFormOpen(false)} 
      />
      
      <HabitSidePanel 
        habitId={selectedHabitId}
        onClose={() => setSelectedHabitId(null)}
      />

    </div>
  );
}
