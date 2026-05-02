// Pure functions for shaping upstream data into the canonical schema.
// No I/O. Easy to spot-check.

import { createHash } from "node:crypto";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Convert plan.wtf time strings like "5:00p", "11:00a", "12:30p" to 24h "HH:MM". Returns null if unparseable. */
export function normalizeShortTime(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const m = raw.trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*([ap])\.?m?\.?$/);
  if (!m) return null;
  let h = parseInt(m[1]!, 10);
  const min = parseInt(m[2]!, 10);
  const meridian = m[3]!;
  if (h < 1 || h > 12 || min < 0 || min > 59) return null;
  if (meridian === "p" && h !== 12) h += 12;
  else if (meridian === "a" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** Build a Miami-local ISO with -04:00 (EDT — May is always EDT). Returns null if any input is null. */
export function buildLocalIso(date: string | null, time24: string | null): string | null {
  if (!date || !time24) return null;
  return `${date}T${time24}:00-04:00`;
}

/** "2026-05-05" → "Tue". */
export function dayOfWeekLabel(isoDate: string): string {
  // UTC interpretation is fine — we just need day-of-week and the date is anchored.
  const d = new Date(`${isoDate}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return "";
  return DAY_NAMES[d.getUTCDay()] || "";
}

/** Parse Google Sheets gviz `Date(YYYY,M,D)` (M is 0-indexed) → "YYYY-MM-DD". Returns null on failure. */
export function parseGvizDate(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;
  const m = raw.match(/^Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\)$/);
  if (!m) return null;
  const yyyy = parseInt(m[1]!, 10);
  const mm = parseInt(m[2]!, 10) + 1; // gviz is 0-indexed
  const dd = parseInt(m[3]!, 10);
  if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return null;
  return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
}

/** Split comma-separated tag string → lowercase slugs, trimmed, deduped. */
export function normalizeTags(raw: string | null | undefined): string[] {
  if (!raw || typeof raw !== "string") return [];
  const seen = new Set<string>();
  for (const part of raw.split(",")) {
    const t = part.trim();
    if (!t) continue;
    seen.add(t);
  }
  return Array.from(seen);
}

/** Heuristic: a cost string is "free" if missing or contains free/complimentary/$0/0.00. */
export function isFreeCost(raw: string | null | undefined): boolean {
  if (!raw) return true;
  const s = raw.trim().toLowerCase();
  if (!s) return true;
  if (/\bfree\b/.test(s)) return true;
  if (/\bcomplimentary\b/.test(s)) return true;
  if (/^\$?0+(\.0+)?$/.test(s)) return true;
  return false;
}

/** Stable id for a side event (gviz has none). */
export function eventId(date: string, startTime: string | null, name: string, organizer: string): string {
  const key = `${date}|${startTime ?? ""}|${name}|${organizer}`.toLowerCase();
  return createHash("sha256").update(key).digest("hex").slice(0, 16);
}

/** Coerce a value to boolean — gviz returns real booleans but defensive. */
export function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "1" || s === "yes";
  }
  return Boolean(v);
}

/** Compute minutes between two ISO datetimes. Returns 0 on failure. */
export function durationMinutes(startIso: string, endIso: string): number {
  const s = Date.parse(startIso);
  const e = Date.parse(endIso);
  if (Number.isNaN(s) || Number.isNaN(e)) return 0;
  return Math.max(0, Math.round((e - s) / 60_000));
}

/** Strip timezone offset → "HH:MM" local (CoinDesk gives ISO with -04:00 already). */
export function localTimeFromIso(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return "";
  return `${m[1]}:${m[2]}`;
}

/** "2026-05-05T09:30:00-04:00" → "2026-05-05" date portion. */
export function localDateFromIso(iso: string): string {
  return iso.slice(0, 10);
}
