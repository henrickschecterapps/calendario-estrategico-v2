import { parseISO, isValid } from "date-fns";

/**
 * Parses event date strings in multiple formats:
 * - ISO format: '2026-04-21'
 * - BR format: '21/04/2026'
 * Returns null if the string is invalid or empty.
 */
export function parseEventStringDate(dataStr: string): Date | null {
  if (!dataStr) return null;

  // ISO format (yyyy-MM-dd)
  if (dataStr.includes('-')) {
    const d = parseISO(dataStr);
    return isValid(d) ? d : null;
  }

  // BR format (dd/mm/yyyy)
  if (dataStr.includes('/')) {
    const [day, month, year] = dataStr.split('/');
    if (!year) return null;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
  }

  return null;
}

/**
 * Checks if an event date is in the past relative to today.
 */
export function isEventPast(dataStr: string, status?: string): boolean {
  if (status?.toLowerCase() === 'concluído') return true;

  const d = parseEventStringDate(dataStr);
  if (!d) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const check = new Date(d);
  check.setHours(0, 0, 0, 0);

  return check.getTime() < today.getTime();
}

/**
 * Formats a date string (ISO or BR) to a standard BR format (dd/mm/aaaa).
 */
export function formatToBRDate(dataStr: string | undefined | null): string {
  if (!dataStr) return '—';
  const d = parseEventStringDate(dataStr);
  if (!d) return dataStr;
  
  // Manual format to avoid timezone issues with toLocaleDateString in some environments
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

