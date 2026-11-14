'use client'

import React, { useId, useMemo, useRef, useState } from 'react'
import type { Block, ElementRecord, PositionFn } from './types'
import {
  CELL,
  CELL_RADIUS,
  COLS,
  GUTTER_LEFT,
  GUTTER_TOP,
  PITCH,
  cellRect as layoutCellRect,
  colLeft,
  displayName,
  nameFits,
  nextFocusZ,
  tableViewBox,
} from './layout'
import type { CellRect } from './layout'
import { MISSING_FILL, contrastText } from './colour-scale'
import styles from './PeriodicTable.module.css'

export { MISSING_FILL }

export interface CellStyle {
  /** A CSS colour for the cell fill. Pass MISSING_FILL to draw the hatched "no data" cell. */
  fill?: string
  /** A value line drawn in the bottom of the cell, for heatmaps. */
  value?: string
  /** Lowers the cell's opacity, for filtered views. */
  dim?: boolean
}

export interface PeriodicTableProps {
  elements: readonly ElementRecord[]
  position: PositionFn
  cell?: (el: ElementRecord) => CellStyle
  highlight?: readonly number[]
  selected?: number
  onSelect?: (el: ElementRecord) => void
  /**
   * full: symbol, Z and name (where it fits). compact: symbol and Z only,
   * for heatmaps. Mass is not drawn in either: it lives in the caption and tile.
   */
  variant: 'full' | 'compact'
  showGroupNumbers?: boolean
  showPeriodNumbers?: boolean
  blockShading?: boolean
  categoryShading?: boolean
  /** Overlay slot (arrows, brackets) in the table's own SVG coordinate system. */
  layer?: React.ReactNode
  /** Accessible name for the table. */
  title?: string
  className?: string
}

const BLOCK_FILL: Record<Block, string> = {
  s: 'var(--block-s)',
  p: 'var(--block-p)',
  d: 'var(--block-d)',
  f: 'var(--block-f)',
}

const CATEGORY_FILL: Record<ElementRecord['category'], string> = {
  metal: 'var(--cat-metal)',
  'non-metal': 'var(--cat-nonmetal)',
  metalloid: 'var(--cat-metalloid)',
}

const NAV_KEYS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'])

/** Geometry of a grid position, for overlays. Returns null for off-grid positions. */
export function cellRect(Z: number, position: PositionFn): CellRect | null {
  return layoutCellRect(Z, position)
}

/** "Sodium, Z 11, group 1, period 3", or "Cerium, Z 58, f-block, period 6". */
export function cellAriaLabel(el: ElementRecord, value?: string): string {
  const where = el.group !== null ? `group ${el.group}` : 'f-block'
  const base = `${displayName(el)}, Z ${el.Z}, ${where}, period ${el.period}`
  return value ? `${base}, ${value}` : base
}

/**
 * The periodic table as one SVG, so it scales crisply and GSAP can animate
 * its cells through the data attributes. Keyboard users move with the arrow
 * keys (roving tabindex), and Enter or Space selects a cell.
 */
