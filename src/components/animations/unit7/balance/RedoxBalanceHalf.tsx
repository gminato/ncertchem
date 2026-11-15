'use client'

import { isBalanced } from '@/lib/chem/redox-balance'
import {
  getHalfStep,
  HALF_BASIC_ROUTE,
  HALF_SKELETON,
  HALF_STEP_COUNT,
  type HalfReactionStepData,
} from './balance-half-steps'
import { EquationView, HalfCard, TallyStrip, type TallyChip } from './BalanceEquation'
import { rolesFromSkeleton } from './balance-equation'
import styles from './balance-half.module.css'

export interface RedoxBalanceHalfProps {
  step: number
  reducedMotion: boolean
}

const STEP_TITLES = [
  'Skeletal ionic equation',
  'Separate into half-reactions',
  'Balance key atoms',
  'Balance O and H in basic medium',
  'Add electrons to balance charge',
  'Equalise electrons and add',
  'Verify the balance',
] as const

const ROLES = rolesFromSkeleton(HALF_SKELETON)

function halfChips(half: HalfReactionStepData): TallyChip[] {
  return half.tally.map((t) => ({ item: t.item, left: t.left, right: t.right, balanced: t.balanced }))
}

/** Atom and charge tally of a complete equation string, computed by the lib. */
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

/** One Scrolly Step of the basic-medium ion-electron method for Cr(OH)3 + ClO-. */
export function RedoxBalanceHalf({ step, reducedMotion }: RedoxBalanceHalfProps) {
  const index = Math.min(HALF_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const data = getHalfStep(index)
  const prev = index > 0 ? getHalfStep(index - 1) : undefined
  const motion = !reducedMotion
  const overall = data.overallEquationMhchem
  const hasMultipliers = data.oxHalf.multiplier !== undefined

  return (
    <div className={styles.container} data-animation="redox-balance-half" data-step={index}>
      <header className={styles.header}>
        <span className={styles.stepPill}>
          Step {data.stepNumber} of {HALF_STEP_COUNT}
        </span>
        <span className={styles.title} data-testid="half-step-title">
          {STEP_TITLES[index]}
        </span>
      </header>

      {index === 0 && (
        <div className={styles.heroBox}>
          <EquationView equation={HALF_SKELETON} roles={ROLES} size="hero" animKey="skeleton" reducedMotion={!motion} />
        </div>
      )}

      {index === 3 && (
        <div className={styles.route} data-testid="basic-route">
          <div className={styles.routeHead}>
            NCERT route in basic medium: balance as if acidic, add OH⁻ to both sides, then cancel water
          </div>
          {HALF_BASIC_ROUTE.map((group) => {
            const last = group.stages[group.stages.length - 1]
            return (
              <section key={group.key} className={styles.routeGroup} aria-label={group.title}>
                <div className={styles.routeTitle}>{group.title}</div>
                {group.stages.map((s, i) => (
                  <div key={s.equationMhchem} className={styles.routeStage}>
                    <span className={styles.routeLabel}>
                      <span className={styles.routeNo}>{i + 1}</span>
                      {s.label}
                    </span>
                    <EquationView
                      equation={s.equationMhchem}
                      roles={ROLES}
                      size="card"
                      animKey={`route-${group.key}-${i}`}
                      reducedMotion={!motion}
                    />
                  </div>
                ))}
                <TallyStrip items={equationChips(last.equationMhchem)} label={`${group.title}: final tally`} />
              </section>
            )
          })}
        </div>
      )}

      {index >= 1 && index !== 3 && index <= 4 && (
        <div className={styles.halves}>
          <HalfCard
            tone="ox"
            title="Oxidation half"
            subtitle="Cr(III) → Cr(VI)"
            equation={data.oxHalf.equationMhchem}
            previous={prev?.oxHalf.equationMhchem}
            electrons={data.oxHalf.electrons || undefined}
            tally={halfChips(data.oxHalf)}
            animKey={`ox-${index}`}
            reducedMotion={!motion}
          />
          <HalfCard
            tone="red"
            title="Reduction half"
            subtitle="Cl(I) → Cl(−I)"
            equation={data.redHalf.equationMhchem}
            previous={prev?.redHalf.equationMhchem}
            electrons={data.redHalf.electrons || undefined}
            tally={halfChips(data.redHalf)}
            animKey={`red-${index}`}
            reducedMotion={!motion}
          />
        </div>
      )}

      {index === 0 && (
        <p className={styles.note}>The two halves are split out in step 2.</p>
      )}

      {overall && index >= 5 && (
        <>
          <div className={styles.heroBox}>
            <EquationView
              equation={overall}
              previous={index === 5 ? undefined : prev?.overallEquationMhchem}
              roles={ROLES}
              size="hero"
              animKey={`overall-${index}`}
              reducedMotion={!motion}
            />
          </div>
          <div className={styles.halves}>
            <HalfCard
              tone="ox"
              title="Oxidation half"
              subtitle="Cr(III) → Cr(VI)"
              equation={data.oxHalf.equationMhchem}
              previous={prev?.oxHalf.equationMhchem}
              electrons={data.oxHalf.electrons || undefined}
              multiplier={hasMultipliers ? data.oxHalf.multiplier : undefined}
              tally={halfChips(data.oxHalf)}
              animKey={`ox-${index}`}
              reducedMotion={!motion}
            />
            <HalfCard
              tone="red"
              title="Reduction half"
              subtitle="Cl(I) → Cl(−I)"
              equation={data.redHalf.equationMhchem}
              previous={prev?.redHalf.equationMhchem}
              electrons={data.redHalf.electrons || undefined}
              multiplier={hasMultipliers ? data.redHalf.multiplier : undefined}
              tally={halfChips(data.redHalf)}
              animKey={`red-${index}`}
              reducedMotion={!motion}
            />
          </div>
          <TallyStrip items={equationChips(overall)} label="Overall equation tally" />
        </>
      )}
    </div>
  )
}
