'use client'

import { PeriodicTable, type CellStyle } from '@/components/periodic/PeriodicTable'
import { ScaleLegend } from '@/components/periodic/ScaleLegend'
import { MISSING_FILL, SEQUENTIAL_VIRIDIS, sequentialScale } from '@/components/periodic/colour-scale'
import { ncertAtomRadiusPm } from '@/lib/chem/ionic-radii'
import { PERIODIC_TABLE, tablePosition, type ElementRecord } from '@/lib/chem/periodic-data'
import type { RadiiStepProps } from './PeriodRadii'

/** Domain of the shading, from the smallest NCERT radius (F, 64 pm) to the largest (Cs, 262 pm). */
const RADIUS_DOMAIN: [number, number] = [64, 262]
const fill = sequentialScale(RADIUS_DOMAIN, SEQUENTIAL_VIRIDIS)

/** Radii NCERT prints in Tables 3.6(a) and 3.6(b), or null for every other element. */
function radiusOf(el: ElementRecord): number | null {
  return ncertAtomRadiusPm(el.symbol)
}

/** Step targets: period 2 lit, then group 1 and group 17, then the whole NCERT set shaded. */
export function periodicMapTarget(step: number): { lit: (el: ElementRecord) => boolean; shade: boolean } {
  switch (step) {
    case 0:
      return { lit: (el) => el.period === 2 && radiusOf(el) !== null, shade: false }
    case 1:
      return { lit: (el) => el.group === 1 || el.group === 17, shade: false }
    default:
      return { lit: (el) => radiusOf(el) !== null, shade: true }
  }
}

/**
 * Scrolly visual on the periodic table: NCERT radii shaded on the cells that NCERT tabulates,
 * with the other cells dimmed and hatched.
 */
export function PeriodicRadiiMap({ step }: RadiiStepProps) {
  const target = periodicMapTarget(step)
  // Fills must be #rrggbb, so every tabulated cell takes its radius colour. Steps 0 and 1 dim
  // the cells outside the selection instead of changing their colour.
  const cell = (el: ElementRecord): CellStyle => {
    const pm = radiusOf(el)
    if (pm === null) return { fill: MISSING_FILL, dim: true }
    const lit = target.shade || target.lit(el)
    return { fill: fill(pm) ?? MISSING_FILL, value: String(pm), dim: !lit }
  }
  return (
    <div style={{ width: '100%' }}>
      <PeriodicTable
        elements={PERIODIC_TABLE}
        position={tablePosition}
        variant="compact"
        cell={cell}
        showGroupNumbers
        showPeriodNumbers
        title="Periodic table with NCERT atomic radii in pm where NCERT prints them"
      />
      <div style={{ marginTop: 8 }}>
        <ScaleLegend
          stops={SEQUENTIAL_VIRIDIS}
          domain={RADIUS_DOMAIN}
          unit="pm"
          label="Atomic radius (NCERT Table 3.6)"
          kind="sequential"
        />
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-subtle)' }}>
        Data: NCERT Tables 3.6(a) and 3.6(b). Hatched cells are not tabulated by NCERT.
      </p>
    </div>
  )
}