export function PeriodicTable({
  elements,
  position,
  cell,
  highlight,
  selected,
  onSelect,
  variant,
  showGroupNumbers = false,
  showPeriodNumbers = false,
  blockShading = false,
  categoryShading = false,
  layer,
  title = 'Periodic table of the elements',
  className,
}: PeriodicTableProps) {
  const uid = useId().replace(/:/g, '')
  const hatchId = `${uid}-hatch`
  const svgRef = useRef<SVGSVGElement>(null)
  const [focusZ, setFocusZ] = useState<number | null>(null)

  const viewBox = useMemo(() => tableViewBox(), [])
  const byZ = useMemo(() => new Map(elements.map((el) => [el.Z, el])), [elements])
  const highlighted = useMemo(() => new Set(highlight ?? []), [highlight])
  const placed = useMemo(() => elements.filter((el) => position(el.Z).row >= 1), [elements, position])

  // Roving tabindex: one cell is in the tab order. Prefer the last focused cell,
  // then the selected one, then the first cell.
  const firstZ = placed.reduce<number | null>((min, el) => (min === null || el.Z < min ? el.Z : min), null)
  const tabStop = focusZ ?? selected ?? firstZ

  const moveFocus = (Z: number) => {
    setFocusZ(Z)
    const node = svgRef.current?.querySelector<SVGGElement>(`[data-z="${Z}"]`)
    node?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    const target = event.target as Element
    const node = target.closest?.('[data-z]')
    if (!node) return
    const Z = Number(node.getAttribute('data-z'))
    const el = byZ.get(Z)
    if (!el) return

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect?.(el)
      return
    }
    if (NAV_KEYS.has(event.key)) {
      event.preventDefault()
      const next = nextFocusZ(elements, position, Z, event.key)
      if (next !== Z) moveFocus(next)
    }
  }

  const compact = variant === 'compact'
  const groups = Array.from({ length: COLS }, (_, i) => i + 1)
  const periods = [1, 2, 3, 4, 5, 6, 7]
  // The f-block row labels sit in columns 1 and 2, right-aligned against column 3.
  const fLabelX = GUTTER_LEFT + colLeft(3) - 8

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewBox.width} ${viewBox.height}`}
      className={`${styles.table} ${compact ? styles.compact : ''} ${className ?? ''}`}
      role="group"
      aria-label={title}
      onKeyDown={onKeyDown}
      data-variant={variant}
    >
      <defs>
        <pattern id={hatchId} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={6} height={6} style={{ fill: 'var(--surface-raised)' }} />
          <line x1={0} y1={0} x2={0} y2={6} strokeWidth={1.4} style={{ stroke: 'var(--fg-subtle)' }} />
        </pattern>
      </defs>

      {showGroupNumbers &&
        groups.map((g) => (
          <text
            key={`g${g}`}
            x={GUTTER_LEFT + colLeft(g) + PITCH / 2}
            y={GUTTER_TOP - 10}
            textAnchor="middle"
            className={styles.axis}
          >
            {g}
          </text>
        ))}

      {showPeriodNumbers &&
        periods.map((p) => (
          <text
            key={`p${p}`}
            x={GUTTER_LEFT - 10}
            y={rectFor(p, 1).cy + 4}
            textAnchor="end"
            className={styles.axis}
          >
            {p}
          </text>
        ))}

      <text x={fLabelX} y={rectFor(9, 3).cy + 4} textAnchor="end" className={styles.fBlockLabel}>
        Lanthanoids
      </text>
      <text x={fLabelX} y={rectFor(10, 3).cy + 4} textAnchor="end" className={styles.fBlockLabel}>
        Actinoids
      </text>

      {placed.map((el) => {
        const style = cell?.(el) ?? {}
        const pos = position(el.Z)
        const rect = rectFor(pos.row, pos.col)
        const isMissing = style.fill === MISSING_FILL
        const fillStyle = isMissing
          ? `url(#${hatchId})`
          : (style.fill ??
            (blockShading ? BLOCK_FILL[el.block] : categoryShading ? CATEGORY_FILL[el.category] : undefined))
        // Missing cells use a muted ink on the hatch. Filled cells use black or
        // white, whichever contrasts more. Plain cells keep the theme ink.
        const textFill = isMissing ? 'var(--fg-muted)' : style.fill ? contrastText(style.fill) : undefined
        const isSelected = selected === el.Z
        const isHighlight = highlighted.has(el.Z)
        const isTabStop = tabStop === el.Z
        const hasValue = style.value !== undefined
        const showName = !compact && !hasValue && nameFits(displayName(el))
        const label = cellAriaLabel(el, style.value)
        const classes = [
          styles.cell,
          isSelected ? styles.selected : '',
          isHighlight ? styles.highlight : '',
          style.dim ? styles.dim : '',
        ]
          .filter(Boolean)
          .join(' ')

        // Layout inside the cell. Z sits in the top-left corner and never shares
        // a line with the symbol. The symbol is centred. The name or the value
        // sits along the bottom edge.
        const symbolSize = compact ? 24 : hasValue ? 19 : 22
        // Vertical centre of the symbol, clear of the Z corner above and the name below.
        const symbolY = compact ? rect.cy + 8 : hasValue ? rect.cy + 3 : showName ? rect.cy + 6 : rect.cy + 8

        return (
          <g
            key={el.Z}
            role="button"
            tabIndex={isTabStop ? 0 : -1}
            aria-label={label}
            aria-current={isSelected ? 'true' : undefined}
            className={classes}
            data-z={el.Z}
            data-symbol={el.symbol}
            data-block={el.block}
            data-group={el.group === null ? '' : String(el.group)}
            data-period={el.period}
            data-category={el.category}
            data-row={pos.row}
            data-col={pos.col}
            onClick={() => {
              setFocusZ(el.Z)
              onSelect?.(el)
            }}
            onFocus={() => setFocusZ(el.Z)}
          >
            <rect
              x={rect.x}
              y={rect.y}
              width={rect.width}
              height={rect.height}
              rx={CELL_RADIUS}
              className={styles.cellRect}
              style={fillStyle ? { fill: fillStyle } : undefined}
            />
            <rect
              x={rect.x - 3}
              y={rect.y - 3}
              width={rect.width + 6}
              height={rect.height + 6}
              rx={CELL_RADIUS + 3}
              className={styles.ring}
              aria-hidden="true"
            />
            <text
              x={rect.x + 6}
              y={rect.y + 13}
              className={styles.z}
              style={textFill ? { fill: textFill, opacity: 0.85 } : undefined}
            >
              {el.Z}
            </text>
            <text
              x={rect.cx}
              y={symbolY}
              textAnchor="middle"
              className={styles.symbol}
              style={{ fontSize: symbolSize, ...(textFill ? { fill: textFill } : {}) }}
            >
              {el.symbol}
            </text>
            {hasValue && (
              <text
                x={rect.cx}
                y={rect.y + rect.height - 7}
                textAnchor="middle"
                className={styles.value}
                style={textFill ? { fill: textFill } : undefined}
              >
                {style.value}
              </text>
            )}
            {showName && (
              <text
                x={rect.cx}
                y={rect.y + rect.height - 6}
                textAnchor="middle"
                className={styles.name}
                style={textFill ? { fill: textFill } : undefined}
              >
                {displayName(el)}
              </text>
            )}
          </g>
        )
      })}

      {layer}
    </svg>
  )
}

/** Rect for a grid position. Positions off the grid fall back to the origin. */
function rectFor(row: number, col: number): CellRect {
  return (
    layoutCellRect(0, () => ({ row, col })) ?? {
      x: 0,
      y: 0,
      width: CELL,
      height: CELL,
      cx: CELL / 2,
      cy: CELL / 2,
    }
  )
}
