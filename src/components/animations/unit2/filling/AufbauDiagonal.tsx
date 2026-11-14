'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { Label, VocabDefs } from '@/components/vocab'
import { electronConfiguration } from '@/lib/chem/quantum'
import { elementInfo } from '@/lib/chem/orbital-builder'
import {
  AUFBAU_STEP_COUNT,
  aufbauDescription,
  aufbauTargetForStep,
  clampStep,
  type AufbauSnapshot,
} from './filling-steps'
import styles from './filling.module.css'

export interface AufbauDiagonalProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 540, matching the Scrolly visual panel)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
/** Column x for s, p, d and f (l = 0 to 3). */
const COL_X = [150, 252, 354, 456]
const ROW_TOP = 96
const ROW_GAP = 56
const NODE_R = 20
const ROW_LABEL_X = 40
const COUNTER_X = 560
const DOT_ORIGIN = { x: 512, y: 226 }
const DOT_STEP = 16
const DOT_R = 5.5
const TOTAL_ELECTRONS = 36
const ARROW_HEAD = 9

const SUBSHELL_LETTERS = ['s', 'p', 'd', 'f'] as const

interface Node {
  n: number
  l: number
  label: string
  x: number
  y: number
  capacity: number
}

/** Every subshell from 1s to 7f that exists, placed on the n (rows) by l (columns) grid. */
const NODES: Node[] = []
for (let n = 1; n <= 7; n++) {
  for (let l = 0; l <= Math.min(n - 1, 3); l++) {
    NODES.push({
      n,
      l,
      label: `${n}${SUBSHELL_LETTERS[l]}`,
      x: COL_X[l],
      y: ROW_TOP + (n - 1) * ROW_GAP,
      capacity: 2 * (2 * l + 1),
    })
  }
}

/**
 * The diagonal arrows: one per value of n + l, through the subshells on that
 * diagonal, from the one with the smallest n (top right) to the largest (bottom left).
 */
const CHAINS: { nodes: Node[]; key: number }[] = []
for (let key = 1; key <= 8; key++) {
  const nodes = NODES.filter((node) => node.n + node.l === key).sort((a, b) => a.n - b.n)
  if (nodes.length >= 2) CHAINS.push({ nodes, key })
}

/** The arrow's end points, trimmed so the line starts and stops at the node edges. */
function chainSegment(first: Node, last: Node) {
  const dx = last.x - first.x
  const dy = last.y - first.y
  const length = Math.hypot(dx, dy)
  const ux = dx / length
  const uy = dy / length
  const trim = NODE_R + 3
  return {
    x1: first.x + ux * trim,
    y1: first.y + uy * trim,
    x2: last.x - ux * (trim + ARROW_HEAD * 0.4),
    y2: last.y - uy * (trim + ARROW_HEAD * 0.4),
    ux,
    uy,
    tip: { x: last.x - ux * trim, y: last.y - uy * trim },
  }
}

