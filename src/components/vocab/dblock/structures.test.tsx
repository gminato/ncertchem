import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  EnergyCycle,
  LATTICE_SPACING,
  MagnetBalance,
  MetalLattice,
  OXO_BOND,
  OXOANION_KINDS,
  Oxoanion,
  balanceDisplacement,
  cycleLevels,
  energyDomain,
  interstitialSites,
  latticeSites,
  oxoCount,
  oxoanionBounds,
  oxoanionGeometry,
  oxoanionOxidationState,
  substitutionSites,
  type OxoanionKind,
} from './index'
import { DBlockGallery } from './DBlockGallery'

const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y)

/** Number of metal atoms each oxygen is bonded to. */
function metalsPerOxygen(kind: OxoanionKind): number[] {
  const g = oxoanionGeometry(kind)
  const counts = new Map<number, number>()
  g.atoms.forEach((a, i) => {
    if (a.element === 'O') counts.set(i, 0)
  })
  for (const bond of g.bonds) {
    if (counts.has(bond.b)) counts.set(bond.b, (counts.get(bond.b) ?? 0) + 1)
  }
  return [...counts.values()]
}

describe('oxoanion geometry', () => {
  it('has four oxygens for chromate and permanganate, seven for dichromate', () => {
    expect(oxoCount(oxoanionGeometry('cro4'))).toBe(4)
    expect(oxoCount(oxoanionGeometry('cr2o7'))).toBe(7)
    expect(oxoCount(oxoanionGeometry('mno4'))).toBe(4)
    expect(oxoCount(oxoanionGeometry('mno4-2'))).toBe(4)
  })

  it('shares exactly one bridging oxygen in dichromate and none elsewhere', () => {
    const bridged = (kind: OxoanionKind) => metalsPerOxygen(kind).filter((n) => n === 2).length
    expect(bridged('cr2o7')).toBe(1)
    expect(bridged('cro4')).toBe(0)
    expect(bridged('mno4')).toBe(0)
    expect(bridged('mno4-2')).toBe(0)
    expect(Math.max(...metalsPerOxygen('cr2o7'))).toBe(2)
  })

  it('puts two metals in dichromate and one elsewhere, with a bent Cr–O–Cr angle', () => {
    const g = oxoanionGeometry('cr2o7')
    expect(g.metals).toHaveLength(2)
    const [l, r] = g.metals.map((i) => g.atoms[i])
    const bridge = g.atoms[0]
    const angle = (Math.acos(((l.x - bridge.x) * (r.x - bridge.x) + (l.y - bridge.y) * (r.y - bridge.y)) / (dist(l, bridge) * dist(r, bridge))) * 180) / Math.PI
    expect(angle).toBeCloseTo(140, 5)
    expect(angle).toBeLessThan(180)
    expect(oxoanionGeometry('cro4').metals).toHaveLength(1)
  })

  it('draws every metal–oxygen bond at the same sensible length', () => {
    for (const kind of OXOANION_KINDS) {
      const g = oxoanionGeometry(kind)
      expect(g.bonds.length).toBeGreaterThan(0)
      for (const bond of g.bonds) {
        expect(dist(g.atoms[bond.a], g.atoms[bond.b])).toBeCloseTo(OXO_BOND, 6)
      }
    }
  })

  it('keeps every atom clear of every other atom (no overlapping discs)', () => {
    for (const kind of OXOANION_KINDS) {
      const g = oxoanionGeometry(kind)
      for (let i = 0; i < g.atoms.length; i++) {
        for (let j = i + 1; j < g.atoms.length; j++) {
          expect(dist(g.atoms[i], g.atoms[j]), `${kind} atoms ${i}, ${j}`).toBeGreaterThan(20)
        }
      }
    }
  })

  it('gives the oxidation states of the metal from the charge', () => {
    expect(oxoanionOxidationState('cro4')).toBe(6)
    expect(oxoanionOxidationState('cr2o7')).toBe(6)
    expect(oxoanionOxidationState('mno4')).toBe(7)
    expect(oxoanionOxidationState('mno4-2')).toBe(6)
  })

  it('writes the ion formulae in Unicode, never with caret or underscore notation', () => {
    expect(oxoanionGeometry('cro4').label).toBe('CrO₄²⁻')
    expect(oxoanionGeometry('cr2o7').label).toBe('Cr₂O₇²⁻')
    expect(oxoanionGeometry('mno4').label).toBe('MnO₄⁻')
    expect(oxoanionGeometry('mno4-2').label).toBe('MnO₄²⁻')
    for (const kind of OXOANION_KINDS) expect(oxoanionGeometry(kind).label).not.toMatch(/[\^_]/)
  })

  it('bounds contain every atom disc', () => {
    for (const kind of OXOANION_KINDS) {
      const g = oxoanionGeometry(kind)
      const b = oxoanionBounds(kind)
      for (const a of g.atoms) {
        expect(a.x).toBeGreaterThanOrEqual(b.minX)
        expect(a.x).toBeLessThanOrEqual(b.maxX)
        expect(a.y).toBeGreaterThanOrEqual(b.minY)
        expect(a.y).toBeLessThanOrEqual(b.maxY)
      }
    }
  })

  it('renders each kind with its label and tint token', () => {
    const html = renderToStaticMarkup(<Oxoanion kind="cr2o7" tint="cr2o7" showOxidationState />)
    expect(html).toContain('data-oxoanion="cr2o7"')
    expect(html).toContain('var(--ion-cr2o7)')
    expect(html).toContain('Cr₂O₇²⁻')
    expect(html).toContain('+6')
  })
})

