'use client'

import { AtomSizeRow, type AtomSizeItem } from '@/components/periodic/AtomSizeRow'
import { ncertAtomRadiusPm, speciesRadius } from '@/lib/chem/ionic-radii'
import { isoelectronicSeries } from '@/lib/chem/periodicity'
import type { RadiiStepProps } from './PeriodRadii'
import { RadiusColumns } from './RadiusColumns'

const WIDTH = 600
const MAX_RADIUS_PX = 60

/** Step 0: sodium atom and sodium ion. Step 1: fluorine atom and fluoride ion. */
const PAIRS: readonly [string, string, number][] = [
  ['Na', 'Na', 1],
  ['F', 'F', -1],
]

function pairItems(symbol: string, charge: number): AtomSizeItem[] {
  const atom = ncertAtomRadiusPm(symbol)
  const ion = speciesRadius(0, symbol, charge)
  if (atom === null || ion.pm === null) throw new RangeError(`No radius for ${symbol}${charge}`)
  return [
    { label: symbol, radiusPm: atom },
    { label: symbol, radiusPm: ion.pm, charge: charge > 0 ? '+' : '−' },
  ]
}

/**
 * The 10-electron isoelectronic species that carry a radius here: O²⁻, F⁻, Na⁺, Mg²⁺.
 * Neon is a noble gas, so NCERT gives it no ionic radius and it is left out of this row.
 */
function isoelectronicItems(): AtomSizeItem[] {
  return isoelectronicSeries(10, 2)
    .filter((s) => s.charge !== 0)
    .map((s) => {
      const r = speciesRadius(s.Z, s.symbol, s.charge)
      if (r.pm === null) throw new RangeError(`No radius for ${s.label}`)
      return { label: s.symbol, radiusPm: r.pm, charge: s.label.slice(s.symbol.length) }
    })
    .sort((a, b) => a.radiusPm - b.radiusPm)
    .reverse()
}

/** Scrolly visual for 3.7.1(b): atom and ion pairs, then the isoelectronic set of 10 electrons. */
export function IonicRadii({ step, reducedMotion }: RadiiStepProps) {
  if (step <= 1) {
    const [symbol, , charge] = PAIRS[step]
    const items = pairItems(symbol, charge)
    return (
      <div style={{ width: '100%', padding: '8px 4px' }}>
        <AtomSizeRow
          items={items}
          title={`Radius of the ${symbol} atom and its ${charge > 0 ? 'cation' : 'anion'}: ${items[0].radiusPm} pm and ${items[1].radiusPm} pm`}
          width={WIDTH}
          maxRadiusPx={MAX_RADIUS_PX}
          labelPlacement="beneath"
        />
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-subtle)', textAlign: 'center' }}>
          Atom: NCERT Table 3.6. Ion: NCERT 3.7.1(b) text.
        </p>
      </div>
    )
  }
  const items = isoelectronicItems()
  return (
    <div style={{ width: '100%', padding: '8px 4px' }}>
      <RadiusColumns count={items.length} active={null} reducedMotion={reducedMotion}>
        <AtomSizeRow
          items={items}
          title="Ionic radii of the 10-electron species O²⁻, F⁻, Na⁺ and Mg²⁺, largest to smallest"
          width={WIDTH}
          maxRadiusPx={MAX_RADIUS_PX}
          labelPlacement="beneath"
        />
      </RadiusColumns>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-subtle)', textAlign: 'center' }}>
        Ionic radii: Pauling (1960). Atomic radii: NCERT Table 3.6.
      </p>
    </div>
  )
}
