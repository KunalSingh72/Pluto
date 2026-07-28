"use client";

import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Folder,
  RefreshCw,
  ChevronDown,
  Check,
  Ban,
} from "lucide-react";
import {
  useCalendarStore,
  EventCategory,
  RepeatOption,
  CalendarEvent,
} from "@/store/useCalendarStore";
import { SidePanel } from "@/components/shared/SidePanel";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getFormattedHeaderDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

// --- Repeating Event Logic ---
const isEventOnDate = (
  event: CalendarEvent,
  cellDate: Date,
  cellDateStr: string,
) => {
  // If the event was stopped, it should not render on any day AFTER the stopDate
  if (event.stopDate && cellDateStr > event.stopDate) return false;

  if (event.date === cellDateStr) return true;
  if (event.repeat === "none") return false;

  const [y, m, d] = event.date.split("-").map(Number);
  const eventStartDate = new Date(y, m - 1, d);

  const cDate = new Date(
    cellDate.getFullYear(),
    cellDate.getMonth(),
    cellDate.getDate(),
  ).getTime();
  const eDate = eventStartDate.getTime();

  if (cDate < eDate) return false;

  switch (event.repeat) {
    case "daily":
      return true;
    case "weekly":
      return cellDate.getDay() === eventStartDate.getDay();
    case "monthly":
      return cellDate.getDate() === eventStartDate.getDate();
    case "yearly":
      return (
        cellDate.getMonth() === eventStartDate.getMonth() &&
        cellDate.getDate() === eventStartDate.getDate()
      );
    default:
      return false;
  }
};

const categoryColors: Record<EventCategory, string> = {
  none: "bg-zinc-700 text-zinc-100",
  work: "bg-purple-500 text-white",
  personal: "bg-blue-500 text-white",
  health: "bg-green-500 text-white",
  finance: "bg-yellow-500 text-yellow-950",
};

const dotColors: Record<EventCategory, string> = {
  none: "bg-transparent border-2 border-zinc-600",
  work: "bg-purple-500 ring-4 ring-purple-500/20",
  personal: "bg-blue-500 ring-4 ring-blue-500/20",
  health: "bg-green-500 ring-4 ring-green-500/20",
  finance: "bg-yellow-500 ring-4 ring-yellow-500/20",
};

