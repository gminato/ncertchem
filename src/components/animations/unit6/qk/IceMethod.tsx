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
/** Three significant figures, kept with trailing zeros (2.00, 0.500, 1.30). Zero is shown as 0. */
const sf3 = (v: number) => (v === 0 ? '0' : v.toPrecision(3))

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

  const initial: IceCell[] = [sf3(NOCL_START.NO), sf3(NOCL_START.Cl2), sf3(NOCL_START.NOCl)]
  const change: IceCell[] = ['−2x', '−x', '+2x']
  const equilibrium: IceCell[] = solved
    ? [sf3(ICE.equilibrium.NO), sf3(ICE.equilibrium.Cl2), sf3(ICE.equilibrium.NOCl)]
    : [`${sf3(NOCL_START.NO)} − 2x`, `${sf3(NOCL_START.Cl2)} − x`, '2x']

  return (
    <div className={styles.stage} data-testid="ice-method" data-step={index}>
      <Tex tex={`\\ce{${reactionCe(NOCL_REACTION)}}`} className={styles.equation} />
      <div className={styles.table}>
        <IceTable
          species={SPECIES}
          initial={initial}
          change={change}
          equilibrium={equilibrium}
          rowNotes={showX ? { C: `x = ${sf3(ICE.extent)}` } : undefined}
          revealStep={REVEAL[index]}
          caption="mol L⁻¹ (I: initial, C: change, E: equilibrium)"
        />
      </div>

      <div className={styles.working} aria-live="polite">
        {index === 0 && <Tex tex={`K_{c} = ${sf3(NOCL_K)} \\text{ (given)}`} display />}
        {index === 1 && <Tex tex={`\\text{Change row: } -2x, \\; -x, \\; +2x`} display />}
        {index === 2 && (
          <>
            <p className={styles.note}>Equilibrium row: start plus change. For NO:</p>
            <Tex tex={`[\\mathrm{NO}]_{\\mathrm{eq}} = ${sf3(NOCL_START.NO)} - 2x`} display />
          </>
        )}
        {index === 3 && (
          <>
            <Tex tex={PROBLEM.equationTex} display />
            <p className={styles.note}>
              Bisection gives x = {sf3(ICE.extent)} mol L⁻¹.
            </p>
          </>
        )}
        {index === 4 && (
          <>
            <Tex
              tex={`Q_{c} = \\dfrac{[\\mathrm{NOCl}]^{2}}{[\\mathrm{NO}]^{2}[\\mathrm{Cl}_{2}]} = \\dfrac{(${sf3(ICE.equilibrium.NOCl)})^{2}}{(${sf3(ICE.equilibrium.NO)})^{2}(${sf3(ICE.equilibrium.Cl2)})} = ${sf3(Q_EQ)} = K_{c}`}
              display
            />
          </>
        )}
      </div>
    </div>
  )
}
