-- Phase 3: shared workspaces, team roles, orders, jobs (dispatch) and an audit log.
--
-- Run after 0001_init.sql (Supabase SQL editor, or `supabase db push`).
--
-- What this changes:
--   * Every business gets a WORKSPACE. Data is shared by everyone on the
--     workspace's team instead of being private to whoever created it.
--   * Existing users get their own workspace (they are its Owner) and all of
--     their existing leads, quotes and activities are moved into it.
--   * New tables: team_members, role_permissions, orders, jobs, audit_log.
--   * Row-level security is rewritten around workspace membership and role:
--       viewer      read only
--       field_tech  read; work jobs (status, notes)
--       sales       read/write leads, quotes, activities, orders, jobs
--       admin/owner everything, including the team and role settings
--   * Inserts that don't say which workspace they belong to (the existing
--     app code, and /api/leads/inbound) land in the creator's workspace.

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type team_role as enum ('owner', 'admin', 'sales', 'field_tech', 'viewer');
create type order_status as enum ('confirmed', 'in_progress', 'delivered');
create type job_status as enum ('scheduled', 'in_progress', 'done', 'late');

-- ---------------------------------------------------------------------------
-- Workspaces and team
-- ---------------------------------------------------------------------------

create table workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'My business',
  created_at timestamptz not null default now()
);

-- One row per person on the team. `user_id` is set once they have a login;
-- crew who only appear on the schedule can stay without one. `email` is how
-- an invite is matched to a login when that person signs up.
create table team_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  email text,
  name text not null,
  trade text,
  role team_role not null default 'field_tech',
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create unique index team_members_workspace_email_idx
  on team_members (workspace_id, lower(email)) where email is not null;
create index team_members_user_id_idx on team_members (user_id);

-- What each role may do, as edited on the Team screen. Stored per workspace
-- so each business can tune its own. The core rules above are always
-- enforced by RLS; these finer settings are applied by the app.
create table role_permissions (
  workspace_id uuid not null references workspaces (id) on delete cascade,
  role team_role not null,
  permissions jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (workspace_id, role)
);

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer so policies can call them without
-- recursing into team_members' own policies)
-- ---------------------------------------------------------------------------

create function workspace_role(ws uuid)
returns team_role
language sql
stable
security definer
set search_path = public
as $$
  select role from team_members
  where workspace_id = ws and user_id = auth.uid()
  limit 1;
$$;

create function is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from team_members where workspace_id = ws and user_id = auth.uid()
  );
$$;

