// Bake side events from plan.wtf (Google Sheets gviz endpoint).
//
// Why two-step source resolution: plan.wtf/data is a 307 redirect to whichever
// Google Sheet currently powers the site. We follow the redirect at bake time
// so that if the maintainers rotate sheets, we pick up the new id automatically.
//
// Output: data/events.json (BakedFile<SideEvent>).

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./fetch-utils.ts";
import {
  parseGvizDate,
  normalizeShortTime,
  buildLocalIso,
  dayOfWeekLabel,
  normalizeTags,
  isFreeCost,
  eventId,
  toBool,
} from "./normalize.ts";
import type { BakedFile, SideEvent } from "./types.ts";

const SHEET_ID_FALLBACK = "1xWmIHyEyOmPHfkYuZkucPRlLGWbb9CF6Oqvfl8FUV6k";
const SHEET_TAB = "Consensus Miami 2026";
const PLAN_WTF_REDIRECT = "https://plan.wtf/data";

// Hard threshold — if we get fewer than this, something is wrong upstream
// and we should fail loudly so CI doesn't commit a regression.
const MIN_EVENTS = 215;

// Date window: Miami Consensus + side events orbit the conference; we accept
// anything in May 2026 (broad enough to catch warm-up and afterparties).
const WINDOW_YEAR = 2026;
const WINDOW_MONTH = 5;

interface GvizRow {
  c: Array<{ v?: unknown; f?: unknown } | null>;
}
interface GvizPayload {
  status: string;
  table: { rows: GvizRow[]; cols: unknown[] };
}

async function resolveSheetId(): Promise<string> {
  // Best-effort: if redirect resolution fails, fall back to the known id.
  try {
    const html = await fetchText(PLAN_WTF_REDIRECT, { timeout: 10_000, retries: 1 });
    const m = html.match(/spreadsheets\/d\/([a-zA-Z0-9_-]{20,})/);
    if (m && m[1]) return m[1];
  } catch (err) {
    console.warn(`[events] redirect resolution failed, using fallback: ${(err as Error).message}`);
  }
  return SHEET_ID_FALLBACK;
}

