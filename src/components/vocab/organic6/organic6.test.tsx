import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { NCERT_TABLE_6_2 } from '@/lib/chem/ncert-c12-unit6-data'
import {
  bondLengthUnits,
  stereoLayout,
  umbrellaAxial,
  umbrellaVectors,
} from './geometry'
import { HALOGEN_TONE, halogenLabel } from './tones'
import { StereoCentre, STEREO_SIZE } from './StereoCentre'
import { PolarBond, POLAR_BOND_SIZE } from './PolarBond'
import { Polarimeter } from './Polarimeter'
import { MechanismProfile } from './MechanismProfile'
import { PlanarCation } from './PlanarCation'

const CX = STEREO_SIZE.width / 2
const CY = STEREO_SIZE.height / 2
const L = 112
const base = { cx: CX, cy: CY, length: L }

const group = (label: string) => ({ label })

describe('umbrella geometry', () => {
  it('opens left at invert 0, is flat at 0.5 and flips at 1', () => {
    expect(umbrellaAxial(0)).toBeCloseTo(-1 / 3)
    expect(umbrellaAxial(0.5)).toBeCloseTo(0)
    expect(umbrellaAxial(1)).toBeCloseTo(1 / 3)
    expect(umbrellaAxial(-2)).toBeCloseTo(-1 / 3)
    expect(umbrellaAxial(9)).toBeCloseTo(1 / 3)
  })

  it('keeps every umbrella direction at unit length and smooth in invert', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      for (const v of umbrellaVectors(t)) {
        expect(Math.hypot(v.x, v.y, v.z)).toBeCloseTo(1, 9)
      }
    }
    const a = umbrellaVectors(0.4)[0].x
    const b = umbrellaVectors(0.45)[0].x
    expect(Math.abs(b - a)).toBeLessThan(0.05)
  })

  it('puts the three groups flat in one plane at invert 0.5, with their mean tip on the carbon', () => {
    const flat = stereoLayout({ ...base, invert: 0.5, mirror: false })
    const meanX = flat.umbrella.reduce((s, u) => s + u.tip.x, 0) / 3
    expect(meanX).toBeCloseTo(CX, 6)
    for (const v of umbrellaVectors(0.5)) expect(v.x).toBeCloseTo(0, 9)
  })

  it('has the umbrella on the far side of the axis at invert 0 and 1', () => {
    const reactant = stereoLayout({ ...base, invert: 0, mirror: false })
    const product = stereoLayout({ ...base, invert: 1, mirror: false })
    const mean = (l: typeof reactant) => l.umbrella.reduce((s, u) => s + u.tip.x, 0) / 3
    expect(mean(reactant)).toBeLessThan(CX)
    expect(mean(product)).toBeGreaterThan(CX)
  })

  it('places the axial groups on opposite sides of the carbon', () => {
    const l = stereoLayout({ ...base, invert: 0.5, mirror: false })
    expect(l.right.x).toBeCloseTo(CX + L)
    expect(l.left.x).toBeCloseTo(CX - L)
    expect(l.left.y).toBeCloseTo(CY)
  })
})

describe('mirror image', () => {
  it('swaps the axis groups and keeps heights and depths', () => {
    for (const t of [0, 0.5, 1]) {
      const plain = stereoLayout({ ...base, invert: t, mirror: false })
      const mirrored = stereoLayout({ ...base, invert: t, mirror: true })
      expect(mirrored.right.x).toBeCloseTo(2 * CX - plain.right.x)
      expect(mirrored.left.x).toBeCloseTo(2 * CX - plain.left.x)
      plain.umbrella.forEach((u, i) => {
        expect(mirrored.umbrella[i].tip.y).toBeCloseTo(u.tip.y)
        expect(mirrored.umbrella[i].z).toBeCloseTo(u.z)
      })
    }
  })
})

describe('bond length scaling', () => {
  it('scales linearly with pm', () => {
    expect(bondLengthUnits(178, 0.5)).toBeCloseTo(89)
    expect(bondLengthUnits(356, 0.5)).toBeCloseTo(2 * bondLengthUnits(178, 0.5))
  })

  it('keeps NCERT Table 6.2 order: F < Cl < Br < I', () => {
    const lengths = NCERT_TABLE_6_2.map((r) => r.lengthPm)
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b))
    expect(NCERT_TABLE_6_2.map((r) => r.halogen)).toEqual(['F', 'Cl', 'Br', 'I'])
  })
})

describe('tones', () => {
  it('gives each halogen one token and labels it', () => {
    expect(HALOGEN_TONE.Br).toBe('var(--el-Br)')
    expect(HALOGEN_TONE.I).toBe('var(--el-I)')
    expect(halogenLabel('Br')).toBe('Br')
    expect(halogenLabel('Cl', 'name')).toBe('chlorine')
  })
})

describe('renders', () => {
  it('draws the bracketed transition state with a double dagger', () => {
    const svg = renderToStaticMarkup(
      <svg>
        <StereoCentre
          umbrella={[group('CH₃'), group('CH₃'), group('H')]}
          incoming={{ label: 'HO⁻', bondOrder: 0.5 }}
          leaving={{ label: 'Br', tone: HALOGEN_TONE.Br, bondOrder: 0.5 }}
          invert={0.5}
          bracketTS
        />
      </svg>,
    )
    expect(svg).toContain('‡')
    expect(svg).toContain('stroke-dasharray')
  })

  it('draws the PolarBond with the pm ruler and dipole', () => {
    const svg = renderToStaticMarkup(
      <svg>
        <PolarBond halogen="Br" ruler dipole />
      </svg>,
    )
    expect(svg).toContain('193 pm')
    expect(svg).toContain('var(--dipole)')
  })

  it('draws each dipole arrow parallel to the bond, proportional to its dipole and inside the box', () => {
    const lengths: Record<string, number> = {}
    for (const row of NCERT_TABLE_6_2) {
      const svg = renderToStaticMarkup(
        <svg>
          <PolarBond halogen={row.halogen} dipole />
        </svg>,
      )
      const tail = Number(/<line x1="([\d.]+)" y1="172"/.exec(svg)?.[1])
      const tip = Number(/<path d="M([\d.]+) 172 L/.exec(svg)?.[1])
      expect(Number.isFinite(tail) && Number.isFinite(tip)).toBe(true)
      expect(tip).toBeLessThanOrEqual(POLAR_BOND_SIZE.width)
      lengths[row.halogen] = tip - tail
      expect(tip - tail).toBeCloseTo(row.dipoleDebye * 30, 1)
    }
    expect(lengths.Cl).toBeGreaterThan(lengths.F)
    expect(lengths.F).toBeGreaterThan(lengths.Br)
    expect(lengths.Br).toBeGreaterThan(lengths.I)
  })

  it('renders the polarimeter, profile and planar cation', () => {
    const svg = renderToStaticMarkup(
      <svg>
        <Polarimeter angle={-30} />
        <MechanismProfile kind="two-step" />
        <PlanarCation attackTop attackBottom />
      </svg>,
    )
    expect(svg).toContain('α = −30°')
    expect(svg).toContain('carbocation intermediate')
    expect(svg).toContain('Nu⁻')
  })
})
