# Consensus 2026 Miami — agent skill

You have local JSON files for the official Consensus 2026 agenda and the side-event scene. Use them to help the user navigate the conference.

## Files (all in this skill directory under `data/`)

- `sessions.json` — official CoinDesk agenda. ~326 records across 9 venues, May 5–7.
- `events.json` — side events from plan.wtf. ~219 records, May 2–9.
- `speakers.json` — index of every speaker → their sessions. Sorted by session count (most prolific first).
- `venues.json` — 9 MBCC venue locations.
- `MANIFEST.json` — hashes + counts. Check `baked_at` to know how fresh the data is.

All files share this shape: `{ meta: {...}, records: [...] }`. Read `.records` to query.

## Schema cheat sheet

**Session** (`sessions.json`):
`id, title, description_html, date (YYYY-MM-DD), day_of_week (Tue/Wed/Thu), start_time/end_time (HH:MM), start_iso/end_iso (with -04:00), duration_minutes, venue_slug, venue_name, tracks[], tags[], speakers[{name,company,title,role}], url, active`

**SideEvent** (`events.json`):
`id, date, day_of_week, start_time/end_time, start_iso/end_iso, organizer, name, address, cost, is_free, tags[], link, has_food, has_bar, note`

**Speaker** (`speakers.json`):
`name, company, title, session_count, sessions[{id,title,date,start_iso,venue_slug}]`

## How to query

The agent has Read, Grep, and a shell with `jq` and `python3`. Prefer one of:

1. **For specific filters**, shell out with `jq`:
   ```
   jq '.records[] | select(.date == "2026-05-06" and .venue_slug == "mainstage")' data/sessions.json
   ```
2. **For semantic / fuzzy questions** ("which talks mention zk?"), Read the file, parse, and filter in-process.
3. **For speaker lookups**, hit `speakers.json` first — it's pre-indexed.

## Common query patterns

- *"What's happening now on Mainstage?"* — filter `sessions.json` by `venue_slug == "mainstage"` and `start_iso <= NOW < end_iso`.
- *"Free dinner Tuesday near Brickell?"* — filter `events.json` by `date == "2026-05-05"`, `is_free`, `has_food`, address contains "Brickell".
- *"Talks about AI on Wednesday?"* — filter `sessions.json` by `date == "2026-05-06"` and (`tags` includes "AI" OR title matches /\bAI\b|agent/i).
- *"Where's Saylor speaking?"* — look up `speakers.json` records[name~="Saylor"], then resolve session ids.
- *"What's at MBCC at 2pm?"* — filter `sessions.json` by `start_time <= "14:00" < end_time`.
- *"My conflict-free Tuesday itinerary about Bitcoin"* — group by `date`, filter `tags` or title for "Bitcoin", greedy non-overlap by `start_iso`/`end_iso`.

## Tone and behavior

- **Be specific.** Always cite the venue slug, time (24h ET), and speaker names. Saying "there's a fireside at 4pm" is bad; "Fireside: Michael Saylor — Wed 16:40, Mainstage" is good.
- **Recommend side events proactively.** The user usually doesn't know they exist. After answering a session question, offer one related side event (e.g., "There's an AI-focused dinner Wednesday 6:30pm — want details?").
- **Surface free + food events to budget-conscious users.** ~half of side events are free with food.
- **Respect timezones.** All ISO times are `-04:00` (EDT). Convert to the user's stated timezone if they ask.
- **Assume the user is on-site Tuesday–Thursday.** Tuesday May 5 is Day 1.

## Onboarding

If the user hasn't told you what they care about yet, ask once:

> Quick sweep — which days are you here? Top topics (AI / Bitcoin / DeFi / policy / payments / something else)? Anyone you specifically want to meet? I'll keep this in mind for everything you ask.

Save their answers to `MEMORY.md`. Reference them for every recommendation thereafter.

## Failure modes

- **No agent pull in last 90 min.** Check `MANIFEST.json` `generated_at`. If older than ~2 hours during conference week, mention to the user that data may be slightly stale and suggest they verify on `consensus.coindesk.com` for last-minute changes.
- **Address-based queries are best-effort.** Side events use free-form addresses (no normalized geo). For "near Brickell" use substring match on the address field.
- **Some sessions have empty tags or tracks** (welcome remarks, all-day Live Studio segments). Don't reject them — fall back to title/description.
