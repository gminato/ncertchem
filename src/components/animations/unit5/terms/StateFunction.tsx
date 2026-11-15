'use client'

import { Label } from '@/components/vocab'
import { STATE_FUNCTION_DEMO_PATHS, deltaU } from '@/lib/chem/thermo-first-law'
import { formatSignedJoule } from './joule-steps'
import {
  CAMP_A,
  CAMP_B,
  ROUTE_1,
  ROUTE_2,
  STATE_FUNCTION_STEP_COUNT,
  pointAlong,
  routeSoFar,
  stateFunctionSnapshotForStep,
  type Pt,
} from './state-function-steps'
import { clampIndex, useTweenedSnapshot } from './useTweenedSnapshot'
import styles from './terms.module.css'

export interface StateFunctionProps {
  step: number
  reducedMotion: boolean
}

// Viewbox for the ~570 px Scrolly panel. The gauge sits on the left, the two camps and their
// routes fill the middle, and the ΔU bracket sits on the right.
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 340
const GAUGE_X = 70
const GAUGE_TOP = CAMP_B.y - 24
const BRACKET_X = 482
const ROUTE_1_COLOUR = 'var(--accent)'
const ROUTE_2_COLOUR = 'var(--fg-muted)'
const [ROUTE_1_PATH, ROUTE_2_PATH] = STATE_FUNCTION_DEMO_PATHS
const DELTA_U_J = deltaU(ROUTE_1_PATH.q, ROUTE_1_PATH.w)

function polyline(points: Pt[]): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
}

/**
 * StateFunction: a mountain-height analogy for Section 5.1.3. Camp A and camp B stand at two
 * altitudes on a gauge. Two walks climb between them, one direct and one winding. The altitude gain
 * is the same on both walks, as ΔU is for the two routes of q and w, but the walks differ.
 */
