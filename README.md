# Pipeline — Sales CRM

A mobile-first sales dashboard: pipeline, quotes, follow-ups, a calendar, and
an AI chat (typed or spoken) for fast data entry. Built with Next.js (App
Router), Tailwind, and Supabase.

## What's built

- Dashboard: revenue (mtd), quotes sent (mtd), win rate, follow-ups due, pipeline by stage
- Leads (pipeline), Quotes, and Activities list/detail views
- A sales calendar (month view) of calls/meetings/follow-ups by due date, with
  a tap-to-add flow that pre-fills the date
- Quick-add forms for leads, quotes, and activities
- AI quick-chat: type — or tap the mic and speak — a natural-language update
  ("Just talked to Priya at Cascade, she wants a demo next Tuesday") and
  Claude drafts a structured lead/quote/activity for you to review and
  confirm before it's saved

Voice logging reuses the same chat pipeline: the mic uses the browser's
built-in speech-to-text (Web Speech API — Chrome/Edge/Safari) to transcribe,
then feeds the transcript through the identical Claude parse → draft →
confirm flow as typed messages. No separate transcription service needed.

### Operations and teams (Phase 3)

- **Dispatch** — the day's jobs per tech with a live "now" line, a running-late
  alert, status colors (scheduled / in progress / done / running late), and an
  unscheduled tray. Tap a job to change its status, reassign or reschedule it.
- **Orders** — what's owed at a glance (total / paid / owed), filters for to
  fulfil, past due and unpaid, record a payment, create a job from an order,
  and select several orders to mark delivered at once.
- **Team** — shared workspaces so other people can use the CRM: add crew to
  the schedule, invite people by email with a role (Owner, Admin, Sales,
  Field Tech, Viewer), per-role settings, and an activity log of who changed
  what.

On phones the bottom bar is Dashboard · Pipeline · Dispatch · Orders · More;
Quotes, Activity, Calendar and Team live under More.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**Demo mode by default.** Without Supabase credentials set, the app runs
against a small JSON-file-backed sample dataset (seeded leads/quotes/
activities) at `.data/demo-store.json`, so you can try the whole UI
immediately — delete that file to reset it. Auth is bypassed in this mode.
This is only meant for local preview, not production use.

## Connecting a real database (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. In the Supabase SQL editor, run the migration in
   `supabase/migrations/0001_init.sql` — it creates the `leads`, `quotes`, and
   `activities` tables plus row-level security policies scoped to `auth.uid()`.
3. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
   Then run `supabase/migrations/0002_teams_and_ops.sql` as well (see
   "Upgrading an existing database" below).
4. Restart the dev server. You'll be redirected to `/login` — use `/signup` to
   create your first account (if your Supabase project has email confirmation
   enabled, confirm via the email link before signing in).

## Upgrading an existing database (teams, orders, jobs)

Run `supabase/migrations/0002_teams_and_ops.sql` in the Supabase SQL editor
after `0001_init.sql`. It:

- gives every existing account its own **workspace** with that account as
  **Owner**, and moves all of its leads, quotes and activities into it, so
  nothing is lost;
- adds `team_members`, `role_permissions`, `orders`, `jobs` and an
  append-only `audit_log`;
- replaces the "each user sees only their own rows" policies with
  workspace-based ones:

  | Role       | Can do                                                                 |
  |------------|------------------------------------------------------------------------|
  | Owner      | Everything, including the team, and is the only one who can add owners |
  | Admin      | Everything, including the team and role settings                       |
  | Sales      | Add and edit leads, quotes, activities, orders and jobs                |
  | Field Tech | See everything; update a job's status and notes (not reschedule it)    |
  | Viewer     | See everything, change nothing                                         |

  A workspace always keeps at least one owner.

**Inviting someone:** on the Team screen, add them with their email and a
role, then send them this site's `/signup` link yourself. When they sign up
with that email, they land in your workspace with that role. People added
without an email appear on the schedule but can't sign in.

The existing code that creates leads/quotes/activities (including
`/api/leads/inbound`) keeps working unchanged: a database trigger fills in
the creator's workspace.

The finer per-role settings on the Team screen (e.g. hide cost & margin from
field techs) are saved per workspace; the table above is what the database
enforces today.

In demo mode the new screens use a separate sample file,
`.data/demo-ops.json` — delete it to reset.

## Before going live (launch checklist)