function gvizUrl(sheetId: string, tab: string): string {
  const t = encodeURIComponent(tab);
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${t}`;
}

function unwrapJsonp(raw: string): GvizPayload {
  // gviz returns: /*O_o*/\ngoogle.visualization.Query.setResponse({...});
  const m = raw.match(/^[^(]*\((.*)\)\s*;?\s*$/s);
  if (!m) throw new Error("gviz response did not match JSONP wrapper");
  const parsed = JSON.parse(m[1]!);
  if (parsed.status !== "ok") {
    throw new Error(`gviz status not ok: ${parsed.status} — ${parsed?.errors?.[0]?.detailed_message ?? ""}`);
  }
  return parsed;
}

function rowToEvent(row: GvizRow): SideEvent | null {
  const c = row.c ?? [];
  // Positional access — column labels are bloated with ad text in this sheet
  // (see CLAUDE.md / PRD). Position is the spec.
  const dateRaw = c[0]?.v as string | undefined;
  const date = parseGvizDate(dateRaw ?? null);
  if (!date) return null;
  // Drop anything outside our event window.
  const [yyyy, mm] = date.split("-").map((n) => parseInt(n, 10));
  if (yyyy !== WINDOW_YEAR || mm !== WINDOW_MONTH) return null;

  const name = (c[4]?.v as string | undefined)?.trim();
  if (!name) return null; // unnamed rows are spreadsheet noise

  const organizer = ((c[3]?.v as string | undefined) ?? "").trim();
  const startTime = normalizeShortTime(c[1]?.v as string | undefined);
  const endTime = normalizeShortTime(c[2]?.v as string | undefined);
  const address = ((c[5]?.v as string | undefined) ?? "").trim() || null;
  const costRaw = ((c[6]?.v as string | undefined) ?? "").trim() || null;
  const tagsRaw = (c[7]?.v as string | undefined) ?? null;
  const link = ((c[8]?.v as string | undefined) ?? "").trim() || null;
  const hasFood = toBool(c[9]?.v);
  const hasBar = toBool(c[10]?.v);
  const note = ((c[11]?.v as string | undefined) ?? "").trim() || null;

  return {
    id: eventId(date, startTime, name, organizer),
    date,
    day_of_week: dayOfWeekLabel(date),
    start_time: startTime,
    end_time: endTime,
    start_iso: buildLocalIso(date, startTime),
    end_iso: buildLocalIso(date, endTime),
    organizer,
    name,
    address,
    cost: costRaw,
    is_free: isFreeCost(costRaw),
    tags: normalizeTags(tagsRaw),
    link,
    has_food: hasFood,
    has_bar: hasBar,
    note,
    source: "planwtf",
  };
}

function dedupe(events: SideEvent[]): SideEvent[] {
  const seen = new Map<string, SideEvent>();
  for (const e of events) {
    if (!seen.has(e.id)) seen.set(e.id, e);
  }
  return Array.from(seen.values());
}

function sortEvents(events: SideEvent[]): SideEvent[] {
  return events.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    const at = a.start_time ?? "99:99";
    const bt = b.start_time ?? "99:99";
    if (at !== bt) return at.localeCompare(bt);
    return a.name.localeCompare(b.name);
  });
}

export async function bakeEvents(): Promise<BakedFile<SideEvent>> {
  const sheetId = await resolveSheetId();
  const url = gvizUrl(sheetId, SHEET_TAB);
  console.log(`[events] fetching ${url}`);
  const raw = await fetchText(url, { timeout: 20_000, retries: 2 });
  const payload = unwrapJsonp(raw);
  const totalRows = payload.table.rows.length;
  console.log(`[events] gviz returned ${totalRows} rows`);

  const events: SideEvent[] = [];
  let dropped = 0;
  for (const row of payload.table.rows) {
    const ev = rowToEvent(row);
    if (ev) events.push(ev);
    else dropped++;
  }
  const deduped = sortEvents(dedupe(events));
  console.log(`[events] kept ${deduped.length}, dropped ${dropped} (header/ad/out-of-window/unnamed)`);

  if (deduped.length < MIN_EVENTS) {
    throw new Error(
      `[events] count ${deduped.length} below threshold ${MIN_EVENTS} — refusing to write. ` +
        `This usually means the sheet schema changed or upstream is broken.`,
    );
  }

  return {
    meta: {
      baked_at: new Date().toISOString(),
      schema_version: 1,
      source_url: url,
      source_label: "plan.wtf — Consensus Miami 2026 (Google Sheets gviz)",
      record_count: deduped.length,
      notes: `${totalRows} raw rows from gviz, ${dropped} filtered (header/ad/out-of-window/unnamed), ${deduped.length} retained.`,
    },
    records: deduped,
  };
}

async function main(): Promise<void> {
  const baked = await bakeEvents();
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = `${here}/../data`;
  await mkdir(outDir, { recursive: true });
  const outPath = `${outDir}/events.json`;
  await writeFile(outPath, JSON.stringify(baked, null, 2) + "\n", "utf8");
  console.log(`[events] wrote ${baked.records.length} events → ${outPath}`);

  // Spot-check log: first three records, last record. Eyeball-friendly.
  const first = baked.records.slice(0, 3);
  const last = baked.records.at(-1)!;
  for (const e of first) {
    console.log(`  ${e.date} ${e.day_of_week} ${e.start_time ?? "??:??"} | ${e.organizer} | ${e.name}`);
  }
  console.log(`  ...`);
  console.log(`  ${last.date} ${last.day_of_week} ${last.start_time ?? "??:??"} | ${last.organizer} | ${last.name}`);
}

const isEntry = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
  main().catch((err) => {
    console.error(`[events] FAIL: ${(err as Error).message}`);
    process.exitCode = 1;
  });
}
