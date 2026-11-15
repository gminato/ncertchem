'use client'

import { GibbsPlot } from '@/components/thermo'
import { Label } from '@/components/vocab'
import { signCaseSteps } from './gibbs-steps'
import { useSweptNumber } from './useTweenedNumber'

export interface SignCasesProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 330
const T_MIN = 200
const T_MAX = 1200
const SCALE = 1.15
/** Plot is 300 × 226 units before scaling; centred horizontally in the viewBox. */
const PLOT_X = (VIEW_WIDTH - 300 * SCALE) / 2
const PLOT_Y = 40

const CASES = signCaseSteps()

/**
 * The four sign cases of ΔH and ΔS on one plot each. A marker sweeps the temperature from 200 K to
 * 1200 K on every Step, so the Learner sees where ΔG crosses zero (if it does) and which side of
 * it is spontaneous.
 */
export function SignCases({ step, reducedMotion }: SignCasesProps) {
  const index = Math.min(CASES.length - 1, Math.max(0, Math.round(step)))
  const current = CASES[index]
  // The marker restarts at the low end on each Step and sweeps to the high end.
  const temperature = useSweptNumber(index, T_MIN, T_MAX, reducedMotion, 1.6)

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`ΔG against temperature for the case ${current.title}, with the spontaneous region shaded`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="gibbs-sign-cases"
      data-step={index}
    >
      <Label x={VIEW_WIDTH / 2} y={18} fontSize={16} fill="var(--fg)">
        {current.title}
      </Label>

      <g transform={`translate(${PLOT_X}, ${PLOT_Y}) scale(${SCALE})`}>
        <GibbsPlot
          dH={current.dH}
          dS={current.dS}
          tMin={T_MIN}
          tMax={T_MAX}
          temperature={temperature}
          title={`ΔG against T for ${current.title}`}
        />
      </g>

      <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 26} fontSize={13} fill="var(--fg-muted)">
        {current.note}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 8} fontSize={14} fill="var(--fg)">
        Table 5.4: {current.table}
      </Label>
    </svg>
  )
}
