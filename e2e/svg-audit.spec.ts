import { test, expect } from '@playwright/test'
import { auditSvg } from './support/svg-audit'

// The shared SVG audit, checked on hand-made drawings: one clean, one with every kind of fault.
test.use({ viewport: { width: 1200, height: 800 } })

const svgPage = (body: string) =>
  `<!doctype html><html><body style="margin:0"><svg role="img" viewBox="0 0 600 400" width="600" height="400" style="font-family:sans-serif">${body}</svg></body></html>`

test('a clean drawing passes', async ({ page }) => {
  await page.setContent(
    svgPage(`
      <text x="40" y="60" font-size="16">reactants</text>
      <text x="300" y="60" font-size="16">products</text>
      <text x="100" y="200" font-size="16">C<tspan baseline-shift="sub" font-size="10">2</tspan>H<tspan baseline-shift="sub" font-size="10">5</tspan>Br</text>
      <text x="200" y="200" font-size="16">Cl</text><circle cx="205" cy="195" r="10" fill="teal"/><text x="200" y="200" font-size="16">Cl</text>
      <text x="40" y="300" font-size="16" opacity="0">hidden label</text><text x="40" y="300" font-size="16">shown label</text>
      <line x1="10" y1="390" x2="590" y2="390" stroke="black"/>
    `)
  )
  expect(await auditSvg(page.locator('svg'), { minPx: 13 })).toEqual({ small: [], overlaps: [], outside: [] })
})

test('small text, overlapping labels and drawing outside the viewBox are reported', async ({ page }) => {
  await page.setContent(
    svgPage(`
      <text x="40" y="60" font-size="10">tiny</text>
      <text x="200" y="120" font-size="16">meta</text>
      <text x="204" y="124" font-size="16">para</text>
      <g transform="translate(-34 200) rotate(-90)"><text text-anchor="middle" font-size="16">Energy</text></g>
      <circle cx="590" cy="380" r="30" fill="none" stroke="black"/>
    `)
  )
  const audit = await auditSvg(page.locator('svg'), { minPx: 13 })
  expect(audit.small).toEqual(['10.0 px: tiny'])
  expect(audit.overlaps).toHaveLength(1)
  expect(audit.overlaps[0]).toContain('"meta" × "para"')
  expect(audit.outside.map((o) => o.split(' by ')[0])).toEqual(['text "Energy"', 'circle'])
})

test('rendered size scales with the SVG on screen', async ({ page }) => {
  await page.setContent(svgPage('<text x="40" y="60" font-size="16">label</text>').replace('width="600" height="400"', 'width="300" height="200"'))
  const audit = await auditSvg(page.locator('svg'), { minPx: 13 })
  expect(audit.small).toEqual(['8.0 px: label'])
})