create function can_edit_records(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(workspace_role(ws) in ('owner', 'admin', 'sales'), false);
$$;

create function can_manage_team(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(workspace_role(ws) in ('owner', 'admin'), false);
$$;

-- The workspace a user works in: the first one they belong to, owner seats
-- first. Used to fill in workspace_id on inserts that don't set it.
create function primary_workspace_for(uid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id from team_members
  where user_id = uid
  order by (role = 'owner') desc, created_at
  limit 1;
$$;

-- Called by the app after sign-in. Links any pending invites that match the
-- signed-in email, creates a personal workspace for someone who has none,
-- and returns the workspace to use.
create function ensure_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  user_email text;
  ws uuid;
  display_name text;
begin
  if uid is null then
    raise exception 'Not signed in';
  end if;

  select email into user_email from auth.users where id = uid;

  if user_email is not null then
    update team_members
      set user_id = uid, updated_at = now()
      where user_id is null and lower(email) = lower(user_email)
        and not exists (
          select 1 from team_members t2
          where t2.workspace_id = team_members.workspace_id and t2.user_id = uid
        );
  end if;

  ws := primary_workspace_for(uid);
  if ws is not null then
    return ws;
  end if;

  display_name := coalesce(split_part(user_email, '@', 1), 'Owner');
  insert into workspaces (name) values ('My business') returning id into ws;
  insert into team_members (workspace_id, user_id, email, name, role, color)
    values (ws, uid, user_email, display_name, 'owner', '#c2410c');
  return ws;
end;
$$;

grant execute on function ensure_workspace() to authenticated;

-- ---------------------------------------------------------------------------
-- Move existing data into workspaces
-- ---------------------------------------------------------------------------

alter table leads add column workspace_id uuid references workspaces (id) on delete cascade;
alter table quotes add column workspace_id uuid references workspaces (id) on delete cascade;
alter table activities add column workspace_id uuid references workspaces (id) on delete cascade;

-- One workspace per user who already has data (or an account).
do $$
declare
  u record;
  ws uuid;
begin
  for u in select id, email from auth.users loop
    insert into workspaces (name) values ('My business') returning id into ws;
    insert into team_members (workspace_id, user_id, email, name, role, color)
      values (ws, u.id, u.email, coalesce(split_part(u.email, '@', 1), 'Owner'), 'owner', '#c2410c');
    update leads set workspace_id = ws where user_id = u.id;
    update quotes set workspace_id = ws where user_id = u.id;
    update activities set workspace_id = ws where user_id = u.id;
  end loop;
end;
$$;

alter table leads alter column workspace_id set not null;
alter table quotes alter column workspace_id set not null;
alter table activities alter column workspace_id set not null;

-- ---------------------------------------------------------------------------
-- Orders and jobs
-- ---------------------------------------------------------------------------

create table orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  order_number text,
  lead_id uuid references leads (id) on delete set null,
  quote_id uuid references quotes (id) on delete set null,
  customer text not null,
  due_date date,
  status order_status not null default 'confirmed',
  total numeric(12, 2) not null default 0,
  paid numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_paid_not_negative check (paid >= 0),
  constraint orders_total_not_negative check (total >= 0)
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  user_id uuid references auth.users (id) on delete set null,
  job_number text,
  order_id uuid references orders (id) on delete set null,
  lead_id uuid references leads (id) on delete set null,
  customer text not null,
  title text,
  -- Null tech or date = unscheduled.
  tech_id uuid references team_members (id) on delete set null,
  scheduled_date date,
  start_time time,
  duration_hours numeric(4, 1) not null default 1,
  status job_status not null default 'scheduled',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log: append-only record of who changed what
-- ---------------------------------------------------------------------------

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  entity text not null,
  entity_id uuid,
  summary text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes (workspace first, so per-business queries stay fast)
-- ---------------------------------------------------------------------------

create index leads_workspace_idx on leads (workspace_id, status);
create index quotes_workspace_idx on quotes (workspace_id, status);
create index activities_workspace_idx on activities (workspace_id, due_at);
create index orders_workspace_idx on orders (workspace_id, status, due_date);
create index jobs_workspace_date_idx on jobs (workspace_id, scheduled_date);
create index jobs_tech_idx on jobs (tech_id);
create index audit_log_workspace_idx on audit_log (workspace_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

-- The inbound-lead endpoint inserts with the service role for an owner whose
-- workspace may not exist yet; give them one.
create function ensure_workspace_for(uid uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  ws uuid := primary_workspace_for(uid);
  user_email text;
begin
  if ws is not null then
    return ws;
  end if;
  select email into user_email from auth.users where id = uid;
  insert into workspaces (name) values ('My business') returning id into ws;
  insert into team_members (workspace_id, user_id, email, name, role, color)
    values (ws, uid, user_email, coalesce(split_part(user_email, '@', 1), 'Owner'), 'owner', '#c2410c');
  return ws;
end;
$$;

revoke execute on function ensure_workspace_for(uuid) from public, anon, authenticated;

-- Fill in workspace_id (and the creator) when an insert leaves it out.
create function set_default_workspace()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  if new.workspace_id is null then
    new.workspace_id := primary_workspace_for(coalesce(new.user_id, auth.uid()));
  end if;
  if new.workspace_id is null and new.user_id is not null then
    new.workspace_id := ensure_workspace_for(new.user_id);
  end if;
  if new.workspace_id is null then
    raise exception 'No workspace for this record. Sign in again so one can be created.';
  end if;
  return new;
end;
$$;

create trigger leads_default_workspace before insert on leads
  for each row execute function set_default_workspace();
create trigger quotes_default_workspace before insert on quotes
  for each row execute function set_default_workspace();
create trigger activities_default_workspace before insert on activities
  for each row execute function set_default_workspace();
create trigger orders_default_workspace before insert on orders
  for each row execute function set_default_workspace();
create trigger jobs_default_workspace before insert on jobs
  for each row execute function set_default_workspace();


create trigger orders_set_updated_at before update on orders
  for each row execute function set_updated_at();
create trigger jobs_set_updated_at before update on jobs
  for each row execute function set_updated_at();
create trigger team_members_set_updated_at before update on team_members
  for each row execute function set_updated_at();

-- Write a plain-English audit entry for every change to orders, jobs and
-- the team. Runs as definer so it can write even though audit_log has no
-- insert policy for regular users (the log can't be edited by hand).
create function write_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  row_data record;
  ws uuid;
  label text;
  msg text;
begin
  if tg_op = 'DELETE' then
    row_data := old;
  else
    row_data := new;
  end if;
  ws := row_data.workspace_id;
  -- Rows removed because their whole workspace was deleted: nothing to log to.
  if tg_op = 'DELETE' and not exists (select 1 from workspaces where id = ws) then
    return null;
  end if;

  if tg_table_name = 'jobs' then
    label := coalesce(row_data.job_number, 'a job') || ' ' || row_data.customer;
    if tg_op = 'INSERT' then
      msg := 'added ' || label;
    elsif tg_op = 'DELETE' then
      msg := 'deleted ' || label;
    elsif new.status is distinct from old.status then
      msg := 'set ' || label || ' to ' || replace(new.status::text, '_', ' ');
    elsif new.tech_id is distinct from old.tech_id
       or new.scheduled_date is distinct from old.scheduled_date
       or new.start_time is distinct from old.start_time then
      if new.tech_id is null or new.scheduled_date is null then
        msg := 'unscheduled ' || label;
      else
        msg := 'booked ' || label || ' with '
          || coalesce((select name from team_members where id = new.tech_id), 'a tech')
          || ' on ' || to_char(new.scheduled_date, 'Mon DD')
          || coalesce(' at ' || to_char(new.start_time, 'HH12:MI AM'), '');
      end if;
    else
      msg := 'edited ' || label;
    end if;
  elsif tg_table_name = 'orders' then
    label := coalesce(row_data.order_number, 'an order') || ' ' || row_data.customer;
    if tg_op = 'INSERT' then
      msg := 'added ' || label;
    elsif tg_op = 'DELETE' then
      msg := 'deleted ' || label;
    elsif new.paid is distinct from old.paid then
      msg := 'recorded $' || to_char(new.paid - old.paid, 'FM999,999,990.00') || ' on ' || label;
    elsif new.status is distinct from old.status then
      msg := 'set ' || label || ' to ' || replace(new.status::text, '_', ' ');
    else
      msg := 'edited ' || label;
    end if;
  else -- team_members
    label := row_data.name;
    if tg_op = 'INSERT' then
      msg := 'added ' || label || ' to the team as ' || replace(new.role::text, '_', ' ');
    elsif tg_op = 'DELETE' then
      msg := 'removed ' || label || ' from the team';
    elsif new.role is distinct from old.role then
      msg := 'made ' || label || ' ' || replace(new.role::text, '_', ' ');
    elsif new.user_id is distinct from old.user_id and new.user_id is not null then
      msg := label || ' joined';
    else
      msg := 'edited ' || label;
    end if;
  end if;

  insert into audit_log (workspace_id, actor_id, entity, entity_id, summary)
    values (ws, auth.uid(), tg_table_name, row_data.id, msg);
  return null;
end;
$$;

create trigger jobs_audit after insert or update or delete on jobs
  for each row execute function write_audit();
create trigger orders_audit after insert or update or delete on orders
  for each row execute function write_audit();
create trigger team_members_audit after insert or update or delete on team_members
  for each row execute function write_audit();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

drop policy "Leads are owned by their creator" on leads;
drop policy "Quotes are owned by their creator" on quotes;
drop policy "Activities are owned by their creator" on activities;

alter table workspaces enable row level security;
alter table team_members enable row level security;
alter table role_permissions enable row level security;
alter table orders enable row level security;
alter table jobs enable row level security;
alter table audit_log enable row level security;

-- Workspaces: members read; owners/admins rename.
create policy "Members read their workspace" on workspaces
  for select using (is_workspace_member(id));
create policy "Managers rename their workspace" on workspaces
  for update using (can_manage_team(id)) with check (can_manage_team(id));

-- Team: members read; owners/admins manage. Nobody can remove the last owner
-- or demote themselves out of owner through RLS alone (handled in the app).
create policy "Members read the team" on team_members
  for select using (is_workspace_member(workspace_id));
create policy "Managers add teammates" on team_members
  for insert with check (can_manage_team(workspace_id));
create policy "Managers edit teammates" on team_members
  for update using (can_manage_team(workspace_id)) with check (can_manage_team(workspace_id));
create policy "Managers remove teammates" on team_members
  for delete using (can_manage_team(workspace_id) and role <> 'owner');

create policy "Members read role settings" on role_permissions
  for select using (is_workspace_member(workspace_id));
create policy "Managers change role settings" on role_permissions
  for all using (can_manage_team(workspace_id)) with check (can_manage_team(workspace_id));

-- Sales records: members read; owners, admins and sales write.
create policy "Members read leads" on leads
  for select using (is_workspace_member(workspace_id));
create policy "Sales write leads" on leads
  for insert with check (can_edit_records(workspace_id));
create policy "Sales edit leads" on leads
  for update using (can_edit_records(workspace_id)) with check (can_edit_records(workspace_id));
create policy "Managers delete leads" on leads
  for delete using (can_manage_team(workspace_id));

create policy "Members read quotes" on quotes
  for select using (is_workspace_member(workspace_id));
create policy "Sales write quotes" on quotes
  for insert with check (can_edit_records(workspace_id));
create policy "Sales edit quotes" on quotes
  for update using (can_edit_records(workspace_id)) with check (can_edit_records(workspace_id));
create policy "Managers delete quotes" on quotes
  for delete using (can_manage_team(workspace_id));

create policy "Members read activities" on activities
  for select using (is_workspace_member(workspace_id));
create policy "Sales write activities" on activities
  for insert with check (can_edit_records(workspace_id));
create policy "Sales edit activities" on activities
  for update using (can_edit_records(workspace_id)) with check (can_edit_records(workspace_id));
create policy "Managers delete activities" on activities
  for delete using (can_manage_team(workspace_id));

create policy "Members read orders" on orders
  for select using (is_workspace_member(workspace_id));
create policy "Sales write orders" on orders
  for insert with check (can_edit_records(workspace_id));
create policy "Sales edit orders" on orders
  for update using (can_edit_records(workspace_id)) with check (can_edit_records(workspace_id));
create policy "Managers delete orders" on orders
  for delete using (can_manage_team(workspace_id));

-- Jobs: field techs can also update (status changes while on site).
create policy "Members read jobs" on jobs
  for select using (is_workspace_member(workspace_id));
create policy "Sales write jobs" on jobs
  for insert with check (can_edit_records(workspace_id));
create policy "Crew update jobs" on jobs
  for update using (coalesce(workspace_role(workspace_id) in ('owner', 'admin', 'sales', 'field_tech'), false))
  with check (coalesce(workspace_role(workspace_id) in ('owner', 'admin', 'sales', 'field_tech'), false));
create policy "Managers delete jobs" on jobs
  for delete using (can_manage_team(workspace_id));

-- Audit log: members read; only the triggers above write.
create policy "Members read the audit log" on audit_log
  for select using (is_workspace_member(workspace_id));

-- Field techs may only change a job's status and notes, not reassign or
-- reschedule it.
create function restrict_field_tech_job_edits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if workspace_role(new.workspace_id) = 'field_tech' and (
    new.tech_id is distinct from old.tech_id
    or new.scheduled_date is distinct from old.scheduled_date
    or new.start_time is distinct from old.start_time
    or new.duration_hours is distinct from old.duration_hours
    or new.customer is distinct from old.customer
    or new.order_id is distinct from old.order_id
  ) then
    raise exception 'Field techs can update a job''s status and notes, but not reschedule it.';
  end if;
  return new;
end;
$$;

create trigger jobs_field_tech_limits before update on jobs
  for each row execute function restrict_field_tech_job_edits();

-- Only an owner can hand out the owner role, and a workspace always keeps at
-- least one owner.
create function protect_owner_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role = 'owner' and old.role is distinct from 'owner'
     and workspace_role(new.workspace_id) is distinct from 'owner'
     and auth.uid() is not null then
    raise exception 'Only an owner can make someone an owner.';
  end if;
  if old.role = 'owner' and new.role is distinct from 'owner'
     and not exists (
       select 1 from team_members
       where workspace_id = old.workspace_id and role = 'owner' and id <> old.id
     ) then
    raise exception 'A business needs at least one owner. Make someone else an owner first.';
  end if;
  return new;
end;
$$;

create trigger team_members_protect_owner before update on team_members
  for each row execute function protect_owner_role();
