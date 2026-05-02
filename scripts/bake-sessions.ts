// Bake the official Consensus 2026 main agenda from CoinDesk's nine venue pages.
//
// CoinDesk runs a custom CMS — no public API, but every venue page server-renders
// three JSON blobs (one per conference day) of the form `{"data":[{...sessions...}]}`.
// We locate each blob by anchor and walk balanced braces (string-aware) to extract
// complete JSON. Multi-year-stable per the upstream research; we treat it as the
// canonical source through 2026-05-07 with the previous bake's data as fallback.
//
// Output: data/sessions.json + data/speakers.json (BakedFile shapes).

import { writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { fetchText } from "./fetch-utils.ts";
import {
  dayOfWeekLabel,
  durationMinutes,
  localDateFromIso,
  localTimeFromIso,
} from "./normalize.ts";
import type { BakedFile, Session, SessionSpeaker, SpeakerIndex } from "./types.ts";

// CoinDesk venue slugs — confirmed live on consensus.coindesk.com/agenda/.
const VENUES = [
  "mainstage",
  "convergence-stage",
  "frontier-stage",
  "spotlight-stage",
  "workshop-stage",
  "coindesk-live-studio",
  "hackathon",
  "deal-flow-zone",
  "meetups-area",
] as const;

const BASE = "https://consensus.coindesk.com";
const MIN_SESSIONS = 320;
const ALLOW_VENUE_FAILURES = 1; // tolerate one venue 404 without aborting the whole bake

function venueUrl(slug: string): string {
  return `${BASE}/agenda/venue/-${slug}`;
}

/** Anchor for the embedded JSON blobs. Each venue page has multiple — one per day. */
const BLOB_ANCHOR = '{"data":[{';

/**
 * Walk balanced braces from each anchor occurrence, respecting string and escape
 * boundaries. Returns the substring [start, endInclusive].
 */
function extractJsonBlobs(html: string): string[] {
  const blobs: string[] = [];
  let scan = 0;
  while (scan < html.length) {
    const start = html.indexOf(BLOB_ANCHOR, scan);
    if (start === -1) break;
    let depth = 0;
    let inString = false;
    let escaped = false;
    let i = start;
    let closed = false;
    for (; i < html.length; i++) {
      const ch = html[i];
      if (escaped) {
        escaped = false;
        continue;
      }
      if (ch === "\\") {
        escaped = true;
        continue;
      }
      if (inString) {
        if (ch === '"') inString = false;
        continue;
      }
      if (ch === '"') {
        inString = true;
        continue;
      }
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) {
          blobs.push(html.slice(start, i + 1));
          closed = true;
          break;
        }
      }
    }
    if (!closed) {
      // Anchor with no balanced close — bail to avoid infinite loop.
      console.warn(`[sessions] unterminated blob at offset ${start}`);
      break;
    }
    scan = i + 1;
  }
  return blobs;
}

interface RawSpeakerRef {
  ref?: string;
  firstname?: string;
  lastname?: string;
  company?: string;
  jobtitle?: string;
  role?: string;
}
interface RawSession {
  id?: string;
  title?: string;
  description?: string | null;
  date?: string;
  start_datetime?: string;
  end_datetime?: string;
  url?: string;
  active?: string;
  mdate?: string;
  venue?: string;
  venue_slug?: string;
  venue_name?: string;
  venue_full_name?: string;
  agenda_venue_id?: { background_color?: string };
  agenda_speaker_ref?: RawSpeakerRef[] | null;
  agenda_track_ref?: Array<{ name?: string }> | null;
  agenda_tag_ref?: Array<{ title?: string; group?: string }> | null;
}

function shapeSpeaker(r: RawSpeakerRef): SessionSpeaker {
  const name =
    r.ref?.trim() ||
    [r.firstname, r.lastname].filter(Boolean).join(" ").trim() ||
    "Unknown";
  return {
    name,
    company: (r.company ?? "").trim(),
    title: (r.jobtitle ?? "").trim(),
    role: (r.role ?? "Speaker").trim(),
  };
}

