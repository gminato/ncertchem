'use client'

import { Label, VocabDefs } from '@/components/vocab'
import {
  integrateAlpha,
  pathToCircle,
  scatterClass,
  type ScatterClass,
  type ScatterPoint,
} from '@/lib/chem/alpha-scattering'
import { useStepTween } from '../subatomic/useStepTween'
import { clampIndex } from '../subatomic/notation'
import styles from '../subatomic/subatomic.module.css'

export interface RutherfordScatteringProps {
  step: number
  reducedMotion: boolean
}

/** Number of Steps in the RutherfordScattering animation. */
export const RUTHERFORD_STEP_COUNT = 5

const VIEW_W = 640
const VIEW_H = 540

/** Centre of the foil (and of the screen ring) in the foil view. */
const C = { x: 320, y: 270 }
/** Radius of the ZnS screen ring, in SVG units. */
const RING_R = 150
/** Foil view: SVG units per impact-parameter unit b₀. Not to scale. */
const FOIL_UNIT = 1.5
const SOURCE_X = 92
const FOIL = { x: C.x - 5, width: 10, top: 170, bottom: 370 }

/** Zoom view: SVG units per b₀. The nucleus is drawn far larger than to scale. */
const ZOOM_UNIT = 8

/**
 * Impact parameters (in units of b₀) for the illustrative foil sample. The
 * real ratio is far more extreme: about 1 in 20 000 alpha particles bounces
 * back. The sample is chosen so that each class is visible.
 */
const SAMPLE = {
  straight: [23.5, 26, 29, 32, 35, 38, 41, 44, -24, -27, -30, -33, -36, -40, -43],
  deflected: [3.2, -4.5, 6.5, -9.5],
  bounced: [0.6],
}

const CLASS_COLOUR: Record<ScatterClass, string> = {
  straight: 'var(--proton)',
  deflected: 'var(--accent)',
  bounced: 'var(--field-b)',
}

interface DrawnPath {
  cls: ScatterClass
  points: ScatterPoint[]
}

/** Foil view paths: each alpha particle, from the source to the screen ring. */
function buildFoilPaths(): DrawnPath[] {
  const make = (b: number, cls: ScatterClass): DrawnPath => {
    const traj = integrateAlpha(b, 1, 60)
    const toScreen = pathToCircle(traj, RING_R / FOIL_UNIT)
    const points = toScreen.map((p) => ({ x: C.x + FOIL_UNIT * p.x, y: C.y - FOIL_UNIT * p.y }))
    return { cls, points: [{ x: SOURCE_X, y: points[0].y }, ...points] }
  }
  return [
    ...SAMPLE.straight.map((b) => make(b, scatterClass(integrateAlpha(b).angle))),
    ...SAMPLE.deflected.map((b) => make(b, scatterClass(integrateAlpha(b).angle))),
    ...SAMPLE.bounced.map((b) => make(b, scatterClass(integrateAlpha(b).angle))),
  ]
}

/** Zoom view: three alpha paths, one per class, past a single enlarged nucleus. */
const ZOOM_SAMPLES = [
  { b: 26, cls: 'straight' as const },
  { b: -3.5, cls: 'deflected' as const },
  { b: 0.6, cls: 'bounced' as const },
].map(({ b, cls }) => {
  const traj = integrateAlpha(b, 1, 60)
  return {
    cls,
    points: traj.points.map((p) => ({ x: C.x + ZOOM_UNIT * p.x, y: C.y - ZOOM_UNIT * p.y })),
  }
})

const FOIL_PATHS = buildFoilPaths()

/** Dimmed and emphasised state for each Step. */
interface ScatterState {
  /** Fraction of every alpha path drawn (0 to 1). */
  progress: number
  /** Opacity of the deflected paths. */
  deflected: number
  /** Opacity of the bounced path. */
  bounced: number
  /** Crossfade from the foil view (0) to the zoom view (1). */
  zoom: number
}

function stateForStep(step: number): ScatterState {
  switch (clampIndex(step, RUTHERFORD_STEP_COUNT)) {
    case 1:
      return { progress: 1, deflected: 0, bounced: 0, zoom: 0 }
    case 2:
      return { progress: 1, deflected: 1, bounced: 0, zoom: 0 }
    case 3:
      return { progress: 1, deflected: 1, bounced: 1, zoom: 0 }
    case 4:
      return { progress: 1, deflected: 1, bounced: 1, zoom: 1 }
    default:
      return { progress: 0, deflected: 0, bounced: 0, zoom: 0 }
  }
}

const CAPTIONS = [
  'A thin gold foil, and a beam of α particles from a source.',
  'Most α particles pass straight through the foil.',
  'A few are deflected by small angles.',
  'Very few are turned back almost through 180°.',
  'Zoom in: a tiny, dense, positive nucleus does the scattering.',
]

const LEGEND: { cls: ScatterClass; text: string }[] = [
  { cls: 'straight', text: 'passes straight through' },
  { cls: 'deflected', text: 'deflected' },
  { cls: 'bounced', text: 'bounced back' },
]

