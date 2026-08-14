# QR Scan Tracking — Mex Taco House Screens

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