function shapeSession(s: RawSession, fallbackVenueSlug: string): Session | null {
  if (!s.id || !s.title || !s.start_datetime || !s.end_datetime) return null;
  const startIso = s.start_datetime;
  const endIso = s.end_datetime;
  const date = s.date || localDateFromIso(startIso);
  const venueSlug = s.venue || s.venue_slug || fallbackVenueSlug;

  return {
    id: s.id,
    title: s.title.trim(),
    description_html: s.description?.trim() || null,
    date,
    day_of_week: dayOfWeekLabel(date),
    start_iso: startIso,
    end_iso: endIso,
    start_time: localTimeFromIso(startIso),
    end_time: localTimeFromIso(endIso),
    duration_minutes: durationMinutes(startIso, endIso),
    venue_slug: venueSlug,
    venue_name: (s.venue_name ?? "").trim(),
    venue_full_name: (s.venue_full_name ?? "").trim(),
    venue_color: s.agenda_venue_id?.background_color ?? null,
    tracks: (s.agenda_track_ref ?? [])
      .map((t) => (t.name ?? "").trim())
      .filter(Boolean),
    tags: (s.agenda_tag_ref ?? [])
      .map((t) => (t.title ?? "").trim())
      .filter(Boolean),
    speakers: (s.agenda_speaker_ref ?? []).map(shapeSpeaker),
    url: s.url ?? "",
    active: (s.active ?? "Yes").toLowerCase() === "yes",
    mdate: s.mdate ?? null,
  };
}

async function fetchVenueSessions(slug: string): Promise<Session[]> {
  const url = venueUrl(slug);
  const html = await fetchText(url, { timeout: 25_000, retries: 2 });
  const blobs = extractJsonBlobs(html);
  if (blobs.length === 0) {
    throw new Error(`[sessions] ${slug}: zero JSON blobs found in HTML — page format may have changed`);
  }
  const sessions: Session[] = [];
  for (const blob of blobs) {
    let parsed: { data?: RawSession[] };
    try {
      parsed = JSON.parse(blob);
    } catch (err) {
      throw new Error(`[sessions] ${slug}: JSON parse failed for blob (${(err as Error).message})`);
    }
    for (const raw of parsed.data ?? []) {
      const s = shapeSession(raw, slug);
      if (s && s.active) sessions.push(s);
    }
  }
  console.log(`[sessions] ${slug.padEnd(22)} ${blobs.length} blobs, ${sessions.length} active sessions`);
  return sessions;
}

function dedupeById(sessions: Session[]): Session[] {
  const seen = new Map<string, Session>();
  for (const s of sessions) {
    const existing = seen.get(s.id);
    if (!existing || (s.mdate ?? "") > (existing.mdate ?? "")) seen.set(s.id, s);
  }
  return Array.from(seen.values());
}

function sortByStart(sessions: Session[]): Session[] {
  return sessions.sort((a, b) => {
    if (a.start_iso !== b.start_iso) return a.start_iso.localeCompare(b.start_iso);
    if (a.venue_slug !== b.venue_slug) return a.venue_slug.localeCompare(b.venue_slug);
    return a.title.localeCompare(b.title);
  });
}

function buildSpeakerIndex(sessions: Session[]): SpeakerIndex[] {
  const byName = new Map<
    string,
    {
      counts: Map<string, number>;
      titles: Map<string, number>;
      sessions: Array<{ id: string; title: string; date: string; start_iso: string; venue_slug: string }>;
    }
  >();

  for (const s of sessions) {
    for (const sp of s.speakers) {
      if (!sp.name || sp.name === "Unknown") continue;
      let entry = byName.get(sp.name);
      if (!entry) {
        entry = { counts: new Map(), titles: new Map(), sessions: [] };
        byName.set(sp.name, entry);
      }
      if (sp.company) entry.counts.set(sp.company, (entry.counts.get(sp.company) ?? 0) + 1);
      if (sp.title) entry.titles.set(sp.title, (entry.titles.get(sp.title) ?? 0) + 1);
      entry.sessions.push({
        id: s.id,
        title: s.title,
        date: s.date,
        start_iso: s.start_iso,
        venue_slug: s.venue_slug,
      });
    }
  }

  const pickTop = (m: Map<string, number>): string => {
    let best = "";
    let bestN = 0;
    for (const [k, n] of m) if (n > bestN) [best, bestN] = [k, n];
    return best;
  };

  return Array.from(byName.entries())
    .map(([name, e]) => ({
      name,
      company: pickTop(e.counts),
      title: pickTop(e.titles),
      session_count: e.sessions.length,
      sessions: e.sessions.sort((a, b) => a.start_iso.localeCompare(b.start_iso)),
    }))
    .sort((a, b) => {
      if (b.session_count !== a.session_count) return b.session_count - a.session_count;
      return a.name.localeCompare(b.name);
    });
}

