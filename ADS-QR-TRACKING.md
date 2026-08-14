# Ad Operations — Mex Taco House Screens

Two tools, one database:

- **`/advertise/admin`** — the ad tracker. Who's running, what's open, what's expiring, who's waiting. Also where the renewal watch reports in.
- **`/advertise/stats`** — the scan report. What the QR codes are actually producing.
- **`/api/ads/cron`** — the daily job. Runs the renewal watch; nothing to visit by hand.

---

## QR scan tracking

Every ad in the rotation gets a QR code that points at **our** domain, not the
advertiser's. We count the scan, then forward the phone on. The guest notices
nothing; we get the one number that proves the screens work.

```
Guest scans QR  →  smartscaleagent.com/go/plumb  →  count it  →  riograndeplumbing.com
                                                    (~50ms)
```

---

## What this measures (and what it doesn't)

| Number | Where it comes from | Honest label |
|---|---|---|
| **Plays / impressions** | Rotation math — 18 slides × 10s, 20 plays/hour, ~4,800 plays a month | Guaranteed, not measured |
| **Ad views** | ~5,000 monthly guests × ~9 loops each ≈ 45,000 | Modelled estimate |
| **Scans** | This system | **Actually measured** |

Never call scans "impressions" on a report. Scans are the *response* number, and
they're worth far more precisely because they're real. Expect a low single-digit
percentage of viewers to scan — that's normal, and a single scan that turns into
a job pays for a month of the spot.

---

## One-time setup (about 10 minutes)

### 1. Turn on the database

The counter lives in Upstash Redis. Free tier is far more than enough.

1. Vercel dashboard → your project → **Storage** → **Create Database** → **Upstash Redis**
2. Name it `smart-scale-kv`, pick the region closest to Houston (`us-east-1`)
3. Connect it to the project and let it apply to **all environments**

Vercel injects the credentials automatically. The code accepts either naming:
`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`, or the `KV_REST_API_*`
pair. Nothing to copy by hand.

### 2. Set the report password

Vercel → **Settings** → **Environment Variables**:

```
ADS_STATS_KEY = <a long random string you make up>
```

Apply to all environments. Then redeploy.

Your report is at:

```
https://smartscaleagent.com/advertise/stats?key=<that key>
```

Bookmark that URL. Anyone with it can read the report, so treat it like a
password — don't paste it into a group chat.

### 3. Pull the credentials locally (optional)

To test on your machine: `vercel env pull .env.local`

---

## Adding an advertiser

1. Open `src/lib/ads/advertisers.ts` and add a block:

```ts
{
  code: "plumb",                                  // short — it's in the QR
  advertiser: "Rio Grande Plumbing",
  category: "Plumbing",
  destination: "https://riograndeplumbing.com",   // where the scan lands
  active: true,
  startedOn: "2026-09-01",
},
```

2. Generate the QR: `npm run qr` → writes `assets/qr/plumb.svg` and `.png`
3. Commit and push. Vercel deploys in about a minute.
4. **Scan the code with your own phone before it goes on screen.** Then add
   `?nolog=1` to the URL if you want to test again without polluting the count.
5. Drop the SVG into the slide artwork.

### Rules that matter

- **Never change a `code` once the ad is live.** The QR is already on screen.
  Changing the code turns every printed QR into a dead link.
- **To end a campaign**, set `active: false`. History is kept and late scans go
  to `/advertise` instead of an ex-client's site.
- **To change where an ad points** (new landing page, seasonal offer), edit
  `destination` and redeploy. The QR on screen keeps working — that's the whole
  point of owning the redirect.

---

## Reading the report

`/advertise/stats?key=…` shows, per advertiser:

- **Scans** for the last 7 / 30 / 90 days, today, and all time
- **Unique phones** — an estimate, so a guest scanning twice isn't counted twice
- **Scans per day** — hover any bar for the exact count; "View as table" for numbers
- **When people scan** — on the same 6a–2p axis as the Google popular-times chart
  on the sales page, so you can show the two side by side
- **Phone type** and the **latest scans** with city

All times are Houston time, so a day means a business day, not a UTC day.

