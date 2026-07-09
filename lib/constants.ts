export const STATUSES = [
  "Pending",
  "Packing In Progress",
  "Packing Finished",
  "Delivered",
] as const;

export type Status = (typeof STATUSES)[number];

export const STATUS_COLORS: Record<string, string> = {
  Pending: "bg-gray-200 text-gray-700",
  "Packing In Progress": "bg-yellow-200 text-yellow-800",
  "Packing Finished": "bg-blue-200 text-blue-800",
  Delivered: "bg-green-200 text-green-800",
};

export const ROLES = {
  ADMIN: "ADMIN",
  SALESMAN: "SALESMAN",
  WAREHOUSE_KEEPER: "WAREHOUSE_KEEPER",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  SALESMAN: "Salesman",
  WAREHOUSE_KEEPER: "Warehouse",
};

export function lpoCode(id: number) {
  return `INV-${String(id).padStart(4, "0")}`;
}

/**
 * Daily serial number: within each delivery date, invoices are numbered
 * 1, 2, 3... in the order they were created. So each day's list restarts at 1,
 * and the highest number = how many deliveries there are that day.
 */
export function computeDailySerials(
  rows: { id: number; deliveryDate: string }[]
): Record<number, number> {
  const byDate = new Map<string, number[]>();
  for (const r of rows) {
    const arr = byDate.get(r.deliveryDate) || [];
    arr.push(r.id);
    byDate.set(r.deliveryDate, arr);
  }
  const serials: Record<number, number> = {};
  for (const ids of byDate.values()) {
    ids.sort((a, b) => a - b);
    ids.forEach((id, i) => {
      serials[id] = i + 1;
    });
  }
  return serials;
}

/** Whole days from `fromStr` to `toStr` (both "YYYY-MM-DD"). */
export function daysBetween(fromStr: string, toStr: string) {
  const [y1, m1, d1] = fromStr.split("-").map(Number);
  const [y2, m2, d2] = toStr.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86400000);
}

// The business runs in the UAE. Compute "today" in Dubai time (UTC+4, no DST)
// regardless of where the server actually runs.
export const APP_TZ = "Asia/Dubai";

export function todayStr(offsetDays = 0) {
  const shifted = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(shifted);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** The exact instant a Dubai calendar day begins (for createdAt/updatedAt filters). */
export function dayStartInstant(dateStr: string) {
  return new Date(`${dateStr}T00:00:00+04:00`);
}

/** The UAE calendar date ("YYYY-MM-DD") that a timestamp falls on. */
export function dubaiDateKey(d: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

// A stored delivery date "YYYY-MM-DD" shown as dd/mm/yyyy
export function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// A timestamp shown in UAE time as "dd/mm/yyyy, h:mm AM/PM"
export function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}

// Just the UAE time, "h:mm AM/PM"
export function formatTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TZ,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
}
