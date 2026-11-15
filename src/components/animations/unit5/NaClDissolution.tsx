'use client'

import { formatSignedKJ, clampSteps, dissolutionDiagramLevels, DISSOLUTION_STEP_COUNT, dissolutionReadout } from './nacl-steps'
import { latticeEnthalpyNaCl, naClHydrationEnthalpy, enthalpyOfSolution } from '@/lib/chem/enthalpy-types'
import styles from './nacl.module.css'

export interface NaClDissolutionProps {
  step: number
  reducedMotion: boolean
}

const VIEW = { width: 600, height: 340 }
const BASE_Y = 300
/** Pixels per kJ mol⁻¹ in the main diagram: the +788 level lands at about y = 60. */
const SCALE = 240 / 788
/** Magnification of the inset, which shows the +4 kJ mol⁻¹ gap at a readable size. */
const ZOOM = 20

const LEFT_ARROW_X = 200
const RIGHT_ARROW_X = 300
const LABEL_GUTTER = 160
const INSET = { x: 400, y: 150, width: 196, height: 180 }

/**
 * NaCl dissolving in water. The two large arrows sit side by side: lattice separation (+788, up, heat
 * colour) and hydration (−784, down, work colour). The aqueous level is only 4 kJ mol⁻¹ above the
 * crystal, so it is drawn in a magnified inset rather than on the main scale, which keeps every label
 * clear of the others.
 */
export function NaClDissolution({ step }: NaClDissolutionProps) {
  const s = clampSteps(step, DISSOLUTION_STEP_COUNT)
  const readout = dissolutionReadout(s)
  const [solid, gas, aqueous] = dissolutionDiagramLevels()
  const yOf = (H: number) => BASE_Y - H * SCALE
  const gasY = yOf(gas.H)
  const solidY = yOf(solid.H)
  const insetSolidY = BASE_Y
  const insetAqueousY = BASE_Y - aqueous.H * ZOOM
  const latticeMid = (solidY + gasY) / 2
  const hydrationMid = (gasY + solidY) / 2

  return (
    <div className={styles.wrapper} data-testid="nacl-dissolution" data-step={s}>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        className={styles.svg}
        role="img"
        aria-label={`NaCl dissolving in water as an enthalpy diagram. ${readout}`}
      >
        {/* Main diagram: the crystal and its gaseous ions */}
        <g>
          <line x1={170} x2={340} y1={gasY} y2={gasY} strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />
          <line x1={170} x2={340} y1={solidY} y2={solidY} strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />
          <text x={LABEL_GUTTER} y={gasY} textAnchor="end" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
            Na⁺(g) + Cl⁻(g)
          </text>
          <text x={LABEL_GUTTER} y={solidY} textAnchor="end" dominantBaseline="central" fontSize={15} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
            NaCl(s)
          </text>
        </g>

        {s >= 1 && (
          <g opacity={s === 1 ? 1 : 0.45} data-testid="lattice-arrow">
            <line x1={LEFT_ARROW_X} x2={LEFT_ARROW_X} y1={solidY - 4} y2={gasY + 6} strokeWidth={3} strokeLinecap="round" style={{ stroke: 'var(--heat)' }} />
            <polygon
              points={`${LEFT_ARROW_X},${gasY + 1} ${LEFT_ARROW_X - 6},${gasY + 11} ${LEFT_ARROW_X + 6},${gasY + 11}`}
              style={{ fill: 'var(--heat)' }}
            />
            <text x={LEFT_ARROW_X + 12} y={latticeMid - 9} fontSize={15} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
              <tspan className="sym">ΔlatH</tspan>
            </text>
            <text x={LEFT_ARROW_X + 12} y={latticeMid + 9} fontSize={15} fontFamily="var(--font-sans)" style={{ fill: 'var(--heat)' }}>
              {formatSignedKJ(latticeEnthalpyNaCl())}
            </text>
          </g>
        )}

        {s >= 2 && (
          <g opacity={s === 2 ? 1 : 0.45} data-testid="hydration-arrow">
            <line x1={RIGHT_ARROW_X} x2={RIGHT_ARROW_X} y1={gasY + 4} y2={solidY - 6} strokeWidth={3} strokeLinecap="round" style={{ stroke: 'var(--work)' }} />
            <polygon
              points={`${RIGHT_ARROW_X},${solidY - 1} ${RIGHT_ARROW_X - 6},${solidY - 11} ${RIGHT_ARROW_X + 6},${solidY - 11}`}
              style={{ fill: 'var(--work)' }}
            />
            <text x={RIGHT_ARROW_X + 12} y={hydrationMid - 9} fontSize={15} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
              <tspan className="sym">ΔhydH</tspan>
            </text>
            <text x={RIGHT_ARROW_X + 12} y={hydrationMid + 9} fontSize={15} fontFamily="var(--font-sans)" style={{ fill: 'var(--work)' }}>
              {formatSignedKJ(naClHydrationEnthalpy())}
            </text>
          </g>
        )}

        {/* Magnified inset: the small gap between the crystal and the aqueous ions */}
        <g data-testid="dissolution-inset">
          <rect x={INSET.x} y={INSET.y} width={INSET.width} height={INSET.height} rx={8} style={{ fill: 'var(--surface)', stroke: 'var(--border)' }} />
          <text x={INSET.x + 12} y={INSET.y + 22} fontSize={14} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg-muted)' }}>
            Magnified ×{ZOOM}
          </text>
          <line x1={INSET.x + 14} x2={INSET.x + 14} y1={insetAqueousY} y2={insetSolidY} strokeWidth={1.2} style={{ stroke: 'var(--fg-muted)' }} />
          <line x1={INSET.x + 10} x2={INSET.x + 18} y1={insetAqueousY} y2={insetAqueousY} strokeWidth={1.2} style={{ stroke: 'var(--fg-muted)' }} />
          <line x1={INSET.x + 10} x2={INSET.x + 18} y1={insetSolidY} y2={insetSolidY} strokeWidth={1.2} style={{ stroke: 'var(--fg-muted)' }} />
          <line x1={INSET.x + 30} x2={INSET.x + 52} y1={insetSolidY} y2={insetSolidY} strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />
          <line x1={INSET.x + 30} x2={INSET.x + 52} y1={insetAqueousY} y2={insetAqueousY} strokeWidth={1.6} style={{ stroke: 'var(--fg-muted)' }} />
          <text x={INSET.x + 60} y={insetSolidY} dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
            NaCl(s): 0.0
          </text>
          <text x={INSET.x + 60} y={insetAqueousY - 9} dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
            Na⁺(aq) + Cl⁻(aq)
          </text>
          <text x={INSET.x + 60} y={insetAqueousY + 9} dominantBaseline="central" fontSize={14} fontFamily="var(--font-sans)" style={{ fill: 'var(--fg)' }}>
            {formatSignedKJ(enthalpyOfSolution(latticeEnthalpyNaCl(), naClHydrationEnthalpy()))} kJ mol⁻¹
          </text>
        </g>
      </svg>
      <p className={styles.readout} aria-live="polite">
        {readout}
      </p>
      <p className={styles.note}>
        Main diagram and inset are not on the same scale: the inset is magnified ×{ZOOM} to show the net gap between the crystal
        and the aqueous ions.
      </p>
    </div>
  )
}
