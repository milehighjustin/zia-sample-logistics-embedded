/**
 * Run with:  node lib/pacificTime.check.ts
 *
 * Guards the 11:00am Pacific expedited cutoff, which is easy to get wrong across
 * daylight saving time — and, more importantly, once the report behind the stat
 * spans more than one day. Uses node's built-in TypeScript support, so no test
 * framework is needed. Not imported by the app.
 */
// node's built-in type stripping needs the explicit .ts extension to run this
// file directly (tsconfig allows it via allowImportingTsExtensions).
import {
  addDaysToDayKey,
  addYearsToDayKey,
  countExpeditedToShip,
  createdBeforeExpeditedCutoff,
  pacificDayOf,
  pacificMinutesSinceMidnight,
  pacificToday,
} from "./pacificTime.ts";

let pass = 0;
let fail = 0;
function check(label: string, actual: any, expected: any) {
  const ok = actual === expected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  got=${actual} want=${expected}`);
}

// ---- wall-clock time of day (September is PDT, UTC-7) -----------------------
check("9:30am PDT", pacificMinutesSinceMidnight("2026-09-17T09:30:00-07:00"), 570);
check("10:59am PDT", pacificMinutesSinceMidnight("2026-09-17T10:59:00-07:00"), 659);
check("midnight PDT", pacificMinutesSinceMidnight("2026-09-17T00:05:00-07:00"), 5);
check("11:00am PDT is NOT before the cutoff", createdBeforeExpeditedCutoff("2026-09-17T11:00:00-07:00"), false);
check("11:01am PDT", createdBeforeExpeditedCutoff("2026-09-17T11:01:00-07:00"), false);
check("7:00am PDT given as UTC (14:00Z)", createdBeforeExpeditedCutoff("2026-09-17T14:00:00Z"), true);
check("12:00pm PDT given as UTC (19:00Z)", createdBeforeExpeditedCutoff("2026-09-17T19:00:00Z"), false);

// January is PST (UTC-8) — the cutoff must not drift with DST
check("9:00am PST given as UTC (17:00Z)", createdBeforeExpeditedCutoff("2026-01-15T17:00:00Z"), true);
check("11:00am PST given as UTC (19:00Z)", createdBeforeExpeditedCutoff("2026-01-15T19:00:00Z"), false);

check("garbage timestamp", createdBeforeExpeditedCutoff("not-a-date"), false);
check("missing timestamp", createdBeforeExpeditedCutoff(undefined), false);

// ---- which Pacific day a timestamp belongs to -------------------------------
check("UTC evening is still the previous Pacific day", pacificDayOf("2026-09-17T05:30:00Z"), "2026-09-16");
check("Pacific morning maps to the same day", pacificDayOf("2026-09-17T09:30:00-07:00"), "2026-09-17");
check("pacificToday() of an evening UTC instant", pacificToday(new Date("2026-09-17T05:30:00Z")), "2026-09-16");

// ---- day-key math (DST and leap-year safe) ----------------------------------
check("addDaysToDayKey across spring forward", addDaysToDayKey("2026-03-08", 1), "2026-03-09");
check("addDaysToDayKey across fall back", addDaysToDayKey("2026-11-01", 1), "2026-11-02");
check("addDaysToDayKey across a year boundary", addDaysToDayKey("2026-01-01", -1), "2025-12-31");
check("addYearsToDayKey a full year back", addYearsToDayKey("2026-09-17", -1), "2025-09-17");
check("addYearsToDayKey clamps Feb 29", addYearsToDayKey("2024-02-29", 1), "2025-02-28");

// ---- the stat itself, over a range that spans many days ---------------------
const ANCHOR = "2026-09-17";
const rows = [
  // today (PDT), before the cutoff -> counts
  { name: "#1", createdAt: "2026-09-17T08:00:00-07:00", fulfillmentStatus: "UNFULFILLED" },
  { name: "#2", createdAt: "2026-09-17T10:30:00-07:00", fulfillmentStatus: "PARTIALLY_FULFILLED" },
  { name: "#5", createdAt: "2026-09-17T10:59:00-07:00", fulfillmentStatus: "UNFULFILLED" },
  // today, already shipped -> does not count
  { name: "#3", createdAt: "2026-09-17T09:00:00-07:00", fulfillmentStatus: "FULFILLED" },
  // today, after the cutoff -> does not count (still a same-day rush to beat)
  { name: "#4", createdAt: "2026-09-17T13:00:00-07:00", fulfillmentStatus: "UNFULFILLED" },
  { name: "#6", createdAt: "2026-09-17T11:00:00-07:00", fulfillmentStatus: "UNFULFILLED" },
  // earlier days: overdue backlog, counted no matter what hour they arrived
  { name: "#7", createdAt: "2025-11-03T09:00:00-08:00", fulfillmentStatus: "UNFULFILLED" },
  { name: "#8", createdAt: "2025-11-03T14:00:00-08:00", fulfillmentStatus: "PARTIALLY_FULFILLED" },
  { name: "#9", createdAt: "2026-01-15T10:00:00-08:00", fulfillmentStatus: "UNFULFILLED" },
  { name: "#11", createdAt: "2026-09-16T11:28:16-07:00", fulfillmentStatus: "UNFULFILLED" },
  // earlier day but already shipped -> does not count
  { name: "#10", createdAt: "2026-01-15T10:00:00-08:00", fulfillmentStatus: "FULFILLED" },
  // no timestamp -> cannot be placed, does not count
  { name: "#12", createdAt: null, fulfillmentStatus: "UNFULFILLED" },
];
check("countExpeditedToShip over a year-long range", countExpeditedToShip(rows, ANCHOR), 7);
// The default anchor is today in Pacific, not the runtime's local day.
const todayKey = pacificToday();
check(
  "default anchor counts today before 11am",
  countExpeditedToShip([{ createdAt: `${todayKey}T09:00:00-07:00`, fulfillmentStatus: "UNFULFILLED" }]),
  1
);
check(
  "default anchor counts an older afternoon order",
  countExpeditedToShip([{ createdAt: "2020-06-01T14:00:00-07:00", fulfillmentStatus: "UNFULFILLED" }]),
  1
);
check("countExpeditedToShip(undefined)", countExpeditedToShip(undefined, ANCHOR), 0);
check("countExpeditedToShip([])", countExpeditedToShip([], ANCHOR), 0);

// A single-day range behaves exactly as it did before the range changed.
const sameDay = rows.filter((r) => String(r.createdAt ?? "").startsWith("2026-09-17"));
check("single-day range is unchanged", countExpeditedToShip(sameDay, ANCHOR), 3);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
