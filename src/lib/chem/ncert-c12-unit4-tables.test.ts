import { describe, expect, it } from 'vitest'
import { elementByZ } from './periodic-data'
import {
  NCERT_ACTINOIDS,
  NCERT_ACTINOID_OXIDATION_STATES,
  NCERT_AQUA_COLOURS,
  NCERT_CATALYSIS_EQUATIONS,
  NCERT_FIRST_SERIES_PROPERTIES,
  NCERT_HALIDES,
  NCERT_LANTHANOIDS,
  NCERT_MAGNETIC_MOMENTS,
  NCERT_OUTER_CONFIGURATIONS,
  NCERT_OXIDANT_EQUATIONS,
  NCERT_OXIDATION_STATES,
  NCERT_OXIDES,
  NCERT_THERMOCHEMISTRY,
  NCERT_UNIT4_ERRATA,
  configDisplay,
  type Config,
} from './ncert-c12-unit4-tables'

const SUB_SUP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-',
}

/** Sum the electrons in a configuration (core excluded). */
function electronsOf(config: Config): number {
  return config.terms.reduce((sum, t) => sum + t.electrons, 0)
}

/** Parse one printed species such as "Cr₂O₇²⁻" or "e⁻" into atoms and charge. */
function parseSpecies(raw: string): { atoms: Map<string, number>; charge: number } {
  const cleaned = raw.replace('(s)', '')
  const m = /^(.*?)([⁰¹²³⁴⁵⁶⁷⁸⁹]*[⁺⁻])?$/.exec(cleaned)
  if (!m) throw new Error(`cannot parse ${raw}`)
  const formula = [...m[1]].map((ch) => SUB_SUP[ch] ?? ch).join('')
  const chargeText = m[2] ?? ''
  let charge = 0
  if (chargeText) {
    const sign = chargeText.endsWith('⁺') ? 1 : -1
    const digits = [...chargeText.slice(0, -1)].map((ch) => SUB_SUP[ch]).join('')
    charge = sign * (digits === '' ? 1 : Number(digits))
  }
  const atoms = new Map<string, number>()
  if (formula === 'e') {
    atoms.set('e', 1)
  } else {
    const re = /([A-Z][a-z]?)(\d*)/g
    let hit: RegExpExecArray | null
    while ((hit = re.exec(formula)) !== null) {
      const count = hit[2] === '' ? 1 : Number(hit[2])
      atoms.set(hit[1], (atoms.get(hit[1]) ?? 0) + count)
    }
  }
  return { atoms, charge }
}

/** Atoms and charge of one side of a printed equation (coefficients applied). */
function sideTotals(side: string): { atoms: Map<string, number>; charge: number } {
  const atoms = new Map<string, number>()
  let charge = 0
  for (const term of side.split(' + ')) {
    const coeffMatch = /^(\d+)(.*)$/.exec(term.trim())
    const coeff = coeffMatch ? Number(coeffMatch[1]) : 1
    const species = coeffMatch ? coeffMatch[2] : term.trim()
    const parsed = parseSpecies(species)
    for (const [el, n] of parsed.atoms) atoms.set(el, (atoms.get(el) ?? 0) + n * coeff)
    charge += parsed.charge * coeff
  }
  return { atoms, charge }
}

function isBalanced(equation: string): boolean {
  const [lhs, rhs] = equation.split(' → ')
  const left = sideTotals(lhs)
  const right = sideTotals(rhs)
  const elements = new Set([...left.atoms.keys(), ...right.atoms.keys()])
  for (const el of elements) {
    if (el === 'e') continue // electrons are counted through the charge
    if ((left.atoms.get(el) ?? 0) !== (right.atoms.get(el) ?? 0)) return false
  }
  return left.charge === right.charge
}

describe('Table 4.1 outer configurations', () => {
  it('has the Z values of the 3d, 4d, 5d and 6d series in order', () => {
    const series = ['3d', '4d', '5d', '6d'] as const
    for (const s of series) {
      const rows = NCERT_OUTER_CONFIGURATIONS.filter((r) => r.series === s)
      const zs = rows.map((r) => r.Z)
      expect([...zs].sort((a, b) => a - b)).toEqual(zs)
    }
    expect(NCERT_OUTER_CONFIGURATIONS.filter((r) => r.series === '3d').map((r) => r.symbol)).toEqual([
      'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn',
    ])
  })

  it('matches the periodic table for symbol and Z', () => {
    for (const row of NCERT_OUTER_CONFIGURATIONS) {
      expect(elementByZ(row.Z).symbol).toBe(row.symbol)
    }
  })

  it('outer electron counts equal Z minus the core electrons', () => {
    const coreFor = (row: { symbol: string; Z: number }): number => {
      if (row.Z <= 30) return 18
      if (row.Z <= 48) return 36
      if (row.Z === 57) return 54
      if (row.Z <= 80) return 68
      if (row.Z === 89) return 86
      return 100
    }
    for (const row of NCERT_OUTER_CONFIGURATIONS) {
      expect(electronsOf(row.config)).toBe(row.Z - coreFor(row))
    }
  })

  it('spot-checks printed cells and display strings', () => {
    const cr = NCERT_OUTER_CONFIGURATIONS.find((r) => r.symbol === 'Cr')
    expect(cr?.display).toBe('3d⁵4s¹')
    const pd = NCERT_OUTER_CONFIGURATIONS.find((r) => r.symbol === 'Pd')
    expect(pd?.config.terms).toContainEqual({ subshell: '5s', electrons: 0 })
    expect(pd?.display).toBe('4d¹⁰')
    const cu = NCERT_OUTER_CONFIGURATIONS.find((r) => r.symbol === 'Cu')
    expect(cu?.display).toBe('3d¹⁰4s¹')
    expect(NCERT_OUTER_CONFIGURATIONS.find((r) => r.symbol === 'Hg')?.display).toBe('5d¹⁰6s²')
    expect(NCERT_OUTER_CONFIGURATIONS.find((r) => r.symbol === 'Rg')?.display).toBe('6d¹⁰7s¹')
  })
})

