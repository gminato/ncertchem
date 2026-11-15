import { describe, expect, it } from 'vitest'
import {
  applyAttack,
  buildStep,
  heterolysisTaker,
  judgeArrow,
  stepOutcome,
  unionGraph,
  type ArrowSpec,
  type PushStep,
} from './arrow-push'
import { parseSmiles, molecularFormula } from './molecule-parse'
import { ARROW_PUSHER_STEPS } from '@/components/simulation/sims/arrow-pusher-steps'

const steps = () => ARROW_PUSHER_STEPS.map(buildStep)
const byId = (id: string): PushStep => {
  const found = steps().find((s) => s.id === id)
  if (!found) throw new Error(`no step ${id}`)
  return found
}

describe('arrow-pusher steps', () => {
  it('has 8 steps, each with at least one required arrow', () => {
    expect(steps()).toHaveLength(8)
    for (const s of steps()) expect(s.required.length).toBeGreaterThan(0)
  })

  it('heterolysis sends the pair to the more electronegative atom (lib table)', () => {
    const s = byId('het-c-br')
    const taker = s.graph.atoms[s.required[0].target].element
    expect(taker).toBe('Br')
    expect(s.required[0].head).toBe('pair')
  })

  it('a C–Cu bond sends the pair to carbon, the more electronegative atom', () => {
    const s = byId('het-c-cu')
    expect(s.graph.atoms[s.required[0].target].element).toBe('C')
  })

  it('homolysis needs two half-headed arrows, one to each atom of the bond', () => {
    const s = byId('hom-c-br')
    expect(s.required).toHaveLength(2)
    expect(s.required.every((r) => r.head === 'radical')).toBe(true)
    const targets = s.required.map((r) => r.target).sort()
    const b = s.graph.bonds[s.bond]
    expect(targets).toEqual([b.a, b.b].sort())
  })

  it('an attack points from the donor lone pair to the positively charged carbon', () => {
    const s = byId('att-oh-tertiary')
    expect(s.required[0].source).toEqual({ kind: 'atom', atom: s.donor })
    expect(s.graph.atoms[s.acceptor].charge).toBe(1)
    expect(s.graph.atoms[s.acceptor].element).toBe('C')
  })

  it('every step has a bond that matches its element pair exactly once', () => {
    for (const spec of ARROW_PUSHER_STEPS) {
      if (spec.kind === 'attack') continue
      const s = buildStep(spec)
      const [x, y] = spec.bond
      const count = s.graph.bonds.filter((b) => {
        const e = [s.graph.atoms[b.a].element, s.graph.atoms[b.b].element].sort().join('')
        return e === [x, y].sort().join('')
      }).length
      expect(count, spec.id).toBe(1)
    }
  })
})

describe('judgeArrow', () => {
  it('accepts the required heterolytic arrow', () => {
    const s = byId('het-c-br')
    const v = judgeArrow(s, s.required[0], [])
    expect(v.ok).toBe(true)
  })

  it('rejects a half head for a cleavage into ions, with a reason', () => {
    const s = byId('het-c-br')
    const attempt: ArrowSpec = { ...s.required[0], head: 'radical' }
    const v = judgeArrow(s, attempt, [])
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toMatch(/full head/)
  })

  it('rejects the carbon as the taker, quoting the electronegativities', () => {
    const s = byId('het-c-br')
    const carbon = s.graph.bonds[s.bond].a === s.required[0].target ? s.graph.bonds[s.bond].b : s.graph.bonds[s.bond].a
    const v = judgeArrow(s, { ...s.required[0], target: carbon }, [])
    expect(v.ok).toBe(false)
    if (!v.ok) {
      expect(v.reason).toMatch(/2\.55/)
      expect(v.reason).toMatch(/2\.96/)
    }
  })

  it('rejects an arrow that starts on a bond which does not break in this step', () => {
    const s = byId('att-oh-tertiary')
    const v = judgeArrow(s, { source: { kind: 'bond', bond: 0 }, target: s.acceptor, head: 'pair' }, [])
    expect(v.ok).toBe(false)
  })

  it('accepts the two half arrows of a homolysis in either order, and rejects a full head', () => {
    const s = byId('hom-c-br')
    const first = judgeArrow(s, s.required[1], [])
    expect(first.ok).toBe(true)
    const placed = [s.required[1]]
    const second = judgeArrow(s, s.required[0], placed)
    expect(second.ok).toBe(true)
    const full = judgeArrow(s, { ...s.required[0], head: 'pair' }, [])
    expect(full.ok).toBe(false)
  })

  it('says an arrow is already drawn when it repeats', () => {
    const s = byId('hom-c-br')
    const v = judgeArrow(s, s.required[0], [s.required[0]])
    expect(v.ok).toBe(false)
    if (!v.ok) expect(v.reason).toMatch(/already/)
  })
})

describe('stepOutcome (lib bookkeeping)', () => {
  it('heterolysis of 2-bromopropane leaves a secondary cation and a bromide', () => {
    const out = stepOutcome(byId('het-c-br'))
    expect(out.lines[0]).toBe('(CH₃)₂CH⁺')
    expect(out.lines[1]).toBe('Br⁻')
  })

  it('homolysis of 1-bromopropane leaves a propyl radical and a bromine atom', () => {
    const out = stepOutcome(byId('hom-c-br'))
    expect(out.lines[0]).toBe('CH₃CH₂CH₂•')
    expect(out.lines[1]).toMatch(/Br•/)
  })

  it('an attack gives a neutral tert-butanol from the hydroxide and the tertiary cation', () => {
    const out = stepOutcome(byId('att-oh-tertiary'))
    expect(out.product).toBeDefined()
    expect(molecularFormula(out.product as NonNullable<typeof out.product>)).toBe('C4H10O')
    expect(out.product?.atoms.every((a) => (a.charge ?? 0) === 0)).toBe(true)
  })

  it('an ammonia attack gives an alkylammonium ion (+1), as the charge balance requires', () => {
    const out = stepOutcome(byId('att-nh3-secondary'))
    expect(molecularFormula(out.product as NonNullable<typeof out.product>)).toBe('C3H10N+')
    expect(out.product?.atoms.reduce((t, a) => t + (a.charge ?? 0), 0)).toBe(1)
    expect(out.lines[0]).toMatch(/Donor: nucleophile/)
    expect(out.lines[0]).toMatch(/Acceptor: electrophile/)
  })
})

describe('graph helpers', () => {
  it('unionGraph offsets the bonds of the second part', () => {
    const a = parseSmiles('CO')
    const b = parseSmiles('N')
    const { graph, partStart } = unionGraph([a, b])
    expect(partStart).toEqual([0, a.atoms.length])
    expect(graph.bonds.some((x) => x.a >= a.atoms.length && x.b >= a.atoms.length)).toBe(false)
  })

  it('applyAttack refuses an acceptor that is not positive, and bonded atoms', () => {
    const { graph, partStart } = unionGraph([parseSmiles('[OH-]'), parseSmiles('C[C+](C)C')])
    expect(() => applyAttack(graph, partStart[0], partStart[0] + 0)).toThrow()
    expect(() => applyAttack(graph, partStart[0], 0)).toThrow()
  })

  it('heterolysisTaker picks the more electronegative atom and the second atom on a tie', () => {
    const g = parseSmiles('CC(C)Br')
    expect(g.atoms[heterolysisTaker(g, 2)].element).toBe('Br')
    const tie = parseSmiles('CC')
    expect(heterolysisTaker(tie, 0)).toBe(tie.bonds[0].b)
  })
})