export async function bakeSessions(): Promise<{
  sessions: BakedFile<Session>;
  speakers: BakedFile<SpeakerIndex>;
}> {
  const all: Session[] = [];
  const failures: Array<{ slug: string; err: string }> = [];
  for (const slug of VENUES) {
    try {
      const venueSessions = await fetchVenueSessions(slug);
      all.push(...venueSessions);
    } catch (err) {
      const msg = (err as Error).message;
      failures.push({ slug, err: msg });
      console.warn(`[sessions] ${slug} FAILED: ${msg}`);
    }
  }
  if (failures.length > ALLOW_VENUE_FAILURES) {
    throw new Error(
      `[sessions] ${failures.length} venue failures (max allowed ${ALLOW_VENUE_FAILURES}): ` +
        failures.map((f) => f.slug).join(", "),
    );
  }

  const sessions = sortByStart(dedupeById(all));
  if (sessions.length < MIN_SESSIONS) {
    throw new Error(
      `[sessions] count ${sessions.length} below threshold ${MIN_SESSIONS} — refusing to write.`,
    );
  }

  const speakers = buildSpeakerIndex(sessions);
  const now = new Date().toISOString();

  return {
    sessions: {
      meta: {
        baked_at: now,
        schema_version: 1,
        source_url: `${BASE}/agenda/venue/-{slug} × ${VENUES.length} venues`,
        source_label: "Consensus 2026 Miami official agenda (CoinDesk)",
        record_count: sessions.length,
        notes: failures.length
          ? `Soft failures (${failures.length}): ${failures.map((f) => f.slug).join(", ")}`
          : "All venues fetched cleanly.",
      },
      records: sessions,
    },
    speakers: {
      meta: {
        baked_at: now,
        schema_version: 1,
        source_url: "derived from sessions.json agenda_speaker_ref entries",
        source_label: "Speaker index — derived",
        record_count: speakers.length,
      },
      records: speakers,
    },
  };
}

async function main(): Promise<void> {
  const { sessions, speakers } = await bakeSessions();
  const here = dirname(fileURLToPath(import.meta.url));
  const outDir = `${here}/../data`;
  await mkdir(outDir, { recursive: true });
  await writeFile(`${outDir}/sessions.json`, JSON.stringify(sessions, null, 2) + "\n", "utf8");
  await writeFile(`${outDir}/speakers.json`, JSON.stringify(speakers, null, 2) + "\n", "utf8");

  console.log(`[sessions] wrote ${sessions.records.length} sessions, ${speakers.records.length} speakers`);

  // Spot-check log
  const sample = sessions.records.slice(0, 3);
  for (const s of sample) {
    const sp = s.speakers.length ? `(${s.speakers.length} speakers)` : "";
    console.log(`  ${s.date} ${s.day_of_week} ${s.start_time} ${s.venue_slug.padEnd(20)} | ${s.title} ${sp}`);
  }
  console.log(`  ...`);
  const last = sessions.records.at(-1)!;
  console.log(
    `  ${last.date} ${last.day_of_week} ${last.start_time} ${last.venue_slug.padEnd(20)} | ${last.title}`,
  );
  console.log(
    `[sessions] top 3 speakers by session count: ` +
      speakers.records
        .slice(0, 3)
        .map((s) => `${s.name} (${s.session_count})`)
        .join(", "),
  );
}

const isEntry = process.argv[1] && import.meta.url === `file://${process.argv[1]}`;
if (isEntry) {
  main().catch((err) => {
    console.error(`[sessions] FAIL: ${(err as Error).message}`);
    process.exitCode = 1;
  });
}
