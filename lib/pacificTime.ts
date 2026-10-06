/**
 * Pacific-time helpers for the dashboard's expedited cutoff.
 *
 * The 11:00am cutoff is a *same-day* idea — "did this order come in early enough
 * to ship today?" — so it is only ever applied to orders created on the anchor
 * day (today, in Pacific time). An order from an earlier day is overdue backlog:
 * it still needs shipping, so the hour it happened to arrive at is irrelevant
 * and must not exclude it.
 *
 * That distinction matters because the report behind this stat can span any
 * range (it currently runs a full year), and every timestamp in it belongs to a
 * different Pacific calendar day. Comparing wall-clock times alone — as this
 * used to — silently dropped every older order that arrived after 11am.
 *
 * The backend buckets orders by Pacific calendar day (see taggedOrdersReport in
 * ziaback), so everything here is done in Pacific wall-clock time — no UTC
 * offset math to get wrong across DST.
 */

export const PACIFIC_TZ = "America/Los_Angeles";

/** 11:00am, the expedited order cutoff, in minutes since midnight. */
export const EXPEDITED_CUTOFF_MINUTES = 11 * 60;

// Built once at module load: these run per order, and a year-long report is
// thousands of rows, so constructing a formatter per call is wasteful.
const PACIFIC_PARTS = new Intl.DateTimeFormat("en-US", {
  timeZone: PACIFIC_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

type PacificParts = { dayKey: string; minutesSinceMidnight: number };

/** Pacific day key (YYYY-MM-DD) and wall-clock time of day for an instant. */
function pacificPartsOf(date: Date): PacificParts | null {
  if (isNaN(date.getTime())) return null;
  const parts = PACIFIC_PARTS.formatToParts(date);
  const pick = (type: string) => parts.find((p) => p.type === type)?.value;
  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const hour = Number(pick("hour"));
  const minute = Number(pick("minute"));
  if (!year || !month || !day) return null;
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return { dayKey: `${year}-${month}-${day}`, minutesSinceMidnight: hour * 60 + minute };
}

function pacificParts(iso?: string | null): PacificParts | null {
  if (!iso) return null;
  return pacificPartsOf(new Date(iso));
}

/** Pacific calendar day (YYYY-MM-DD) a timestamp falls on, or null if invalid. */
export function pacificDayOf(iso?: string | null): string | null {
  return pacificParts(iso)?.dayKey ?? null;
}

/** "Today" in Pacific time — the shop's calendar day, not the viewer's. */
export function pacificToday(now: Date = new Date()): string {
  return pacificPartsOf(now)?.dayKey ?? "";
}

/**
 * Minutes since midnight in Pacific time, or null if the timestamp is missing or
 * unparseable. Day-agnostic: this is only ever the wall-clock time of day.
 */
export function pacificMinutesSinceMidnight(iso?: string | null): number | null {
  return pacificParts(iso)?.minutesSinceMidnight ?? null;
}

/**
 * True when a timestamp is before the 11:00am Pacific cutoff by wall clock.
 * Day-agnostic on purpose — callers that care *which* day it was (see
 * `countExpeditedToShip`) must check the day themselves.
 */
export function createdBeforeExpeditedCutoff(createdAt?: string | null): boolean {
  const minutes = pacificMinutesSinceMidnight(createdAt);
  return minutes !== null && minutes < EXPEDITED_CUTOFF_MINUTES;
}

/** Shift a YYYY-MM-DD day key by whole days (calendar-correct across DST). */
export function addDaysToDayKey(dayKey: string, days: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dayKey;
  const shifted = new Date(Date.UTC(y, m - 1, d) + days * 86_400_000);
  return shifted.toISOString().slice(0, 10);
}

/** Shift a YYYY-MM-DD day key by whole years, clamping Feb 29 to Feb 28. */
export function addYearsToDayKey(dayKey: string, years: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return dayKey;
  const targetYear = y + years;
  // Day 0 of the next month is the last day of this one.
  const daysInMonth = new Date(Date.UTC(targetYear, m, 0)).getUTCDate();
  const day = Math.min(d, daysInMonth);
  return `${String(targetYear).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isFulfilled(order: any): boolean {
  return String(order?.fulfillmentStatus ?? "").toUpperCase() === "FULFILLED";
}

/**
 * Expedited orders that still need shipping.
 *
 * `rows` are rows from `reports/shopifyOrdersByTagByDateByStatus` (any date
 * range — they do not have to share a day). An order counts when it is not
 * fully fulfilled and either:
 *
 *   - it was created on `anchorDay` (today, Pacific) before the 11:00am cutoff, or
 *   - it was created on an earlier day, in which case it is overdue and the
 *     cutoff does not apply.
 *
 * Partially fulfilled orders count: they still have pieces to ship. `anchorDay`
 * is injectable so this is testable without freezing the clock.
 */
export function countExpeditedToShip(
  rows: any[] | null | undefined,
  anchorDay: string = pacificToday()
): number {
  return (rows ?? []).filter((order: any) => {
    if (isFulfilled(order)) return false;
    const day = pacificDayOf(order?.createdAt);
    if (!day) return false;
    if (day !== anchorDay) return true;
    return createdBeforeExpeditedCutoff(order?.createdAt);
  }).length;
}
