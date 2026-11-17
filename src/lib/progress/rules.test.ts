import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESS,
  checkId,
  combine,
  continueTarget,
  isAnswered,
  sectionProgress,
  unitProgress,
  withAnswered,
  withOpened,
  type Progress,
  type SectionChecks,
} from './rules'

/** Progress with the given Checks answered at time 1. */
function answered(...ids: string[]): Progress {
  return ids.reduce((progress, id) => withAnswered(progress, id, 1), EMPTY_PROGRESS)
}

const MOLE: SectionChecks = { slug: '1-8-mole-concept', checkNumbers: ['1', '2', '3'] }
const PERCENT: SectionChecks = { slug: '1-9-percentage-composition', checkNumbers: ['1', '2'] }
const STOICH: SectionChecks = { slug: '1-10-stoichiometry', checkNumbers: ['1'] }
const BOOK = [MOLE, PERCENT, STOICH]

describe('checkId', () => {
  it('joins the Section slug and the Check number', () => {
    expect(checkId('1-8-mole-concept', 2)).toBe('1-8-mole-concept:2')
    expect(checkId('2-6-filling-orbitals', 'config-N')).toBe('2-6-filling-orbitals:config-N')
  })
})

describe('withAnswered', () => {
  it('records a Check as answered', () => {
    const progress = withAnswered(EMPTY_PROGRESS, 'a:1', 100)
    expect(isAnswered(progress, 'a:1')).toBe(true)
    expect(isAnswered(progress, 'a:2')).toBe(false)
  })

  it('keeps an answered Check answered, with its first time', () => {
    const first = withAnswered(EMPTY_PROGRESS, 'a:1', 100)
    const again = withAnswered(first, 'a:1', 999)
    expect(again).toBe(first)
    expect(again.answered['a:1']).toBe(100)
  })

  it('does not change the Progress it was given', () => {
    withAnswered(EMPTY_PROGRESS, 'a:1', 100)
    expect(EMPTY_PROGRESS.answered).toEqual({})
  })

  it('is not fooled by names that every object inherits', () => {
    expect(isAnswered(EMPTY_PROGRESS, 'toString')).toBe(false)
    expect(isAnswered(EMPTY_PROGRESS, 'constructor')).toBe(false)
  })
})

describe('combine', () => {
  it('treats a Check answered in either record as answered', () => {
    const merged = combine(answered('a:1', 'a:2'), answered('a:2', 'b:1'))
    expect(Object.keys(merged.answered).sort()).toEqual(['a:1', 'a:2', 'b:1'])
  })

  it('keeps the earlier time when both records hold the same Check', () => {
    const browser = withAnswered(EMPTY_PROGRESS, 'a:1', 500)
    const account = withAnswered(EMPTY_PROGRESS, 'a:1', 200)
    expect(combine(browser, account).answered['a:1']).toBe(200)
    expect(combine(account, browser).answered['a:1']).toBe(200)
  })

  it('takes the Section opened more recently', () => {
    const browser = withOpened(EMPTY_PROGRESS, 'old', 100)
    const account = withOpened(EMPTY_PROGRESS, 'new', 200)
    expect(combine(browser, account).lastOpened).toEqual({ slug: 'new', at: 200 })
    expect(combine(account, browser).lastOpened).toEqual({ slug: 'new', at: 200 })
  })

  it('keeps the only last-opened Section when one record has none', () => {
    const opened = withOpened(EMPTY_PROGRESS, 'only', 100)
    expect(combine(opened, EMPTY_PROGRESS).lastOpened).toEqual({ slug: 'only', at: 100 })
    expect(combine(EMPTY_PROGRESS, opened).lastOpened).toEqual({ slug: 'only', at: 100 })
    expect(combine(EMPTY_PROGRESS, EMPTY_PROGRESS).lastOpened).toBeNull()
  })

  it('never removes anything, and changes neither record', () => {
    const a = answered('a:1')
    const b = answered('b:1')
    const merged = combine(a, b)
    expect(Object.keys(merged.answered)).toHaveLength(2)
    expect(Object.keys(a.answered)).toEqual(['a:1'])
    expect(Object.keys(b.answered)).toEqual(['b:1'])
  })
})

