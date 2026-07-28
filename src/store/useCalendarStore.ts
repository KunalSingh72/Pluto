import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RepeatOption = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type EventCategory = "none" | "work" | "personal" | "health" | "finance";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // Stored as YYYY-MM-DD
  repeat: RepeatOption;
  category: EventCategory;
  stopDate?: string; // Tracks when a recurring event was stopped
}

interface CalendarState {
  events: CalendarEvent[];
  
  // Actions
  addEvent: (title: string, date: string) => string;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  duplicateEvent: (id: string, newStartDate?: string) => void;
  stopEvent: (id: string, stopDate: string) => void;
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set) => ({
      events: [],

      addEvent: (title, date) => {
        const id = crypto.randomUUID();
        const newEvent: CalendarEvent = {
          id,
          title,
          date,
          repeat: "none",
          category: "none",
        };
        set((state) => ({ events: [...state.events, newEvent] }));
        return id;
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, ...updates } : event
          ),
        }));
      },

      deleteEvent: (id) => {
        set((state) => ({
          events: state.events.filter((event) => event.id !== id),
        }));
      },

      duplicateEvent: (id, newStartDate) => {
        set((state) => {
          const eventToCopy = state.events.find((e) => e.id === id);
          if (!eventToCopy) return state;

          const duplicatedEvent: CalendarEvent = {
            ...eventToCopy,
            id: crypto.randomUUID(),
            date: newStartDate || eventToCopy.date, // Starts on the new date if provided
            stopDate: undefined, // Reset stop date for the new duplicate
          };
          
          return { events: [...state.events, duplicatedEvent] };
        });
      },

      stopEvent: (id, stopDate) => {
        set((state) => ({
          events: state.events.map((event) =>
            event.id === id ? { ...event, stopDate } : event
          ),
        }));
      },
    }),
    {
      name: "pluto-calendar-storage",
    }
  )
);