export function StateFunction({ step, reducedMotion }: StateFunctionProps) {
  const index = clampIndex(step, STATE_FUNCTION_STEP_COUNT)
  const view = useTweenedSnapshot(stateFunctionSnapshotForStep(index), reducedMotion)
  const motion = reducedMotion ? undefined : styles.enter

  const walker1 = pointAlong(ROUTE_1, view.progress1)
  const walker2 = pointAlong(ROUTE_2, view.progress2)
  const bracketTop = CAMP_B.y
  const bracketBottom = CAMP_A.y

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={styles.svg}
      role="img"
      aria-label={`A mountain-height analogy. Two camps, A and B, stand at different heights on a gauge. Two walks climb between them, and both gain the same height. Step ${index + 1} of ${STATE_FUNCTION_STEP_COUNT}.`}
      data-testid="thermo-state-function"
      data-step={index}
    >
      {/* The altitude gauge: a vertical axis with the two levels marked. */}
      <g>
        <line x1={GAUGE_X} y1={GAUGE_TOP} x2={GAUGE_X} y2={bracketBottom + 6} strokeWidth={1.5} style={{ stroke: 'var(--fg-subtle)' }} />
        <line x1={GAUGE_X - 6} y1={CAMP_A.y} x2={GAUGE_X + 6} y2={CAMP_A.y} strokeWidth={1.5} style={{ stroke: 'var(--fg-subtle)' }} />
        <line x1={GAUGE_X - 6} y1={CAMP_B.y} x2={GAUGE_X + 6} y2={CAMP_B.y} strokeWidth={1.5} style={{ stroke: 'var(--fg-subtle)' }} />
        <line x1={GAUGE_X} y1={CAMP_A.y} x2={CAMP_A.x - 10} y2={CAMP_A.y} strokeWidth={1} strokeDasharray="3 4" style={{ stroke: 'var(--fg-subtle)' }} />
        <line x1={GAUGE_X} y1={CAMP_B.y} x2={CAMP_B.x - 10} y2={CAMP_B.y} strokeWidth={1} strokeDasharray="3 4" style={{ stroke: 'var(--fg-subtle)' }} />
        <Label x={GAUGE_X} y={GAUGE_TOP - 16} fontSize={15} fill="var(--fg)">
          <tspan className="sym">U</tspan>
        </Label>
        <Label x={GAUGE_X - 12} y={CAMP_A.y} fontSize={14} fill="var(--fg)" textAnchor="end">
          <tspan className="sym">U</tspan>
          <tspan className="sym" dy="5" fontSize={11}>A</tspan>
        </Label>
        <Label x={GAUGE_X - 12} y={CAMP_B.y} fontSize={14} fill="var(--fg)" textAnchor="end">
          <tspan className="sym">U</tspan>
          <tspan className="sym" dy="5" fontSize={11}>B</tspan>
        </Label>
      </g>

      {/* The camps. */}
      <g>
        <circle cx={CAMP_A.x} cy={CAMP_A.y} r={7} style={{ fill: 'var(--fg)' }} />
        <circle cx={CAMP_B.x} cy={CAMP_B.y} r={7} style={{ fill: 'var(--fg)' }} />
        <Label x={CAMP_A.x} y={CAMP_A.y + 26} fontSize={15} fill="var(--fg)">
          <tspan className="sym">A</tspan>
        </Label>
        <Label x={CAMP_B.x} y={CAMP_B.y - 22} fontSize={15} fill="var(--fg)">
          <tspan className="sym">B</tspan>
        </Label>
      </g>

      {/* Route 1: the direct climb. */}
      <g opacity={view.alpha1} data-route="1">
        <path
          d={polyline(routeSoFar(ROUTE_1, view.progress1))}
          fill="none"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: ROUTE_1_COLOUR }}
        />
        <circle cx={walker1.x} cy={walker1.y} r={6} style={{ fill: ROUTE_1_COLOUR }} />
      </g>

      {/* Route 2: the winding climb. */}
      <g opacity={view.alpha2} data-route="2">
        <path
          d={polyline(routeSoFar(ROUTE_2, view.progress2))}
          fill="none"
          strokeWidth={3}
          strokeDasharray="7 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ stroke: ROUTE_2_COLOUR }}
        />
        <circle cx={walker2.x} cy={walker2.y} r={6} style={{ fill: ROUTE_2_COLOUR }} />
      </g>

      {/* The ΔU bracket, from camp A up to camp B on the right. */}
      <g opacity={view.bracket} data-testid="delta-u-bracket">
        <line x1={BRACKET_X} y1={bracketTop} x2={BRACKET_X} y2={bracketBottom} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
        <line x1={BRACKET_X - 6} y1={bracketTop} x2={BRACKET_X} y2={bracketTop} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
        <line x1={BRACKET_X - 6} y1={bracketBottom} x2={BRACKET_X} y2={bracketBottom} strokeWidth={2} style={{ stroke: 'var(--fg)' }} />
        <Label x={BRACKET_X + 12} y={(bracketTop + bracketBottom) / 2 - 12} fontSize={15} fill="var(--fg)" textAnchor="start">
          <tspan className="sym">ΔU</tspan>
        </Label>
        <Label x={BRACKET_X + 12} y={(bracketTop + bracketBottom) / 2 + 10} fontSize={14} fill="var(--fg)" textAnchor="start">
          {formatSignedJoule(DELTA_U_J)}
        </Label>
      </g>

      {/* Legend: the two walks, with their heat and work. */}
      <Label x={GAUGE_X} y={300} fontSize={14} fill={ROUTE_1_COLOUR} textAnchor="start">
        Route 1: <tspan className="sym">q</tspan> = {formatSignedJoule(ROUTE_1_PATH.q)}, <tspan className="sym">w</tspan> = {formatSignedJoule(ROUTE_1_PATH.w)}
      </Label>
      <Label x={GAUGE_X} y={322} fontSize={14} fill="var(--fg)" textAnchor="start">
        Route 2: <tspan className="sym">q</tspan> = {formatSignedJoule(ROUTE_2_PATH.q)}, <tspan className="sym">w</tspan> = {formatSignedJoule(ROUTE_2_PATH.w)}
      </Label>
    </svg>
  )
}
