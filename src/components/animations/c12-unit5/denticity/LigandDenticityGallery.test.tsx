import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LigandDenticityGallery } from './LigandDenticityGallery'

describe('LigandDenticityGallery', () => {
  it('renders all five steps with expected labels', () => {
    const s0 = renderToStaticMarkup(<LigandDenticityGallery step={0} reducedMotion />)
    expect(s0).toContain('1 donor atom')
    expect(s0).toContain('unidentate')

    const s1 = renderToStaticMarkup(<LigandDenticityGallery step={1} reducedMotion />)
    expect(s1).toContain('chelate ring')
    expect(s1).toContain('didentate, 2 donor atoms, chelate ring')

    const s2 = renderToStaticMarkup(<LigandDenticityGallery step={2} reducedMotion />)
    expect(s2).toContain('polydentate')
    expect(s2).toContain('4 donor atoms')

    const s3 = renderToStaticMarkup(<LigandDenticityGallery step={3} reducedMotion />)
    expect(s3).toContain('hexadentate, 2 N + 4 O')
    expect(s3).toContain('EDTA')

    const s4 = renderToStaticMarkup(<LigandDenticityGallery step={4} reducedMotion />)
    expect(s4).toContain('nitrito-N')
    expect(s4).toContain('nitrito-O')
    expect(s4).toContain('thiocyanato-S')
    expect(s4).toContain('thiocyanato-N')
    expect(s4).toContain('two possible donors, only one used at a time')
  })
})