### The advertiser also sees it independently

Each redirect appends `utm_source=mex-taco-house` to the destination. If the
advertiser has Google Analytics, our traffic shows up in *their* dashboard,
tagged, without them taking our word for anything. Mention this on the sales
call — it is unusually credible for in-store advertising.

---

## Designing the slide so it actually gets scanned

Scanning a TV from across a dining room is hard. What makes the difference:

- **Big.** The QR should be at least 15% of the slide width. Bigger is better.
- **Static.** Keep the QR on screen the whole 10 seconds — no fade-in.
- **High contrast.** Pure black on pure white, never on a photo or a color panel.
- **Keep the white border.** The quiet zone is part of the code.
- **Tell them why.** "Scan for 10% off" beats a bare code by a wide margin. A
  code with no reason attached gets ignored.
- **Short codes.** `plumb` makes a sparser, easier-to-scan code than
  `rio-grande-plumbing-houston`.

---

## Troubleshooting

**Report says "Scan counting is not switched on yet."**
The Upstash env vars aren't reaching the deployment. Check Vercel → Storage that
the database is connected to this project, then redeploy.

**Scans show 0 but the redirect works.**
That's the safe failure mode by design — the redirect never waits on the
counter. Same fix as above.

**A scan didn't register.**
Known crawlers and link previewers are filtered out. Also, some phones aggressively
cache; a second scan from the same phone within seconds may be served locally.

**Someone got the report URL.**
Change `ADS_STATS_KEY` in Vercel and redeploy. The old link stops working.

---

## Files

| File | What it does |
|---|---|
| `src/lib/ads/advertisers.ts` | The link registry — **the only file you edit routinely** |
| `src/lib/ads/scan-store.ts` | Counting and reading, over Upstash's REST API |
| `src/app/go/[code]/route.ts` | The redirect the QR points at |
| `src/app/(advertise)/advertise/stats/page.tsx` | The report |
| `scripts/make-qr.mjs` | `npm run qr` — print-ready SVG + PNG |

---

## The ad tracker (`/advertise/admin`)

The internal book of record for the rotation. Sign in once and the session lasts
30 days.

### Setup

Add one environment variable in Vercel alongside the ones above:

```
ADS_ADMIN_KEY = <a long passphrase you make up — different from ADS_STATS_KEY>
```

Redeploy, then go to **smartscaleagent.com/advertise/admin** and sign in. Give
Jay the same passphrase. Unlike the scan report, this page can *change* data, so
it uses a real login rather than a key in the URL — nothing sensitive ends up in
browser history or a screenshot.

### What it tracks

| | |
|---|---|
| **Advertisers** | Business, contact, category, package, start date, status, notes, and which QR code is theirs |
| **Packages** | Short Term (3mo/$500), Standard (6mo/$450), Annual (12mo/$375), plus Free Starter (internal only) |
| **End dates** | Calculated from the package term — you never type one. Month-end is handled correctly (a term starting Jan 31 ends Feb 28) |
| **Slots** | 16 sellable of the 18-slide loop. Open slots update as you add and end advertisers |
| **Categories** | Every locked category, listed. Two active advertisers cannot hold the same one — the form refuses and tells you who already has it |
| **Needs attention** | Anything ending within 60 days, plus anything whose end date has already passed, with a tap-to-call link |
| **Money** | Monthly revenue from active advertisers, and total left to invoice across current terms |
| **Interested list** | Businesses waiting on a slot or a category, ranked hot → contacted → new → passed |

### Day-to-day

- **New advertiser** → fill the form at the bottom. Category and start date are
  what matter; everything else can be filled in later.
- **Signed but artwork isn't ready** → status "Signed, not live yet". They don't
  consume a slot or count toward revenue until you set them to Running.
- **Term is up** → they renew (change the start date and package to the new
  term) or they don't (set status to Ended). Ended advertisers stay on the record
  and release their category.
- **Someone asks about advertising** → put them on the Interested list right
  then, with the category they want. When that category frees up you have a call
  list instead of a memory.

### Two things to know

