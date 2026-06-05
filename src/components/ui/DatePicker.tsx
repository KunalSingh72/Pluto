import { useState, useRef, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  addDays,
  parseISO,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";

interface DatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  className?: string;
  align?: "left" | "right"; // Added alignment property
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Set date",
  className = "",
  align = "left",
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    value ? parseISO(value) : new Date(),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedDate = value ? parseISO(value) : undefined;
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  const handleDateSelect = (date: Date) => {
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 px-3 py-2 bg-transparent hover:bg-background-main border border-transparent hover:border-border-subtle rounded-lg text-sm text-text-primary transition-all cursor-pointer outline-none"
        >
          <CalendarIcon className="w-4 h-4 text-text-secondary" />
          <span>
            {selectedDate ? format(selectedDate, "MMM d, yyyy") : placeholder}
          </span>
        </button>
        {value && (
          <button
            onClick={() => onChange(undefined)}
            className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1 w-72 bg-background-surface border border-border-subtle rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-text-primary">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-1.5 rounded-md hover:bg-background-main text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-1.5 rounded-md hover:bg-background-main text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <span key={d} className="text-xs font-medium text-text-secondary">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((date, idx) => {
              const isSelected = selectedDate && isSameDay(date, selectedDate);
              const isCurrentMonth = isSameMonth(date, currentMonth);
              const isToday = isSameDay(date, new Date());

              return (
                <button
                  key={idx}
                  onClick={() => handleDateSelect(date)}
                  className={`h-8 w-full rounded-md text-sm flex items-center justify-center transition-all cursor-pointer ${!isCurrentMonth ? "text-text-secondary/40" : "text-text-primary"} ${isSelected ? "bg-accent-primary text-white font-medium" : "hover:bg-background-main"} ${isToday && !isSelected ? "border border-accent-primary text-accent-primary" : "border border-transparent"}`}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
