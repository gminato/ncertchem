import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  ColourWheel,
  ConfigurationBoxes,
  DBlockStrip,
  ION_COLOUR_KEYS,
  ION_COLOUR_TOKEN,
  SERIES,
  SERIES_TONE,
  SPECTRAL_KEYS,
  SPECTRAL_TOKEN,
  SolutionColour,
  configurationLayout,
  dBlockCells,
  fillSubshell,
  oppositeSector,
  orbitalsIn,
  sectorAngle,
  seriesOf,
} from './index'
import { DBlockGallery } from './DBlockGallery'
import { elementBySymbol } from '@/lib/chem/periodic-data'

const TOKENS = fs.readFileSync(path.resolve(__dirname, '../../../styles/tokens.css'), 'utf8')

const count = (spins: ReturnType<typeof fillSubshell>) => ({
  electrons: spins.reduce((n, o) => n + (o.up ? 1 : 0) + (o.down ? 1 : 0), 0),
  pairs: spins.filter((o) => o.up && o.down).length,
  singles: spins.filter((o) => o.up !== o.down).length,
})

describe('fillSubshell (Hund then Pauli)', () => {
  it('puts five electrons in 3d as five singles', () => {
    expect(count(fillSubshell(5, 5))).toEqual({ electrons: 5, pairs: 0, singles: 5 })
  })

  it('puts six electrons in 3d as one pair and four singles', () => {
    expect(count(fillSubshell(6, 5))).toEqual({ electrons: 6, pairs: 1, singles: 4 })
  })

  it('fills a full subshell and an empty one', () => {
    expect(count(fillSubshell(10, 5))).toEqual({ electrons: 10, pairs: 5, singles: 0 })
    expect(count(fillSubshell(0, 5))).toEqual({ electrons: 0, pairs: 0, singles: 0 })
  })

  it('never puts more than two electrons in one orbital', () => {
    for (let e = 0; e <= 14; e++) {
      for (const o of fillSubshell(e, 7)) expect(o.up && o.down ? 2 : 0).toBeLessThanOrEqual(2)
    }
  })

  it('rejects impossible occupancies', () => {
    expect(() => fillSubshell(11, 5)).toThrow(RangeError)
    expect(() => fillSubshell(-1, 5)).toThrow(RangeError)
    expect(() => fillSubshell(1.5, 5)).toThrow(RangeError)
  })

  it('knows the orbital count of each subshell type', () => {
    expect(orbitalsIn('4s')).toBe(1)
    expect(orbitalsIn('3d')).toBe(5)
    expect(orbitalsIn('4f')).toBe(7)
    expect(() => orbitalsIn('3x')).toThrow(RangeError)
  })
})

describe('configurationLayout', () => {
  it('draws NCERT order left to right and fits the width', () => {
    const layout = configurationLayout(
      [
        { subshell: '4f', electrons: 14 },
        { subshell: '5d', electrons: 1 },
        { subshell: '6s', electrons: 2 },
      ],
      560
    )
    const xs = layout.rows.map((r) => r.x)
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
    const last = layout.rows[layout.rows.length - 1]
    expect(last.x + last.width).toBeLessThanOrEqual(560 + 1e-9)
    expect(layout.size).toBeGreaterThanOrEqual(16)
  })

  it('keeps the box size at its maximum when there is room', () => {
    expect(configurationLayout([{ subshell: '3d', electrons: 5 }, { subshell: '4s', electrons: 1 }], 560).size).toBe(36)
  })

  it('throws when a row cannot fit', () => {
    expect(() => configurationLayout([{ subshell: '4f', electrons: 14 }, { subshell: '5d', electrons: 1 }], 200)).toThrow(RangeError)
  })
})

