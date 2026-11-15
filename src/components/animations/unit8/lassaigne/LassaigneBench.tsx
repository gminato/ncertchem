'use client'

import { FusionTube, TestTubeRack, type FusionStage } from '@/components/organic/lab'
import { ExtractDish } from './ExtractDish'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  HALOGEN_PHOSPHORUS_TUBES,
  NITROGEN_SULPHUR_TUBES,
  lassaigneTarget,
  type LassaigneStage,
} from './lassaigne-steps'

export interface LassaigneBenchProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 500
/**
 * The fusion drawing is 340 × 300 in its own units, and its content runs from y 40 to y 296. At 1.6
 * it fills about 80 % of the 500-unit panel height and its 14-unit labels render at 22 px.
 */
const FUSION_SCALE = 1.6
const FUSION_X = (VIEW_WIDTH - 340 * FUSION_SCALE) / 2
/** The extract dish: a 340 × 300 drawing, scaled and centred so the funnel and dish fill the panel. */
const EXTRACT_SCALE = 2
const EXTRACT_X = VIEW_WIDTH / 2 - 130 * EXTRACT_SCALE
const EXTRACT_Y = VIEW_HEIGHT / 2 - 146 * EXTRACT_SCALE
/** Before and during the fusion the apparatus sits left, and its equations sit in a column on the right. */
const FUSION_LEFT_X = 20
const NOTE_X = 300

/** The rack is drawn 480 units wide and scaled to the panel, so the outer labels stay inside it. */
const RACK_NATIVE_WIDTH = 480
const RACK_SCALE = VIEW_WIDTH / RACK_NATIVE_WIDTH

/** Text column beside the tube while the sodium is still in the tube (Steps 0 and 1). */
const NOTES: Partial<Record<LassaigneStage, { heading: string; lines: string[] }>> = {
  sample: { heading: 'Before the fusion', lines: ['Covalent bonds hold N, S', 'and X to the carbon.', 'The sodium is waiting.'] },
  fuse: { heading: 'During the fusion', lines: ['Na + C + N → NaCN', '2Na + S → Na₂S', 'Na + X → NaX'] },
}

const STAGE_CAPTION: Partial<Record<string, string>> = {
  'nitrogen-sulphur': 'Tests on the extract for nitrogen and sulphur',
  'halogen-phosphorus': 'Tests for halogens (boiled first) and for phosphorus',
}

/**
 * The Lassaigne bench in six Steps: the sodium fusion in the ignition tube, the hot tube plunged
 * into water, the extract, and then two racks of test tubes that name the element each colour or
 * precipitate shows. The progress of each drawing tweens to its target, and reduced motion cuts.
 */
export function LassaigneBench({ step, reducedMotion }: LassaigneBenchProps) {
  const target = lassaigneTarget(step)
  const progress = useTweenedNumber(target.progress, reducedMotion, 0.9)
  const isRack = target.stage === 'nitrogen-sulphur' || target.stage === 'halogen-phosphorus'
  const rackTubes = target.stage === 'nitrogen-sulphur' ? NITROGEN_SULPHUR_TUBES : HALOGEN_PHOSPHORUS_TUBES

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={isRack ? STAGE_CAPTION[target.stage] ?? 'Test tubes' : `Sodium fusion, stage: ${target.stage}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="lassaigne-bench"
      data-stage={target.stage}
    >
      {!isRack && target.stage !== 'extract' && (
        <g transform={`translate(${NOTES[target.stage] ? FUSION_LEFT_X : FUSION_X}, 0) scale(${FUSION_SCALE})`}>
          <FusionTube stage={target.stage as FusionStage} progress={progress} extractColor="var(--liquid)" />
        </g>
      )}

      {target.stage === 'extract' && (
        <g transform={`translate(${EXTRACT_X}, ${EXTRACT_Y}) scale(${EXTRACT_SCALE})`}>
          <ExtractDish />
        </g>
      )}

      {NOTES[target.stage] && (
        <g data-testid="lassaigne-notes">
          <text x={NOTE_X} y={130} fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {NOTES[target.stage]?.heading}
          </text>
          {NOTES[target.stage]?.lines.map((line, i) => (
            <text key={line} x={NOTE_X} y={170 + i * 34} fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {line}
            </text>
          ))}
        </g>
      )}

      {isRack && (
        <g>
          <text x={VIEW_WIDTH / 2} y={84} textAnchor="middle" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg)">
            {STAGE_CAPTION[target.stage]}
          </text>
          <g transform={`translate(${(VIEW_WIDTH - RACK_NATIVE_WIDTH * RACK_SCALE) / 2}, 120) scale(${RACK_SCALE})`}>
            <TestTubeRack tubes={rackTubes} columns={4} spacing={120} width={RACK_NATIVE_WIDTH} progress={progress} />
          </g>
        </g>
      )}
    </svg>
  )
}
