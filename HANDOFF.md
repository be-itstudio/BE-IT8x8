# BE-IT 8x8 — your handover pack

Everything to run the 8x8 app as **your own asset**. None of Pete's accounts are involved —
you set up your own, and from then on it's 100% yours (your data, your hosting, your billing —
all free at this size).

## What the app is
A phone web-app for the 8x8 challenge. No app store — people open a link and tap "Add to Home
Screen". Members onboard themselves after paying, tick 8 daily habits, and see a shared
leaderboard. You (admin) manage members and export their details for Court.

It's three parts, and each becomes yours:
1. **The code** — this folder. Plain files, no build step.
2. **The database** — your own free **Supabase** (stores members + progress).
3. **The hosting** — your own free **Vercel** (puts it on a web address).

You'll also use **your own Claude Code** to make any changes. **You do NOT need Railway.**

---

## Setup — do this once (about 20–30 minutes)

> Easiest path: open this folder in **your Claude Code** and say *"set this up on my own Supabase
> and Vercel following HANDOFF.md."* It'll walk you through. Or do it by hand below.

### 1. Database (Supabase)
1. Go to **supabase.com**, sign up, create a new project (pick any password + a region near you).
2. Open the **SQL Editor** → **New query** → paste the whole of **`SETUP.sql`** → **Run**.
   (Builds the empty tables.)
3. Go to **Project Settings → API** and copy two things:
   - **Project URL** (like `https://abcd1234.supabase.co`)
   - **anon public** key (a long string)

### 2. Point the app at your database
Open **`config.js`** and paste those two values into the blank quotes at the top:
```
SUPABASE_URL: "https://abcd1234.supabase.co",
SUPABASE_ANON_KEY: "your-anon-public-key",
```
(The anon key is safe to be public — the database only allows what the app is meant to do.)

### 3. Put it online (Vercel)
1. Go to **vercel.com**, sign up.
2. Install the tool: in a terminal run `npm i -g vercel` (needs Node.js from nodejs.org).
3. In this folder run `vercel deploy --prod` and follow the prompts. You get a web address like
   `beit-8x8.vercel.app`. **That link is the app.**
   *(Optional: buy a domain and point it at Vercel for a custom URL.)*

### 4. Set your codes
In `config.js` (change these from the defaults, then redeploy):
- `OWNER_CODE` — your admin password (currently `beit8x8`).
- `JOIN_CODE` — the shared code members enter to sign up (currently `beit8x8`).

**After ANY change to any file, redeploy:** run `vercel deploy --prod` again.

---

## How it runs day to day

**Members joining (self-serve, after they pay):**
1. You send a paid client the app link + the join code.
2. They tap **"I've paid — join"**, enter the join code, fill the onboarding form
   (name, contact, height/weight/age/activity for Court, injuries, input choice, photo consent,
   8-week sign-off).
3. The app creates their account and gives them a **personal code** — that's how they log back in
   on any phone ("Find my account" + their code). It also logs them in on that phone straight away.
4. They build their becoming statement, pick their 3 habits (locks 11 Oct), then tick daily.

**You (admin)** — go to `your-url/?admin`, enter your owner code:
- Add members by hand (backup to self-serve), copy their links.
- **Edit any member's details**, reset someone's setup, or delete them.
- **Export CSV** — downloads everyone's details (height/weight/age/activity) for **Court to set macros.**

**Scoring** (all automatic): 10 points per habit tick (80/day), +200 a perfect week, +100 the
weekly socials-detox tick. Leaderboard ranks on total points; streak = perfect days in a row.

---

## Before you go live (important)
- The challenge dates are already set: **starts Mon 12 Oct, ends Sat 5 Dec** (in `config.js`).
- Members' links point at **your** web address — so only send real links once the app is live on
  **your** Vercel, not on any demo. (You start with an empty database — no members yet.)
- Change `OWNER_CODE` and `JOIN_CODE` from the defaults.

## Customising (all in these files, then redeploy)
- `config.js` — dates, the 5 fixed habits, the menu of 10, all the becoming-statement options,
  scoring numbers, your codes.
- `index.html` / `app.js` — wording and colours.
- `logo.png` / `tagline.png` / `icon.png` — the branding images.

## Files in here
`index.html`, `app.js`, `config.js`, `SETUP.sql`, `manifest.json`, `sw.js`,
`logo.png`, `tagline.png`, `icon.png`, `HANDOFF.md`.
