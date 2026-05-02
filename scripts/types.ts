// Canonical schema for Consensus 2026 baked data.
// Agents read these JSON files at query time; SKILL.md tells them the shape.

export interface BakedFile<T> {
  meta: {
    baked_at: string;          // ISO timestamp of the bake run
    schema_version: number;
    source_url: string;        // primary upstream
    source_label: string;      // human-readable
    record_count: number;
    notes?: string;
  };
  records: T[];
}

export interface SideEvent {
  /** Stable id derived from sha256(date|start_time|name|organizer). */
  id: string;
  /** ISO date YYYY-MM-DD in event-local timezone (Miami / ET). */
  date: string;
  /** Three-letter day, e.g. "Tue". Convenience. */
  day_of_week: string;
  /** 24h "HH:MM" in ET. May be null if upstream omits. */
  start_time: string | null;
  end_time: string | null;
  /** Full ISO with -04:00 offset (EDT — Miami in May). Null if start_time null. */
  start_iso: string | null;
  end_iso: string | null;
  /** Organizer name as listed by upstream. */
  organizer: string;
  /** Event name. */
  name: string;
  /** Free-form address as published. May be null. */
  address: string | null;
  /** Raw cost text (e.g. "Free", "$50", "€1700+"). */
  cost: string | null;
  /** Derived from cost — true if free / complimentary / null cost. */
  is_free: boolean;
  /** Normalized lowercase tag slugs, deduped. */
  tags: string[];
  /** RSVP / event link. */
  link: string | null;
  has_food: boolean;
  has_bar: boolean;
  /** Any extra note from the source. */
  note: string | null;
  /** Upstream source identifier. */
  source: "planwtf";
}

export interface SessionSpeaker {
  name: string;
  company: string;
  title: string;
  role: string;
}

export interface Session {
  /** CoinDesk session id (uppercase hex). */
  id: string;
  title: string;
  description_html: string | null;
  /** ISO date YYYY-MM-DD. */
  date: string;
  day_of_week: string;
  /** ISO datetime with -04:00 offset. */
  start_iso: string;
  end_iso: string;
  /** 24h "HH:MM" in ET. */
  start_time: string;
  end_time: string;
  duration_minutes: number;
  /** Short slug, e.g. "mainstage". */
  venue_slug: string;
  /** Display name, e.g. "Anchorage Digital Mainstage". */
  venue_name: string;
  /** Full venue name as CoinDesk shows it (with "MBCC:" prefix typically). */
  venue_full_name: string;
  /** Hex background color CoinDesk assigns to the venue, useful for UI. */
  venue_color: string | null;
  /** Track names this session belongs to. */
  tracks: string[];
  /** Topic tag titles (e.g. "Staking", "AI"). */
  tags: string[];
  speakers: SessionSpeaker[];
  /** Path on consensus.coindesk.com (e.g. "/agenda/event/-welcome-remarks-2"). */
  url: string;
  active: boolean;
  /** Upstream last-modified, useful for delta sync. */
  mdate: string | null;
}

export interface SpeakerIndex {
  name: string;
  /** Most-frequent company across their sessions. */
  company: string;
  /** Most-frequent title across their sessions. */
  title: string;
  session_count: number;
  /** Sorted by start_iso. */
  sessions: Array<{
    id: string;
    title: string;
    date: string;
    start_iso: string;
    venue_slug: string;
  }>;
}

export interface Venue {
  slug: string;
  name: string;
  full_name: string;
  color: string | null;
  /** Hand-curated approximate location. All MBCC venues share the same building lat/lng — kept here so the agent can do walking-time calcs against side events. */
  address: string;
  lat: number;
  lng: number;
  /** Human note for the agent (e.g. "Stage A on the convention floor — 5 min walk from Mainstage"). */
  note: string;
}
