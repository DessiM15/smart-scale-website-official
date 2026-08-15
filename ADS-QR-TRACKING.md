# Ad Operations — Mex Taco House Screens

Two tools, one database:

- **`/advertise/admin`** — the ad tracker. Who's running, what's open, what's expiring, who's waiting. Also where the renewal watch reports in.
- **`/advertise/stats`** — the scan report. What the QR codes are actually producing.
- **`/advertise/renew/…`** — where an advertiser answers a renewal email. Signed link, no login.
- **`/api/ads/cron`** — the daily job. Runs the renewal watch and drafts monthly reports; nothing to visit by hand.

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

## Making a QR code

All of this happens in the tracker at **/advertise/admin → QR codes**. No code
changes, no waiting on a developer.

1. **New QR code** → pick a short **code** (`plumb`), say what it's **for**, and
   paste the **web address** the scan should go to.
2. Optionally upload the client's **logo** — it goes in the middle of the code.
3. **Create QR code**, then download the **SVG** (best for print) or **PNG**.
4. On the advertiser's record, pick that code from the **QR code** dropdown.

**Scan the artwork with your own phone before it goes on a screen.** Every time.

### The rules, and why

- **The code is permanent.** `plumb` can never be reassigned to a different
  business, because it is printed and out in the world. Codes are retired, never
  deleted — a retired code still resolves, it just lands on the advertise page.
- **The destination is editable forever.** New landing page, seasonal offer,
  changed website — edit it and the printed code keeps working. That is the
  entire reason we own the redirect.
- **Tagging is on by default.** The link appends `utm_source=mex-taco-house`, so
  the advertiser sees this traffic in their own Google Analytics and does not
  have to take our word for the numbers.

### About logos

A logo covers about 22% of the code's middle. To survive that, the code switches
to the highest error-correction level, which makes it **denser** — more, smaller
squares.

That matters because these are scanned off a TV from across a room. A logo code
needs to be printed **larger** than a plain one to read from the same distance.
Tested down to 120px with blur and it still decodes, but give it room on the
slide.

Logos must be PNG, JPEG, WebP or SVG and under 200KB. Square, on a transparent or
white background, works best.

### If the database is down

`src/lib/ads/advertisers.ts` holds a small seed list that the redirect falls back
to, so `/go/<code>` keeps resolving during an outage. You do not need to edit it.

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

---

## Advertiser replies (renewal emails)

The renewal watch texts *you*. This is the other half: the advertiser gets an
email with three buttons — **Renew**, **Change my package**, **End my run** —
answers in one tap, and you get a text with their answer.

### Setup

Two more variables, plus DNS for the sending domain:

```
RESEND_API_KEY  = re_...            # resend.com — free tier covers this easily
ADS_LINK_SECRET = <a long random string>
ADS_FROM_EMAIL  = Smart Scale <ads@smartscaleagent.com>   # optional, this is the default
ADS_REPLY_TO    = you@yourdomain.com                       # optional
```

**Domain setup at Resend:** add the domain `smartscaleagent.com`, then add the
DKIM/SPF records it gives you to your DNS. Until the domain verifies, mail either
won't send or will land in spam. This is the only step that needs anything
outside Vercel.

`ADS_LINK_SECRET` signs the reply links. Change it and every link already sitting
in an advertiser's inbox stops working — so set it once and leave it alone.

The tracker's Renewal watch panel shows **Emailing advertisers** once both are
set, and **Advertiser email off** until then.

### When advertisers hear from us

**Three times, not eight** — at **30 days, 7 days, and the final day.** The
overdue nags stay internal; a customer whose term lapsed doesn't need a fourth
robot email, they need a phone call. And once someone replies, the emails stop
even if the next threshold comes around.

### How a reply works

1. They tap a button in the email.
2. They land on a page showing their business, when the term ends, and the three
   options with their choice pre-selected. **Nothing has been recorded yet.**
3. They confirm.
4. The answer is saved, and you and Jay get a text.
5. It appears at the top of the Renewal watch panel as **action needed**, with a
   **Mark handled** button once you've spoken to them.

