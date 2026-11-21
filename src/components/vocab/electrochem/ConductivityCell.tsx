import React, { forwardRef } from 'react'
import { METAL_FILL, SOLUTION_FILL, type SolutionTint } from './materials'

export interface ConductivityCellProps extends React.SVGAttributes<SVGGElement> {
  /** Top-left corner of the cell body. */
  x?: number
  y?: number
  width?: number
  height?: number
  /** Solution between the plates. */
  tint?: SolutionTint
  /** Caption for the plate separation, e.g. "l". */
  lengthLabel?: string
  /** Caption for the plate area, e.g. "A". */
  areaLabel?: string
  /** Show the dimension callouts. */
  dimensions?: boolean
}

/**
 * Two parallel platinum plates of area A, a distance l apart, in a conductivity cell.
 * Cell constant = l / A. The callouts carry the labels the parent passes.
 */
export const ConductivityCell = forwardRef<SVGGElement, ConductivityCellProps>(function ConductivityCell(
  { x = 0, y = 0, width = 200, height = 130, tint = 'clear', lengthLabel = 'l', areaLabel = 'A', dimensions = true, className, ...rest },
  ref
) {
  const plateW = 9
  const leftX = x + 30
  const rightX = x + width - 30 - plateW
  const plateTop = y + 14
  const plateH = height - 28
  const liquid = SOLUTION_FILL[tint] ?? 'var(--liquid)'
  const dimY = y + height * 0.5
  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      <rect x={x} y={y} width={width} height={height} rx={8} fill={liquid} fillOpacity={tint === 'clear' ? 1 : 0.35} stroke="var(--glass-wall)" strokeWidth={2} />
      <rect x={x} y={y} width={width} height={height} rx={8} fill="var(--glass-fill)" fillOpacity={0.2} />
      {/* Leads rising from each plate */}
      <line x1={leftX + plateW / 2} x2={leftX + plateW / 2} y1={plateTop} y2={y - 24} stroke="var(--glass-wall)" strokeWidth={3} />
      <line x1={rightX + plateW / 2} x2={rightX + plateW / 2} y1={plateTop} y2={y - 24} stroke="var(--glass-wall)" strokeWidth={3} />
      <rect x={leftX} y={plateTop} width={plateW} height={plateH} rx={1.5} fill={METAL_FILL.pt} stroke="var(--glass-wall)" strokeWidth={1.2} />
      <rect x={rightX} y={plateTop} width={plateW} height={plateH} rx={1.5} fill={METAL_FILL.pt} stroke="var(--glass-wall)" strokeWidth={1.2} />
      {dimensions && (
        <g stroke="var(--fg-muted)" strokeWidth={1.4} fill="none">
          {/* l: horizontal, between the inner faces of the plates */}
          <line x1={leftX + plateW} x2={rightX} y1={dimY} y2={dimY} />
          <path d={`M${leftX + plateW + 6} ${dimY - 4} L${leftX + plateW} ${dimY} L${leftX + plateW + 6} ${dimY + 4}`} />
          <path d={`M${rightX - 6} ${dimY - 4} L${rightX} ${dimY} L${rightX - 6} ${dimY + 4}`} />
          <text x={(leftX + rightX + plateW) / 2} y={dimY - 8} textAnchor="middle" fontSize={15} fontStyle="italic" fill="var(--fg)" stroke="none">
            {lengthLabel}
          </text>
          {/* A: vertical, along the outer face of the left plate */}
          <line x1={leftX - 12} x2={leftX - 12} y1={plateTop} y2={plateTop + plateH} />
          <path d={`M${leftX - 16} ${plateTop + 6} L${leftX - 12} ${plateTop} L${leftX - 8} ${plateTop + 6}`} />
          <path d={`M${leftX - 16} ${plateTop + plateH - 6} L${leftX - 12} ${plateTop + plateH} L${leftX - 8} ${plateTop + plateH - 6}`} />
          <text x={leftX - 20} y={plateTop + plateH / 2 + 5} textAnchor="end" fontSize={15} fontStyle="italic" fill="var(--fg)" stroke="none">
            {areaLabel}
          </text>
        </g>
      )}
    </g>
  )
})
