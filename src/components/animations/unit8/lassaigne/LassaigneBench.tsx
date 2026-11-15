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
const VIEW_HEIGHT = 420
/** The fusion drawing is 340 × 300 in its own units; this scale makes it fill the panel height. */
const FUSION_SCALE = 1.4
const FUSION_X = (VIEW_WIDTH - 340 * FUSION_SCALE) / 2
/** Before and during the fusion the apparatus sits left, and its equations sit in a column on the right. */
const FUSION_LEFT_X = 20
const NOTE_X = 300

/** The rack drawing is scaled up from its native 464-unit width so its labels stay large. */
const RACK_SCALE = 1.25
const RACK_NATIVE_WIDTH = VIEW_WIDTH / RACK_SCALE

/** Text column beside the tube while the sodium is still in the tube (Steps 0 and 1). */
const NOTES: Partial<Record<LassaigneStage, { heading: string; lines: string[] }>> = {
  sample: { heading: 'Before the fusion', lines: ['Covalent bonds hold N, S', 'and X to the carbon.', 'The sodium is waiting.'] },
  fuse: { heading: 'During the fusion', lines: ['Na + C + N → NaCN', '2Na + S → Na₂S', 'Na + X → NaX'] },
  extract: { heading: 'The extract holds', lines: ['CN⁻ when N was present', 'S²⁻ when S was present', 'X⁻ when a halogen was present'] },
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
        <g transform={`translate(${FUSION_LEFT_X}, 0) scale(${FUSION_SCALE})`}>
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
          <text x={VIEW_WIDTH / 2} y={64} textAnchor="middle" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg)">
            {STAGE_CAPTION[target.stage]}
          </text>
          <g transform={`translate(${(VIEW_WIDTH - RACK_NATIVE_WIDTH * RACK_SCALE) / 2}, 100) scale(${RACK_SCALE})`}>
            <TestTubeRack tubes={rackTubes} columns={4} spacing={112} width={RACK_NATIVE_WIDTH} progress={progress} />
          </g>
        </g>
      )}
    </svg>
  )
}
