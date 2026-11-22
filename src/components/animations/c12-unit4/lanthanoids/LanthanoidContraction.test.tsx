import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LanthanoidContraction } from './LanthanoidContraction'
import { ATOMS_WITH_5D, FALL_BOTTOM_PM, FALL_TOP_PM } from './lanthanoid-steps'

describe('LanthanoidContraction drawing', () => {
  it('draws the 5d¹ tag under the atoms only, never under an Ln³⁺ ion', () => {
    const html = renderToStaticMarkup(<LanthanoidContraction step={0} />)
    expect(ATOMS_WITH_5D).toEqual(['La', 'Ce', 'Gd', 'Lu'])
    // Count only the tag <text> elements; the caption also contains "5d¹".
    const tagYs = [...html.matchAll(/<text x="[^"]+" y="(\d+(?:\.\d+)?)"[^>]*>5d¹<\/text>/g)].map((m) => Number(m[1]))
    expect(tagYs).toHaveLength(ATOMS_WITH_5D.length)
    // Each tag sits in the atom row, below the ion row's f count (y 306).
    expect(tagYs.every((y) => y > 306 && y < 360)).toBe(true)
  })

  it('reads the radius fall endpoints from the lib (La 106, Yb 86)', () => {
    expect(FALL_TOP_PM).toBe(106)
    expect(FALL_BOTTOM_PM).toBe(86)
  })

  it('shows the special ion count inside each outlined cell (Eu cell reads f⁷)', () => {
    const html = renderToStaticMarkup(<LanthanoidContraction step={4} />)
    expect(html).toContain('Eu²⁺')
    expect(html).toContain('Ce⁴⁺')
    expect(html).toContain('Grey cells: the Ln³⁺ f count')
  })
})
