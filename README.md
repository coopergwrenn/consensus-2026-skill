# consensus-2026-skill

InstaClaw partner skill for **Consensus 2026 Miami** (May 5–7, 2026). Each tagged user gets an agent that answers questions about the official agenda and the side-event scene.

This repo is cloned to every `partner: consensus_2026` VM at `~/.openclaw/skills/consensus-2026/` and refreshed every 30 min by a cron. A GitHub Actions workflow re-bakes the data hourly through 2026-05-08.

## What's in here

| Path | Purpose |
|------|---------|
| `SKILL.md` | Agent-facing — read by the on-VM agent. Explains the data shape and query patterns. |
| `data/sessions.json` | Official Consensus agenda (~326 sessions × 9 venues × 3 days) baked from CoinDesk. |
| `data/events.json` | Side events (~219) baked from plan.wtf via Google Sheets gviz. |
| `data/speakers.json` | Derived speaker index — every unique speaker with the sessions they're in. |
| `data/venues.json` | Hand-curated list of MBCC venue locations (lat/lng, walking notes). |
| `data/MANIFEST.json` | Hashes + counts for the four files above. |
| `scripts/bake-*.ts` | Source-of-truth scrapers. Pure stdlib, zero runtime deps. |

## Running the bakers

```bash
# Bake everything (CI uses this)
node scripts/bake-all.ts

# Or one source at a time
node scripts/bake-events.ts
node scripts/bake-sessions.ts
```

Requirements: Node ≥ 24 (uses native TypeScript stripping). No `npm install` needed — there are no runtime deps.

## Validation thresholds

The bakers refuse to write if counts drop below historical floors:

- `events.json` ≥ 215 records (plan.wtf publishes ~219; below threshold means the upstream sheet was rotated or column-shifted)
- `sessions.json` ≥ 320 records (CoinDesk publishes ~326; below threshold means a venue page format changed)

A failed bake exits non-zero, GitHub Actions skips the commit, and the previous successful data stays live. We never push degraded data on top of good data.

## Sources

- **Side events:** `https://docs.google.com/spreadsheets/d/1xWmIHyEyOmPHfkYuZkucPRlLGWbb9CF6Oqvfl8FUV6k/gviz/tq?tqx=out:json&sheet=Consensus+Miami+2026` (resolved automatically from `https://plan.wtf/data` redirect; the fallback id above is the May 2 baseline).
- **Main agenda:** Server-rendered embedded JSON in each `https://consensus.coindesk.com/agenda/venue/-{slug}` page. Same custom CMS CoinDesk has used since 2024.

## Known characteristics

- **Mid-event drift is normal.** Side events get added daily; `sessions.json` `mdate` lets you spot CoinDesk's last-modified per session.
- **Free + food density.** Roughly half of side events are free, ~46% include food, ~47% include a bar. Plenty of breakfasts and dinners during the week.
- **The agenda is AI-heavy.** "AI" is the most-tagged topic (37 sessions), and 75 sessions mention AI/agents in title or tags.
- **Timezone: America/New_York (EDT, UTC−4) for May.** All ISO timestamps are anchored at `-04:00`.

## License / attribution

Data is republished from public sources for the duration of the event. Side-event data credit: [@sheeetsxyz](https://x.com/sheeetsxyz) / [plan.wtf](https://plan.wtf/consensus). Main agenda credit: CoinDesk.
