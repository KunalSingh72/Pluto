import { format, parseISO, startOfDay, endOfDay } from "date-fns";

/**
 * Format a date string to a readable format
 * @param date - ISO date string
 * @param formatStr - date-fns format string
 * @returns Formatted date string
 */
export function formatDate(date: string, formatStr = "MMM d, yyyy"): string {
  try {
    return format(parseISO(date), formatStr);
  } catch {
    return date;
  }
}

/**
 * Get the start of day for a given date
 * @param date - Date object
 * @returns Start of day (00:00:00)
 */
export function getStartOfDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Get the end of day for a given date
 * @param date - Date object
 * @returns End of day (23:59:59)
 */
export function getEndOfDay(date: Date): Date {
  return endOfDay(date);
}

/**
 * Convert a date to ISO string format
 * @param date - Date object
 * @returns ISO date string
 */
export function toISOString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse an ISO date string to a Date object
 * @param dateStr - ISO date string
 * @returns Date object
 */
export function parseDate(dateStr: string): Date {
  return parseISO(dateStr);
}