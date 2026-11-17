import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PGlite } from '@electric-sql/pglite'
import { beforeAll, describe, expect, it } from 'vitest'

/**
 * The browser talks to the database directly, so the database's own rules are what keep one
 * Account's Progress away from another. These tests run the real migration files in an
 * in-process Postgres and then act as different Accounts.
 *
 * Supabase provides the `auth` schema, `auth.uid()` and the `anon` and `authenticated` roles.
 * The few lines of SUPABASE_STANDIN below stand in for them.
 */

const MIGRATIONS_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../supabase/migrations'
)

const SUPABASE_STANDIN = `
  create role anon nologin;
  create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  grant usage on schema auth to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`

const ASHA = '11111111-1111-4111-8111-111111111111'
const BILAL = '22222222-2222-4222-8222-222222222222'
const CAPPED = '33333333-3333-4333-8333-333333333333'

let db: PGlite

type Row = Record<string, unknown>

/** Runs SQL as a signed-in Account, or as a visitor who is not signed in (`null`). */
async function as(account: string | null, sql: string, params: unknown[] = []): Promise<Row[]> {
  return db.transaction(async (tx) => {
    await tx.exec(`set local role ${account ? 'authenticated' : 'anon'}`)
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [account ?? ''])
    const result = await tx.query<Row>(sql, params)
    return result.rows
  })
}

/** Runs SQL as the database owner, which is how the tests look at what is really stored. */
async function asOwner(sql: string, params: unknown[] = []): Promise<Row[]> {
  return (await db.query<Row>(sql, params)).rows
}

beforeAll(async () => {
  db = new PGlite()
  await db.exec(SUPABASE_STANDIN)
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith('.sql'))
    .sort()
  expect(files.length).toBeGreaterThan(0)
  for (const file of files) {
    await db.exec(fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8'))
  }
  await db.query('insert into auth.users (id) values ($1), ($2), ($3)', [ASHA, BILAL, CAPPED])
}, 60_000)

describe('answered Checks', () => {
  it('lets an Account add and read its own answered Checks, without naming itself', async () => {
    await as(
      ASHA,
      `insert into public.answered_checks (section_slug, check_number, answered_at)
       values ('1-8-mole-concept', '1', '2026-06-01T10:00:00Z'), ('1-8-mole-concept', '2', '2026-06-01T10:05:00Z')`
    )
    const rows = await as(ASHA, 'select account_id, check_number from public.answered_checks order by check_number')
    expect(rows).toEqual([
      { account_id: ASHA, check_number: '1' },
      { account_id: ASHA, check_number: '2' },
    ])
  })

  it('shows an Account none of another Account’s answered Checks', async () => {
    expect(await as(BILAL, 'select * from public.answered_checks')).toEqual([])
  })

  it('refuses an answered Check added in another Account’s name', async () => {
    await expect(
      as(BILAL, `insert into public.answered_checks (account_id, section_slug, check_number) values ($1, 'x', '1')`, [ASHA])
    ).rejects.toThrow(/row-level security/)
  })

  it('does not let an Account remove another Account’s answered Checks', async () => {
    await as(BILAL, 'delete from public.answered_checks')
    const left = await asOwner('select count(*)::int as n from public.answered_checks where account_id = $1', [ASHA])
    expect(left[0].n).toBe(2)
  })

  it('never changes an answered Check: no Account may update one', async () => {
    await expect(
      as(ASHA, `update public.answered_checks set answered_at = now()`)
    ).rejects.toThrow(/permission denied/)
  })

  it('keeps the first time when the same Check is added again', async () => {
    await as(
      ASHA,
      `insert into public.answered_checks (section_slug, check_number, answered_at)
       values ('1-8-mole-concept', '1', '2026-09-09T09:09:09Z')
       on conflict do nothing`
    )
    const rows = await asOwner(
      `select answered_at from public.answered_checks where account_id = $1 and check_number = '1'`,
      [ASHA]
    )
    expect(new Date(rows[0].answered_at as string).toISOString()).toBe('2026-06-01T10:00:00.000Z')
  })

  it('gives a visitor who is not signed in no access at all', async () => {
    await expect(as(null, 'select * from public.answered_checks')).rejects.toThrow(/permission denied/)
    await expect(
      as(null, `insert into public.answered_checks (account_id, section_slug, check_number) values ($1, 'x', '1')`, [ASHA])
    ).rejects.toThrow(/permission denied/)
    await expect(as(null, 'delete from public.answered_checks')).rejects.toThrow(/permission denied/)
  })

  it('accepts the Check numbers the site uses', async () => {
    await as(
      BILAL,
      `insert into public.answered_checks (section_slug, check_number)
       values ('2-6-filling-orbitals-electronic-configuration', 'config-Fe'),
              ('2-6-filling-orbitals-electronic-configuration', '4f'),
              ('page', 'home'),
              ('controls', 'dev-numeric')`
    )
    const rows = await as(BILAL, 'select count(*)::int as n from public.answered_checks')
    expect(rows[0].n).toBe(4)
  })

  it('refuses a Section slug or a Check number of the wrong shape', async () => {
    const insert = (slug: string, n: string) =>
      as(BILAL, 'insert into public.answered_checks (section_slug, check_number) values ($1, $2)', [slug, n])
    await expect(insert('Bad Slug', '1')).rejects.toThrow(/section_slug_shape/)
    await expect(insert('a:b', '1')).rejects.toThrow(/section_slug_shape/)
    await expect(insert('', '1')).rejects.toThrow(/section_slug_shape/)
    await expect(insert('a'.repeat(121), '1')).rejects.toThrow(/section_slug_shape/)
    await expect(insert('ok', '')).rejects.toThrow(/check_number_shape/)
    await expect(insert('ok', 'a b')).rejects.toThrow(/check_number_shape/)
    await expect(insert('ok', '<script>')).rejects.toThrow(/check_number_shape/)
    await expect(insert('ok', 'n'.repeat(61))).rejects.toThrow(/check_number_shape/)
  })

  it('stops an Account at 2000 answered Checks', async () => {
    await as(
      CAPPED,
      `insert into public.answered_checks (section_slug, check_number)
       select 'filler', g::text from generate_series(1, 2000) g`
    )
    await expect(
      as(CAPPED, `insert into public.answered_checks (section_slug, check_number) values ('filler', 'one-more')`)
    ).rejects.toThrow(/at most 2000/)
    // The limit is each Account's own: another Account can still add.
    await as(BILAL, `insert into public.answered_checks (section_slug, check_number) values ('after-limit', '1')`)
  }, 60_000)
})

