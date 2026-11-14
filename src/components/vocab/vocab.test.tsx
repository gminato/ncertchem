import React, { createRef } from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  VocabDefs,
  Electron,
  Nucleus,
  EnergyLevel,
  Photon,
  Label,
  mapWavelengthToVisualPeriod,
} from './index'

describe('VocabDefs', () => {
  it('renders defs with standard gradient and filter IDs', () => {
    const html = renderToStaticMarkup(
      <svg>
        <VocabDefs />
      </svg>
    )

    expect(html).toContain('id="vocab-electron-glow"')
    expect(html).toContain('id="vocab-sphere-shading"')
    expect(html).toContain('id="vocab-nucleus-halo"')
    expect(html).toContain('id="vocab-glow-filter"')
  })

  it('supports custom idPrefix', () => {
    const html = renderToStaticMarkup(
      <svg>
        <VocabDefs idPrefix="custom" />
      </svg>
    )

    expect(html).toContain('id="custom-electron-glow"')
    expect(html).toContain('id="custom-sphere-shading"')
    expect(html).toContain('id="custom-nucleus-halo"')
  })
})

describe('Electron', () => {
  it('renders an SVG <g> with core circle and glow halo', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Electron x={10} y={20} size={12} />
      </svg>
    )

    expect(html).toContain('<g transform="translate(10, 20) scale(1)"')
    expect(html).toContain('fill="var(--electron)"')
    expect(html).toContain('fill="url(#vocab-electron-glow)"')
    expect(html).toContain('--glow-strength')
    // No hardcoded hex color values
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })

  it('forwards ref to SVGGElement', () => {
    const ref = createRef<SVGGElement>()
    renderToStaticMarkup(<Electron ref={ref} />)
    // Ref forwarding defined on component
    expect(Electron).toHaveProperty('render')
  })
})

describe('Nucleus', () => {
  it('renders single proton for Hydrogen-1', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Nucleus protons={1} neutrons={0} />
      </svg>
    )

    expect(html).toContain('fill="var(--proton)"')
    expect(html).not.toContain('fill="var(--neutron)"')
    expect(html).toContain('fill="url(#vocab-nucleus-halo)"')
    expect(html).not.toMatch(/#[0-9a-fA-F]{3,8}/)
  })

  it('renders deterministic 4-nucleon cluster for Helium-4 (2p 2n)', () => {
    const html1 = renderToStaticMarkup(
      <svg>
        <Nucleus protons={2} neutrons={2} />
      </svg>
    )
    const html2 = renderToStaticMarkup(
      <svg>
        <Nucleus protons={2} neutrons={2} />
      </svg>
    )

    // Perfectly identical renders between runs (no Math.random)
    expect(html1).toBe(html2)

    // Contains both proton and neutron fills
    expect(html1).toContain('fill="var(--proton)"')
    expect(html1).toContain('fill="var(--neutron)"')

    // Count occurrences of protons and neutrons
    const protonMatches = html1.match(/fill="var\(--proton\)"/g) ?? []
    const neutronMatches = html1.match(/fill="var\(--neutron\)"/g) ?? []
    expect(protonMatches.length).toBe(2)
    expect(neutronMatches.length).toBe(2)
  })

  it('renders deterministic 7-nucleon cluster for Lithium-7 (3p 4n)', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Nucleus protons={3} neutrons={4} />
      </svg>
    )

    const protonMatches = html.match(/fill="var\(--proton\)"/g) ?? []
    const neutronMatches = html.match(/fill="var\(--neutron\)"/g) ?? []
    expect(protonMatches.length).toBe(3)
    expect(neutronMatches.length).toBe(4)
  })

  it('renders a single shaded sphere for counts > 20', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Nucleus protons={26} neutrons={30} />
      </svg>
    )

    // Total = 56 (> 20)
    // Should NOT render 56 separate nucleon circles
    const nucleonFills = html.match(/fill="var\(--proton\)"/g) ?? []
    expect(nucleonFills.length).toBe(1)
    expect(html).toContain('fill="url(#vocab-nucleus-halo)"')
    expect(html).toContain('fill="url(#vocab-sphere-shading)"')
  })
})

