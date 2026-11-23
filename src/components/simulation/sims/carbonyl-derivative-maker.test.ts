import { describe, expect, it } from 'vitest'
import { skeletalBounds } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { CARBONYL_SMILES, outcome, reagentsFor, type CarbonylId, type ReagentId } from '@/lib/chem/carbonyl-derivatives'

const DRAW_SCALE = 42

describe('carbonyl derivative drawings fit the 560 x 360 viewBox', () => {
  const cases: [CarbonylId, ReagentId][] = (['propanal', 'butanone'] as const).flatMap((c) =>
    reagentsFor(c).map((r) => [c, r] as [CarbonylId, ReagentId]),
  )
  it.each(cases)('%s + %s stays inside the 12-unit margin', (c, r) => {
    const o = outcome(c, r)
    const b = skeletalBounds(parseSmiles(o.drawnSmiles), DRAW_SCALE)
    expect(b.width + 24).toBeLessThanOrEqual(560)
    expect(b.height).toBeLessThanOrEqual(240)
  })
  it('the carbonyl compounds fit too', () => {
    for (const s of Object.values(CARBONYL_SMILES)) {
      const b = skeletalBounds(parseSmiles(s), DRAW_SCALE)
      expect(b.width + 24).toBeLessThanOrEqual(560)
    }
  })
})