/** Electrons per subshell label for atomic number Z (empty for Z = 0). */
function occupancy(Z: number): Map<string, number> {
  const counts = new Map<string, number>()
  if (Z < 1) return counts
  for (const subshell of electronConfiguration(Z).subshells) {
    counts.set(subshell.label, subshell.electrons)
  }
  return counts
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AufbauDiagonal: the n + l diagonal rule drawn as a grid of subshells. The arrows
 * draw themselves on first load, and an electron counter climbs through the
 * Steps. Subshells light up in filling order, as the ground-state configuration
 * for each Z says.
 */
export function AufbauDiagonal({ step, reducedMotion }: AufbauDiagonalProps) {
  const activeStep = clampStep(step, AUFBAU_STEP_COUNT)

  // The live state is a mutable object that GSAP tweens; `view` is a React copy.
  const [state] = useState<AufbauSnapshot>(() => ({ z: 0, draw: 0 }))
  const [view, setView] = useState<AufbauSnapshot>(() => ({ ...state }))
  const render = () => setView({ ...state })

  useEffect(() => {
    const target = aufbauTargetForStep(activeStep)

    if (reducedMotion) {
      Object.assign(state, target)
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }

    const distance = Math.abs(target.z - state.z)
    const tl = gsap.timeline({ onUpdate: render })
    tl.to(state, { draw: target.draw, duration: 1.4, ease: 'power2.inOut' }, 0)
    tl.to(
      state,
      { z: target.z, duration: Math.min(2.6, 0.25 + 0.085 * distance), ease: 'none' },
      0.15
    )
    return () => {
      tl.kill()
    }
    // `render` and `state` are stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  const Z = Math.round(view.z)
  const counts = occupancy(Z)
  const element = Z >= 1 ? elementInfo(Z) : null
  const configuration = Z >= 1 ? electronConfiguration(Z).text : ''

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="The n plus l diagonal rule: subshells arranged by principal quantum number and orbital type, with arrows showing the filling order, and an electron counter for atomic number Z"
        data-testid="aufbau-diagonal"
        data-step={activeStep}
        data-z={Z}
      >
        <VocabDefs idPrefix="aufbau" />

        {/* Column headers */}
        {SUBSHELL_LETTERS.map((letter, l) => (
          <Label key={letter} x={COL_X[l]} y={ROW_TOP - 52} fontSize={18} fill="var(--fg-muted)">
            <tspan fontStyle="italic">{letter}</tspan>
          </Label>
        ))}

        {/* Row labels: n = 1 to 7 */}
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <Label
            key={`row-${n}`}
            x={ROW_LABEL_X}
            y={ROW_TOP + (n - 1) * ROW_GAP}
            textAnchor="start"
            fontSize={15}
            fill="var(--fg-subtle)"
          >
            <tspan fontStyle="italic">n</tspan> = {n}
          </Label>
        ))}

        {/* Diagonal arrows, drawn on first load */}
        {CHAINS.map(({ nodes, key }) => {
          const first = nodes[0]
          const last = nodes[nodes.length - 1]
          const seg = chainSegment(first, last)
          const headLeft = {
            x: seg.tip.x - seg.ux * ARROW_HEAD - seg.uy * ARROW_HEAD * 0.55,
            y: seg.tip.y - seg.uy * ARROW_HEAD + seg.ux * ARROW_HEAD * 0.55,
          }
          const headRight = {
            x: seg.tip.x - seg.ux * ARROW_HEAD + seg.uy * ARROW_HEAD * 0.55,
            y: seg.tip.y - seg.uy * ARROW_HEAD - seg.ux * ARROW_HEAD * 0.55,
          }
          return (
            <g key={`chain-${key}`} data-testid="diagonal-arrow">
              <path
                d={`M${seg.x1},${seg.y1} L${seg.x2},${seg.y2}`}
                fill="none"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - view.draw}
                strokeWidth={1.8}
                strokeLinecap="round"
                style={{ stroke: 'var(--fg-muted)' }}
              />
              <path
                d={`M${headLeft.x},${headLeft.y} L${seg.tip.x},${seg.tip.y} L${headRight.x},${headRight.y}`}
                fill="none"
                strokeWidth={1.8}
                strokeLinejoin="round"
                strokeLinecap="round"
                opacity={view.draw > 0.97 ? 1 : 0}
                style={{ stroke: 'var(--fg-muted)' }}
              />
            </g>
          )
        })}

        {/* Subshell nodes. Fill height is the share of the subshell that is occupied. */}
        {NODES.map((node) => {
          const filled = counts.get(node.label) ?? 0
          const fraction = filled / node.capacity
          const lit = filled > 0
          return (
            <g key={node.label} data-subshell={node.label} data-filled={filled}>
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                strokeWidth={1.2}
                style={{ fill: 'var(--surface-raised)', stroke: lit ? 'var(--electron)' : 'var(--fg-subtle)' }}
              />
              {lit && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={NODE_R}
                  style={{ fill: 'var(--electron)', fillOpacity: 0.2 + 0.7 * fraction }}
                />
              )}
              <Label
                x={node.x}
                y={node.y}
                fontSize={15}
                halo
                fill={lit ? 'var(--fg)' : 'var(--fg-muted)'}
              >
                {node.label}
              </Label>
            </g>
          )
        })}

        {/* Electron counter: a big Z, the element name, and 36 electron places */}
        <Label x={COUNTER_X} y={96} fontSize={14} fill="var(--fg-muted)">
          atomic number Z
        </Label>
        <Label x={COUNTER_X} y={140} fontSize={44} fill="var(--fg)">
          {Z}
        </Label>
        <Label x={COUNTER_X} y={172} fontSize={16} fill="var(--fg-muted)">
          {element ? `${element.name} (${element.symbol})` : 'no electrons yet'}
        </Label>

        {Array.from({ length: TOTAL_ELECTRONS }, (_, i) => {
          const col = i % 6
          const row = Math.floor(i / 6)
          const on = i < Z
          return (
            <circle
              key={`dot-${i}`}
              cx={DOT_ORIGIN.x + col * DOT_STEP}
              cy={DOT_ORIGIN.y + row * DOT_STEP}
              r={DOT_R}
              style={{
                fill: on ? 'var(--electron)' : 'var(--surface-raised)',
                stroke: on ? 'none' : 'var(--fg-subtle)',
              }}
              strokeWidth={on ? 0 : 0.8}
            />
          )
        })}
        <Label x={COUNTER_X} y={DOT_ORIGIN.y + 6 * DOT_STEP + 14} fontSize={13} fill="var(--fg-subtle)">
          {Z} / {TOTAL_ELECTRONS} placed
        </Label>

        {/* The configuration, in n-then-l order */}
        <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 44} fontSize={17} fill="var(--fg)">
          {configuration || 'Ground state: none yet'}
        </Label>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {aufbauDescription(activeStep)}
      </p>
    </div>
  )
}
