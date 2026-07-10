-- Sales CRM schema (Phase 1)
-- Run this in the Supabase SQL editor, or via `supabase db push`.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'proposal',
  'negotiation',
  'won',
  'lost'
);

create type quote_status as enum (
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired'
);

create type activity_type as enum (
  'call',
  'email',
  'meeting',
  'note',
  'task'
);

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  company text,
  email text,
  phone text,
  status lead_status not null default 'new',
  value numeric(12, 2) not null default 0,
  source text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lead_id uuid references leads (id) on delete cascade,
  quote_number text,
  amount numeric(12, 2) not null default 0,
  status quote_status not null default 'draft',
  sent_at timestamptz,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  lead_id uuid references leads (id) on delete cascade,
  type activity_type not null default 'task',
  subject text not null,
  notes text,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

create index leads_user_id_idx on leads (user_id);
create index leads_status_idx on leads (status);
create index quotes_user_id_idx on quotes (user_id);
create index quotes_lead_id_idx on quotes (lead_id);
create index quotes_status_idx on quotes (status);
create index activities_user_id_idx on activities (user_id);
create index activities_lead_id_idx on activities (lead_id);
create index activities_due_at_idx on activities (due_at);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at
  before update on leads
  for each row execute function set_updated_at();

create trigger quotes_set_updated_at
  before update on quotes
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security: each user only sees their own data
-- ---------------------------------------------------------------------------

alter table leads enable row level security;
alter table quotes enable row level security;
alter table activities enable row level security;

create policy "Leads are owned by their creator"
  on leads for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Quotes are owned by their creator"
  on quotes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Activities are owned by their creator"
  on activities for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
