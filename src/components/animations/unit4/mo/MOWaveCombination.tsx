'use client'

import { Label } from '@/components/vocab'
import {
  NUCLEUS_HALF,
  WAVE_STEP_COUNT,
  antibondingWave,
  atomicWave,
  bondingWave,
  density,
  waveDescription,
  waveTargetForStep,
} from './mo-wave-steps'
import styles from './mo.module.css'

export interface MOWaveCombinationProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 600 x 520). Upper panel: the wave functions. Lower panel: densities or energies.
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 600
const VIEW_HEIGHT = 520
/** Horizontal scale: sketch units to SVG units. The nuclei sit at u = ±1, at x = 240 and 360. */
const X_SCALE = 60
const X_MID = 300
const SAMPLES = 121
const U_MIN = -4
const U_MAX = 4

/** Energy ladder rows (SVG y): the atomic 1s level, the antibonding level above it and the bonding level below. */
const ATOM_Y = 404
const ANTI_Y = 346
const BOND_Y = 462

const WAVE_BASE = 236
const WAVE_SCALE = 150
const DENSITY_BASE = 476
const DENSITY_SCALE = 100

function xOf(u: number): number {
  return X_MID + u * X_SCALE
}

/** Polyline through f(u) sampled across the sketch, mapped into the panel. */
function curve(f: (u: number) => number, toY: (value: number) => number): string {
  const parts: string[] = []
  for (let i = 0; i < SAMPLES; i++) {
    const u = U_MIN + ((U_MAX - U_MIN) * i) / (SAMPLES - 1)
    parts.push(`${i === 0 ? 'M' : 'L'}${xOf(u).toFixed(1)},${toY(f(u)).toFixed(1)}`)
  }
  return parts.join(' ')
}

const waveY = (psi: number) => WAVE_BASE - psi * WAVE_SCALE
const densityY = (rho: number) => DENSITY_BASE - rho * DENSITY_SCALE

const A_X = xOf(-NUCLEUS_HALF)
const B_X = xOf(NUCLEUS_HALF)

/**
 * MOWaveCombination: two 1s-like waves combine by addition (σ1s, in phase, density between the
 * nuclei) and by subtraction (σ*1s, a node at the midpoint). The lower panel compares densities,
 * and the last Step puts the two orbitals on an energy ladder.
 */
