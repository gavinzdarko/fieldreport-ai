import { PAST_REPORTS } from "./sample-data";

export function nowIso() {
  return new Date().toISOString();
}

export function stableId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function sourceMarker(ref: string) {
  return `[SOURCE:${ref}]`;
}

export function sameJson(a: unknown, b: unknown) {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** Returns past report content as file-like objects (no filesystem). */
export function getSampleReportFiles() {
  return PAST_REPORTS.map((report, i) => ({
    file: `dui-${String(i + 1).padStart(3, "0")}.json`,
    content: JSON.stringify(report)
  }));
}
