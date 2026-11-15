'use client'

import { isBalanced } from '@/lib/chem/redox-balance'
import { EquationView, Ce, TallyStrip, type TallyChip } from './BalanceEquation'
import { rolesFromSkeleton } from './balance-equation'
import { getONStep, ON_MEDIUM, ON_SKELETON, ON_STEP_COUNT } from './balance-on-steps'
import styles from './balance-on.module.css'

export interface RedoxBalanceONProps {
  step: number
  reducedMotion: boolean
}

const STEP_TITLES = [
  'Skeletal ionic equation',
  'Assign oxidation numbers',
  'Equalise the changes',
  'Balance charge with H⁺',
  'Balance H and O with H₂O',
] as const

const ROLES = rolesFromSkeleton(ON_SKELETON)

function equationChips(equation: string): TallyChip[] {
  const v = isBalanced(equation)
  return [
    ...Object.entries(v.atomBalance).map(([item, b]) => ({
      item,
      left: b.reactant,
      right: b.product,
      balanced: b.balanced,
    })),
    {
      item: 'Charge',
      left: v.chargeBalance.reactant,
      right: v.chargeBalance.product,
      balanced: v.chargeBalance.balanced,
    },
  ]
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : n < 0 ? `−${Math.abs(n)}` : '0'
}

/** One Scrolly Step of the oxidation-number method for MnO4- + C2O4^2- in acid. */
export function RedoxBalanceON({ step, reducedMotion }: RedoxBalanceONProps) {
  const index = Math.min(ON_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = getONStep(index)
  const prev = index > 0 ? getONStep(index - 1) : undefined
  const motion = !reducedMotion
  const { oxidised, reduced, lcm } = data.onChanges
  const equalised = index >= 2

  return (
    <div className={styles.container} data-animation="redox-balance-on" data-step={index}>
      <header className={styles.header}>
        <span className={styles.stepPill}>
          Step {data.stepNumber} of {ON_STEP_COUNT}
        </span>
        <span className={styles.title} data-testid="on-step-title">
          {STEP_TITLES[index]}
        </span>
      </header>

      <div className={styles.heroBox}>
        <EquationView
          equation={data.equationMhchem}
          previous={prev?.equationMhchem}
          roles={index >= 1 ? ROLES : undefined}
          size="hero"
          animKey={`on-${index}`}
          reducedMotion={!motion}
          data-testid="on-equation"
        />
      </div>

      {index >= 1 && index <= 2 && (
        <div className={styles.changes}>
          <section className={`${styles.change} ${styles.changeOx}`} aria-label="Oxidation">
            <span className={styles.changeTag}>Oxidised · reductant</span>
            <span className={styles.changeSpecies}>
              <Ce ce={oxidised.species} />
            </span>
            <span className={styles.changeNums}>
              {oxidised.element} {signed(oxidised.from)} <span className={styles.arrowUp}>→</span> {signed(oxidised.to)}
            </span>
            <span className={styles.changeNote}>
              loses {oxidised.perUnitChange} e⁻ per formula unit
              {equalised && (
                <>
                  {' '}× <strong>{oxidised.multiplier}</strong> = {oxidised.totalChange}
                </>
              )}
            </span>
          </section>
          <section className={`${styles.change} ${styles.changeRed}`} aria-label="Reduction">
            <span className={styles.changeTag}>Reduced · oxidant</span>
            <span className={styles.changeSpecies}>
              <Ce ce={reduced.species} />
            </span>
            <span className={styles.changeNums}>
              {reduced.element} {signed(reduced.from)} <span className={styles.arrowDown}>→</span> {signed(reduced.to)}
            </span>
            <span className={styles.changeNote}>
              gains {Math.abs(reduced.perUnitChange)} e⁻ per formula unit
              {equalised && (
                <>
                  {' '}× <strong>{reduced.multiplier}</strong> = {Math.abs(reduced.totalChange)}
                </>
              )}
            </span>
          </section>
          {equalised && (
            <p className={styles.lcm}>
              Electrons lost = electrons gained = <strong>{lcm}</strong> (the lowest common multiple of{' '}
              {Math.abs(reduced.perUnitChange)} and {oxidised.perUnitChange})
            </p>
          )}
        </div>
      )}

      {index === 0 && <p className={styles.note}>Oxidation numbers are assigned in step 2.</p>}

      {index >= 1 && (
        <TallyStrip items={equationChips(data.equationMhchem)} label={`${ON_MEDIUM} medium tally`} />
      )}
    </div>
  )
}
