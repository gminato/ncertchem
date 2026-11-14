'use client'

import { useMemo, type ReactNode } from 'react'
import { EnergyLadder, Label, LabelSub, OrbitalBox, VocabDefs } from '@/components/vocab'
import {
  RADIAL_CURVES,
  a0ToPm,
  hydrogenLevelsEv,
  multiElectronOrder,
  radialCurvePoints,
  radialNodePm,
  radialPeak,
  stateForStep,
  type OrbitalStepState,
} from './orbital-steps'
import styles from './OrbitalQuantumNumbers.module.css'

export interface OrbitalQuantumNumbersProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 540). Text is 15 to 16 units, about 14px on a card.
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
const LABEL_SIZE = 15

/** A quantum number with a true minus sign (U+2212) and an explicit plus sign, as in mℓ = −1. */
const signedText = (value: number) => (value > 0 ? `+${value}` : value < 0 ? `−${-value}` : '0')

/** Four address slots across the top. */
const SLOTS = [
  { x: 22, symbol: 'n', title: 'shell' },
  { x: 174, symbol: 'ℓ', title: 'subshell' },
  { x: 326, symbol: 'mℓ', title: 'orbital' },
  { x: 478, symbol: 'ms', title: 'spin' },
] as const
const SLOT = { y: 18, width: 140, height: 84 }

/** Shell diagram: centre and radii for K, L and M. */
const SHELLS = { cx: 150, cy: 330, radii: [40, 80, 120] as const }

/** Subshell rows for shell M, to the right of the shells. */
const ROWS = { x: 330, width: 290, height: 38, ys: [168, 222, 276] as const }

/** Plot frame for the radial probability. */
const PLOT = { x0: 84, x1: 600, y0: 120, y1: 440, maxPm: 1000, maxDensity: 0.6 }

/** Energy columns. */
const HYDROGEN = { top: 118, bottom: 440, rungLeft: 40, rungRight: 170, labelX: 182 }
const MULTI = { top: 118, bottom: 440, rungLeft: 432, rungRight: 510, labelX: 522 }

const CURVE_COLOUR: Record<string, string> = {
  '1s': 'var(--accent)',
  '2s': 'var(--electron)',
  '2p': 'var(--orbital-pos)',
  '3s': 'var(--caution)',
  '3p': 'var(--orbital-neg)',
}

const pmToX = (pm: number) => PLOT.x0 + (pm / PLOT.maxPm) * (PLOT.x1 - PLOT.x0)
const densityToY = (d: number) => PLOT.y1 - (d / PLOT.maxDensity) * (PLOT.y1 - PLOT.y0)