**A reply never changes the rotation by itself.** An email tap is not a signed
contract and money is involved, so the roster only ever changes when a person
updates it in the tracker. "Renew" means *they want to* — you still confirm the
term and the invoice, then edit their record.

### Why confirmation is a second step

Mail scanners, corporate security filters, and link previewers all follow links
in email automatically. If tapping "End my run" recorded a cancellation
immediately, a spam filter could cancel a contract before the advertiser ever saw
the message. So the link only ever *shows* a page; recording requires a real
submit.

### The links

Each link is an HMAC over the advertiser and their current term end date. That
means:

- Unguessable, so no login is needed.
- Scoped to one decision — a link for one advertiser does nothing for another.
- **Self-expiring.** Renew someone and their term end changes, which kills every
  old link automatically. Expired links land on a friendly "give us a call" page
  that never explains why, and never leaks whether the advertiser exists.

### Files

| File | What it does |
|---|---|
| `src/lib/ads/links.ts` | Signing and verifying reply links |
| `src/lib/ads/email.ts` | Resend sending and the renewal email template |
| `src/lib/ads/responses.ts` | Storing, listing and clearing replies |
| `src/app/(advertise)/advertise/renew/[id]/` | The reply page and its action |

---

## Monthly reports

On the first of each month, every active advertiser with an email address and a
QR code gets a report **drafted** — scans, plays, how the month compared to the
last one, and a short paragraph of commentary written by Claude.

**Nothing sends on its own.** Drafts wait in the tracker under **Monthly
reports** until you read them and press **Approve & send**. You and Jay get a
text saying how many are waiting.

### Setup

```
ANTHROPIC_API_KEY = sk-ant-...
```

From **console.anthropic.com** → Settings → API Keys. You also need credit on
the account: Settings → Billing. $5 is the minimum and will last years at this
volume.

Without the key everything still works — reports are drafted with a plain
templated summary instead of written commentary. The tracker says which you're
getting.

### What it costs

About **20 reports a month**, roughly 1,500 tokens in and a few hundred out
each, on `claude-opus-5` at $5/$25 per million tokens. That is **well under $1 a
month** — realistically 30–65 cents. This is not a place to economise: a cheaper
model to save forty cents on a document you send a paying advertiser is a bad
trade.

### The rule that makes this safe

**Claude never produces a number.** Every figure in a report is measured or
computed in `report-data.ts` and injected into the template. Claude is given
those figures and writes commentary around them.

That is then *enforced*, not merely instructed: every number in the draft is
checked against the exact set of figures the model was shown. If it mentions
anything else — a percentage it worked out, a total it estimated, a year it
remembered — **the draft is thrown away** and replaced with the plain templated
summary. The tracker shows which reports fell back, and why.

Numbers inside words the model was shown are fine — "July 2026", "10am–11am", a
business called 911 Repo. The test is *"was it shown this number"*, not *"is it
a statistic"*.

### Reviewing a draft

Each card shows the real figures, the proposed wording, and whether Claude or
the fallback wrote it. You can **edit the wording in place** before sending —
edited text is marked as yours, not the model's.

- **Approve & send** — emails the advertiser and marks it sent.
- **Skip this one** — never sends; useful for someone who started mid-month.
- **Draft last month now** — generate on demand instead of waiting for the 1st.
  Safe to press twice; existing drafts are never overwritten or re-sent.

### Keep the approval step for a while

Read the first couple of months properly before trusting it. Once you have seen
it get the tone right several times, we can switch to sending automatically —
but a machine mailing something odd to a paying client on the first of the month
while nobody is looking is exactly the failure worth spending a minute a month
to avoid.

### Files

| File | What it does |
|---|---|
| `src/lib/ads/report-data.ts` | Every measured figure, and the set a narrative may use |
| `src/lib/ads/narrative.ts` | The Claude call, and the guard that rejects invented numbers |
| `src/lib/ads/reports.ts` | Drafts, edits, approval, sending |
| `src/lib/ads/email.ts` | The report email |
