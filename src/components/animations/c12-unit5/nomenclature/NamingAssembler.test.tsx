import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { NamingAssembler } from './NamingAssembler'

describe('NamingAssembler SVG', () => {
  it('renders all 6 steps with expected key labels', () => {
    const step0 = renderToStaticMarkup(<NamingAssembler step={0} />)
    expect(step0).toContain('metal first, ligands outward')
    expect(step0).toContain('[Co(NH₃)₄Cl₂]Cl')

    const step1 = renderToStaticMarkup(<NamingAssembler step={1} />)
    expect(step1).toContain('ligands first, metal last')
    expect(step1).toContain('tetraamminedichloridocobalt(III) chloride')

    const step2 = renderToStaticMarkup(<NamingAssembler step={2} />)
    expect(step2).toContain('ignored for sorting')
    expect(step2).toContain('thane-1,2-diamine')

    const step3 = renderToStaticMarkup(<NamingAssembler step={3} />)
    expect(step3).toContain('aqua')
    expect(step3).toContain('ammine')
    expect(step3).toContain('carbonyl')
    expect(step3).toContain('nitrosyl')

    const step4 = renderToStaticMarkup(<NamingAssembler step={4} />)
    expect(step4).toContain('entity is 4−')
    expect(step4).toContain('+2 − 6 = −4')

    const step5 = renderToStaticMarkup(<NamingAssembler step={5} />)
    expect(step5).toContain('iron(II)')
    expect(step5).toContain('ferrate(II)')
    expect(step5).toContain('silver(I)')
    expect(step5).toContain('argentate(I)')
  })
})