describe('Table 4.2 first-series properties', () => {
  it('ion configurations lose 4s before 3d: M+ = M minus one, M2+ = M minus two, M3+ = M minus three', () => {
    for (const row of NCERT_FIRST_SERIES_PROPERTIES) {
      const m = electronsOf(row.configM)
      expect(electronsOf(row.configMPlus)).toBe(m - 1)
      if (row.configM2Plus) expect(electronsOf(row.configM2Plus)).toBe(m - 2)
      if (row.configM3Plus) expect(electronsOf(row.configM3Plus)).toBe(m - 3)
    }
  })

  it('spot-checks printed cells', () => {
    const cr = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === 'Cr')
    expect(cr?.atomisationKJ).toBe(397)
    expect(cr?.ie2KJ).toBe(1592)
    expect(cr?.radiusM3PlusPm).toBe(62)
    const mn = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === 'Mn')
    expect(mn?.eM3PlusM2PlusVolt).toBe(1.57)
    const cu = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === 'Cu')
    expect(cu?.eM2PlusVolt).toBe(0.34)
    const sc = NCERT_FIRST_SERIES_PROPERTIES.find((r) => r.symbol === 'Sc')
    expect(sc?.configM3Plus?.core).toBe('Ar')
    expect(configDisplay(sc!.configM3Plus!)).toBe('[Ar]')
  })
})

describe('Table 4.3 and 4.4', () => {
  it('flags the bold states of Mn and Cu as printed', () => {
    expect(NCERT_OXIDATION_STATES.Mn?.filter((s) => s.common).map((s) => s.state)).toEqual([2, 7])
    expect(NCERT_OXIDATION_STATES.Cu?.filter((s) => s.common).map((s) => s.state)).toEqual([2])
  })

  it('Table 4.4 spot checks and E° sign', () => {
    const cu = NCERT_THERMOCHEMISTRY.find((r) => r.symbol === 'Cu')
    expect(cu).toMatchObject({ atomisationKJ: 339, hydrationKJ: -2121, eVolt: 0.34 })
    expect(NCERT_THERMOCHEMISTRY.find((r) => r.symbol === 'Mn')?.atomisationKJ).toBe(279)
    expect(NCERT_THERMOCHEMISTRY.filter((r) => r.eVolt > 0).map((r) => r.symbol)).toEqual(['Cu'])
  })
})

describe('Tables 4.5 and 4.6', () => {
  it('halide formulas use the X key as printed', () => {
    expect(NCERT_HALIDES.find((h) => h.formula === 'CrF6')?.oxidationState).toBe(6)
    expect(NCERT_HALIDES.find((h) => h.formula === 'VXI4')?.key).toBe('XI')
    expect(NCERT_HALIDES.find((h) => h.formula === 'CuX')?.key).toBe('XIII')
  })

  it('oxides: highest state equals the group number up to Mn', () => {
    for (const oxide of NCERT_OXIDES) {
      if (oxide.oxidationState === oxide.group && oxide.group <= 7) {
        expect(oxide.formula).toMatch(/O/)
      }
    }
    expect(NCERT_OXIDES.find((o) => o.formula === 'Mn2O7')?.oxidationState).toBe(7)
    expect(NCERT_OXIDES.filter((o) => o.mixed).map((o) => o.formula)).toEqual(['Mn3O4', 'Fe3O4', 'Co3O4'])
  })
})