describe('the last-opened Section', () => {
  const upsert = `
    insert into public.last_opened (section_slug, opened_at) values ($1, $2)
    on conflict (account_id) do update set section_slug = excluded.section_slug, opened_at = excluded.opened_at`

  it('lets an Account set and then change its own', async () => {
    await as(ASHA, upsert, ['1-8-mole-concept', '2026-06-01T10:00:00Z'])
    await as(ASHA, upsert, ['1-9-percentage-composition', '2026-06-02T10:00:00Z'])
    const rows = await as(ASHA, 'select account_id, section_slug from public.last_opened')
    expect(rows).toEqual([{ account_id: ASHA, section_slug: '1-9-percentage-composition' }])
  })

  it('shows an Account none of another Account’s', async () => {
    expect(await as(BILAL, 'select * from public.last_opened')).toEqual([])
  })

  it('refuses a row set in another Account’s name, and leaves that Account’s row alone', async () => {
    await expect(
      as(BILAL, `insert into public.last_opened (account_id, section_slug) values ($1, 'hijacked')`, [ASHA])
    ).rejects.toThrow(/row-level security|duplicate key/)
    await as(BILAL, `update public.last_opened set section_slug = 'hijacked'`)
    await as(BILAL, 'delete from public.last_opened')
    const rows = await asOwner('select section_slug from public.last_opened where account_id = $1', [ASHA])
    expect(rows).toEqual([{ section_slug: '1-9-percentage-composition' }])
  })

  it('gives a visitor who is not signed in no access at all', async () => {
    await expect(as(null, 'select * from public.last_opened')).rejects.toThrow(/permission denied/)
  })
})

describe('Delete Account', () => {
  it('cannot be called by a visitor who is not signed in', async () => {
    await expect(as(null, 'select public.delete_account()')).rejects.toThrow(/permission denied/)
  })

  it('deletes the calling Account and all its Progress, and no other Account', async () => {
    await as(BILAL, `insert into public.last_opened (section_slug) values ('bilal-was-here')`)
    const before = await asOwner('select count(*)::int as n from public.answered_checks where account_id = $1', [BILAL])
    expect(before[0].n).toBeGreaterThan(0)

    await as(ASHA, 'select public.delete_account()')

    expect(await asOwner('select id from auth.users where id = $1', [ASHA])).toEqual([])
    expect(await asOwner('select 1 from public.answered_checks where account_id = $1', [ASHA])).toEqual([])
    expect(await asOwner('select 1 from public.last_opened where account_id = $1', [ASHA])).toEqual([])

    expect(await asOwner('select id from auth.users where id = $1', [BILAL])).toEqual([{ id: BILAL }])
    const after = await asOwner('select count(*)::int as n from public.answered_checks where account_id = $1', [BILAL])
    expect(after[0].n).toBe(before[0].n)
    expect(await asOwner('select section_slug from public.last_opened where account_id = $1', [BILAL])).toEqual([
      { section_slug: 'bilal-was-here' },
    ])
  })
})
