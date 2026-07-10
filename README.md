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
4. Restart the dev server. You'll be redirected to `/login` — use `/signup` to
   create your first account (if your Supabase project has email confirmation
   enabled, confirm via the email link before signing in).

## Enabling the AI quick-chat (typed and voice)

Set an Anthropic API key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without it, the chat still opens but returns a friendly "not configured" message.

Voice input needs no extra key — it only requires a browser with Web Speech
API support (Chrome, Edge, Safari) and microphone permission. Where it's
unsupported, the mic button is simply hidden and typing still works.

## Project structure

```
src/app/(app)/            Authenticated app shell + pages (dashboard, leads, quotes, activities, calendar)
src/app/login, /signup    Auth pages
src/app/api/ai/parse      Claude tool-use endpoint for the quick-chat feature (typed + voice)
src/app/api/demo/*        Demo-mode CRUD routes backing the JSON store (server-only)
src/components/           UI components, grouped by feature
src/components/calendar/  Month-grid calendar view + day detail sheet
src/components/ai-chat/   Chat drawer, draft confirmation card, voice input hook
src/lib/data/             Data access layer (Supabase-backed, with a demo-mode
                           fallback that talks to /api/demo/* — see mock-store.ts)
src/lib/dashboard.ts       Dashboard stat aggregation
src/lib/calendar.ts        Calendar month-grid date helpers
supabase/migrations/       SQL schema
```

## Not yet built

A broader standalone chatbot experience beyond quick-entry (e.g. answering
questions about your pipeline) is still open for a future phase.