describe('Tables 4.7 and 4.8', () => {
  it('spin-only moments: unpaired n gives sqrt(n(n+2)) to 2 d.p., except the printed 2.84 for n = 2 (ERRATA)', () => {
    for (const row of NCERT_MAGNETIC_MOMENTS) {
      const spinOnly = Math.round(Math.sqrt(row.unpaired * (row.unpaired + 2)) * 100) / 100
      expect(row.calculatedBm).toBe(row.unpaired === 2 ? 2.84 : spinOnly)
    }
  })

  it('unpaired electrons are high spin: n = d for d up to 5, 10 − d after', () => {
    for (const row of NCERT_MAGNETIC_MOMENTS) {
      const expected = row.dCount <= 5 ? row.dCount : 10 - row.dCount
      expect(row.unpaired).toBe(expected)
    }
  })

  it('colour table spot checks', () => {
    expect(NCERT_AQUA_COLOURS.find((r) => r.ion === 'Mn²⁺')?.colour).toBe('pink')
    expect(NCERT_AQUA_COLOURS.find((r) => r.ion === 'Cu²⁺')?.colour).toBe('blue')
    expect(NCERT_AQUA_COLOURS.filter((r) => r.dCount === 0 || r.dCount === 10).every((r) => r.colour === 'colourless')).toBe(true)
  })
})

describe('Tables 4.9 to 4.11', () => {
  it('lanthanoid Ln³⁺ has Z − 57 f electrons (La 0 to Lu 14)', () => {
    for (const row of NCERT_LANTHANOIDS) {
      const f = row.ln3Plus?.terms.find((t) => t.subshell === '4f')?.electrons ?? 0
      expect(f).toBe(row.Z - 57)
    }
  })

  it('lanthanoid ion electron counts: Ln²⁺ = Ln − 2 and Ln³⁺ = Ln − 3 outside the core', () => {
    for (const row of NCERT_LANTHANOIDS) {
      const n = electronsOf(row.ln)
      if (row.ln2Plus) expect(electronsOf(row.ln2Plus)).toBe(n - 2)
      if (row.ln3Plus) expect(electronsOf(row.ln3Plus)).toBe(n - 3)
      if (row.ln4Plus) expect(electronsOf(row.ln4Plus)).toBe(n - 4)
    }
  })

  it('lanthanoid radii spot checks and the Eu anomaly', () => {
    expect(NCERT_LANTHANOIDS.find((r) => r.symbol === 'Eu')?.radiusLnPm).toBe(199)
    expect(NCERT_LANTHANOIDS.find((r) => r.symbol === 'Lu')?.radiusLn3PlusPm).toBeNull()
    const ln3 = NCERT_LANTHANOIDS.filter((r) => r.radiusLn3PlusPm !== null).map((r) => r.radiusLn3PlusPm as number)
    expect(ln3.every((v, i) => i === 0 || v <= ln3[i - 1])).toBe(true)
  })

  it('actinoid electron counts: M3+ = M − 3 and M4+ = M − 4', () => {
    for (const row of NCERT_ACTINOIDS) {
      const n = electronsOf(row.m)
      if (row.m3Plus) expect(electronsOf(row.m3Plus)).toBe(n - 3)
      if (row.m4Plus) expect(electronsOf(row.m4Plus)).toBe(n - 4)
    }
  })

  it('actinoid spot checks and Table 4.11', () => {
    expect(NCERT_ACTINOIDS.find((r) => r.symbol === 'Np')?.radiusM3PlusPm).toBe(101)
    expect(NCERT_ACTINOIDS.find((r) => r.symbol === 'Pa')?.radiusM4PlusPm).toBe(96)
    expect(NCERT_ACTINOID_OXIDATION_STATES.Pu).toEqual([3, 4, 5, 6, 7])
    expect(Math.max(...NCERT_ACTINOID_OXIDATION_STATES.Th!)).toBe(4)
    expect(NCERT_ACTINOID_OXIDATION_STATES.Lr).toEqual([3])
  })
})

describe('Printed equations', () => {
  const allEquations = [...NCERT_OXIDANT_EQUATIONS, ...NCERT_CATALYSIS_EQUATIONS]

  it('every printed equation balances in atoms and charge', () => {
    const unbalanced = allEquations.filter((e) => !isBalanced(e.equation)).map((e) => e.id)
    expect(unbalanced).toEqual([])
  })

  it('the balance checker rejects an unbalanced equation', () => {
    expect(isBalanced('H₂ + O₂ → H₂O')).toBe(false)
    expect(isBalanced('2H₂ + O₂ → 2H₂O')).toBe(true)
  })

  it('dichromate and permanganate E° values are as printed', () => {
    const e = (id: string) => NCERT_OXIDANT_EQUATIONS.find((x) => x.id === id)?.eVolt
    expect(e('dichromate-acid-half')).toBe(1.33)
    expect(e('permanganate-to-mn2plus-half')).toBe(1.52)
    expect(e('permanganate-to-dioxide-half')).toBe(1.69)
    expect(e('permanganate-to-manganate-half')).toBe(0.56)
  })
})

describe('NCERT_UNIT4_ERRATA', () => {
  it('records the Wacker and TiO slips', () => {
    const ids = NCERT_UNIT4_ERRATA.map((e) => e.id)
    expect(ids).toContain('wacker-ethyne-for-ethene')
    expect(ids).toContain('tio-for-tio2')
    const wacker = NCERT_UNIT4_ERRATA.find((e) => e.id === 'wacker-ethyne-for-ethene')
    expect(wacker?.correct).toMatch(/ethene/)
  })
})
