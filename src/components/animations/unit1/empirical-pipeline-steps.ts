/** Number of Steps in the EmpiricalPipeline Scrolly Animation. */
export const EMPIRICAL_PIPELINE_STEP_COUNT = 5

/** The table column that the Step highlights, left to right. */
export type PipelineColumn = 'percent' | 'grams' | 'moles' | 'ratio'

export const PIPELINE_COLUMN_ORDER: readonly PipelineColumn[] = ['percent', 'grams', 'moles', 'ratio']

export function clampPipelineStep(step: number): number {
  if (!Number.isFinite(step)) return 0
  return Math.min(EMPIRICAL_PIPELINE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
}

export interface PipelineTargets {
  /** The column in focus, or null once the table is complete (Step 5). */
  activeColumn: PipelineColumn | null
  /** 0 to 1: strength of the empirical and molecular formula block. */
  result: number
}

/**
 * Target state per Step. Steps 1 to 4 each light one column of the table in
 * the order percentage, grams in 100 g, moles, and whole-number ratio. The
 * final Step shows the formulas.
 */
export function targetsForPipelineStep(step: number): PipelineTargets {
  const clamped = clampPipelineStep(step)
  if (clamped === 4) return { activeColumn: null, result: 1 }
  return { activeColumn: PIPELINE_COLUMN_ORDER[clamped], result: 0 }
}
