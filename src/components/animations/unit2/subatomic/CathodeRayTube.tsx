'use client'

import { Electron, Label, VocabDefs } from '@/components/vocab'
import { beamPath, chargeToMassFromBalance, magneticRadius, thomsonScenario, type BeamSetup } from '@/lib/chem/electron-beam'
import { useStepTween } from './useStepTween'
import { clampIndex, sci } from './notation'
import styles from './subatomic.module.css'

export interface CathodeRayTubeProps {
  step: number
  reducedMotion: boolean
}

/** Number of Steps in the CathodeRayTube animation. */
export const CATHODE_RAY_STEP_COUNT = 4

// Geometry in SVG units (viewBox 640 × 540). Scale: 32 units per centimetre.
const VIEW_W = 640
const VIEW_H = 540
const SCALE = 3200 // SVG units per metre
const BEAM_Y = 200
const CATHODE_X = 70
const FIELD_X = 230
const TUBE = { x: 40, y: 60, w: 560, h: 280 }

/** The fields and speed used on the site, all from the library. */
const SCENARIO = thomsonScenario()
const SETUP: BeamSetup = {
  fieldLength: 0.02,
  screenDistance: 0.06,
  electricField: SCENARIO.electricField,
  magneticField: SCENARIO.magneticField,
  speed: SCENARIO.speed,
}
const FIELD_W = SETUP.fieldLength * SCALE
const PLATE_GAP = 64
const PLATE_TOP = BEAM_Y - PLATE_GAP / 2
const PLATE_BOTTOM = BEAM_Y + PLATE_GAP / 2
const SCREEN_X = FIELD_X + (SETUP.fieldLength + SETUP.screenDistance) * SCALE

/** Fields on (1) or off (0) for each Step. */
interface FieldState {
  fieldE: number
  fieldB: number
}

function fieldsForStep(step: number): FieldState {
  switch (clampIndex(step, CATHODE_RAY_STEP_COUNT)) {
    case 1:
      return { fieldE: 1, fieldB: 0 }
    case 2:
      return { fieldE: 0, fieldB: 1 }
    case 3:
      return { fieldE: 1, fieldB: 1 }
    default:
      return { fieldE: 0, fieldB: 0 }
  }
}

const CAPTIONS = [
  'No fields: the rays travel in a straight line.',
  'Electric field on: the beam bends towards the + plate.',
  'Magnetic field on: the beam bends the opposite way.',
  'Both fields on: the two forces balance and the beam is straight again.',
]

/** Superscript-free helper for the readout lines. */
const RADIUS_CM = (magneticRadius(SETUP.speed, SETUP.magneticField) * 100).toFixed(2)
const SPEED_LABEL = sci(SETUP.speed, 2)
const CHARGE_TO_MASS_LABEL = sci(
  chargeToMassFromBalance(
    SETUP.electricField,
    SETUP.magneticField,
    magneticRadius(SETUP.speed, SETUP.magneticField)
  ),
  4
)

/** Maps a path (metres, y up) to SVG coordinates for the tube. */
function toSvg(p: { x: number; y: number }) {
  return { x: FIELD_X + p.x * SCALE, y: BEAM_Y - p.y * SCALE }
}

/**
 * CathodeRayTube: the beam leaves the cathode on the left, passes an electric
 * field, then a magnetic field, and strikes a fluorescent screen. Steps switch
 * the fields on and off. The beam path is integrated from the Lorentz force
 * with the library's e/m, so the bend directions are the physics.
 */
