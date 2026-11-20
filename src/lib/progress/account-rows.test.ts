import { describe, expect, it } from 'vitest'
import { answeredRow, pendingRows, progressFromRows, splitCheckId } from './account-rows'
import { EMPTY_PROGRESS, combine, withAnswered, withOpened } from './rules'

describe('splitCheckId', () => {
  it('splits a Check id at its first colon', () => {
    expect(splitCheckId('1-8-mole-concept:2')).toEqual({ slug: '1-8-mole-concept', n: '2' })
    expect(splitCheckId('2-6-filling-orbitals:config-Fe')).toEqual({ slug: '2-6-filling-orbitals', n: 'config-Fe' })
  })

  it('refuses ids the database would refuse', () => {
    expect(splitCheckId('no-colon')).toBeNull()
    expect(splitCheckId(':1')).toBeNull()
    expect(splitCheckId('Bad Slug:1')).toBeNull()
    expect(splitCheckId('ok:')).toBeNull()
    expect(splitCheckId('ok:a b')).toBeNull()
    expect(splitCheckId('ok:<script>')).toBeNull()
    expect(splitCheckId(`${'a'.repeat(121)}:1`)).toBeNull()
    expect(splitCheckId(`ok:${'n'.repeat(61)}`)).toBeNull()
  })
})

describe('progressFromRows', () => {
  it('reads answered Checks and the last-opened Section', () => {
    const progress = progressFromRows(
      [{ section_slug: 'a', check_number: '1', answered_at: '2026-06-01T10:00:00.000Z' }],
      { section_slug: 'a', opened_at: '2026-06-02T10:00:00.000Z' }
    )
    expect(progress).toEqual({
      answered: { 'a:1': Date.parse('2026-06-01T10:00:00.000Z') },
      lastOpened: { slug: 'a', at: Date.parse('2026-06-02T10:00:00.000Z') },
    })
  })

  it('reads the time Postgres sends, with a +00:00 offset', () => {
    const progress = progressFromRows(
      [{ section_slug: 'a', check_number: '1', answered_at: '2026-06-01T10:00:00+00:00' }],
      null
    )
    expect(progress.answered['a:1']).toBe(Date.parse('2026-06-01T10:00:00Z'))
  })

  it('drops rows with an unreadable time, and gives empty Progress for no rows', () => {
    expect(progressFromRows([{ section_slug: 'a', check_number: '1', answered_at: 'never' }], null)).toEqual(EMPTY_PROGRESS)
    expect(progressFromRows([], null)).toEqual(EMPTY_PROGRESS)
  })
})

describe('answeredRow', () => {
  it('turns an answered Check into a row with an ISO time', () => {
    expect(answeredRow('a:1', Date.parse('2026-06-01T10:00:00Z'))).toEqual({
      section_slug: 'a',
      check_number: '1',
      answered_at: '2026-06-01T10:00:00.000Z',
    })
  })

  it('gives null for an id that cannot be stored', () => {
    expect(answeredRow('Bad:1', 1)).toBeNull()
  })
})

describe('pendingRows', () => {
  const account = withOpened(withAnswered(EMPTY_PROGRESS, 'a:1', 100), 'a', 1000)

  it('sends only the answered Checks the Account lacks', () => {
    const browser = withAnswered(withAnswered(EMPTY_PROGRESS, 'a:1', 50), 'b:2', 200)
    const pending = pendingRows(account, combine(browser, account))
    expect(pending.answered.map((r) => `${r.section_slug}:${r.check_number}`)).toEqual(['b:2'])
  })

  it('sends nothing when the Account already holds everything', () => {
    expect(pendingRows(account, account)).toEqual({ answered: [], lastOpened: null })
  })

  it('sends the last-opened Section only when it is newer than the Account’s', () => {
    const newer = withOpened(EMPTY_PROGRESS, 'b', 2000)
    expect(pendingRows(account, combine(newer, account)).lastOpened).toEqual({
      section_slug: 'b',
      opened_at: new Date(2000).toISOString(),
    })
    const older = withOpened(EMPTY_PROGRESS, 'c', 500)
    expect(pendingRows(account, combine(older, account)).lastOpened).toBeNull()
  })

  it('sends the last-opened Section when the Account has none', () => {
    const pending = pendingRows(EMPTY_PROGRESS, withOpened(EMPTY_PROGRESS, 'a', 10))
    expect(pending.lastOpened?.section_slug).toBe('a')
  })

  it('leaves out what the database would refuse, so the rest still saves', () => {
    const browser = withAnswered(withAnswered(EMPTY_PROGRESS, 'Bad Slug:1', 1), 'good:1', 2)
    const pending = pendingRows(EMPTY_PROGRESS, withOpened(browser, 'Not A Slug', 3))
    expect(pending.answered.map((r) => r.section_slug)).toEqual(['good'])
    expect(pending.lastOpened).toBeNull()
  })
})
