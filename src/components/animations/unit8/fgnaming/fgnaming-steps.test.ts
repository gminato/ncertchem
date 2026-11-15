import { describe, expect, it } from 'vitest'
import { neighbours } from '@/lib/chem/molecule-parse'
import { typeset } from '@/lib/chem/functional-namer'
import { functionalNamingSteps } from './fgnaming-steps'

const steps = functionalNamingSteps()

describe('functional-naming Steps', () => {
  it('has six Steps in the order ladder, principal, numbering, ketone over alcohol, ring rows, alphabetical', () => {
    expect(steps.map((s) => s.layout)).toEqual(['ladder', 'centred', 'centred', 'centred', 'rows', 'centred'])
  })

  it('names the acid example and the hydroxy ketone from the lib', () => {
    expect(steps[2].big).toBe('3-oxohex-5-enoic acid')
    expect(steps[3].big).toBe('5-hydroxypent-3-en-2-one')
  })

  it('numbers the acid example so the oxo group is on C3 and the double bond starts on C5', () => {
    const lines = steps[2].lines.join(' ')
    expect(lines).toContain('oxo group sits on C3')
    expect(lines).toContain('double bond starts on C5')
    const marks = steps[2].molecules[0].locants
    expect(marks.map((m) => m.label).join('')).toBe('123456')
  })

  it('names the three ring rows as ortho, meta and para pairs', () => {
    const rows = steps[4].rows
    expect(rows.map((r) => r.relation)).toEqual(['ortho', 'meta', 'para'])
    expect(rows.map((r) => r.molecule.name)).toEqual(['1-chloro-2-methylbenzene', '1-chloro-3-methylbenzene', '1-chloro-4-methylbenzene'])
  })

  it('puts the locants on the substituted ring carbons of the alphabetical Step', () => {
    const step = steps[5]
    expect(step.big).toBe('1-chloro-3-methylbenzene')
    const [m1, m3] = step.molecules[0].locants
    const g = step.molecules[0].graph
    expect(g.atoms[m1.atom].element).toBe('C')
    expect(g.atoms[m3.atom].element).toBe('C')
    // Position 1 carries the chlorine and position 3 the methyl group.
    const bears = (atom: number, element: string) => neighbours(g, atom).some((n) => g.atoms[n.atom].element === element)
    expect(bears(m1.atom, 'Cl')).toBe(true)
    expect(bears(m3.atom, 'C') && !bears(m3.atom, 'Cl')).toBe(true)
  })

  it('highlights the principal group atoms on the priority ladder Step', () => {
    expect(steps[0].present).toEqual(['acid', 'ketone', 'alkene'])
    expect(steps[0].molecules[0].highlightAtoms.length).toBeGreaterThan(0)
  })
})

describe('typeset', () => {
  it('turns group dashes into en dashes and digits into subscripts', () => {
    expect(typeset('-COOH ranks highest')).toBe('–COOH ranks highest')
    expect(typeset('-NH2 and -SO3H')).toBe('–NH₂ and –SO₃H')
  })

  it('leaves affix hyphens alone', () => {
    expect(typeset('written as -en- and -oic acid')).toBe('written as -en- and -oic acid')
  })
})
