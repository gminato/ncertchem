import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CoordinationPolyhedraGallery } from './CoordinationPolyhedraGallery'

describe('CoordinationPolyhedraGallery', () => {
  it('renders all four steps with NCERT Fig. 5.1 labels and examples', () => {
    const s0 = renderToStaticMarkup(<CoordinationPolyhedraGallery step={0} reducedMotion />)
    expect(s0).toContain('octahedral, CN = 6')
    expect(s0).toContain('[Co(NH₃)₆]³⁺')

    const s1 = renderToStaticMarkup(<CoordinationPolyhedraGallery step={1} reducedMotion />)
    expect(s1).toContain('tetrahedral, CN = 4')
    expect(s1).toContain('[Ni(CO)₄]')

    const s2 = renderToStaticMarkup(<CoordinationPolyhedraGallery step={2} reducedMotion />)
    expect(s2).toContain('square planar, CN = 4')
    expect(s2).toContain('[PtCl₄]²⁻')

    const s3 = renderToStaticMarkup(<CoordinationPolyhedraGallery step={3} reducedMotion />)
    expect(s3).toContain('trigonal bipyramidal')
    expect(s3).toContain('square pyramidal')
    expect(s3).toContain('CN = 5')
  })
})
