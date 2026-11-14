'use client'

import { useMemo } from 'react'
import { PERIODIC_TABLE, tablePosition } from '@/lib/chem/periodic-data'
import type { ElementRecord } from '@/components/periodic/types'
import { PeriodicFrame } from './PeriodicFrame'
import { blockFocus, categoryFocus, type BlockFocus, type CategoryFocus } from './block-steps'
import { zigzagPath, zigzagPoints } from './zigzag'
import styles from './modern.module.css'

export interface PeriodicBlocksProps {
  step: number
  reducedMotion: boolean
}

const BLOCK_CAPTION: Record<BlockFocus, string> = {
  periods: 'Rows are periods: n is the period number',
  'group-columns': 'Columns are groups: group 1 is ns¹, group 17 is ns²np⁵',
  s: 's-block: groups 1–2, ns¹⁻²',
  p: 'p-block: groups 13–18, ns²np¹⁻⁶',
  d: 'd-block: groups 3–12, (n − 1)d¹⁻¹⁰ ns⁰⁻²',
  f: 'f-block: lanthanoids and actinoids, (n − 2)f¹⁻¹⁴ (n − 1)d⁰⁻¹ ns²',
}

const BLOCK_FOR_FOCUS: Partial<Record<BlockFocus, ElementRecord['block']>> = {
  s: 's',
  p: 'p',
  d: 'd',
  f: 'f',
}

/**
 * PeriodicBlocks: the s, p, d and f blocks on the periodic table, with the outer configuration of
 * each. Steps 1 and 2 show that rows are periods and columns are groups, and that a column
 * shares its outer configuration.
 */
export function PeriodicBlocks({ step }: PeriodicBlocksProps) {
  const focus = blockFocus(step)
  const block = BLOCK_FOR_FOCUS[focus]
  const group1and17 = useMemo(
    () => new Set(PERIODIC_TABLE.filter((e) => e.group === 1 || e.group === 17).map((e) => e.Z)),
    []
  )

  const cell = (el: ElementRecord) => {
    if (focus === 'periods') return {}
    if (focus === 'group-columns') return { dim: !group1and17.has(el.Z) }
    return { dim: el.block !== block }
  }

  const highlight = focus === 'group-columns' ? [...group1and17] : undefined
  const blockShading = focus !== 'periods' && focus !== 'group-columns'

  return (
    <PeriodicFrame
      elements={PERIODIC_TABLE}
      position={tablePosition}
      cell={cell}
      highlight={highlight}
      blockShading={blockShading}
      title="Periodic table by block and outer configuration"
    >
      <p className={styles.caption} aria-live="polite">
        {BLOCK_CAPTION[focus]}
      </p>
    </PeriodicFrame>
  )
}

const CATEGORY_CAPTION: Record<CategoryFocus, string> = {
  metals: 'Metals: left of the zig-zag',
  'non-metals': 'Non-metals: top right',
  metalloids: 'Metalloids: along the zig-zag',
}

/**
 * PeriodicCategories: metals, non-metals and metalloids, with the zig-zag boundary of NCERT
 * Fig. 3.3 drawn over the table. The boundary is computed from the cells, so it follows the
 * same grid as the rest of the table.
 */
export function PeriodicCategories({ step, reducedMotion }: PeriodicBlocksProps) {
  const focus = categoryFocus(step)
  const showZigzag = focus === 'metalloids'
  const points = useMemo(() => zigzagPoints(PERIODIC_TABLE, tablePosition), [])
  const d = zigzagPath(points)

  const cell = (el: ElementRecord) => {
    const match =
      (focus === 'metals' && el.category === 'metal') ||
      (focus === 'non-metals' && el.category === 'non-metal') ||
      (focus === 'metalloids' && el.category === 'metalloid')
    return { dim: !match }
  }

  const layer = (
    <path
      d={d}
      pathLength={1}
      className={styles.zigzag}
      style={{
        opacity: showZigzag ? 1 : 0,
        strokeDasharray: 1,
        strokeDashoffset: showZigzag ? 0 : 1,
        transition: reducedMotion ? 'none' : 'stroke-dashoffset 1s ease-out, opacity 0.4s ease',
      }}
      aria-hidden="true"
    />
  )

  return (
    <PeriodicFrame
      elements={PERIODIC_TABLE}
      position={tablePosition}
      cell={cell}
      categoryShading
      layer={layer}
      title="Periodic table of metals, non-metals and metalloids"
    >
      <p className={styles.caption} aria-live="polite">
        {CATEGORY_CAPTION[focus]}
      </p>
    </PeriodicFrame>
  )
}
