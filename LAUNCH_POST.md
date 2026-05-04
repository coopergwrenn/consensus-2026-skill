# Consensus 2026 Launch — final post copy

**Final pairing chosen 2026-05-04:** brand post from @InstaClaw + personal QT from @cooper.

The brand account establishes the product with confident product voice + 4 screenshots.
The personal QT humanizes it with builder voice and creates a DM funnel for feedback.

---

## 1. BRAND POST — @InstaClaw account

Posts first. Attach 4 screenshots as a 2×2 grid.

> your AI agent for consensus 2026.
>
> 326 sessions. 219 side events. 451 speakers. every free dinner. every afterparty.
>
> ask in plain english. answers in seconds. lives in telegram.
>
> first 100 attendees free → instaclaw.io/consensus

**Screenshots to attach (in this order):**

1. *"where can i find free food tonight?"* — universal hook, the most shareable image
2. *"build me a 3-day itinerary focused on AI and crypto infrastructure"* — depth-of-capability proof
3. *"who's speaking about DePIN?"* — speaker filter / network alpha
4. *"what's at 9am tomorrow on mainstage?"* — daily-utility framing

**Pinned self-reply on the brand post** (post immediately after, then pin):

> coindesk's app gives you the agenda.
>
> ours gives you the agenda + 219 side events + an agent that learns what you care about, remembers you across sessions, and lives in telegram.
>
> 30 seconds to claim, free for first 100:
> instaclaw.io/consensus

---

## 2. PERSONAL QT — Cooper's account

Posts 5–10 minutes after the brand post. Quote-tweets the brand post above.

> shipped this over the weekend. wanted to find the free dinner without reading 219 event listings, so i built an agent that does it.
>
> turns out it's good at the rest of the conference too.
>
> first 100 attendees free. dm me if you try it.

---

## Posting sequence

1. **T+0:00** — @InstaClaw posts brand post + 4 screenshots
2. **T+0:01** — @InstaClaw posts the pinned reply, then pins it
3. **T+0:08** — Cooper QTs from personal account
4. **T+0:30** — Cooper starts reply-guy mode on "going to consensus?" tweets
5. **T+4:00** — Mirror to Farcaster (cast the brand post copy + lead screenshot)
6. **T+5:00** — Hand-send the Telegram founder DM to 5–10 friends attending

---

## Mirror posts

**Farcaster (post 4–6h after the X thread, with the same lead screenshot):**

> consensus week starts tomorrow.
>
> i scraped the full agenda this weekend — 326 sessions, 219 side events, 451 speakers — and built an agent on top of it. lives in telegram, knows where the free dinner is.
>
> first 100 free → instaclaw.io/consensus

**Telegram founder DMs (5–10 hand-sent to friends attending):**

> hey [name] — built a consensus agent this weekend. knows all 326 sessions + 219 side events, finds free food, builds itineraries from prompts. lives in telegram. claim takes 30s, free for first 100: instaclaw.io/consensus
>
> if you're going, would love your feedback — i'm shipping changes live through wed.

---

## Reply-guy mode (Mon 7am → Tue all day)

**For "going to consensus?" / "anyone going to consensus?":**

> just shipped an agent that knows all 326 sessions + 219 side events. finds free food. free for first 100 attendees → instaclaw.io/consensus

**For "first time at consensus, what do i do?":**

> ask my agent. it'll literally tell you. instaclaw.io/consensus

**For "best parties at consensus?":**

> that's the only thing my agent is good at → instaclaw.io/consensus

**For "what's worth seeing at consensus?":**

> built an agent that picks the talks for you based on what you care about. free for first 100 → instaclaw.io/consensus

---

## Day-of follow-ups (Tue–Thu, 8am ET each)

Use the agent's own output. Cooper sends a fresh prompt each morning, screenshots the response, posts it.

**Tue 8am ET:**
> day 1 of consensus. asked my agent what's worth showing up for at 9:30:
>
> ↓ [screenshot]
>
> the agent that goes to consensus with you → instaclaw.io/consensus

**Wed 8am ET:**
> day 2. asked: "what's happening at 16:40 mainstage?"
>
> ↓ [Saylor keynote panel screenshot]
>
> instaclaw.io/consensus

**Thu 8am ET:**
> day 3. asked: "what's the best free dinner tonight?"
>
> ↓ [screenshot]
>
> instaclaw.io/consensus

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

Cooper sends each of the 4 prompts to **@edgecitybot** (his vm-780, which has the consensus-2026 skill installed + bootstrapMaxChars=35000 + periodic-summary cron firing). Screenshots of each Telegram exchange go into the brand post as a 2×2 grid.

The four prompts, verbatim:

1. *"where can i find free food tonight?"*
2. *"build me a 3-day itinerary focused on AI and crypto infrastructure"*
3. *"who's speaking about DePIN?"*
4. *"what's at 9am tomorrow on mainstage?"*

For the agent's expected response shape on each, see `MOCK_LAUNCH_RESPONSES.md` (same directory). Treat those as the "what good looks like" target — if a real Telegram response is materially weaker, ping me and we iterate on SKILL.md before posting.