export default function CalendarPage() {
  const {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    duplicateEvent,
    stopEvent,
  } = useCalendarStore();
  const [mounted, setMounted] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const remainingCells = 42 - days.length;
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    return days;
  }, [currentMonth]);

  const nextMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  const prevMonth = () =>
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );

  const todayStr = formatDate(new Date());

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return events.filter((e) => isEventOnDate(e, dateObj, selectedDate));
  }, [events, selectedDate]);

  const handleAddNewEvent = () => {
    if (!selectedDate) return;
    const newId = addEvent("New Event", selectedDate);
    setExpandedEventId(newId);
  };

  const handleClosePanel = () => {
    setSelectedDate(null);
    setExpandedEventId(null);
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto px-2 relative">
      <div className="flex items-center justify-between mb-8 pt-2">
        <h2 className="text-4xl font-black tracking-tight text-transparent bg-clip-text bg-linear-to-br from-white to-purple-500 drop-shadow-sm">
          Calendar
        </h2>

        <div className="flex items-center gap-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-xl bg-[#121215] border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-lg font-bold min-w-35 text-center text-zinc-100">
            {currentMonth.toLocaleDateString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </span>

          <button
            onClick={nextMonth}
            className="p-2 rounded-xl bg-[#121215] border border-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#121215] border border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-zinc-800/80">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
            <div
              key={day}
              className="py-3 text-center text-xs font-bold text-zinc-500 tracking-widest border-r border-zinc-800/50 last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
          {calendarDays.map((dayObj, i) => {
            const dateStr = formatDate(dayObj.date);
            const isToday = dateStr === todayStr;
            const dayEvents = events.filter((e) =>
              isEventOnDate(e, dayObj.date, dateStr),
            );

            // Limit rendered events to prevent layout stretching
            const MAX_EVENTS = 2;
            const displayedEvents = dayEvents.slice(0, MAX_EVENTS);
            const hiddenCount = dayEvents.length - MAX_EVENTS;

            return (
              <div
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`relative p-2 border-r border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors cursor-pointer flex flex-col min-h-0
                  ${i % 7 === 6 ? "border-r-0" : ""} 
                  ${i >= 35 ? "border-b-0" : ""}
                `}
              >
                <div className="flex justify-start mb-1 shrink-0">
                  <span
                    className={`text-sm font-semibold flex items-center justify-center h-7 w-7 rounded-full
                    ${isToday ? "bg-purple-600 text-white shadow-md shadow-purple-900/40" : ""}
                    ${!isToday && dayObj.isCurrentMonth ? "text-zinc-200" : ""}
                    ${!isToday && !dayObj.isCurrentMonth ? "text-zinc-600" : ""}
                  `}
                  >
                    {dayObj.date.getDate()}
                  </span>
                </div>

                <div className="flex flex-col gap-1 overflow-hidden">
                  {displayedEvents.map((event) => (
                    <div
                      key={event.id}
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-md truncate shrink-0 ${categoryColors[event.category]}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <div className="text-[10px] font-semibold text-zinc-500 pl-1 mt-0.5 shrink-0">
                      + {hiddenCount} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SidePanel isOpen={!!selectedDate} onClose={handleClosePanel}>
        {selectedDate && (
          <div className="flex flex-col h-full">
            <div className="p-6 pb-4 border-b border-zinc-800/60 shrink-0">
              <h3 className="text-lg font-semibold text-zinc-100">
                {getFormattedHeaderDate(selectedDate)}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar flex flex-col gap-4">
              <button
                onClick={handleAddNewEvent}
                className="w-full py-3.5 border border-dashed border-zinc-700/80 text-zinc-400 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-800/50 hover:text-zinc-200 transition-colors hover:border-zinc-600 shrink-0"
              >
                <Plus className="h-4 w-4" /> Add New Event
              </button>

              <div className="flex flex-col gap-3 pb-8">
                {selectedDayEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    selectedDate={selectedDate}
                    isExpanded={expandedEventId === event.id}
                    onToggle={() =>
                      setExpandedEventId(
                        expandedEventId === event.id ? null : event.id,
                      )
                    }
                    updateEvent={updateEvent}
                    duplicateEvent={duplicateEvent}
                    deleteEvent={deleteEvent}
                    stopEvent={stopEvent}
                    closeExpanded={() => setExpandedEventId(null)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </SidePanel>
    </div>
  );
}

// --- Extracted Component ---
interface EventRowProps {
  event: CalendarEvent;
  isExpanded: boolean;
  selectedDate: string;
  onToggle: () => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  duplicateEvent: (id: string, newStartDate?: string) => void;
  deleteEvent: (id: string) => void;
  stopEvent: (id: string, stopDate: string) => void;
  closeExpanded: () => void;
}

function EventRow({
  event,
  isExpanded,
  selectedDate,
  onToggle,
  updateEvent,
  duplicateEvent,
  deleteEvent,
  stopEvent,
  closeExpanded,
}: EventRowProps) {
  // Show Stop button only if it's a repeating event being viewed on a date AFTER it was created, and hasn't been stopped yet.
  const isRecurrentAndFuture =
    event.repeat !== "none" && selectedDate > event.date;

  return (
    <div
      className={`border rounded-2xl overflow-hidden transition-all duration-300 ${isExpanded ? "bg-[#121215] border-zinc-800" : "bg-[#101012] border-transparent hover:border-zinc-800/60"}`}
    >
      {!isExpanded ? (
        <div
          onClick={onToggle}
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-zinc-900/50 transition-colors"
        >
          <div className="flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full ${dotColors[event.category]}`}
            />
            <span
              className={`text-sm font-medium ${event.title === "New Event" ? "text-zinc-500 italic" : "text-zinc-200"}`}
            >
              {event.title}
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </div>
      ) : (
        <div className="flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-zinc-800/80 flex items-center gap-4">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${dotColors[event.category]}`}
            />
            <input
              value={event.title}
              onChange={(e) => updateEvent(event.id, { title: e.target.value })}
              className="w-full bg-transparent text-lg font-bold text-zinc-100 outline-none placeholder:text-zinc-700"
              placeholder="Event Title"
              autoFocus
            />
          </div>

          <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center gap-3 text-zinc-400">
                <RefreshCw className="w-4 h-4" />{" "}
                <span className="text-sm font-medium">Repeat</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-semibold text-zinc-200 hover:text-white capitalize flex items-center gap-2 outline-none">
                  {event.repeat === "none" ? "Does not repeat" : event.repeat}{" "}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-zinc-900 border-zinc-800 rounded-xl w-48"
                >
                  {["none", "daily", "weekly", "monthly", "yearly"].map(
                    (opt) => (
                      <DropdownMenuItem
                        key={opt}
                        onClick={() =>
                          updateEvent(event.id, { repeat: opt as RepeatOption })
                        }
                        className="cursor-pointer capitalize text-zinc-300 focus:bg-zinc-800 flex items-center justify-between"
                      >
                        {opt === "none" ? "Does not repeat" : opt}
                        {event.repeat === opt && (
                          <Check className="h-4 w-4 text-purple-500" />
                        )}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-900/50 transition-colors">
              <div className="flex items-center gap-3 text-zinc-400">
                <Folder className="w-4 h-4" />{" "}
                <span className="text-sm font-medium">Category</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger className="text-sm font-semibold text-zinc-200 hover:text-white capitalize flex items-center gap-2 outline-none">
                  {event.category === "none" ? "No Category" : event.category}{" "}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-zinc-900 border-zinc-800 rounded-xl w-48"
                >
                  {["none", "work", "personal", "health", "finance"].map(
                    (cat) => (
                      <DropdownMenuItem
                        key={cat}
                        onClick={() =>
                          updateEvent(event.id, {
                            category: cat as EventCategory,
                          })
                        }
                        className="cursor-pointer capitalize text-zinc-300 focus:bg-zinc-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${dotColors[cat as EventCategory]}`}
                          />
                          {cat === "none" ? "No Category" : cat}
                        </div>
                        {event.category === cat && (
                          <Check className="h-4 w-4 text-purple-500" />
                        )}
                      </DropdownMenuItem>
                    ),
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          <div className="p-3 border-t border-zinc-800/80 bg-[#09090b] flex items-center justify-between rounded-b-xl gap-2 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => {
                duplicateEvent(event.id, selectedDate);
                closeExpanded();
              }}
              className="px-3 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg flex items-center gap-2 transition-colors shrink-0"
            >
              <Copy className="w-3.5 h-3.5" /> Duplicate
            </button>

            <div className="flex items-center gap-1 shrink-0">
              {isRecurrentAndFuture && !event.stopDate && (
                <ConfirmDialog
                  title="Stop Recurring Event?"
                  description="This event will stop repeating after today. Previous occurrences will remain on your calendar."
                  onConfirm={() => {
                    stopEvent(event.id, selectedDate);
                    closeExpanded();
                  }}
                  destructive
                >
                  <button className="px-3 py-1.5 text-xs font-medium text-orange-400/80 hover:text-orange-400 hover:bg-orange-950/40 rounded-lg flex items-center gap-2 transition-colors">
                    <Ban className="w-3.5 h-3.5" /> Stop
                  </button>
                </ConfirmDialog>
              )}

              <ConfirmDialog
                title="Delete Event?"
                description="Are you sure you want to remove this event from your calendar entirely?"
                onConfirm={() => deleteEvent(event.id)}
                destructive
              >
                <button className="px-3 py-1.5 text-xs font-medium text-red-400/80 hover:text-red-400 hover:bg-red-950/40 rounded-lg flex items-center gap-2 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </ConfirmDialog>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