describe('ConfigurationBoxes', () => {
  it('draws one OrbitalBox per subshell in order, with a ghost arrow per removed electron', () => {
    const html = renderToStaticMarkup(
      <svg>
        <ConfigurationBoxes
          config={[
            { subshell: '3d', electrons: 6 },
            { subshell: '4s', electrons: 0, removed: 2 },
          ]}
        />
      </svg>
    )
    expect(html.match(/data-subshell="/g)?.length).toBe(2)
    expect(html.indexOf('data-subshell="3d"')).toBeLessThan(html.indexOf('data-subshell="4s"'))
    expect(html.match(/data-testid="removed-electron"/g)?.length).toBe(2)
    expect(html).toContain('aria-hidden="true"')
  })

  it('draws no ghosts when nothing was removed', () => {
    const html = renderToStaticMarkup(<svg><ConfigurationBoxes config={[{ subshell: '3d', electrons: 5 }]} /></svg>)
    expect(html).not.toContain('removed-electron')
  })
})

describe('colour and series maps', () => {
  it('give every ion colour key a token that is defined in all three theme blocks', () => {
    for (const key of ION_COLOUR_KEYS) {
      expect(ION_COLOUR_TOKEN[key]).toBe(`var(--ion-${key})`)
      const defs = TOKENS.split(`--ion-${key}:`).length - 1
      expect(defs, `--ion-${key}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('give every series and spectral key a token defined in all three theme blocks', () => {
    for (const s of SERIES) {
      expect(SERIES_TONE[s]).toBe(`var(--db-${s})`)
      expect(TOKENS.split(`--db-${s}:`).length - 1).toBeGreaterThanOrEqual(3)
    }
    for (const k of SPECTRAL_KEYS) {
      expect(SPECTRAL_TOKEN[k]).toBe(`var(--spec-${k})`)
      expect(TOKENS.split(`--spec-${k}:`).length - 1).toBeGreaterThanOrEqual(3)
    }
  })

  it('pairs spectral sectors as complementary opposites on the wheel', () => {
    expect(oppositeSector('red')).toBe('green')
    expect(oppositeSector('orange')).toBe('blue')
    expect(oppositeSector('yellow')).toBe('violet')
    for (let i = 0; i < 6; i++) expect(sectorAngle(i + 3) - sectorAngle(i)).toBe(180)
  })
})

describe('DBlockStrip', () => {
  it('lists the 40 main-table tiles and, with showF, the 14 + 14 f-block tiles', () => {
    expect(dBlockCells(false).main).toHaveLength(40)
    const withF = dBlockCells(true)
    expect(withF.lanthanoids.map((e) => e.symbol)[0]).toBe('Ce')
    expect(withF.lanthanoids).toHaveLength(14)
    expect(withF.actinoids).toHaveLength(14)
  })

  it('tints tiles by series, with lanthanum in 5d and actinium in 6d', () => {
    expect(seriesOf(elementBySymbol('La')!)).toBe('5d')
    expect(seriesOf(elementBySymbol('Ac')!)).toBe('6d')
    expect(seriesOf(elementBySymbol('Fe')!)).toBe('3d')
    expect(seriesOf(elementBySymbol('Lu')!)).toBe('ln')
  })

  it('renders each symbol and makes tiles buttons when onSelect is set', () => {
    const html = renderToStaticMarkup(
      <svg>
        <DBlockStrip showF onSelect={() => {}} highlight={['Cr']} />
      </svg>
    )
    expect(html).toContain('>Cr<')
    expect(html).toContain('>Lu<')
    expect(html).toContain('role="button"')
  })
})

describe('SolutionColour and ColourWheel', () => {
  it('fills the liquid with the ion token and draws a transmitted beam when light is on', () => {
    const html = renderToStaticMarkup(<svg><SolutionColour ion="cu2" light /></svg>)
    expect(html).toContain('var(--ion-cu2)')
    expect(html).toContain('data-testid="transmitted-beam"')
  })

  it('draws a precipitate only when asked', () => {
    expect(renderToStaticMarkup(<svg><SolutionColour ion="mno4" /></svg>)).not.toContain('precipitate')
    expect(renderToStaticMarkup(<svg><SolutionColour ion="mno4" precipitate="mno2" /></svg>)).toContain('var(--ion-mno2)')
  })

  it('draws six sectors and an arrow from absorbed to seen', () => {
    const html = renderToStaticMarkup(<svg><ColourWheel absorbed="orange" seen="blue" /></svg>)
    expect(html.match(/data-sector="/g)?.length).toBe(6)
    expect(html).toContain('data-testid="wheel-arrow"')
    expect(html).toContain('orange absorbed')
    expect(html).toContain('blue seen')
  })
})

describe('DBlockGallery', () => {
  it('renders every figure of the gallery without errors', () => {
    const html = renderToStaticMarkup(<DBlockGallery />)
    expect(html).toContain('Chromium')
    expect(html).toContain('Lutetium')
    expect(html).toContain('data-subshell="5d"')
  })
})
