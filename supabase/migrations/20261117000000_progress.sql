-- Progress for Accounts.
--
-- A Learner's Progress is the Checks they answered correctly, plus the Section they opened last.
-- A signed-in Learner's Progress is saved here, so that it follows their Account from one device
-- to another.
--
-- The site's pages are static and the browser talks to this database directly (see
-- docs/adr/0002-static-pages-progress-loads-in-the-browser.md). These rules are therefore the
-- only thing that keeps one Account's Progress away from another Account. Every table has row
-- level security, and an Account can touch only its own rows. A visitor who is not signed in
-- can touch nothing.

-- ---------------------------------------------------------------------------------------------
-- Answered Checks: one row for each Check an Account has answered correctly.
-- ---------------------------------------------------------------------------------------------

create table public.answered_checks (
  account_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- A Check is identified by its Section's slug and its number within that Section.
  section_slug text not null,
  check_number text not null,
  -- When the Learner first answered it correctly. The browser sends this, because an answer
  -- given offline is saved later.
  answered_at timestamptz not null default now(),

  primary key (account_id, section_slug, check_number),

  constraint answered_checks_section_slug_shape
    check (section_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(section_slug) <= 120),
  constraint answered_checks_check_number_shape
    check (check_number ~ '^[A-Za-z0-9][A-Za-z0-9._-]*$' and char_length(check_number) <= 60)
);

comment on table public.answered_checks is
  'Progress: the Checks each Account has answered correctly. Wrong attempts are never stored.';

-- The site holds a few hundred Checks. The limit stops a signed-in visitor from filling the
-- database with rows for Checks that do not exist.
create function public.enforce_answered_checks_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.answered_checks where account_id = new.account_id) >= 2000 then
    raise exception 'An Account can hold at most 2000 answered Checks'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger answered_checks_limit
  before insert on public.answered_checks
  for each row execute function public.enforce_answered_checks_limit();

-- ---------------------------------------------------------------------------------------------
-- Last opened: the Section each Account opened most recently. One row for each Account.
-- ---------------------------------------------------------------------------------------------

create table public.last_opened (
  account_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  section_slug text not null,
  opened_at timestamptz not null default now(),

  constraint last_opened_section_slug_shape
    check (section_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(section_slug) <= 120)
);

comment on table public.last_opened is
  'Progress: the Section each Account opened most recently, for "Continue".';

-- ---------------------------------------------------------------------------------------------
-- Who may do what.
-- ---------------------------------------------------------------------------------------------

alter table public.answered_checks enable row level security;
alter table public.last_opened enable row level security;

-- Start from nothing, then grant exactly what the site needs. A visitor who is not signed in
-- (the anon role) gets no access at all.
revoke all on table public.answered_checks from anon, authenticated;
revoke all on table public.last_opened from anon, authenticated;

-- An answered Check is added, read and removed (Reset Progress), and never changed: it keeps
-- the time of its first correct answer.
grant select, insert, delete on table public.answered_checks to authenticated;
grant select, insert, update, delete on table public.last_opened to authenticated;

create policy "An Account reads its own answered Checks"
  on public.answered_checks for select to authenticated
  using ((select auth.uid()) = account_id);

create policy "An Account adds its own answered Checks"
  on public.answered_checks for insert to authenticated
  with check ((select auth.uid()) = account_id);

create policy "An Account removes its own answered Checks"
  on public.answered_checks for delete to authenticated
  using ((select auth.uid()) = account_id);

create policy "An Account reads its own last-opened Section"
  on public.last_opened for select to authenticated
  using ((select auth.uid()) = account_id);

create policy "An Account sets its own last-opened Section"
  on public.last_opened for insert to authenticated
  with check ((select auth.uid()) = account_id);

create policy "An Account changes its own last-opened Section"
  on public.last_opened for update to authenticated
  using ((select auth.uid()) = account_id)
  with check ((select auth.uid()) = account_id);

create policy "An Account removes its own last-opened Section"
  on public.last_opened for delete to authenticated
  using ((select auth.uid()) = account_id);

-- ---------------------------------------------------------------------------------------------
-- Delete Account.
-- ---------------------------------------------------------------------------------------------

-- Deletes the Account of whoever calls it, and nothing else. Its Progress goes with it, because
-- both tables above cascade from auth.users. The function runs with its owner's rights, since a
-- signed-in Account has no access to auth.users, and it takes no argument, so there is no way to
-- name another Account.
create function public.delete_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

comment on function public.delete_account() is
  'Deletes the calling Account and all its Progress, immediately and permanently.';

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
