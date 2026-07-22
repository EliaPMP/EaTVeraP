/**
 * useActivityLog — stores steps and calories burned per day in localStorage.
 * Key: "eatclean-activity-log"
 * Shape: Record<string, { steps: number; burned: number }>
 * where key is ISO date string "YYYY-MM-DD"
 */

const STORAGE_KEY = "eatclean-activity-log";

export interface DayActivity {
  steps: number;
  burned: number;
}

type ActivityLog = Record<string, DayActivity>;

function toKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function loadLog(): ActivityLog {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as ActivityLog;
  } catch {
    return {};
  }
}

function saveLog(log: ActivityLog): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {}
}

export function getActivity(date: Date): DayActivity {
  const log = loadLog();
  return log[toKey(date)] ?? { steps: 0, burned: 0 };
}

export function setActivity(date: Date, data: Partial<DayActivity>): void {
  const log = loadLog();
  const key = toKey(date);
  log[key] = { ...({ steps: 0, burned: 0 }), ...(log[key] ?? {}), ...data };
  saveLog(log);
}

export function getWeekActivity(startDate: Date): DayActivity[] {
  const log = loadLog();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return log[toKey(d)] ?? { steps: 0, burned: 0 };
  });
}