export function MOWaveCombination({ step, reducedMotion }: MOWaveCombinationProps) {
  const t = waveTargetForStep(step)
  const shownStep = Math.min(WAVE_STEP_COUNT - 1, Math.max(0, Math.round(Number.isFinite(step) ? step : 0)))
  const motion = reducedMotion ? 'true' : 'false'

  const atomA = (u: number) => atomicWave(u, -NUCLEUS_HALF)
  const atomB = (u: number) => atomicWave(u, NUCLEUS_HALF)

  return (
    <div className={styles.waveWrap}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.waveSvg}
        role="img"
        aria-label="Two 1s waves on two nuclei. Adding them gives a bonding σ1s orbital with density between the nuclei. Subtracting them gives an antibonding σ*1s orbital with a node at the midpoint."
        data-testid="mo-wave"
        data-step={shownStep}
        data-reduced-motion={motion}
      >
        <Label x={VIEW_WIDTH / 2} y={24} fontSize={15} fill="var(--fg-muted)">
          Two 1s waves on two nuclei (schematic)
        </Label>

        {/* Upper panel: the wave functions */}
        <line x1={xOf(U_MIN)} y1={WAVE_BASE} x2={xOf(U_MAX)} y2={WAVE_BASE} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
        {/* Nuclei */}
        {[A_X, B_X].map((x, i) => (
          <g key={`nucleus-${i}`}>
            <circle cx={x} cy={WAVE_BASE} r={4.5} style={{ fill: 'var(--fg)' }} />
            <Label x={x} y={WAVE_BASE + 18} fontSize={14} fill="var(--fg-muted)">
              {i === 0 ? 'A' : 'B'}
            </Label>
          </g>
        ))}

        <g className={styles.waveLayer} data-layer="atomic" style={{ opacity: t.atomic ? 1 : 0 }}>
          <path d={curve(atomA, waveY)} fill="none" strokeWidth={2} style={{ stroke: 'var(--fg-muted)' }} />
          <path d={curve(atomB, waveY)} fill="none" strokeWidth={2} strokeDasharray="6 4" style={{ stroke: 'var(--fg-muted)' }} />
          <Label x={xOf(-NUCLEUS_HALF)} y={62} fontSize={15} fill="var(--fg)">
            <tspan className="sym">ψ</tspan>
            <tspan dy="0.3em" fontSize={11}>A</tspan>
          </Label>
          <Label x={xOf(NUCLEUS_HALF)} y={62} fontSize={15} fill="var(--fg)">
            <tspan className="sym">ψ</tspan>
            <tspan dy="0.3em" fontSize={11}>B</tspan>
          </Label>
        </g>

        <g className={styles.waveLayer} data-layer="sum" style={{ opacity: t.sum ? 1 : 0 }}>
          <path d={curve(bondingWave, waveY)} fill="none" strokeWidth={3} style={{ stroke: 'var(--accent)' }} />
          <Label x={130} y={62} fontSize={15} fill="var(--accent)" textAnchor="start">
            <tspan className="sym">ψ</tspan>
            <tspan dy="0.3em" fontSize={11}>A</tspan>
            <tspan dy="-0.3em"> + </tspan>
            <tspan className="sym">ψ</tspan>
            <tspan dy="0.3em" fontSize={11}>B</tspan>
          </Label>
        </g>

        <g className={styles.waveLayer} data-layer="difference" style={{ opacity: t.difference ? 1 : 0 }}>
          <path d={curve(antibondingWave, waveY)} fill="none" strokeWidth={3} style={{ stroke: 'var(--orbital-neg)' }} />
          <Label x={470} y={156} fontSize={15} fill="var(--orbital-neg)">
            <tspan className="sym">ψ</tspan>
            <tspan dy="0.3em" fontSize={11}>A</tspan>
            <tspan dy="-0.3em"> − </tspan>
            <tspan className="sym">ψ</tspan>
            <tspan dy="0.3em" fontSize={11}>B</tspan>
          </Label>
          <Label x={470} y={178} fontSize={13} fill="var(--fg-muted)">
            sign change
          </Label>
        </g>

        <g className={styles.waveLayer} data-layer="node" style={{ opacity: t.node ? 1 : 0 }}>
          <line x1={X_MID} y1={92} x2={X_MID} y2={WAVE_BASE} strokeWidth={1.4} strokeDasharray="4 4" style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={X_MID} y={84} fontSize={14} fill="var(--fg-muted)">
            node
          </Label>
        </g>

        {/* Lower panel: densities */}
        <g className={styles.waveLayer} data-layer="lower-density" style={{ opacity: t.lower === 'energy' ? 0 : 1 }}>
          <line x1={xOf(U_MIN)} y1={DENSITY_BASE} x2={xOf(U_MAX)} y2={DENSITY_BASE} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
          <Label x={60} y={330} fontSize={15} fill="var(--fg-muted)" textAnchor="start">
            Electron density, |ψ|²
          </Label>
          <g style={{ opacity: t.lower === 'atoms' || t.lower === 'bonding' ? 1 : t.lower === 'both' ? 0.3 : 0 }}>
            <path d={curve((u) => density(atomA(u)), densityY)} fill="none" strokeWidth={1.8} style={{ stroke: 'var(--fg-muted)' }} />
            <path d={curve((u) => density(atomB(u)), densityY)} fill="none" strokeWidth={1.8} strokeDasharray="6 4" style={{ stroke: 'var(--fg-muted)' }} />
          </g>
          <g style={{ opacity: t.lower === 'bonding' || t.lower === 'both' ? 1 : 0 }}>
            <path d={curve((u) => density(bondingWave(u)), densityY)} fill="none" strokeWidth={2.8} style={{ stroke: 'var(--accent)' }} />
            <Label x={560} y={352} fontSize={14} fill="var(--accent)" textAnchor="end">
              σ1s: high between the nuclei
            </Label>
          </g>
          <g style={{ opacity: t.lower === 'antibonding' || t.lower === 'both' ? 1 : 0 }}>
            <path d={curve((u) => density(antibondingWave(u)), densityY)} fill="none" strokeWidth={2.8} style={{ stroke: 'var(--orbital-neg)' }} />
            <Label x={560} y={372} fontSize={14} fill="var(--orbital-neg)" textAnchor="end">
              σ*1s: zero at the node
            </Label>
          </g>
        </g>

        {/* Lower panel alternative: the energy ladder for the last Step */}
        <g className={styles.waveLayer} data-layer="energy" style={{ opacity: t.lower === 'energy' ? 1 : 0 }}>
          <Label x={60} y={330} fontSize={15} fill="var(--fg-muted)" textAnchor="start">
            Energy
          </Label>
          <line x1={A_X - 42} y1={ATOM_Y} x2={A_X + 42} y2={ATOM_Y} strokeWidth={2.4} style={{ stroke: 'var(--fg)' }} />
          <line x1={B_X - 42} y1={ATOM_Y} x2={B_X + 42} y2={ATOM_Y} strokeWidth={2.4} style={{ stroke: 'var(--fg)' }} />
          <line x1={X_MID - 50} y1={ANTI_Y} x2={X_MID + 50} y2={ANTI_Y} strokeWidth={3} style={{ stroke: 'var(--orbital-neg)' }} />
          <line x1={X_MID - 50} y1={BOND_Y} x2={X_MID + 50} y2={BOND_Y} strokeWidth={3} style={{ stroke: 'var(--accent)' }} />
          {[
            [A_X + 42, ATOM_Y, X_MID - 50, ANTI_Y],
            [A_X + 42, ATOM_Y, X_MID - 50, BOND_Y],
            [B_X - 42, ATOM_Y, X_MID + 50, ANTI_Y],
            [B_X - 42, ATOM_Y, X_MID + 50, BOND_Y],
          ].map(([x1, y1, x2, y2], i) => (
            <line key={`corr-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeDasharray="3 4" style={{ stroke: 'var(--fg-subtle)' }} />
          ))}
          <Label x={A_X - 52} y={ATOM_Y} fontSize={15} fill="var(--fg)" textAnchor="end">
            1s (A)
          </Label>
          <Label x={B_X + 52} y={ATOM_Y} fontSize={15} fill="var(--fg)" textAnchor="start">
            1s (B)
          </Label>
          <Label x={X_MID + 62} y={ANTI_Y} fontSize={15} fill="var(--orbital-neg)" textAnchor="start">
            <tspan className="sym">σ*</tspan>
            <tspan dy="0.3em" fontSize={11}>1s</tspan>
            <tspan dy="-0.3em"> (higher)</tspan>
          </Label>
          <Label x={X_MID + 62} y={BOND_Y} fontSize={15} fill="var(--accent)" textAnchor="start">
            <tspan className="sym">σ</tspan>
            <tspan dy="0.3em" fontSize={11}>1s</tspan>
            <tspan dy="-0.3em"> (lower)</tspan>
          </Label>
          <Label x={VIEW_WIDTH / 2} y={500} fontSize={14} fill="var(--fg-subtle)">
            The two shifts are equal in size, so the total energy is unchanged.
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {waveDescription(step)}
      </p>
    </div>
  )
}