export function CathodeRayTube({ step, reducedMotion }: CathodeRayTubeProps) {
  const activeStep = clampIndex(step, CATHODE_RAY_STEP_COUNT)
  const fields = useStepTween(activeStep, fieldsForStep, reducedMotion, 0.9)

  const path = beamPath(SETUP, fields.fieldE, fields.fieldB, 60)
  const beamPoints: { x: number; y: number }[] = [
    { x: CATHODE_X, y: BEAM_Y },
    { x: FIELD_X, y: BEAM_Y },
    ...path.map(toSvg),
  ]
  const polyline = beamPoints.map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')
  const hit = beamPoints[beamPoints.length - 1]
  const electronDots = [0.12, 0.3, 0.5, 0.7, 0.88].map((f) => beamPoints[Math.round(f * (beamPoints.length - 1))])

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label="Cathode ray tube: a beam of electrons from the cathode on the left passes through an electric field, then a magnetic field, and strikes a fluorescent screen on the right"
        data-testid="cathode-ray-tube"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="crt" />

        {/* Glass envelope */}
        <rect
          x={TUBE.x}
          y={TUBE.y}
          width={TUBE.w}
          height={TUBE.h}
          rx={18}
          fill="none"
          strokeWidth={1.5}
          style={{ stroke: 'var(--border)' }}
        />

        {/* Cathode (left) and anode with a hole for the beam */}
        <line x1={CATHODE_X} x2={CATHODE_X} y1={150} y2={250} strokeWidth={7} strokeLinecap="round" style={{ stroke: 'var(--fg-muted)' }} />
        <Label x={CATHODE_X} y={44} fontSize={16} textAnchor="middle">
          cathode (<tspan>−</tspan>)
        </Label>
        <line x1={150} x2={150} y1={TUBE.y} y2={BEAM_Y - 14} strokeWidth={7} style={{ stroke: 'var(--fg-muted)' }} />
        <line x1={150} x2={150} y1={BEAM_Y + 14} y2={TUBE.y + TUBE.h} strokeWidth={7} style={{ stroke: 'var(--fg-muted)' }} />
        <Label x={150} y={366} fontSize={16} textAnchor="middle">
          anode (+)
        </Label>

        {/* Magnetic region: ⊗ marks show a field into the page, faded by fieldB */}
        <g opacity={0.25 + 0.75 * fields.fieldB}>
          <rect
            x={FIELD_X}
            y={92}
            width={FIELD_W}
            height={216}
            fill="var(--field-b)"
            fillOpacity={0.08 * fields.fieldB}
            stroke="var(--field-b)"
            strokeDasharray="4 4"
            strokeOpacity={fields.fieldB}
          />
          {[FIELD_X + 12, FIELD_X + 32, FIELD_X + 52].flatMap((x) =>
            [118, 282].map((y) => (
              <g key={`x-${x}-${y}`} style={{ stroke: 'var(--field-b)' }} strokeWidth={1.6}>
                <circle cx={x} cy={y} r={6} fill="none" />
                <line x1={x - 4} y1={y - 4} x2={x + 4} y2={y + 4} />
                <line x1={x - 4} y1={y + 4} x2={x + 4} y2={y - 4} />
              </g>
            ))
          )}
          <Label x={FIELD_X + FIELD_W / 2} y={80} fontSize={16} textAnchor="middle" fill="var(--field-b)">
            <tspan className="sym">B</tspan> into page
          </Label>
        </g>

        {/* Deflecting plates: + on top, − below, E points down */}
        <g opacity={0.35 + 0.65 * fields.fieldE}>
          <line x1={FIELD_X} x2={FIELD_X + FIELD_W} y1={PLATE_TOP} y2={PLATE_TOP} strokeWidth={5} style={{ stroke: 'var(--proton)' }} />
          <line x1={FIELD_X} x2={FIELD_X + FIELD_W} y1={PLATE_BOTTOM} y2={PLATE_BOTTOM} strokeWidth={5} style={{ stroke: 'var(--electron)' }} />
          <Label x={FIELD_X - 14} y={PLATE_TOP} fontSize={18} textAnchor="end" fill="var(--proton)">
            +
          </Label>
          <Label x={FIELD_X - 14} y={PLATE_BOTTOM} fontSize={18} textAnchor="end" fill="var(--electron)">
            −
          </Label>
          {[FIELD_X + 14, FIELD_X + 32, FIELD_X + 50].map((x) => (
            <g key={`e-${x}`} style={{ stroke: 'var(--accent)' }} strokeWidth={1.8} opacity={fields.fieldE}>
              <line x1={x} x2={x} y1={PLATE_TOP + 8} y2={PLATE_BOTTOM - 14} />
              <path d={`M${x - 4},${PLATE_BOTTOM - 18} L${x},${PLATE_BOTTOM - 10} L${x + 4},${PLATE_BOTTOM - 18}`} fill="none" />
            </g>
          ))}
          <Label x={FIELD_X + FIELD_W / 2} y={PLATE_TOP - 16} fontSize={16} textAnchor="middle" fill="var(--accent)" opacity={fields.fieldE}>
            <tspan className="sym">E</tspan>
          </Label>
        </g>

        {/* Fluorescent screen */}
        <rect x={SCREEN_X - 6} y={TUBE.y} width={12} height={TUBE.h} rx={3} style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }} />
        <circle cx={hit.x} cy={hit.y} r={22} style={{ fill: 'var(--electron)', opacity: 0.22 }} />
        <circle cx={hit.x} cy={hit.y} r={7} style={{ fill: 'var(--electron)' }} />
        <Label x={SCREEN_X} y={366} fontSize={16} textAnchor="middle">
          screen
        </Label>

        {/* The beam and its electrons */}
        <polyline points={polyline} fill="none" strokeWidth={3} strokeLinejoin="round" style={{ stroke: 'var(--electron)', opacity: 0.35 }} />
        <polyline points={polyline} fill="none" strokeWidth={1.4} strokeLinejoin="round" style={{ stroke: 'var(--electron)' }} />
        {electronDots.map((p, i) => (
          <Electron key={`dot-${i}`} x={p.x} y={p.y} size={10} defsPrefix="crt" />
        ))}

        {/* Caption and readouts */}
        <Label x={VIEW_W / 2} y={418} fontSize={17} textAnchor="middle" fill="var(--fg)">
          {CAPTIONS[activeStep]}
        </Label>
        {activeStep >= 2 && (
          <Label x={VIEW_W / 2} y={456} fontSize={17} textAnchor="middle" fill="var(--fg-muted)">
            <tspan className="sym">r</tspan> = <tspan className="sym">mv</tspan>/(<tspan className="sym">eB</tspan>) = {RADIUS_CM} cm
          </Label>
        )}
        {activeStep === 3 && (
          <g>
            <Label x={VIEW_W / 2} y={486} fontSize={17} textAnchor="middle" fill="var(--fg-muted)">
              <tspan className="sym">v</tspan> = <tspan className="sym">E</tspan>/<tspan className="sym">B</tspan> = {SPEED_LABEL} m s⁻¹
            </Label>
            <Label x={VIEW_W / 2} y={514} fontSize={17} textAnchor="middle" style={{ fontWeight: 600 }} fill="var(--accent)">
              <tspan className="sym">e</tspan>/<tspan className="sym">m</tspan> = {CHARGE_TO_MASS_LABEL} C kg⁻¹
            </Label>
          </g>
        )}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {CAPTIONS[activeStep]}
      </p>
    </div>
  )
}
