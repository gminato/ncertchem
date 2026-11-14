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
  periods:
    'Read across a row and the outermost shell keeps the same n. Period 2 has n = 2 and period 3 has n = 3, so the period number is the principal quantum number of the valence shell.',
  'group-columns':
    'Read down a column and the outer configuration repeats. Group 1 is ns¹ in every period, and group 17 is ns²np⁵. Only n changes from one row to the next.',
  s: 'The s-block is groups 1 and 2. The last electron enters an s subshell, so the outer configuration is ns¹ or ns². Helium is also an s-block element, but it sits in group 18 because its shell is full.',
  p: 'The p-block is groups 13 to 18. The last electron enters a p subshell, so the outer configuration runs from ns²np¹ to ns²np⁶. Group 18 has the full ns²np⁶ shell, which is why the noble gases are unreactive.',
  d: 'The d-block is groups 3 to 12, the transition elements. The general outer configuration is (n − 1)d¹⁻¹⁰ ns⁰⁻². Palladium is the exception, with 4d¹⁰ 5s⁰.',
  f: 'The f-block is the two detached rows. The lanthanoids Ce to Lu and the actinoids Th to Lr follow (n − 2)f¹⁻¹⁴ (n − 1)d⁰⁻¹ ns². The last electron enters an f subshell.',
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
  metals:
    'Metals lie to the left of the zig-zag, and they make up most of the table. They are usually solids with high melting points. They conduct heat and electricity well, and they can be hammered into sheets or drawn into wires.',
  'non-metals':
    'Non-metals lie at the top right. They are usually solids or gases with low melting points, and they are poor conductors. Most non-metallic solids are brittle, so they are neither malleable nor ductile. Boron and carbon are the usual exceptions to the low melting points.',
  metalloids:
    'The zig-zag line separates metals from non-metals, and the metalloids lie along it. NCERT names silicon, germanium, arsenic, antimony and tellurium. The data here also class boron and polonium as metalloids.',
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
