import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  EMWave,
  EnergyLadder,
  OrbitalBox,
  SpectrumStrip,
  emWavePaths,
  orbitalBoxWidth,
  spectrumStops,
  spectrumX,
} from './index'

const countMatches = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length

describe('spectrumX', () => {
  it('maps the ends of the range to the ends of the strip', () => {
    expect(spectrumX(380, 560)).toBe(0)
    expect(spectrumX(750, 560)).toBe(560)
    expect(spectrumX(565, 560)).toBeCloseTo(280, 6)
  })

  it('respects a custom range', () => {
    expect(spectrumX(200, 100, [200, 400])).toBe(0)
    expect(spectrumX(300, 100, [200, 400])).toBe(50)
  })
})

describe('spectrumStops', () => {
  it('samples every 10 nm and ends at 100%', () => {
    const stops = spectrumStops([380, 750])
    expect(stops[0].offset).toBe('0.00%')
    expect(stops[stops.length - 1].offset).toBe('100%')
    expect(stops.length).toBe(38 + 1)
  })
})

describe('SpectrumStrip', () => {
  it('draws bright lines only in emission mode', () => {
    const html = renderToStaticMarkup(
      <svg>
        <SpectrumStrip width={560} lines={[{ nm: 656 }, { nm: 486, intensity: 0.5 }]} mode="emission" />
      </svg>
    )
    expect(countMatches(html, /data-testid="spectral-line"/g)).toBe(2)
    expect(html).toContain('var(--spectrum-track-opacity)')
    expect(html).toContain('opacity:0.5')
  })

  it('draws dark lines in absorption mode, with the track at full strength', () => {
    const html = renderToStaticMarkup(
      <svg>
        <SpectrumStrip width={560} lines={[{ nm: 589 }]} mode="absorption" />
      </svg>
    )
    expect(countMatches(html, /data-testid="spectral-line"/g)).toBe(1)
    expect(html).toContain('var(--spectrum-track)')
    expect(html).not.toContain('var(--spectrum-track-opacity)')
  })

  it('draws the full rainbow and no lines in continuous mode', () => {
    const html = renderToStaticMarkup(
      <svg>
        <SpectrumStrip width={560} lines={[{ nm: 589 }]} mode="continuous" />
      </svg>
    )
    expect(html).not.toContain('data-testid="spectral-line"')
    expect(html).toContain('<linearGradient')
  })

  it('draws ticks only inside the range and none when asked', () => {
    const withTicks = renderToStaticMarkup(
      <svg>
        <SpectrumStrip width={560} ticks={[400, 800]} />
      </svg>
    )
    expect(withTicks).toContain('400 nm')
    expect(withTicks).not.toContain('800 nm')
    const noTicks = renderToStaticMarkup(
      <svg>
        <SpectrumStrip width={560} ticks={[]} />
      </svg>
    )
    expect(noTicks).not.toContain(' nm<')
  })
})

describe('OrbitalBox', () => {
  it('lays out one box per orbital with arrows for each electron', () => {
    const html = renderToStaticMarkup(
      <svg>
        <OrbitalBox
          label="2p"
          orbitals={[{ up: true, down: false }, { up: true, down: true }, { up: false, down: false }]}
        />
      </svg>
    )
    expect(countMatches(html, /data-testid="orbital-box"/g)).toBe(3)
    expect(countMatches(html, /data-spin="\+1\/2"/g)).toBe(2)
    expect(countMatches(html, /data-spin="-1\/2"/g)).toBe(1)
    expect(html).toContain('2p')
    expect(html).not.toMatch(/[↑↓]/)
  })

  it('outlines the subshell in --caution when it is a violation', () => {
    const ok = renderToStaticMarkup(
      <svg>
        <OrbitalBox orbitals={[{ up: true, down: false }]} />
      </svg>
    )
    const bad = renderToStaticMarkup(
      <svg>
        <OrbitalBox orbitals={[{ up: true, down: false }]} state="violation" />
      </svg>
    )
    expect(ok).not.toContain('var(--caution)')
    expect(bad).toContain('var(--caution)')
    expect(bad).toContain('data-state="violation"')
  })

  it('computes the row width with and without a label', () => {
    expect(orbitalBoxWidth(3, { size: 36, gap: 6, hasLabel: false })).toBe(3 * 36 + 2 * 6)
    expect(orbitalBoxWidth(3, { size: 36, gap: 6, hasLabel: true })).toBe(30 + 3 * 36 + 2 * 6)
  })
})

describe('EMWave', () => {
  it('builds the same paths every time', () => {
    const a = emWavePaths({ x: 10, y: 100, length: 300, wavelength: 90, amplitude: 30 })
    const b = emWavePaths({ x: 10, y: 100, length: 300, wavelength: 90, amplitude: 30 })
    expect(a).toEqual(b)
    expect(a.electric.startsWith('M10.00,100.00')).toBe(true)
  })

  it('keeps the electric field within the amplitude about the axis', () => {
    const paths = emWavePaths({ x: 0, y: 0, length: 200, wavelength: 80, amplitude: 25 })
    const ys = paths.electric.split(' ').map((p) => Number(p.split(',')[1]))
    expect(Math.max(...ys.map(Math.abs))).toBeLessThanOrEqual(25.001)
  })

  it('draws E in --accent and B in --field-b, with the axis by default', () => {
    const html = renderToStaticMarkup(
      <svg>
        <EMWave length={200} wavelength={80} amplitude={25} />
      </svg>
    )
    expect(html).toContain('var(--accent)')
    expect(html).toContain('var(--field-b)')
    expect(html).toContain('data-testid="em-axis"')
    const noAxis = renderToStaticMarkup(
      <svg>
        <EMWave showAxis={false} />
      </svg>
    )
    expect(noAxis).not.toContain('data-testid="em-axis"')
  })
})

describe('EnergyLadder', () => {
  const levels = [
    { label: 'n = 1', energy: -13.6 },
    { label: 'n = 2', energy: -3.4 },
    { label: 'n = 3', energy: -1.51 },
  ]

  it('renders one rung and one label per level', () => {
    const html = renderToStaticMarkup(
      <svg>
        <EnergyLadder levels={levels} top={0} bottom={200} rungLeft={0} rungRight={60} />
      </svg>
    )
    expect(countMatches(html, /data-testid="energy-ladder-level"/g)).toBe(3)
    expect(html).toContain('n = 3')
  })

  it('nudges crowded labels apart and joins them with leader lines', () => {
    const close = [
      { label: 'a', energy: 0 },
      { label: 'b', energy: 0.01 },
      { label: 'c', energy: 10 },
    ]
    const html = renderToStaticMarkup(
      <svg>
        <EnergyLadder levels={close} top={0} bottom={100} rungLeft={0} rungRight={60} minLabelGap={20} />
      </svg>
    )
    expect(countMatches(html, /<line x1="60"/g)).toBe(2)
    expect(html).toContain('>a<')
  })
})
