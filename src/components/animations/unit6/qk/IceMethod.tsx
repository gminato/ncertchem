'use client'

import { IceTable, type IceCell } from '@/components/equilibrium'
import { reactionQuotient, type IceTable as IceData } from '@/lib/chem/equilibrium'
import { reactionCe, solveIceProblem } from '@/lib/chem/ice-solver'
import { Tex } from './Tex'
import { NOCL_K, NOCL_REACTION, NOCL_START } from './example'
import { ICE_STEP_COUNT, iceExample } from './ice-steps'
import styles from './IceMethod.module.css'

export interface IceMethodProps {
  step: number
  reducedMotion: boolean
}

const ICE: IceData = iceExample()
const PROBLEM = solveIceProblem({
  reaction: NOCL_REACTION,
  initial: { ...NOCL_START },
  k: NOCL_K,
  basis: 'concentration',
  temperatureK: 298,
})
const Q_EQ = reactionQuotient(NOCL_REACTION, ICE.equilibrium)

/** Two decimal places, as the worked example is written. */
const two = (v: number) => v.toFixed(2)

const SPECIES = ['[NO]', '[Cl₂]', '[NOCl]']

/** What each Step of the ICE Scrolly adds to the table and to the working below it. */
const REVEAL: Array<1 | 2 | 3> = [1, 2, 3, 3, 3]

/**
 * The ICE table for 2NO + Cl₂ ⇌ 2NOCl, filled one row per Step, with the working below it. The
 * equilibrium row is symbolic until the solver has run, then numeric, and the check uses the
 * library's reaction quotient.
 */
export function IceMethod({ step }: IceMethodProps) {
  const index = Math.min(ICE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const solved = index >= 4
  const showX = index >= 3

  const initial: IceCell[] = [NOCL_START.NO, NOCL_START.Cl2, NOCL_START.NOCl]
  const change: IceCell[] = ['−2x', '−x', '+2x']
  const equilibrium: IceCell[] = solved
    ? [ICE.equilibrium.NO, ICE.equilibrium.Cl2, ICE.equilibrium.NOCl]
    : [`${two(NOCL_START.NO)} − 2x`, `${two(NOCL_START.Cl2)} − x`, '2x']

  return (
    <div className={styles.stage} data-testid="ice-method" data-step={index}>
      <Tex tex={`\\ce{${reactionCe(NOCL_REACTION)}}`} className={styles.equation} />
      <div className={styles.table}>
        <IceTable
          species={SPECIES}
          initial={initial}
          change={change}
          equilibrium={equilibrium}
          rowNotes={showX ? { C: `x = ${ICE.extent.toFixed(2)}` } : undefined}
          revealStep={REVEAL[index]}
          caption="mol L⁻¹ (I: initial, C: change, E: equilibrium)"
        />
      </div>

      <div className={styles.working} aria-live="polite">
        {index === 0 && <Tex tex={`K_{c} = ${two(NOCL_K)} \\text{ (given)}`} display />}
        {index === 1 && <Tex tex={`\\text{Change: } -2x \\text{ for NO, } -x \\text{ for Cl}_2, +2x \\text{ for NOCl}`} display />}
        {index === 2 && (
          <Tex tex={`\\text{Equilibrium: start plus change, for example } [\\mathrm{NO}] = ${two(NOCL_START.NO)} - 2x`} display />
        )}
        {index === 3 && (
          <>
            <Tex tex={PROBLEM.equationTex} display />
            <p className={styles.note}>
              Bisection gives x = {ICE.extent.toFixed(2)} mol L⁻¹.
            </p>
          </>
        )}
        {index === 4 && (
          <>
            <Tex
              tex={`Q_{c} = \\dfrac{[\\mathrm{NOCl}]^{2}}{[\\mathrm{NO}]^{2}[\\mathrm{Cl}_{2}]} = \\dfrac{(${two(ICE.equilibrium.NOCl)})^{2}}{(${two(ICE.equilibrium.NO)})^{2}(${two(ICE.equilibrium.Cl2)})} = ${two(Q_EQ)} = K_{c}`}
              display
            />
          </>
        )}
      </div>
    </div>
  )
}
