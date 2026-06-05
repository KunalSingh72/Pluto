import { useState, useEffect, useRef } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Menu, Plus } from "lucide-react";
import { useUiStore } from "@/stores/ui.store";
import { useTasksStore } from "@/features/tasks/store/tasks.store";
import {
  isTaskOnDate,
  isTaskCompletedOnDate,
} from "@/features/tasks/utils/task.utils";
import { DaySidebar } from "./components/DaySidebar";

export default function CalendarPage() {
  const { openMobileMenu } = useUiStore();
  const { tasks, categories } = useTasksStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [initialExpandedTaskId, setInitialExpandedTaskId] = useState<
    string | null
  >(null);

  // Dynamic Layout State
  const [maxVisibleTasks, setMaxVisibleTasks] = useState(4);
  const gridRef = useRef<HTMLDivElement>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Intelligent Google-Calendar style height calculation
  useEffect(() => {
    if (!gridRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const { height } = entries[0].contentRect;
      const rowCount = days.length / 7;
      const rowHeight = height / rowCount;

      // Subtract cell padding (16px) and date number height (~28px) = 44px
      const availableSpace = rowHeight - 44;

      // Each event chip is roughly 24px tall (including gaps)
      const fitCount = Math.floor(availableSpace / 24);

      // Ensure at least 1 slot is available for "+X more" on extremely tiny screens
      setMaxVisibleTasks(Math.max(1, fitCount));
    });

    observer.observe(gridRef.current);
    return () => observer.disconnect();
  }, [days.length]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  const getCategoryColor = (categoryId?: string) => {
    if (!categoryId || categoryId === "none") return "bg-accent-primary";
    const category = categories.find((c) => c.id === categoryId);
    return category ? category.color : "bg-accent-primary";
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setInitialExpandedTaskId(null);
  };

  const handleTaskClick = (e: React.MouseEvent, date: Date, taskId: string) => {
    e.stopPropagation();
    setSelectedDate(date);
    setInitialExpandedTaskId(taskId);
  };

  return (
    <div className="flex h-full w-full absolute inset-0 z-20 bg-background-surface md:static md:bg-transparent overflow-hidden">
      <div className="flex-1 flex flex-col h-full min-w-0 transition-all duration-300">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between px-4 h-16 border-b border-border-subtle shrink-0 bg-background-surface z-10">
          <div className="flex items-center gap-3">
            <button
              onClick={openMobileMenu}
              className="p-2 -ml-2 text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="text-2xl font-extrabold bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent">
              Calendar
            </span>
          </div>
        </div>

        {/* Desktop Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between px-4 md:px-8 pt-4 md:pt-8 pb-4 md:pb-6 shrink-0 bg-background-main md:bg-transparent border-b md:border-none border-border-subtle">
          <h1 className="hidden md:block text-4xl font-extrabold tracking-tight">
            <span className="bg-linear-to-r from-text-primary via-accent-primary to-text-primary bg-clip-text text-transparent bg-size-[200%_auto] animate-gradient">
              Calendar
            </span>
          </h1>

          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-xl border border-border-subtle bg-background-surface hover:bg-background-main text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg md:text-xl font-bold text-text-primary w-32 text-center">
                {format(currentMonth, "MMMM yyyy")}
              </span>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl border border-border-subtle bg-background-surface hover:bg-background-main text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              onClick={() => handleDayClick(new Date())}
              className="md:hidden flex items-center justify-center p-2 rounded-xl bg-accent-primary text-white hover:bg-accent-primary/90 transition-colors cursor-pointer"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Calendar Grid Container */}
        <div className="flex-1 overflow-hidden px-2 md:px-8 pb-4 md:pb-8 flex flex-col min-h-0">
          <div className="flex-1 bg-background-surface border border-border-subtle rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-0">
            {/* Days of Week Row */}
            <div className="grid grid-cols-7 border-b border-border-subtle bg-background-main/30 shrink-0">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="py-3 text-center text-xs font-semibold text-text-secondary uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="flex-1 overflow-hidden min-h-0 relative">
              <div
                ref={gridRef}
                className="grid grid-cols-7 h-full w-full"
                style={{
                  gridTemplateRows: `repeat(${days.length / 7}, minmax(0, 1fr))`,
                }}
              >
                {days.map((day, idx) => {
                  // STRICT filter for "event" types only
                  const dayTasks = tasks.filter(
                    (t) => t.type === "event" && isTaskOnDate(t, day),
                  );

                  const isCurrentMonth = isSameMonth(day, currentMonth);

                  // ADD THIS MISSING LINE BACK:
                  const isCurrentDay = isToday(day);

                  // Math to cleanly slice array and calculate indicator based on live screen height
                  const hasOverflow = dayTasks.length > maxVisibleTasks;
                  const visibleTasks = hasOverflow
                    ? dayTasks.slice(0, maxVisibleTasks - 1)
                    : dayTasks;
                  const overflowCount = dayTasks.length - visibleTasks.length;

                  // Remove bottom border from the last week's row to prevent double-borders
                  const isLastRow = idx >= days.length - 7;

                  return (
                    <div
                      key={day.toISOString()}
                      onClick={() => handleDayClick(day)}
                      className={`flex flex-col border-r border-border-subtle p-1 md:p-2 transition-colors cursor-pointer hover:bg-background-main/50 overflow-hidden
                        ${!isCurrentMonth ? "bg-background-main/20" : ""}
                        ${idx % 7 === 6 ? "border-r-0" : ""}
                        ${!isLastRow ? "border-b" : ""}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1 shrink-0">
                        <span
                          className={`text-xs md:text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full
                          ${!isCurrentMonth ? "text-text-secondary/40" : "text-text-primary"}
                          ${isCurrentDay ? "bg-accent-primary text-white" : ""}
                        `}
                        >
                          {format(day, "d")}
                        </span>
                      </div>

                      {/* Flex container ensures content is clipped neatly without scrolling */}
                      <div className="flex-1 overflow-hidden flex flex-col gap-1 min-h-0">
                        {visibleTasks.map((task) => {
                          const isCompleted = isTaskCompletedOnDate(task, day);

                          return (
                            <div
                              key={task.id}
                              onClick={(e) => handleTaskClick(e, day, task.id)}
                              className={`text-[10px] md:text-xs font-medium truncate px-1.5 py-0.5 rounded text-white shadow-sm hover:opacity-80 transition-opacity shrink-0 ${getCategoryColor(task.categoryId)} ${isCompleted ? "opacity-50 line-through" : ""}`}
                              title={task.title}
                            >
                              {task.title || "Untitled"}
                            </div>
                          );
                        })}

                        {hasOverflow && (
                          <div className="text-[10px] md:text-xs font-bold text-text-secondary px-1 hover:text-text-primary transition-colors shrink-0">
                            {overflowCount} more...
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DaySidebar
        date={selectedDate}
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        initialExpandedTaskId={initialExpandedTaskId}
      />
    </div>
  );
}
