# Consensus 2026 Launch — post copy + thread

Posted from Cooper's @ on X. Mirror to Farcaster + Telegram founder DMs at the same time.

**Recommended timing (per PRD):** Mon 2026-05-04 at 7:00 AM ET (peak crypto-Twitter activity, gives 24h surface area before Day 1).

---

## Option A — single-tweet (post this as the hero)

> your personal AI agent for consensus 2026.
>
> knows all 326 sessions across 9 stages.
> knows all 219 side events.
> asks what you care about. tells you where to be.
>
> free for the first 100 attendees → instaclaw.io/consensus

*(214 chars — fits one tweet with ~60 chars to spare for a short URL preview.)*

---

## Option B — thread (post this if you want surface area; 6 tweets)

**T1** *(same as Option A — anchors the thread, the rest are screenshot proof):*

> your personal AI agent for consensus 2026.
>
> knows all 326 sessions across 9 stages.
> knows all 219 side events.
> asks what you care about. tells you where to be.
>
> free for the first 100 attendees → instaclaw.io/consensus

**T2** — *attach screenshot of "what's happening at consensus tomorrow?" response*

> ask: "what's happening at consensus tomorrow?"
>
> ↓ knows monday is day 0. surfaces 46 side events instead of pretending the main agenda is open. flags the free-with-food ones first.

**T3** — *attach screenshot of "find me AI events on tuesday" response*

> ask: "find me AI events on tuesday."
>
> ↓ stitches main agenda + side events. cloudflare's stephanie cohen, coinbase's erik reppel, mastercard's raja rajamannar, animoca's yat siu, kraken's mayur gupta, all on tuesday.

**T4** — *attach screenshot of "who's speaking about DePIN?" response*

> ask: "who's speaking about DePIN?"
>
> ↓ honest. one dedicated session (geodnet + iotex + doublezero, wed 13:50 convergence). doesn't pad. redirects you to adjacent tracks with real coverage instead.

**T5** — *attach screenshot of 3-day itinerary response*

> ask: "build me a 3-day itinerary focused on AI and crypto infrastructure."
>
> ↓ 41 sessions, non-overlapping across 3 days. anchors marked: saylor keynote wed 16:40 ⭐⭐, adam back wed 11:00 ⭐, charles hoskinson wed 12:00 ⭐. don't skip those.

**T6** — *the close*

> data refreshes hourly through the conference week.
> runs as your private agent on its own VM, not a chatbot in someone else's app.
> remembers what you care about across sessions.
>
> free for the first 100 attendees: instaclaw.io/consensus

**T7 (optional, credit/attribution)**

> built on the public corpus — agenda data from @CoinDesk's official agenda pages, side events from @sheeetsxyz / plan.wtf. the agent itself is what we ship.

---

## Mirror posts (Farcaster + Telegram)

**Farcaster (post 6 hours after the X thread, with the same screenshots):**

> your personal AI agent for consensus 2026 — 326 sessions, 219 side events, 451 speakers indexed.
>
> ask in plain english. it knows the answer.
>
> free for the first 100 attendees → instaclaw.io/consensus

**Telegram founder DMs (5–10 friends attending Consensus, hand-sent):**

> hey [name], shipping a consensus agent this week — knows the full 326-session agenda + 219 side events, you can ask "where's the free dinner near brickell tuesday" or "build me a 3-day AI itinerary" and it just does it. claim it free at instaclaw.io/consensus, takes 30 seconds. pls hit me with feedback if you try it.

---

## Reply guy mode (Mon 7 AM ET → Tue all day)

For every "going to consensus?" / "anyone going to consensus?" tweet on Sunday/Monday, drop this one-liner:

> shipped an agent that knows all 326 sessions + 219 side events. free for the first 100 attendees. instaclaw.io/consensus

For "what should I do at consensus?" / "first time at consensus, what do I do?":

> ask my agent. it will literally tell you. instaclaw.io/consensus

---

## Day-of follow-ups (Tue–Thu, 8 AM ET each)

Use the agent's own output. Cooper sends a fresh prompt each morning, screenshots the response, posts it.

**Tue 8 AM ET:**
> day 1 of consensus. asked the agent what's worth showing up for at 9:30:
>
> ↓ [screenshot]
>
> the agent that goes to consensus with you: instaclaw.io/consensus

**Wed 8 AM ET:**
> day 2 of consensus. asked: "what's happening at 16:40 mainstage?"
>
> ↓ [screenshot — Saylor keynote panel]
>
> instaclaw.io/consensus

**Thu 8 AM ET:**
> day 3. asked: "what's the best free dinner tonight?"
>
> ↓ [screenshot]
>
> instaclaw.io/consensus

---

## Pinned reply on the hero tweet

For people who land on the post and want to know what makes this different from the CoinDesk app:

> the coindesk app gives you the agenda. this agent does the work you actually need done — picks talks for you, finds the free dinner, flags the conflicts, remembers you across sessions.
>
> 30s to claim, free for the first 100 attendees: instaclaw.io/consensus

---

## Stats to surface in replies (use as needed)

- **326 sessions** across 9 stages — Mainstage, Frontier, Convergence, Spotlight, Workshop, CoinDesk Live Studio, Hackathon, Deal Flow Zone, Meetups Area
- **219 side events** from plan.wtf, May 2–9 (afterparty week included)
- **451 speakers** indexed — searchable by name, company, or session
- **75 sessions** mention AI / agents in title or tags (the dominant theme)
- **41 of those** form a non-overlapping 3-day AI track itinerary
- **37 free events with food** on Tuesday alone
- **Refreshes every hour** through the conference week

---

## What Cooper still needs to capture (screenshots)

Cooper sends each of the 4 prompts to **@edgecitybot** (his vm-780, which has the consensus-2026 skill installed + bootstrapMaxChars=35000 + periodic-summary cron firing). Screenshots of each Telegram exchange go into T2–T5 of the thread.

The four prompts, verbatim:

1. *"what's happening at consensus tomorrow?"*
2. *"find me AI-focused events on tuesday"*
3. *"who's speaking about DePIN?"*
4. *"build me a 3-day itinerary focused on AI and crypto infrastructure"*

For the agent's expected response shape on each, see `MOCK_LAUNCH_RESPONSES.md` (same directory). Treat those as the "what good looks like" target — if a real Telegram response is materially weaker, ping me and we iterate on SKILL.md before posting.
