/**
 * Step targets for the Lassaigne Scrolly (Section 8.9.2). Each Step names the piece of bench
 * drawn and how far its process has run. The drawing tweens its progress to the target.
 */

import type { RackTube } from '@/components/organic/lab'

export type LassaigneStage = 'sample' | 'fuse' | 'plunge' | 'extract' | 'nitrogen-sulphur' | 'halogen-phosphorus'

export interface LassaigneTarget {
  stage: LassaigneStage
  /** 0 to 1: glow while fusing, steam while plunging, and how far the rack's solids have formed. */
  progress: number
}

/** One target per Step, in the order the Scrolly shows them. */
export const LASSAIGNE_TARGETS: readonly LassaigneTarget[] = [
  { stage: 'sample', progress: 0 },
  { stage: 'fuse', progress: 1 },
  { stage: 'plunge', progress: 0.6 },
  { stage: 'extract', progress: 1 },
  { stage: 'nitrogen-sulphur', progress: 1 },
  { stage: 'halogen-phosphorus', progress: 1 },
]

/** The target for a Step index, clamped to the list. */
export function lassaigneTarget(step: number): LassaigneTarget {
  const index = Math.min(LASSAIGNE_TARGETS.length - 1, Math.max(0, Math.round(step)))
  return LASSAIGNE_TARGETS[index]
}

/** The four tubes that test the sodium fusion extract for nitrogen and sulphur. */
export const NITROGEN_SULPHUR_TUBES: readonly RackTube[] = [
  { id: 'n-prussian', label: 'N', sub: 'Prussian blue', liquid: 'var(--prussian-blue)', liquidLevel: 0.7 },
  { id: 's-pbs', label: 'S', sub: 'black PbS', liquid: 'var(--liquid)', precipitate: { color: 'var(--pbs-black)', amount: 0.6 } },
  { id: 's-violet', label: 'S', sub: 'violet', liquid: 'var(--nitroprusside-violet)', liquidLevel: 0.7 },
  { id: 'ns-blood', label: 'N + S', sub: 'blood red', liquid: 'var(--blood-red)', liquidLevel: 0.7 },
]

/** The four tubes for the halogens (after boiling with HNO₃) and for phosphorus. */
export const HALOGEN_PHOSPHORUS_TUBES: readonly RackTube[] = [
  { id: 'cl-agcl', label: 'Cl', sub: 'white AgCl', liquid: 'var(--liquid)', precipitate: { color: 'var(--agcl-white)', amount: 0.6, outline: true } },
  { id: 'br-agbr', label: 'Br', sub: 'pale yellow AgBr', liquid: 'var(--liquid)', precipitate: { color: 'var(--agbr-pale-yellow)', amount: 0.6, outline: true } },
  { id: 'i-agi', label: 'I', sub: 'yellow AgI', liquid: 'var(--liquid)', precipitate: { color: 'var(--agi-yellow)', amount: 0.6 } },
  { id: 'p-phospho', label: 'P', sub: 'yellow', liquid: 'var(--phosphomolybdate-yellow)', liquidLevel: 0.7 },
]