describe('sectionProgress', () => {
  it('counts the answered Checks of a Section', () => {
    const progress = answered('1-8-mole-concept:1', '1-8-mole-concept:3')
    expect(sectionProgress(progress, MOLE)).toEqual({ answered: 2, total: 3, complete: false })
  })

  it('makes a Section complete when every current Check is answered', () => {
    const progress = answered('1-8-mole-concept:1', '1-8-mole-concept:2', '1-8-mole-concept:3')
    expect(sectionProgress(progress, MOLE).complete).toBe(true)
  })

  it('makes a Complete Section incomplete again when a Check is added', () => {
    const progress = answered('1-8-mole-concept:1', '1-8-mole-concept:2', '1-8-mole-concept:3')
    const grown: SectionChecks = { ...MOLE, checkNumbers: ['1', '2', '3', '4'] }
    expect(sectionProgress(progress, grown)).toEqual({ answered: 3, total: 4, complete: false })
  })

  it('ignores an answered Check that the Section no longer holds', () => {
    const progress = answered('1-8-mole-concept:1', '1-8-mole-concept:2', '1-8-mole-concept:3')
    const shrunk: SectionChecks = { ...MOLE, checkNumbers: ['1', '2'] }
    expect(sectionProgress(progress, shrunk)).toEqual({ answered: 2, total: 2, complete: true })
  })

  it('does not count a Check of another Section with the same number', () => {
    const progress = answered('1-9-percentage-composition:1')
    expect(sectionProgress(progress, MOLE).answered).toBe(0)
  })

  it('never calls a Section with no Checks complete', () => {
    const empty: SectionChecks = { slug: 'no-checks', checkNumbers: [] }
    expect(sectionProgress(EMPTY_PROGRESS, empty)).toEqual({ answered: 0, total: 0, complete: false })
  })
})

describe('unitProgress', () => {
  it('counts complete and started Sections', () => {
    const progress = answered(
      '1-8-mole-concept:1',
      '1-8-mole-concept:2',
      '1-8-mole-concept:3',
      '1-9-percentage-composition:1'
    )
    expect(unitProgress(progress, BOOK)).toEqual({ complete: 1, started: 2, total: 3 })
  })

  it('gives zeros for a Learner with no Progress', () => {
    expect(unitProgress(EMPTY_PROGRESS, BOOK)).toEqual({ complete: 0, started: 0, total: 3 })
  })
})

describe('continueTarget', () => {
  it('is null when the Learner has opened nothing', () => {
    expect(continueTarget(EMPTY_PROGRESS, BOOK)).toBeNull()
    expect(continueTarget(answered('1-8-mole-concept:1'), BOOK)).toBeNull()
  })

  it('is the Section opened last while it is incomplete', () => {
    const progress = withOpened(answered('1-8-mole-concept:1'), MOLE.slug, 10)
    expect(continueTarget(progress, BOOK)).toBe(MOLE)
  })

  it('is the Section opened last even with nothing answered in it', () => {
    expect(continueTarget(withOpened(EMPTY_PROGRESS, PERCENT.slug, 10), BOOK)).toBe(PERCENT)
  })

  it('moves to the next Section in book order once the last one is complete', () => {
    const done = answered('1-8-mole-concept:1', '1-8-mole-concept:2', '1-8-mole-concept:3')
    expect(continueTarget(withOpened(done, MOLE.slug, 10), BOOK)).toBe(PERCENT)
  })

  it('skips later Sections that are already complete', () => {
    const done = answered(
      '1-8-mole-concept:1',
      '1-8-mole-concept:2',
      '1-8-mole-concept:3',
      '1-9-percentage-composition:1',
      '1-9-percentage-composition:2'
    )
    expect(continueTarget(withOpened(done, MOLE.slug, 10), BOOK)).toBe(STOICH)
  })

  it('stays on the last Section opened when nothing after it is left to do', () => {
    const done = answered('1-10-stoichiometry:1')
    expect(continueTarget(withOpened(done, STOICH.slug, 10), BOOK)).toBe(STOICH)
  })

  it('is null when the Section opened last no longer exists', () => {
    expect(continueTarget(withOpened(EMPTY_PROGRESS, 'renamed-away', 10), BOOK)).toBeNull()
  })
})