/** Path data for a polyline through the sampled points. */
function pathFor(points: { pm: number; density: number }[]): string {
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${pmToX(p.pm).toFixed(1)},${densityToY(p.density).toFixed(1)}`)
    .join(' ')
}

/** Address layer: the shell, subshell, orbital and spin picked one at a time. */
function AddressLayer({ state }: { state: OrbitalStepState }) {
  const { address } = state
  const picked = [address.n, address.l, address.ml, address.ms]
  const values: ReactNode[] = [
    address.n === null ? '?' : <><tspan className="sym">n</tspan> = {address.n}</>,
    address.l === null ? '?' : <><tspan className="sym">ℓ</tspan> = {address.l} ({'spdf'[address.l]})</>,
    address.ml === null ? '?' : <><tspan className="sym">m</tspan><LabelSub><tspan className="sym">ℓ</tspan></LabelSub> = {signedText(address.ml)}</>,
    address.ms === null ? '?' : <><tspan className="sym">m</tspan><LabelSub><tspan className="sym">s</tspan></LabelSub> = {address.ms > 0 ? '+½' : '−½'}</>,
  ]
  const shellName = address.n === null ? null : ['K', 'L', 'M'][address.n - 1]
  const subName = address.l === null ? null : `${address.n ?? 3}${'spdf'[address.l]}`
  const orbitalNames = ['py', 'pz', 'px']
  const orbitalName = address.ml === null ? null : orbitalNames[address.ml + 1]

  return (
    <g data-layer="address">
      {SLOTS.map((slot, i) => {
        const filled = picked[i] !== null
        return (
          <g key={slot.symbol} data-filled={filled ? 'true' : 'false'}>
            <rect
              x={slot.x}
              y={SLOT.y}
              width={SLOT.width}
              height={SLOT.height}
              rx={10}
              className={filled ? styles.slotFilled : styles.slotEmpty}
            />
            <Label x={slot.x + SLOT.width / 2} y={SLOT.y + 18} fontSize={15} fill="var(--fg-subtle)">
              {slot.title}
            </Label>
            <Label x={slot.x + SLOT.width / 2} y={SLOT.y + 44} fontSize={20} fill={filled ? 'var(--fg)' : 'var(--fg-subtle)'}>
              {values[i]}
            </Label>
          </g>
        )
      })}

      {/* Shells K, L, M around the nucleus. The chosen shell is drawn in the accent colour. */}
      {SHELLS.radii.map((radius, i) => {
        const current = address.n === i + 1
        return (
          <g key={radius} data-shell={i + 1}>
            <circle
              cx={SHELLS.cx}
              cy={SHELLS.cy}
              r={radius}
              className={current ? styles.shellPicked : styles.shell}
            />
            <Label x={SHELLS.cx} y={SHELLS.cy - radius - 12} fontSize={LABEL_SIZE} fill={current ? 'var(--accent)' : 'var(--fg-subtle)'}>
              {['K', 'L', 'M'][i]}
            </Label>
          </g>
        )
      })}
      <circle cx={SHELLS.cx} cy={SHELLS.cy} r={6} style={{ fill: 'var(--fg)' }} />
      <Label x={SHELLS.cx} y={SHELLS.cy + 60} fontSize={15} fill="var(--fg-subtle)">
        nucleus
      </Label>
      {shellName && (
        <Label x={SHELLS.cx} y={SHELLS.cy + SHELLS.radii[2] + 34} fontSize={LABEL_SIZE} fill="var(--accent)">
          {`shell ${shellName}`}
        </Label>
      )}

      {/* Subshell rows for shell n = 3: 3s, 3p, 3d. */}
      {(['3s', '3p', '3d'] as const).map((name, row) => {
        const l = row
        const chosen = address.l === l
        const dim = address.l !== null && !chosen
        return (
          <g key={name} data-subshell={name} opacity={dim ? 0.45 : 1}>
            <rect
              x={ROWS.x}
              y={ROWS.ys[row]}
              width={ROWS.width}
              height={ROWS.height}
              rx={8}
              className={chosen ? styles.rowPicked : styles.row}
            />
            <Label x={ROWS.x + 18} y={ROWS.ys[row] + ROWS.height / 2} fontSize={LABEL_SIZE} halo={false} textAnchor="start" fill={chosen ? 'var(--accent)' : 'var(--fg-muted)'}>
              {`${name}`}
            </Label>
            <Label x={ROWS.x + ROWS.width - 18} y={ROWS.ys[row] + ROWS.height / 2} fontSize={15} textAnchor="end" fill="var(--fg-subtle)">
              {`${2 * l + 1} orbital${l === 0 ? '' : 's'}`}
            </Label>
          </g>
        )
      })}
      {subName && (
        <Label x={ROWS.x + ROWS.width / 2} y={ROWS.ys[2] + ROWS.height + 14} fontSize={15} fill="var(--fg-subtle)">
          {`${subName} subshell chosen`}
        </Label>
      )}

      {/* The three p orbitals: mℓ = −1, 0, +1. The chosen one is outlined. */}
      {address.l === 1 &&
        orbitalNames.map((name, i) => {
          const m = i - 1
          const chosen = address.ml === m
          return (
            <g key={name} data-orbital={name} opacity={address.ml !== null && !chosen ? 0.4 : 1}>
              <rect
                x={ROWS.x + i * 98}
                y={352}
                width={86}
                height={50}
                rx={8}
                className={chosen ? styles.rowPicked : styles.row}
              />
              <Label x={ROWS.x + i * 98 + 43} y={372} fontSize={LABEL_SIZE} fill={chosen ? 'var(--accent)' : 'var(--fg-muted)'}>
                {name}
              </Label>
              <Label x={ROWS.x + i * 98 + 43} y={390} fontSize={15} fill="var(--fg-subtle)">
                <tspan className="sym">m</tspan><LabelSub><tspan className="sym">ℓ</tspan></LabelSub> = {signedText(m)}
              </Label>
            </g>
          )
        })}
      {orbitalName && (
        <Label x={ROWS.x + 143} y={424} fontSize={LABEL_SIZE} fill="var(--accent)">
          {`${subName}${orbitalName.slice(1)} orbital`}
        </Label>
      )}

      {/* Spin: one box is one orbital, one arrow is one electron. */}
      {address.ms !== null && (
        <g data-spin="up">
          <OrbitalBox
            orbitals={[{ up: true, down: false }]}
            x={ROWS.x + 18}
            y={458}
            size={40}
            fontSize={15}
            label={`${subName}${orbitalName ? orbitalName.slice(1) : ''}`}
          />
          <Label x={ROWS.x + 110} y={478} fontSize={LABEL_SIZE} textAnchor="start" fill="var(--fg-muted)">
            spin up, <tspan className="sym">m</tspan><LabelSub><tspan className="sym">s</tspan></LabelSub> = +½
          </Label>
        </g>
      )}
    </g>
  )
}

/** Radial layer: r²R² for five orbitals, with nodes and the 1s peak marked. */
function RadialLayer() {
  const curves = useMemo(
    () =>
      RADIAL_CURVES.map((curve) => {
        const points = radialCurvePoints(curve.n, curve.l, PLOT.maxPm, 200)
        const nodes = radialNodePm(curve.n, curve.l, 30)
        const peak = radialPeak(curve.n, curve.l, 30)
        return { ...curve, points, nodes, peak, colour: CURVE_COLOUR[`${curve.n}${'spdf'[curve.l]}`] }
      }),
    []
  )
  // Two short lines, so the node values fit the viewBox: the 2s and 3p nodes, then 3s.
  const nodeText = [
    curves
      .filter((c) => c.label === '2s' || c.label === '3p')
      .map((c) => `${c.label} ${c.nodes.map((pm) => `${Math.round(pm)} pm`).join(', ')}`)
      .join(';  '),
    curves
      .filter((c) => c.label === '3s')
      .map((c) => `3s ${c.nodes.map((pm) => `${Math.round(pm)} pm`).join(' and ')}`)
      .join(''),
  ] as const

  return (
    <g data-layer="radial">
      {/* Axes and ticks. */}
      <line x1={PLOT.x0} y1={PLOT.y1} x2={PLOT.x1} y2={PLOT.y1} className={styles.axis} />
      <line x1={PLOT.x0} y1={PLOT.y0} x2={PLOT.x0} y2={PLOT.y1} className={styles.axis} />
      {[0, 200, 400, 600, 800, 1000].map((pm) => (
        <g key={pm}>
          <line x1={pmToX(pm)} y1={PLOT.y1} x2={pmToX(pm)} y2={PLOT.y1 + 5} className={styles.axis} />
          <Label x={pmToX(pm)} y={PLOT.y1 + 20} fontSize={15} fill="var(--fg-subtle)">
            {String(pm)}
          </Label>
        </g>
      ))}
      <Label x={(PLOT.x0 + PLOT.x1) / 2} y={PLOT.y1 + 44} fontSize={LABEL_SIZE} fill="var(--fg-muted)">
        distance from the nucleus, <tspan className="sym">r</tspan> (pm)
      </Label>
      {[0, 0.2, 0.4, 0.6].map((d) => (
        <g key={d}>
          <line x1={PLOT.x0 - 5} y1={densityToY(d)} x2={PLOT.x0} y2={densityToY(d)} className={styles.axis} />
          <Label x={PLOT.x0 - 10} y={densityToY(d)} fontSize={15} textAnchor="end" fill="var(--fg-subtle)">
            {d === 0 ? '0' : d.toFixed(1)}
          </Label>
        </g>
      ))}
      <Label x={PLOT.x0 - 2} y={PLOT.y0 - 14} fontSize={LABEL_SIZE} textAnchor="start" fill="var(--fg-muted)">
        <tspan className="sym">r</tspan>²<tspan className="sym">R</tspan>² (a₀⁻¹)
      </Label>

      {/* 1s peak at the Bohr radius. */}
      <line
        x1={pmToX(a0ToPm(1))}
        y1={PLOT.y0}
        x2={pmToX(a0ToPm(1))}
        y2={PLOT.y1}
        className={styles.guide}
      />
      <Label x={pmToX(a0ToPm(1)) + 10} y={PLOT.y0 + 16} fontSize={15} textAnchor="start" fill="var(--accent)">
        1s peak at 52.9 pm
      </Label>

      {curves.map((curve) => (
        <path key={curve.label} d={pathFor(curve.points)} fill="none" stroke={curve.colour} strokeWidth={2.4} strokeLinejoin="round" data-curve={curve.label} />
      ))}

      {/* Radial nodes: hollow markers on the axis. */}
      {curves.flatMap((curve) =>
        curve.nodes.map((pm) => (
          <circle
            key={`${curve.label}-${pm.toFixed(1)}`}
            cx={pmToX(pm)}
            cy={PLOT.y1}
            r={4.5}
            className={styles.nodeMarker}
            style={{ stroke: curve.colour }}
          />
        ))
      )}

      {/* Labels above each curve's peak. The 1s curve is named by the annotation at its peak. */}
      {curves
        .filter((curve) => curve.label !== '1s')
        .map((curve) => (
          <Label
            key={`peak-${curve.label}`}
            x={pmToX(curve.peak.pm)}
            y={densityToY(curve.peak.density) - 10}
            fontSize={LABEL_SIZE}
            fill={curve.colour}
          >
            {curve.label}
          </Label>
        ))}

      <Label x={VIEW_WIDTH / 2} y={PLOT.y1 + 72} fontSize={15} fill="var(--fg-muted)">
        {`Radial nodes (open circles): ${nodeText[0]}`}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={PLOT.y1 + 92} fontSize={15} fill="var(--fg-muted)">
        {nodeText[1]}
      </Label>
    </g>
  )
}

/** Energy layer: hydrogen degenerate levels against a many-electron atom with split subshells. */
function EnergyLayer() {
  const hydrogen = useMemo(() => hydrogenLevelsEv(4), [])
  const hydrogenLevels = hydrogen.map((level) => ({
    label: `n = ${level.n}  ${level.energyEv.toFixed(2).replace('-', '−')} eV`,
    energy: level.energyEv,
  }))
  const eMin = hydrogen[0].energyEv
  const eMax = hydrogen[hydrogen.length - 1].energyEv

  const order = useMemo(() => multiElectronOrder(), [])
  const multiLevels = order.map((label, rank) => ({ label, energy: rank }))
  // The hydrogen labels are nudged apart by EnergyLadder where they would collide.

  return (
    <g data-layer="energy">
      <Label x={(HYDROGEN.rungLeft + HYDROGEN.rungRight) / 2 + 40} y={HYDROGEN.top - 52} fontSize={LABEL_SIZE} fill="var(--fg)">
        Hydrogen
      </Label>
      <Label x={(MULTI.rungLeft + MULTI.rungRight) / 2 + 40} y={MULTI.top - 52} fontSize={LABEL_SIZE} fill="var(--fg)">
        Many-electron atom
      </Label>

      <EnergyLadder
        levels={hydrogenLevels}
        bottom={HYDROGEN.bottom}
        top={HYDROGEN.top}
        rungLeft={HYDROGEN.rungLeft}
        rungRight={HYDROGEN.rungRight}
        labelX={HYDROGEN.labelX}
        minLabelGap={20}
        fontSize={LABEL_SIZE}
        eMin={eMin}
        eMax={eMax}
      />
      <EnergyLadder
        levels={multiLevels.map((level) => ({ label: level.label, energy: level.energy }))}
        bottom={MULTI.bottom}
        top={MULTI.top}
        rungLeft={MULTI.rungLeft}
        rungRight={MULTI.rungRight}
        labelX={MULTI.labelX}
        minLabelGap={22}
        fontSize={LABEL_SIZE}
        eMin={0}
        eMax={multiLevels.length - 1}
      />

      <Label x={(HYDROGEN.rungLeft + HYDROGEN.rungRight) / 2 + 40} y={HYDROGEN.bottom + 34} fontSize={15} fill="var(--fg-muted)">
        {'Energy depends on n only.'}
      </Label>
      <Label x={(HYDROGEN.rungLeft + HYDROGEN.rungRight) / 2 + 40} y={HYDROGEN.bottom + 52} fontSize={15} fill="var(--fg-muted)">
        {`2s = 2p, and 3s = 3p = 3d.`}
      </Label>
      <Label x={(MULTI.rungLeft + MULTI.rungRight) / 2 + 40} y={MULTI.bottom + 34} fontSize={15} fill="var(--fg-muted)">
        {'Energy depends on n and ℓ.'}
      </Label>
      <Label x={(MULTI.rungLeft + MULTI.rungRight) / 2 + 40} y={MULTI.bottom + 52} fontSize={15} fill="var(--fg-muted)">
        {'Order only, not to scale.'}
      </Label>
      <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 12} fontSize={15} fill="var(--fg-subtle)">
        {`Filling order by n + ℓ, then n: ${order.join(', ')}.`}
      </Label>
    </g>
  )
}

/**
 * The Scrolly visual for "2.6 Quantum Mechanical Model of Atom". Three layers share one SVG:
 * the quantum-number address (Steps 0 to 3), the radial probability r²R² (Step 4), and the
 * energies (Step 5). The active layer fades in with a CSS transition; reduced motion cuts it.
 */
export function OrbitalQuantumNumbers({ step, reducedMotion }: OrbitalQuantumNumbersProps) {
  const state = stateForStep(step)
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label="Quantum numbers, radial probability and energy levels of atomic orbitals"
      className={styles.svg}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
    >
      <VocabDefs idPrefix="orbital-qn" />
      <g className={styles.layer} data-visible={state.view === 'address' ? 'true' : 'false'} style={{ opacity: state.view === 'address' ? 1 : 0 }}>
        <AddressLayer state={state} />
      </g>
      <g className={styles.layer} data-visible={state.view === 'radial' ? 'true' : 'false'} style={{ opacity: state.view === 'radial' ? 1 : 0 }}>
        <RadialLayer />
      </g>
      <g className={styles.layer} data-visible={state.view === 'energy' ? 'true' : 'false'} style={{ opacity: state.view === 'energy' ? 1 : 0 }}>
        <EnergyLayer />
      </g>
    </svg>
  )
}
