'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { ELEMENTARY_CHARGE_C } from '@/lib/chem/constants'
import { balancingVoltage, histogram, simulatedDropCharges } from '@/lib/chem/oil-drop'
import { useStepTween } from './useStepTween'
import { clampIndex, sci } from './notation'
import styles from './subatomic.module.css'

export interface OilDropApparatusProps {
  step: number
  reducedMotion: boolean
}

/** Number of Steps in the OilDropApparatus animation. */
export const OIL_DROP_STEP_COUNT = 5

const VIEW_W = 640
const VIEW_H = 540

// Apparatus (left): plates 260 units apart, which stands for 1.0 cm.
const PLATE_TOP = 130
const PLATE_BOTTOM = 390
const PLATE_LEFT = 110
const PLATE_RIGHT = 262
const HOLE_X = 186
const DROP_X = 186
const GAP_UNITS = PLATE_BOTTOM - PLATE_TOP
const PLATE_SEPARATION_M = 0.01

// Histogram (right)
const HIST = { left: 360, right: 610, base: 390, top: 130, maxValue: 6, binWidth: 0.2 }

/** A drop of mass 3.0 × 10⁻¹⁵ kg that carries three elementary charges. */
const DROP_MASS_KG = 3.0e-15
const DROP_CHARGES = 3
const BALANCE_VOLTS = balancingVoltage(DROP_MASS_KG, DROP_CHARGES, PLATE_SEPARATION_M)
const MEASURED = simulatedDropCharges(48)
// Shifting by half a bin centres each bin on a value, so every whole number sits in the middle of one bar.
const BINS = histogram(
  MEASURED.map((v) => v + HIST.binWidth / 2),
  HIST.binWidth,
  HIST.maxValue + HIST.binWidth
)
const MAX_COUNT = Math.max(...BINS.map((b) => b.count))

/** Arrow length (SVG units) for a force of 1 unit: the weight of the drop. */
const FORCE_UNIT = 30

interface DropState {
  /** Height of the drop in the gap, from 0 (top plate) to 1 (bottom plate). */
  dropY: number
  /** Electric force on the drop in units of its weight. */
  force: number
  /** X-ray ionisation strength (0 to 1). */
  ion: number
  /** Histogram height (0 to 1). */
  histo: number
}

function stateForStep(step: number): DropState {
  switch (clampIndex(step, OIL_DROP_STEP_COUNT)) {
    case 1:
      return { dropY: 0.34, force: 0, ion: 1, histo: 0 }
    case 2:
      return { dropY: 0.2, force: 1.6, ion: 1, histo: 0 }
    case 3:
      return { dropY: 0.2, force: 1, ion: 1, histo: 0 }
    case 4:
      return { dropY: 0.2, force: 1, ion: 1, histo: 1 }
    default:
      return { dropY: 0.16, force: 0, ion: 0, histo: 0 }
  }
}

const CAPTIONS = [
  'Gravity pulls the drop down: its weight is mg.',
  'X-rays ionise the air, and the drop picks up charge.',
  'Field on: the electric force qE beats mg, so the drop rises.',
  'Balance: qE = mg, so the drop hangs still.',
  'Many drops: every charge is a whole multiple of e.',
]

/** The X-ray zigzag between x0 and x1 at height y. */
function zigzag(x0: number, x1: number, y: number): string {
  const pts: string[] = []
  for (let x = x0, i = 0; x <= x1; x += 12, i++) {
    pts.push(`${x},${i % 2 === 0 ? y - 6 : y + 6}`)
  }
  return `M${pts.join(' L')}`
}

const XRAY_PATH = zigzag(20, PLATE_RIGHT - 6, 300)

/**
 * OilDropApparatus: Millikan's oil-drop experiment. Mist drops fall between
 * two plates. X-rays charge them, and the field is tuned until one drop hangs
 * still. A histogram of measured charges shows whole multiples of e.
 */
