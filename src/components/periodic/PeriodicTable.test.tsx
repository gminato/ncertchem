import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { PeriodicTable, cellAriaLabel, MISSING_FILL } from './PeriodicTable'
import { ScaleLegend } from './ScaleLegend'
import { ElementTile } from './ElementTile'
import { FIXTURE_ELEMENTS, fixturePosition } from './fixture'
import { PERIODIC_TABLE, tablePosition, elementBySymbol } from '../../lib/chem/periodic-data'

function render(node: React.ReactElement): string {
  return renderToStaticMarkup(node)
}

describe('PeriodicTable markup', () => {
  const html = render(
    <PeriodicTable elements={FIXTURE_ELEMENTS} position={fixturePosition} variant="full" blockShading />
  )

  it('renders one button-role cell per element', () => {
    const cells = html.match(/role="button"/g) ?? []
    expect(cells).toHaveLength(FIXTURE_ELEMENTS.length)
  })

  it('renders all 118 cells for the full real table', () => {
    const full = render(<PeriodicTable elements={PERIODIC_TABLE} position={tablePosition} variant="full" />)
    expect(full.match(/role="button"/g) ?? []).toHaveLength(118)
  })

  it('gives each cell a descriptive aria-label', () => {
    expect(html).toContain('aria-label="Sodium, Z 11, group 1, period 3"')
    expect(html).toContain('aria-label="Cerium, Z 58, f-block, period 6"')
  })

  it('exposes Z, symbol and block as data attributes for GSAP targeting', () => {
    expect(html).toContain('data-z="11"')
    expect(html).toContain('data-symbol="Na"')
    expect(html).toContain('data-block="s"')
    expect(html).toContain('data-period="3"')
    expect(html).toContain('data-group="1"')
  })

  it('leaves the group attribute empty for f-block elements', () => {
    expect(html).toMatch(/data-z="58"[^>]*data-group=""/)
  })

  it('labels the detached f-block rows as Lanthanoids and Actinoids', () => {
    const full = render(<PeriodicTable elements={PERIODIC_TABLE} position={tablePosition} variant="full" />)
    expect(full).toContain('>Lanthanoids<')
    expect(full).toContain('>Actinoids<')
    expect(full).not.toContain('57–71')
  })

  it('places lanthanum and actinium in group 3 of rows 6 and 7', () => {
    const full = render(<PeriodicTable elements={PERIODIC_TABLE} position={tablePosition} variant="full" />)
    expect(full).toMatch(/data-z="57"[^>]*data-row="6"[^>]*data-col="3"/)
    expect(full).toMatch(/data-z="89"[^>]*data-row="7"[^>]*data-col="3"/)
  })

  it('puts exactly one cell in the tab order', () => {
    const tabStops = html.match(/tabindex="0"/g) ?? []
    expect(tabStops).toHaveLength(1)
  })

  it('places the first cell in the tab order when nothing is selected', () => {
    expect(html).toMatch(/tabindex="0"[^>]*data-z="1"|data-z="1"[^>]*tabindex="0"/)
  })

  it('places the selected cell in the tab order and marks it current', () => {
    const selected = render(
      <PeriodicTable elements={FIXTURE_ELEMENTS} position={fixturePosition} variant="full" selected={11} />
    )
    expect(selected).toMatch(/tabindex="0"[^>]*data-z="11"|data-z="11"[^>]*tabindex="0"/)
    expect(selected).toMatch(/aria-current="true"[^>]*data-z="11"|data-z="11"[^>]*aria-current="true"/)
  })

  it('never draws atomic mass in the table, and draws names only where they fit', () => {
    const full = render(<PeriodicTable elements={FIXTURE_ELEMENTS} position={fixturePosition} variant="full" />)
    expect(full).not.toContain('22.99')
    expect(full).toContain('>Sodium<')
    // Praseodymium is too long for a cell at 10 px, so it is left off the cell.
    const pr = render(
      <PeriodicTable
        elements={[elementBySymbol('Pr')!]}
        position={tablePosition}
        variant="full"
      />
    )
    expect(pr).not.toContain('>Praseodymium<')
    expect(pr).toContain('aria-label="Praseodymium, Z 59, f-block, period 6"')
  })

  it('hides names in the compact variant', () => {
    const compact = render(<PeriodicTable elements={FIXTURE_ELEMENTS} position={fixturePosition} variant="compact" />)
    expect(compact).not.toContain('>Sodium<')
  })

  it('draws a value line and hatches missing values in a heatmap', () => {
    const heat = render(
      <PeriodicTable
        elements={FIXTURE_ELEMENTS}
        position={fixturePosition}
        variant="compact"
        cell={(el) =>
          el.electronegativity === null
            ? { fill: MISSING_FILL, value: '—' }
            : { fill: '#21918C', value: el.electronegativity.toFixed(2) }
        }
      />
    )
    expect(heat).toContain('>0.93<')
    expect(heat).toContain('>—<')
    expect(heat).toContain('url(#')
  })

  it('renders the overlay layer in the table coordinate system', () => {
    const withLayer = render(
      <PeriodicTable
        elements={FIXTURE_ELEMENTS}
        position={fixturePosition}
        variant="full"
        layer={<line data-testid="overlay" x1={0} x2={10} y1={0} y2={10} />}
      />
    )
    expect(withLayer).toContain('data-testid="overlay"')
  })
})

