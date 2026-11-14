import React from 'react'
import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { Label } from './Label'

describe('Label', () => {
  it('keeps the default fill when fill is undefined', () => {
    const html = renderToStaticMarkup(<svg><Label fill={undefined}>x</Label></svg>)
    expect(html).toContain('fill="var(--fg-muted)"')
  })

  it('uses a fill that is given', () => {
    const html = renderToStaticMarkup(<svg><Label fill="var(--fg)">x</Label></svg>)
    expect(html).toContain('fill="var(--fg)"')
  })
})
