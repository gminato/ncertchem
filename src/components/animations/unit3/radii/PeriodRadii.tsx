'use client'

import { AtomSizeRow, type AtomSizeItem } from '@/components/periodic/AtomSizeRow'
import { PERIODIC_TABLE, slaterZeff, periodOf } from '@/lib/chem/periodic-data'
import { ncertAtomRadiusPm } from '@/lib/chem/ionic-radii'
import { RadiusColumns } from './RadiusColumns'

export interface RadiiStepProps {
  step: number
  reducedMotion: boolean
}

const WIDTH = 600
const MAX_RADIUS_PX = 40

/** Period 2 elements Li to F, with NCERT Table 3.6(a) radii and Slater Z_eff. */
const PERIOD_TWO = ['Li', 'Be', 'B', 'C', 'N', 'O', 'F'] as const

function bySymbol(symbol: string) {
  const el = PERIODIC_TABLE.find((e) => e.symbol === symbol)
  if (!el) throw new RangeError(`Unknown element ${symbol}`)
  return el
}

function zEffText(Z: number): string {
  return slaterZeff(Z).toFixed(2)
}

const PERIOD_TWO_ITEMS: readonly AtomSizeItem[] = PERIOD_TWO.map((s) => ({
  label: s,
  radiusPm: ncertAtomRadiusPm(s) as number,
}))

/** Step targets for the period 2 Scrolly: which columns are lit, and whether Z_eff shows. */
export function periodTwoTarget(step: number): { active: readonly [number, number] | null; showZeff: boolean } {
  switch (step) {
    case 0:
      return { active: [0, 0], showZeff: false }
    case 1:
      return { active: [6, 6], showZeff: false }
    default:
      return { active: [0, PERIOD_TWO.length - 1], showZeff: true }
  }
}

/** Scrolly visual: atomic radii across period 2, with Slater Z_eff under each element. */
export function PeriodTwoRadii({ step, reducedMotion }: RadiiStepProps) {
  const target = periodTwoTarget(step)
  const zEffs = PERIOD_TWO.map((s) => zEffText(bySymbol(s).Z))
  return (
    <div style={{ width: '100%', padding: '8px 4px' }}>
      <RadiusColumns
        count={PERIOD_TWO.length}
        active={target.active}
        footer={target.showZeff ? zEffs : undefined}
        footerTitle="Slater effective nuclear charge Z_eff for each element of period 2"
        reducedMotion={reducedMotion}
      >
        <AtomSizeRow
          items={PERIOD_TWO_ITEMS}
          title="Atomic radii of period 2 elements, Li to F, from NCERT Table 3.6(a): 152, 111, 88, 77, 74, 66, 64 pm"
          width={WIDTH}
          maxRadiusPx={MAX_RADIUS_PX}
        />
      </RadiusColumns>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-subtle)', textAlign: 'center' }}>
        {target.showZeff
          ? 'Z_eff is estimated with Slater’s rules (periodicity model), not printed by NCERT.'
          : 'Radii: NCERT Table 3.6(a), pm.'}
      </p>
    </div>
  )
}

const GROUP_ONE = ['Li', 'Na', 'K', 'Rb', 'Cs'] as const

const GROUP_ONE_ITEMS: readonly AtomSizeItem[] = GROUP_ONE.map((s) => ({
  label: s,
  radiusPm: ncertAtomRadiusPm(s) as number,
}))

/** Step targets for the group 1 Scrolly. */
export function groupOneTarget(step: number): { active: readonly [number, number] | null; shells: boolean } {
  switch (step) {
    case 0:
      return { active: [0, 1], shells: false }
    case 1:
      return { active: [2, 4], shells: false }
    default:
      return { active: [0, GROUP_ONE.length - 1], shells: true }
  }
}

/** Scrolly visual: atomic radii down group 1, with the valence shell n under each element. */
export function GroupOneRadii({ step, reducedMotion }: RadiiStepProps) {
  const target = groupOneTarget(step)
  const shells = GROUP_ONE.map((s) => `n = ${periodOf(bySymbol(s).Z)}`)
  return (
    <div style={{ width: '100%', padding: '8px 4px' }}>
      <RadiusColumns
        count={GROUP_ONE.length}
        active={target.active}
        footer={target.shells ? shells : undefined}
        footerTitle="Principal quantum number n of the valence shell"
        reducedMotion={reducedMotion}
      >
        <AtomSizeRow
          items={GROUP_ONE_ITEMS}
          title="Atomic radii of group 1 elements, Li to Cs, from NCERT Table 3.6(b): 152, 186, 231, 244, 262 pm"
          width={WIDTH}
          maxRadiusPx={MAX_RADIUS_PX}
        />
      </RadiusColumns>
      <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--fg-subtle)', textAlign: 'center' }}>
        Radii: NCERT Table 3.6(b), pm.
      </p>
    </div>
  )
}
