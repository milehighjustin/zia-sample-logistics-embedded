/**
 * Run with:  node lib/pacificTime.check.ts
 *
 * Guards the 11:00am Pacific expedited cutoff, which is easy to get wrong across
 * daylight saving time. Uses node's built-in TypeScript support, so no test
 * framework is needed. Not imported by the app.
 */
// node's built-in type stripping needs the explicit .ts extension to run this
// file directly (tsconfig allows it via allowImportingTsExtensions).
import {
  createdBeforeExpeditedCutoff,
  countExpeditedToShip,
  pacificMinutesSinceMidnight,
} from "./pacificTime.ts";

let pass = 0;
let fail = 0;
function check(label: string, actual: any, expected: any) {
  const ok = actual === expected;
  if (ok) pass++;
  else fail++;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  got=${actual} want=${expected}`);
}

// September is PDT (UTC-7)
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

const orders = [
  { name: "#1", createdAt: "2026-09-17T08:00:00-07:00", fulfillmentStatus: "UNFULFILLED" }, // before cutoff, to ship
  { name: "#2", createdAt: "2026-09-17T10:30:00-07:00", fulfillmentStatus: "PARTIALLY_FULFILLED" }, // before cutoff, still needs shipping
  { name: "#3", createdAt: "2026-09-17T09:00:00-07:00", fulfillmentStatus: "FULFILLED" }, // already shipped
  { name: "#4", createdAt: "2026-09-17T13:00:00-07:00", fulfillmentStatus: "UNFULFILLED" }, // after the cutoff
  { name: "#5", createdAt: "2026-09-17T10:59:00-07:00", fulfillmentStatus: "UNFULFILLED" }, // before cutoff, to ship
  { name: "#6", createdAt: "2026-09-17T11:00:00-07:00", fulfillmentStatus: "UNFULFILLED" }, // exactly at the cutoff
];
check("countExpeditedToShip", countExpeditedToShip(orders), 3);
check("countExpeditedToShip(undefined)", countExpeditedToShip(undefined), 0);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
