'use client'

import { ChromatographyColumn, ChromatographyPlate } from '@/components/organic/lab'
import { PaperStrip } from './PaperStrip'
import { elutionOrder, paperSpots, sceneAnalyte, sceneSpots, sceneSteps, SCENE_SOLVENT } from './chromatography-steps'
import { useTweenedNumber } from '../../unit5/gibbs/useTweenedNumber'

export interface ChromatographyProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 470
const STEPS = sceneSteps()
const SPOTS = sceneSpots()
const PAPER = paperSpots()
const ORDER = elutionOrder()

/** Each apparatus sits left of centre and its key sits on the right, so the drawing fills the panel. */
const COLUMN_T = { x: -80, y: 34, s: 1.15 }
const PLATE_T = { x: 100, y: 34, s: 1.3 }
const KEY_X = 372

/**
 * The chromatography Scrolly. Each Step is one pose of the same apparatus from the organic lab: a
 * column with its bands and fraction tubes, a thin layer plate (spotted, developed, measured and
 * visualised) and a paper strip in a jar. The progress of the solvent or eluent tweens to the Step.
 */
export function Chromatography({ step, reducedMotion }: ChromatographyProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const pose = STEPS[index]
  const progress = useTweenedNumber(pose.progress, reducedMotion, 1.4)
  const label = `${pose.view === 'column' ? 'Column' : pose.view === 'tlc' ? 'Thin layer plate' : 'Paper strip'}: ${pose.title}`

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="chromatography-scene"
      data-step={index}
      data-view={pose.view}
    >
      <text x={VIEW_WIDTH / 2} y={22} textAnchor="middle" fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
        {pose.title}
      </text>

      {pose.view === 'column' && (
        <g>
          <g transform={`translate(${COLUMN_T.x}, ${COLUMN_T.y}) scale(${COLUMN_T.s})`}>
            <ChromatographyColumn bands={ORDER} progress={progress} title="Column with bands moving down" />
          </g>
          <ColumnKey />
        </g>
      )}

      {pose.view === 'tlc' && (
        <g>
          <g transform={`translate(${PLATE_T.x}, ${PLATE_T.y}) scale(${PLATE_T.s})`}>
            <ChromatographyPlate
              kind="tlc"
              spots={SPOTS}
              progress={progress}
              visualise={pose.visualise}
              measure={pose.measure}
              measureSpot={pose.measureSpot}
              title="Thin layer plate"
            />
          </g>
          <RfKey heading="Rf in this solvent" spots={SPOTS} />
        </g>
      )}

      {pose.view === 'paper' && (
        <g>
          <PaperStrip spots={PAPER} progress={progress} />
          <RfKey heading="Rf on paper" spots={PAPER} />
        </g>
      )}

      <text x={VIEW_WIDTH - 8} y={VIEW_HEIGHT - 12} textAnchor="end" fontSize={13} fill="var(--fg-subtle)" fontFamily="var(--font-sans)" aria-hidden="true">
        {`solvent strength ${SCENE_SOLVENT.toFixed(2)} (illustrative)`}
      </text>
    </svg>
  )
}

/** Key beside a plate or strip: each spot with its letter, its substance and its Rf in the scene solvent. */
function RfKey({ heading, spots }: { heading: string; spots: readonly { id: string; rf: number; colourless?: boolean; color?: string }[] }) {
  return (
    <g>
      <text x={KEY_X} y={92} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {heading}
      </text>
      {spots.map((spot, i) => {
        const y = 128 + i * 84
        const analyte = sceneAnalyte(spot.id)
        return (
          <g key={spot.id}>
            <circle cx={KEY_X + 10} cy={y - 6} r={8} fill={spot.colourless ? 'none' : spot.color} stroke={spot.colourless ? 'var(--fg-muted)' : 'none'} strokeWidth={1.5} strokeDasharray={spot.colourless ? '3 2' : undefined} />
            <text x={KEY_X + 28} y={y - 2} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`${spot.id}: ${analyte.label}`}
            </text>
            <text x={KEY_X + 28} y={y + 17} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              {`Rf ${spot.rf.toFixed(2)}`}
            </text>
            {spot.colourless && (
              <text x={KEY_X + 28} y={y + 34} fontSize={13} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                seen only after UV or iodine
              </text>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** Right-hand key of the column: the fraction tubes in elution order, with the substance in each. */
function ColumnKey() {
  return (
    <g>
      <text x={330} y={92} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Fractions in elution order
      </text>
      {ORDER.map((band, i) => {
        const y = 128 + i * 74
        return (
          <g key={band.id}>
            <rect x={330} y={y - 16} width={26} height={22} rx={5} fill={band.color} opacity={0.9} />
            <text x={370} y={y - 2} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`F${i + 1}: band ${band.id}`}
            </text>
            <text x={370} y={y + 18} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              {sceneAnalyte(band.id).label}
            </text>
          </g>
        )
      })}
      <text x={330} y={VIEW_HEIGHT - 40} fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        The weakest adsorption leaves first.
      </text>
    </g>
  )
}