describe('EnergyLevel', () => {
  it('renders circular orbit variant when inactive and active', () => {
    const inactiveHtml = renderToStaticMarkup(
      <svg>
        <EnergyLevel variant="orbit" r={50} active={false} />
      </svg>
    )
    expect(inactiveHtml).toContain('<circle')
    expect(inactiveHtml).toContain('r="50"')
    expect(inactiveHtml).toContain('stroke="var(--orbit)"')

    const activeHtml = renderToStaticMarkup(
      <svg>
        <EnergyLevel variant="orbit" r={50} active={true} />
      </svg>
    )
    expect(activeHtml).toContain('stroke="var(--orbit-active)"')
    expect(activeHtml).toContain('stroke-width="2.5"')
  })

  it('renders horizontal ladder variant when inactive and active', () => {
    const ladderHtml = renderToStaticMarkup(
      <svg>
        <EnergyLevel variant="ladder" width={120} active={false} />
      </svg>
    )
    expect(ladderHtml).toContain('<line')
    expect(ladderHtml).toContain('x1="-60"')
    expect(ladderHtml).toContain('x2="60"')
    expect(ladderHtml).toContain('stroke="var(--orbit)"')

    const activeLadderHtml = renderToStaticMarkup(
      <svg>
        <EnergyLevel variant="ladder" width={120} active={true} />
      </svg>
    )
    expect(activeLadderHtml).toContain('stroke="var(--orbit-active)"')
  })
})

describe('Photon', () => {
  it('renders visible 656 nm photon with solid stroke and spectral red', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Photon wavelengthNm={656} x={0} y={0} length={100} />
      </svg>
    )

    expect(html).toContain('<path')
    expect(html).toContain('stroke="rgb(255, 0, 0)"')
    // Visible light should NOT be dashed
    expect(html).not.toContain('stroke-dasharray')
  })

  it('renders non-visible 121 nm (UV) and 1875 nm (IR) photons dashed with fallback colors', () => {
    const uvHtml = renderToStaticMarkup(
      <svg>
        <Photon wavelengthNm={121} />
      </svg>
    )
    // Non-visible should have stroke-dasharray
    expect(uvHtml).toContain('stroke-dasharray="5 4"')
    // UV fallback color #7B61FF -> rgb(123, 97, 255)
    expect(uvHtml).toContain('stroke="rgb(123, 97, 255)"')

    const irHtml = renderToStaticMarkup(
      <svg>
        <Photon wavelengthNm={1875} />
      </svg>
    )
    expect(irHtml).toContain('stroke-dasharray="5 4"')
    // IR fallback color #8B2E2E -> rgb(139, 46, 46)
    expect(irHtml).toContain('stroke="rgb(139, 46, 46)"')
  })

  it('scales visual period monotonically with physical wavelength', () => {
    const period121 = mapWavelengthToVisualPeriod(121)
    const period410 = mapWavelengthToVisualPeriod(410)
    const period486 = mapWavelengthToVisualPeriod(486)
    const period656 = mapWavelengthToVisualPeriod(656)
    const period1875 = mapWavelengthToVisualPeriod(1875)

    expect(period121).toBeLessThan(period410)
    expect(period410).toBeLessThan(period486)
    expect(period486).toBeLessThan(period656)
    expect(period656).toBeLessThan(period1875)
  })

  it('supports explicit endpoint props (x1, y1, x2, y2)', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Photon wavelengthNm={486} x1={10} y1={20} x2={110} y2={20} />
      </svg>
    )

    expect(html).toContain('<path')
    expect(html).toContain('M10.00,20.00')
  })
})

describe('Label', () => {
  it('renders SVG <text> with small-caps styling in --font-sans and --fg-muted', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Label x={50} y={60}>Proton</Label>
      </svg>
    )

    expect(html).toContain('<text')
    expect(html).toContain('x="50"')
    expect(html).toContain('y="60"')
    expect(html).toContain('fill="var(--fg-muted)"')
    expect(html).toContain('font-family="var(--font-sans)"')
    expect(html).toContain('all-small-caps')
    expect(html).toContain('Proton')
  })

  it('renders subscript and superscript helpers', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Label sub="2" sup="+">O</Label>
      </svg>
    )

    expect(html).toContain('<tspan dy="0.32em"')
    expect(html).toContain('2')
    expect(html).toContain('+')
  })

  it('renders Label.Sub and Label.Sup subcomponents', () => {
    const html = renderToStaticMarkup(
      <svg>
        <Label>
          H<Label.Sub>2</Label.Sub><Label.Sup>+</Label.Sup>
        </Label>
      </svg>
    )

    expect(html).toContain('H')
    expect(html).toContain('2')
    expect(html).toContain('+')
  })
})