| Item | Status |
|---|---|
| API keys hidden | Server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `LEAD_INTAKE_SECRET`) never reach the browser; `.env*` is git-ignored (see `.env.example` for names only) |
| HTTPS | Vercel redirects to HTTPS; `next.config.ts` adds HSTS plus anti-clickjacking and other security headers |
| Privacy / Terms | `/privacy` and `/terms`, linked from sign-in, sign-up and the menu. **Have a lawyer review them.** |
| Cookie banner | Not needed: only essential sign-in cookies, no tracking (explained in the privacy policy) |
| Favicon, titles, preview image | `app/icon.svg`, `apple-icon`, per-page titles, `opengraph-image` |
| Robots | Private app: `robots.txt` disallows everything and pages are `noindex`; no sitemap on purpose |
| Accessibility | WCAG 2.2 AA contrast, labelled controls, pinch-zoom allowed, Esc closes dialogs |
| 404 | `app/not-found.tsx` |
| Form validation / spam | Client checks + database constraints; sign-up honeypot; optional Cloudflare Turnstile; AI chat is sign-in only, rate-limited and size-capped |
| Analytics | Vercel Web Analytics (cookieless) loads automatically on Vercel once you enable it in the dashboard |
| Backups | See below |

### Bot protection (optional, recommended once sign-up is public)

1. Create a free Turnstile widget at dash.cloudflare.com for your domain.
2. Supabase → Authentication → Attack Protection → enable CAPTCHA → Turnstile → paste the **secret** key.
3. Vercel → Environment Variables → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the **site** key, then redeploy.

Also worth setting in Supabase → Authentication: a minimum password length of 8 (matches the sign-up form) and email confirmation on.

### Backups

- Check Supabase → Database → Backups for what your plan includes, and turn on
  Point-in-Time Recovery if you need to roll back to a specific minute. See
  [Supabase's backup docs](https://supabase.com/docs/guides/platform/backups).
- Whatever the plan, take your own copy before big changes (like running a
  migration): `supabase db dump --db-url "$DATABASE_URL" -f backup.sql`, and
  store it somewhere private. **Don't commit it:** it contains customer data.
- Test a restore once into a scratch project so you know it works.

### Time zone

The schedule renders in the business's time zone on the server, then switches
to the phone's clock. It defaults to `America/New_York`; set
`NEXT_PUBLIC_BUSINESS_TIME_ZONE` (e.g. `America/Chicago`) to change it.

## Enabling the AI quick-chat (typed and voice)

Set an Anthropic API key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without it, the chat still opens but returns a friendly "not configured" message.

Voice input needs no extra key — it only requires a browser with Web Speech
API support (Chrome, Edge, Safari) and microphone permission. Where it's
unsupported, the mic button is simply hidden and typing still works.

## Accepting leads from an external site (e.g. the marketing site)

`POST /api/leads/inbound` lets a trusted external system (like the
valinorgrpllc.com contact form) create a lead here without a logged-in user
session. It's a service-role endpoint gated by a shared secret, not part of
the normal per-user auth flow.

Set in `.env.local` (and in the hosting dashboard for production):

```
SUPABASE_SERVICE_ROLE_KEY=<service_role key from Supabase project settings — API>
LEAD_INTAKE_SECRET=<a long random string, shared with the calling site>
# CRM_OWNER_EMAIL=phil@valinorgrpllc.com   # optional, this is already the default
```

The `SUPABASE_SERVICE_ROLE_KEY` bypasses row-level security — keep it
server-side only, never expose it to the browser or commit it.

The endpoint expects:

```
POST /api/leads/inbound
Headers: x-lead-intake-secret: <LEAD_INTAKE_SECRET>
Body: { "name": "...", "email": "...", "phone": "...", "company": "...",
        "message": "...", "preferCall": true, "source": "Website" }
```

It looks up the CRM user matching `CRM_OWNER_EMAIL` via Supabase's admin API
and creates the lead under that account, with `message`/`preferCall` folded
into the lead's notes.

## Project structure

```
src/app/(app)/            Authenticated app shell + pages (dashboard, leads, quotes, activities, calendar)
src/app/login, /signup    Auth pages
src/app/api/ai/parse      Claude tool-use endpoint for the quick-chat feature (typed + voice)
src/app/api/demo/*        Demo-mode CRUD routes backing the JSON store (server-only)
src/components/           UI components, grouped by feature
src/components/calendar/  Month-grid calendar view + day detail sheet
src/components/ai-chat/   Chat drawer, draft confirmation card, voice input hook
src/components/ops/       Dispatch, Orders and Team screens (+ job sheet, shared bits)
src/lib/ops.ts            Pure helpers for dispatch/orders/roles (tested in ops.test.ts)
src/lib/data/ops.ts       Data access for workspaces, team, orders, jobs, audit log
src/lib/data/ops-store.ts Demo-mode store for the above (server-only)
src/lib/data/             Data access layer (Supabase-backed, with a demo-mode
                           fallback that talks to /api/demo/* — see mock-store.ts)
src/lib/dashboard.ts       Dashboard stat aggregation
src/lib/calendar.ts        Calendar month-grid date helpers
supabase/migrations/       SQL schema
```

## Not yet built

A broader standalone chatbot experience beyond quick-entry (e.g. answering
questions about your pipeline) is still open for a future phase.