function polyline(points: ScatterPoint[], count = points.length): string {
  return points
    .slice(0, count)
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(' ')
}

/** Opacity of a class's paths in the current state. */
function classOpacity(cls: ScatterClass, s: ScatterState): number {
  if (cls === 'deflected') return s.deflected
  if (cls === 'bounced') return s.bounced
  return 1
}

/**
 * RutherfordScattering: α particles fired at a thin gold foil. Most pass
 * straight through, a few are deflected, and very few bounce back. The last
 * Step zooms in on a single nucleus and shows how each path comes about. The
 * paths come from a Coulomb-repulsion integrator in lib/chem.
 */
export function RutherfordScattering({ step, reducedMotion }: RutherfordScatteringProps) {
  const activeStep = clampIndex(step, RUTHERFORD_STEP_COUNT)
  const s = useStepTween(activeStep, stateForStep, reducedMotion, 1.0)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className={styles.svg}
        role="img"
        aria-label="Rutherford's alpha-particle scattering: α particles from a source strike a thin gold foil and a ring of zinc sulphide screen. Most pass through, a few deflect, and very few bounce back. The last view zooms in on a small positive nucleus."
        data-testid="rutherford-scattering"
        data-step={activeStep}
      >
        <VocabDefs idPrefix="raz" />

        {/* Foil view */}
        <g opacity={1 - s.zoom}>
          {/* ZnS screen ring */}
          <circle cx={C.x} cy={C.y} r={RING_R} fill="none" strokeWidth={2} style={{ stroke: 'var(--fg-subtle)' }} />
          <Label x={C.x} y={100} fontSize={16} textAnchor="middle">
            ZnS screen
          </Label>

          {/* Source */}
          <rect x={SOURCE_X - 34} y={C.y - 26} width={34} height={52} rx={6} style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }} />
          <Label x={SOURCE_X - 17} y={180} fontSize={16} textAnchor="middle">
            α source
          </Label>

          {/* The gold foil, with its nucleus at the centre */}
          <rect x={FOIL.x} y={FOIL.top} width={FOIL.width} height={FOIL.bottom - FOIL.top} rx={2} style={{ fill: 'var(--surface-raised)', stroke: 'var(--border)' }} />
          <Label x={C.x} y={FOIL.top - 14} fontSize={16} textAnchor="middle">
            gold foil
          </Label>
          <circle cx={C.x} cy={C.y} r={3.5} style={{ fill: 'var(--proton)' }} />

          {/* Alpha particle paths and their flashes on the screen */}
          {FOIL_PATHS.map((path, i) => {
            // Nothing is fired until the first Step.
            if (s.progress < 0.01) return null
            const n = Math.max(2, Math.round(s.progress * path.points.length))
            const opacity = classOpacity(path.cls, s)
            const hit = path.points[path.points.length - 1]
            const flash = Math.max(0, Math.min(1, (s.progress - 0.9) / 0.1)) * opacity
            return (
              <g key={`alpha-${i}`}>
                <polyline
                  points={polyline(path.points, n)}
                  fill="none"
                  strokeWidth={1.4}
                  strokeLinejoin="round"
                  style={{ stroke: CLASS_COLOUR[path.cls] }}
                  opacity={opacity * 0.85}
                />
                {flash > 0.01 && (
                  <circle cx={hit.x} cy={hit.y} r={4} style={{ fill: CLASS_COLOUR[path.cls] }} opacity={flash} />
                )}
              </g>
            )
          })}
        </g>

        {/* Zoom view: one enlarged nucleus and three representative paths */}
        <g opacity={s.zoom}>
          <circle cx={C.x} cy={C.y} r={34} fill="url(#raz-nucleus-halo)" />
          <circle cx={C.x} cy={C.y} r={ZOOM_UNIT} style={{ fill: 'var(--proton)' }} />
          <Label x={VIEW_W / 2} y={432} fontSize={15} textAnchor="middle" fill="var(--fg-subtle)">
            nucleus drawn many times larger than to scale
          </Label>
          {ZOOM_SAMPLES.map((z) => (
            <polyline
              key={`zoom-${z.cls}`}
              points={polyline(z.points)}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              style={{ stroke: CLASS_COLOUR[z.cls] }}
            />
          ))}
        </g>

        {/* Caption and key, drawn inside the SVG so the panel keeps its shape */}
        <Label x={VIEW_W / 2} y={470} fontSize={17} textAnchor="middle" fill="var(--fg)">
          {CAPTIONS[activeStep]}
        </Label>
        {LEGEND.map((item, i) => {
          const x = [36, 268, 398][i]
          const textX = x + 30
          return (
            <g key={`key-${item.cls}`}>
              <line x1={x} x2={x + 22} y1={510} y2={510} strokeWidth={4} strokeLinecap="round" style={{ stroke: CLASS_COLOUR[item.cls] }} />
              <Label x={textX} y={510} fontSize={16} textAnchor="start" fill="var(--fg-muted)">
                {item.text}
              </Label>
            </g>
          )
        })}
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {CAPTIONS[activeStep]}
      </p>
    </div>
  )
}