export function OilDropApparatus({ step, reducedMotion }: OilDropApparatusProps) {
  const activeStep = clampIndex(step, OIL_DROP_STEP_COUNT)
  const s = useStepTween(activeStep, stateForStep, reducedMotion, 0.9)

  const dropPixelY = PLATE_TOP + s.dropY * GAP_UNITS
  const electricLength = FORCE_UNIT * s.force
  const elecTipY = dropPixelY - 14 - electricLength
  const weightTipY = dropPixelY + 14 + FORCE_UNIT
  const charged = s.ion > 0.5

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label="Millikan's oil-drop apparatus: a charged drop between two plates, held still by an electric field, beside a histogram of measured charges in whole multiples of e"
        data-testid="oil-drop"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="oil" />

        {/* Atomiser and mist above the hole in the upper plate */}
        <rect x={HOLE_X - 22} y={58} width={44} height={22} rx={4} style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }} />
        <Label x={HOLE_X} y={44} fontSize={16} textAnchor="middle">
          atomiser
        </Label>
        {[80, 96, 112].map((y, i) => (
          <circle key={`mist-${y}`} cx={HOLE_X + (i % 2 === 0 ? -6 : 7)} cy={y} r={2.2} style={{ fill: 'var(--fg-subtle)' }} />
        ))}

        {/* Chamber and plates. A hole in the upper plate lets the mist in. */}
        <rect x={PLATE_LEFT - 18} y={PLATE_TOP - 18} width={PLATE_RIGHT - PLATE_LEFT + 36} height={GAP_UNITS + 36} rx={10} fill="none" strokeWidth={1.2} style={{ stroke: 'var(--border)' }} />
        <line x1={PLATE_LEFT} x2={HOLE_X - 10} y1={PLATE_TOP} y2={PLATE_TOP} strokeWidth={5} style={{ stroke: 'var(--proton)' }} />
        <line x1={HOLE_X + 10} x2={PLATE_RIGHT} y1={PLATE_TOP} y2={PLATE_TOP} strokeWidth={5} style={{ stroke: 'var(--proton)' }} />
        <line x1={PLATE_LEFT} x2={PLATE_RIGHT} y1={PLATE_BOTTOM} y2={PLATE_BOTTOM} strokeWidth={5} style={{ stroke: 'var(--electron)' }} />
        <Label x={PLATE_LEFT - 22} y={PLATE_TOP} fontSize={18} textAnchor="end" fill="var(--proton)">
          +
        </Label>
        <Label x={PLATE_LEFT - 22} y={PLATE_BOTTOM} fontSize={18} textAnchor="end" fill="var(--electron)">
          −
        </Label>

        {/* Field arrows between the plates, pointing down */}
        <g opacity={Math.min(1, s.force)} style={{ stroke: 'var(--accent)' }} strokeWidth={1.8}>
          {[122, 142].map((x) => (
            <g key={`f-${x}`}>
              <line x1={x} x2={x} y1={PLATE_TOP + 10} y2={PLATE_TOP + 40} />
              <path d={`M${x - 4},${PLATE_TOP + 34} L${x},${PLATE_TOP + 42} L${x + 4},${PLATE_TOP + 34}`} fill="none" />
            </g>
          ))}
        </g>

        {/* X-rays entering from the left */}
        <path d={XRAY_PATH} fill="none" strokeWidth={1.8} strokeLinejoin="round" style={{ stroke: 'var(--accent)' }} opacity={s.ion} />
        <Label x={24} y={278} fontSize={16} textAnchor="start" opacity={s.ion} fill="var(--accent)">
          X-rays
        </Label>

        {/* The drop: a halo when charged */}
        <circle cx={DROP_X} cy={dropPixelY} r={24} fill="url(#oil-electron-glow)" opacity={0.15 + 0.85 * s.ion} />
        <circle cx={DROP_X} cy={dropPixelY} r={11} style={{ fill: charged ? 'var(--electron)' : 'var(--fg-subtle)', stroke: 'var(--bg)', strokeWidth: 1 }} />
        {charged && (
          <Label x={DROP_X} y={dropPixelY - 1} fontSize={16} textAnchor="middle" fill="var(--bg)" style={{ fontWeight: 700 }}>
            −
          </Label>
        )}

        {/* Forces on the drop: weight down, electric force up */}
        <g style={{ stroke: 'var(--fg)' }} strokeWidth={2}>
          <line x1={DROP_X + 30} x2={DROP_X + 30} y1={dropPixelY + 14} y2={weightTipY - 8} />
          <path d={`M${DROP_X + 26},${weightTipY - 8} L${DROP_X + 30},${weightTipY} L${DROP_X + 34},${weightTipY - 8}`} fill="none" />
        </g>
        <Label x={DROP_X + 42} y={dropPixelY + 14 + FORCE_UNIT / 2} fontSize={16} textAnchor="start" fill="var(--fg)">
          <tspan fontStyle="italic">mg</tspan>
        </Label>
        <g opacity={Math.min(1, s.force)} style={{ stroke: 'var(--accent)' }} strokeWidth={2}>
          <line x1={DROP_X + 30} x2={DROP_X + 30} y1={dropPixelY - 14} y2={elecTipY + 8} />
          <path d={`M${DROP_X + 26},${elecTipY + 8} L${DROP_X + 30},${elecTipY} L${DROP_X + 34},${elecTipY + 8}`} fill="none" />
        </g>
        <Label x={DROP_X + 42} y={dropPixelY - 14 - electricLength / 2} fontSize={16} textAnchor="start" fill="var(--accent)" opacity={Math.min(1, s.force)}>
          <tspan fontStyle="italic">qE</tspan>
        </Label>

        {/* Histogram of measured charges, in units of e */}
        <line x1={HIST.left} x2={HIST.right} y1={HIST.base} y2={HIST.base} style={{ stroke: 'var(--border)' }} strokeWidth={1.4} />
        {BINS.map((bin) => {
          const scale = (HIST.right - HIST.left) / HIST.maxValue
          const barW = HIST.binWidth * scale * 0.8
          // bin.start is the bin's centre in units of e
          const x = HIST.left + (bin.start - HIST.binWidth / 2) * scale
          const h = (bin.count / MAX_COUNT) * (HIST.base - HIST.top) * s.histo
          return (
            <rect
              key={`bin-${bin.start}`}
              x={x}
              y={HIST.base - h}
              width={barW}
              height={Math.max(0, h)}
              rx={1.5}
              style={{ fill: 'var(--electron)' }}
              opacity={0.9}
            />
          )
        })}
        {[0, 1, 2, 3, 4, 5, 6].map((n) => (
          <Label key={`tick-${n}`} x={HIST.left + (n / HIST.maxValue) * (HIST.right - HIST.left)} y={HIST.base + 18} fontSize={16} textAnchor="middle">
            {n}
          </Label>
        ))}
        <Label x={(HIST.left + HIST.right) / 2} y={HIST.base + 44} fontSize={16} textAnchor="middle" fill="var(--fg)">
          measured <tspan fontStyle="italic">q</tspan>/<tspan fontStyle="italic">e</tspan>
        </Label>
        <Label x={(HIST.left + HIST.right) / 2} y={HIST.top - 12} fontSize={16} textAnchor="middle" fill="var(--fg-muted)" opacity={s.histo}>
          charge on each drop
        </Label>

        {/* Caption and readouts */}
        <Label x={VIEW_W / 2} y={478} fontSize={17} textAnchor="middle" fill="var(--fg)">
          {CAPTIONS[activeStep]}
        </Label>
        {activeStep === 3 && (
          <Label x={VIEW_W / 2} y={508} fontSize={16} textAnchor="middle" fill="var(--accent)">
            <tspan fontStyle="italic">V</tspan> = <tspan fontStyle="italic">mgd</tspan>/(<tspan fontStyle="italic">ne</tspan>) ≈ {Math.round(BALANCE_VOLTS)} V, 1.0 cm gap
          </Label>
        )}
        {activeStep === 4 && (
          <Label x={VIEW_W / 2} y={508} fontSize={16} textAnchor="middle" fill="var(--accent)">
            <tspan fontStyle="italic">e</tspan> = {sci(ELEMENTARY_CHARGE_C, 4)} C, the unit of charge
          </Label>
        )}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {CAPTIONS[activeStep]}
      </p>
    </div>
  )
}