**The QR field is a cross-reference, not the source of truth.** QR codes live in
`src/lib/ads/advertisers.ts` and stay in code on purpose — a code that's printed
and on a screen should be governed by something reviewed, not editable in a
browser. If you type a code here that isn't in that file, the tracker flags it in
red, because scanning it would fall through to the advertise page.

**Back it up.** The roster lives in Upstash's free tier. It is not a system of
record you'd trust a business to, and it's cheap insurance to keep a copy —
`exportRoster()` in `src/lib/ads/roster.ts` returns the whole thing as JSON. A
scheduled nightly export is worth adding before this holds real money.

### Files

| File | What it does |
|---|---|
| `src/lib/ads/roster.ts` | Advertisers, waitlist, term math, slot and category rules |
| `src/lib/ads/redis.ts` | Shared Upstash transport for the roster and the scan counters |
| `src/lib/ads/auth.ts` | Sign-in for the admin page |
| `src/app/(advertise)/advertise/admin/` | The tracker page and its save/delete actions |

---

## The renewal watch (daily alerts)

A term that lapses quietly costs a category and the revenue behind it. Every
morning a scheduled job walks the roster and texts the team as each advertiser
approaches the end of their term.

### When it fires

Per advertiser, once each: **30, 14, 7 and 3 days out**, on the **final day**,
and then again at **1, 7 and 21 days overdue** if the record is still marked
Running after its end date.

It picks the smallest threshold already reached rather than requiring an exact
match — so a morning the job doesn't run doesn't drop a warning, it just arrives
a day late. It also won't fire a stale 30-day notice when someone is 5 days out;
you get the 3-day one, which is the one that matters.

### Setup

Twilio is already configured for the contact form, so only two new variables:

```
ADS_ALERT_PHONES = 8324070773,+1832XXXXXXX      # you and Jay, comma-separated
CRON_SECRET      = <a long random string>
```

`CRON_SECRET` is what makes the daily job run at all. Vercel attaches it to
scheduled invocations automatically once the variable exists — and **without it
the endpoint refuses everything**, deliberately: an open URL that sends SMS is an
open URL that can run up a Twilio bill.

The schedule lives in `vercel.json` — `0 13 * * *`, which is 8am Central during
daylight saving (7am in winter). Vercel triggers daily crons within the hour, so
treat it as "some time in the 8 o'clock hour", not 8:00 sharp.

### Verify it works

After you deploy with those variables set, open `/advertise/admin` and check the
Renewal watch panel says **Armed** and lists the right last-four digits. Then
press **Run check now** and confirm the text actually arrives on both phones.
Do this once — a delivery problem you find by testing costs nothing, and one you
find because a renewal was missed costs a category.

If a Twilio trial account is still in use, recipient numbers must be verified in
the Twilio console first or sends will fail.

### How it behaves

- **A notice fires once.** The ledger keys on advertiser + term end date +
  threshold, so re-running the check is a no-op — but renew someone, and their
  new term gets a fresh set of notices automatically.
- **A failed send is not a lost warning.** Notices are only marked as sent once
  they've actually reached somebody. If Twilio is down, the check reports the
  failure and tries again tomorrow.
- **Run check now** does the same work on demand, and is logged as `manual` so
  it doesn't look like a scheduled run.
- The panel shows what's queued, what's coming and when, and the last ten checks.

### Troubleshooting

**Panel says "Not sending."** It names the missing variables. Set them and redeploy.

**Cron never runs.** `CRON_SECRET` isn't set, or the deployment predates
`vercel.json`. Check Vercel → your project → Cron Jobs; the last run and its
status code are listed there. A 401 means the secret is missing or mismatched.

**Alerts arrive but nobody acts on them.** That's Phase 3 — letting the
advertiser answer renew / change / cancel themselves.

### Files

| File | What it does |
|---|---|
| `src/lib/ads/renewals.ts` | Which notice is due, the message copy, the daily run |
| `src/lib/ads/notify.ts` | Twilio sending, the once-only ledger, the run log |
| `src/app/api/ads/cron/route.ts` | The scheduled endpoint |
| `vercel.json` | The schedule |