describe('metal lattice sites', () => {
  it('places rows × cols metal atoms', () => {
    expect(latticeSites(4, 6)).toHaveLength(24)
  })

  it('puts interstitial holes in alternate squares', () => {
    // 3 × 5 squares in a 4 × 6 layer; half of them (checkerboard) hold an atom.
    expect(interstitialSites(4, 6)).toHaveLength(8)
  })

  it('keeps holes clear of metal atoms (hole to nearest site is more than both radii)', () => {
    const sites = latticeSites(4, 6)
    for (const h of interstitialSites(4, 6)) {
      const nearest = Math.min(...sites.map((s) => Math.hypot(s.x - h.x, s.y - h.y)))
      expect(nearest).toBeGreaterThan(9 + 12)
    }
  })

  it('substitutes one site in four for an alloy', () => {
    expect(substitutionSites(4, 6)).toHaveLength(6)
    for (const s of substitutionSites(4, 6)) expect(s.row % 2 === 0 && s.col % 2 === 0).toBe(true)
  })

  it('renders interstitial and alloy atoms with their symbols', () => {
    const html = renderToStaticMarkup(<MetalLattice interstitial="C" alloy={{ symbol: 'Cr', tone: 'var(--spec-orange)' }} />)
    expect(html).toContain('>C<')
    expect(html).toContain('>Cr<')
    expect(html.split('<circle').length - 1).toBe(24 + 8 + 0)
    expect(LATTICE_SPACING).toBeGreaterThan(0)
  })
})

describe('energy cycle', () => {
  it('builds levels as running sums from zero', () => {
    expect(cycleLevels([130, 2640, -2050])).toEqual([0, 130, 2770, 720])
    expect(cycleLevels([])).toEqual([0])
  })

  it('gives one domain that fits every cycle passed', () => {
    const a = [130, 2640, -2050]
    const b = [340, 2750, -2110]
    const [lo, hi] = energyDomain(a, b)
    for (const level of [...cycleLevels(a), ...cycleLevels(b)]) {
      expect(level).toBeGreaterThanOrEqual(lo)
      expect(level).toBeLessThanOrEqual(hi)
    }
    expect(lo).toBeLessThan(0)
    expect(hi).toBeGreaterThan(Math.max(...cycleLevels(b)))
  })

  it('renders one level label per species and one step label per step', () => {
    const html = renderToStaticMarkup(
      <EnergyCycle
        species={['A', 'B', 'C', 'D']}
        steps={[
          { name: 'x', value: 10, text: '+10' },
          { name: 'y', value: -5, text: '−5' },
          { name: 'z', value: 3, text: '+3' },
        ]}
        domain={energyDomain([10, -5, 3])}
        net={{ name: 'Net', value: 8, text: '+8' }}
      />
    )
    expect(html).toContain('>A<')
    expect(html).toContain('>D<')
    expect(html).toContain('>+10<')
    expect(html).toContain('>−5<')
  })
})

describe('magnet balance', () => {
  it('displaces the sample down for a positive pull and up for a negative one', () => {
    expect(balanceDisplacement(0.8)).toBeGreaterThan(0)
    expect(balanceDisplacement(-0.2)).toBeLessThan(0)
    expect(balanceDisplacement(0)).toBe(0)
  })

  it('clamps the pull to plus or minus one', () => {
    expect(balanceDisplacement(5)).toBe(balanceDisplacement(1))
    expect(balanceDisplacement(-5)).toBe(balanceDisplacement(-1))
    expect(balanceDisplacement(Number.NaN)).toBe(0)
  })

  it('says whether the sample is pulled in or pushed out', () => {
    expect(renderToStaticMarkup(<MagnetBalance pull={0.8} />)).toContain('Pulled into the field')
    expect(renderToStaticMarkup(<MagnetBalance pull={-0.2} schematic />)).toContain('Pushed out of the field')
    expect(renderToStaticMarkup(<MagnetBalance pull={-0.2} schematic />)).toContain('Schematic, not to scale')
  })
})

describe('gallery with the structure drawings', () => {
  it('renders the four new cards with their drawings', () => {
    const html = renderToStaticMarkup(<DBlockGallery />)
    expect(html).toContain('Interstitial and alloy lattices')
    expect(html).toContain('Oxoanions: four ions, four shapes')
    expect(html).toContain('Energy cycles on one scale')
    expect(html).toContain('Magnetic balance: the sign of the pull')
    expect(html).toContain('NCERT Table 4.4')
    expect(html).toContain('data-energy-cycle')
    expect(html).toContain('data-magnet-pull="0.8"')
  })
})
