-- Subscriptions for Accounts.
--
-- A Subscription grants an Account its Entitlement to read Paid Sections until its expiry time.
-- Rows are written and updated only by server-side payment verification (using the service role)
-- after Razorpay confirms payment. The browser reads an Account's own Subscription directly from
-- Supabase, so row level security ensures an Account can read only its own rows and can never
-- create, alter, or remove a Subscription. A visitor who is not signed in can read nothing.

-- ---------------------------------------------------------------------------------------------
-- Subscriptions: one row per paid Subscription period for an Account.
-- ---------------------------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references auth.users (id) on delete cascade,
  starts_at timestamptz not null,
  expires_at timestamptz not null,
  status text not null check (status in ('active', 'expired', 'cancelled')),
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  created_at timestamptz not null default now(),

  constraint subscriptions_expires_after_starts
    check (expires_at > starts_at)
);

comment on table public.subscriptions is
  'Subscriptions granting an Account its Entitlement to Paid Sections. Managed only by server-side verification.';

create index subscriptions_account_entitlement_idx
  on public.subscriptions (account_id, status, expires_at desc);

-- ---------------------------------------------------------------------------------------------
-- Who may do what.
-- ---------------------------------------------------------------------------------------------

alter table public.subscriptions enable row level security;

-- Start from nothing, then grant read-only access to signed-in Accounts. A visitor who is not
-- signed in (the anon role) gets no access at all, and signed-in Accounts cannot write here.
revoke all on table public.subscriptions from anon, authenticated;
grant select on table public.subscriptions to authenticated;

create policy "An Account reads its own Subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = account_id);
