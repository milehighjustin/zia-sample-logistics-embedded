/**
 * Pacific-time helpers for the dashboard's expedited cutoff.
 *
 * The backend buckets orders by Pacific calendar day (see taggedOrdersReport in
 * ziaback), so anything comparing "before 11am" only needs a wall-clock
 * comparison — no UTC offset math to get wrong across DST.
 */

export const PACIFIC_TZ = "America/Los_Angeles";

/** 11:00am, the expedited order cutoff, in minutes since midnight. */
export const EXPEDITED_CUTOFF_MINUTES = 11 * 60;

/**
 * Minutes since midnight in Pacific time, or null if the timestamp is missing or
 * unparseable.
 */
export function pacificMinutesSinceMidnight(iso?: string | null): number | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (isNaN(date.getTime())) return null;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PACIFIC_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const hour = Number(parts.find((p) => p.type === "hour")?.value);
  const minute = Number(parts.find((p) => p.type === "minute")?.value);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  return hour * 60 + minute;
}

/** True when an order was created before the 11:00am Pacific cutoff. */
export function createdBeforeExpeditedCutoff(createdAt?: string | null): boolean {
  const minutes = pacificMinutesSinceMidnight(createdAt);
  return minutes !== null && minutes < EXPEDITED_CUTOFF_MINUTES;
}

/**
 * Expedited orders that still need shipping and were created before the 11:00am
 * Pacific cutoff. Expects rows from `ops/shopifyOrdersByTagByDateByStatus`,
 * which is already scoped to the day and (with status=open) to open orders.
 */
export function countExpeditedToShip(orders: any[] | null | undefined): number {
  return (orders ?? []).filter((order: any) => {
    if (!createdBeforeExpeditedCutoff(order?.createdAt)) return false;
    return String(order?.fulfillmentStatus ?? "").toUpperCase() !== "FULFILLED";
  }).length;
}