describe('cellAriaLabel', () => {
  it('builds the spec pattern for a main-group element', () => {
    const na = elementBySymbol('Na')
    expect(na && cellAriaLabel(na)).toBe('Sodium, Z 11, group 1, period 3')
  })

  it('appends a value when one is shown', () => {
    const na = elementBySymbol('Na')
    expect(na && cellAriaLabel(na, '0.93')).toBe('Sodium, Z 11, group 1, period 3, 0.93')
  })
})

describe('ScaleLegend markup', () => {
  it('labels the gradient with its range and unit', () => {
    const html = render(
      <ScaleLegend
        stops={['#000000', '#FFFFFF']}
        domain={[0.8, 4]}
        unit="Pauling"
        label="Electronegativity"
        kind="sequential"
      />
    )
    expect(html).toContain('Electronegativity: from 0.8 to 4 Pauling')
    expect(html).toContain('No data')
  })

  it('marks the neutral midpoint on a diverging scale', () => {
    const html = render(
      <ScaleLegend
        stops={['#000000', '#888888', '#FFFFFF']}
        domain={[-1, 3]}
        unit="eV"
        label="Electron affinity"
        kind="diverging"
        midpoint={0}
      />
    )
    expect(html).toContain('neutral at 0 eV')
  })
})

describe('ElementTile markup', () => {
  it('shows NCERT terms and kJ mol⁻¹ values, and the configuration', () => {
    const na = elementBySymbol('Na') ?? null
    const html = render(<ElementTile element={na} configuration="[Ne] 3s¹" />)
    expect(html).toContain('Sodium')
    expect(html).toContain('Ionization enthalpy')
    expect(html).toContain('kJ mol⁻¹')
    expect(html).toContain('[Ne] 3s¹')
  })

  it('shows question marks and a caption for a predicted element', () => {
    const eka = { ...(elementBySymbol('H') as NonNullable<ReturnType<typeof elementBySymbol>>), Z: 31, symbol: 'Ea', name: 'Eka-aluminium', ncertName: undefined, atomicMass: 68, electronegativity: null, firstIonizationEnergyKjPerMol: null, electronAffinityEv: null, atomicRadiusPm: null }
    const html = render(<ElementTile element={eka} predicted />)
    expect(html).toContain('Predicted by Mendeleev')
    expect(html).not.toContain('Not available')
    expect(html).toContain('?')
  })

  it('reports Not available for a missing value', () => {
    const he = elementBySymbol('He') ?? null
    const html = render(<ElementTile element={he} />)
    expect(html).toContain('Not available')
  })
})
