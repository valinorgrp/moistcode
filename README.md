# Pipeline — Sales CRM (Phase 1)

A mobile-first sales dashboard: pipeline, quotes, follow-ups, and an AI quick-chat
for fast data entry. Built with Next.js (App Router), Tailwind, and Supabase.

## Phase 1 scope

- Dashboard: revenue (mtd), quotes sent (mtd), win rate, follow-ups due, pipeline by stage
- Leads (pipeline), Quotes, and Activities list/detail views
- Quick-add forms for leads, quotes, and activities
- AI quick-chat: type a natural-language update ("Just talked to Priya at Cascade,
  she wants a demo next Tuesday") and Claude drafts a structured lead/quote/activity
  for you to review and confirm before it's saved

Not yet built (next phases): voice-based logging, a sales calendar for
calls/meetings, and a broader chat-bot experience.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

**Demo mode by default.** Without Supabase credentials set, the app runs against
an in-memory sample dataset (seeded leads/quotes/activities) so you can try the
whole UI immediately. Data resets whenever the dev server restarts, and auth is
bypassed. This is only meant for local preview, not production use.

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

## Enabling the AI quick-chat

Set an Anthropic API key in `.env.local`:

```
ANTHROPIC_API_KEY=sk-ant-...
```

Without it, the chat still opens but returns a friendly "not configured" message.

## Project structure

```
src/app/(app)/            Authenticated app shell + pages (dashboard, leads, quotes, activities)
src/app/login, /signup    Auth pages
src/app/api/ai/parse      Claude tool-use endpoint for the quick-chat feature
src/components/           UI components, grouped by feature
src/lib/data/             Data access layer (Supabase-backed, with an in-memory
                           demo-mode fallback in mock-store.ts)
src/lib/dashboard.ts       Dashboard stat aggregation
supabase/migrations/       SQL schema
```
