'use client'

import type { ChromatogramSpot } from '@/components/organic/lab'

/**
 * Paper chromatography drawn in the Scrolly's own coordinates. The origin line sits 30 units above the
 * solvent surface (the drawing has no cm scale), so the spots never dip into the solvent.
 */
export const PAPER_ORIGIN_Y = 380
export const PAPER_SOLVENT_Y = 410
export const PAPER_FRONT_UNITS = 260
const JAR = { x0: 150, x1: 330, top: 80, bottom: 450 }
const STRIP = { x0: 222, x1: 258, top: 110, bottom: 430 }

export interface PaperStripProps {
  spots: readonly ChromatogramSpot[]
  /** Solvent progress, 0 to 1. */
  progress: number
}

export function PaperStrip({ spots, progress }: PaperStripProps) {
  const p = Math.min(1, Math.max(0, progress))
  const frontY = PAPER_ORIGIN_Y - p * PAPER_FRONT_UNITS
  const cx = (STRIP.x0 + STRIP.x1) / 2
  return (
    <g>
      <rect x={140} y={62} width={JAR.x1 - JAR.x0 + 20} height={18} rx={5} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.6} />
      <rect x={JAR.x0} y={JAR.top} width={JAR.x1 - JAR.x0} height={JAR.bottom - JAR.top} rx={10} fill="var(--glass-fill)" />
      <rect x={JAR.x0 + 2} y={PAPER_SOLVENT_Y} width={JAR.x1 - JAR.x0 - 4} height={JAR.bottom - PAPER_SOLVENT_Y - 2} fill="var(--liquid)" opacity={0.85} />
      <line x1={JAR.x0 + 2} x2={JAR.x1 - 2} y1={PAPER_SOLVENT_Y} y2={PAPER_SOLVENT_Y} stroke="var(--liquid-edge)" strokeWidth={1.4} />
      <rect x={STRIP.x0} y={STRIP.top} width={STRIP.x1 - STRIP.x0} height={STRIP.bottom - STRIP.top} rx={3} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.4} />
      <rect x={JAR.x0} y={JAR.top} width={JAR.x1 - JAR.x0} height={JAR.bottom - JAR.top} rx={10} fill="none" stroke="var(--glass)" strokeWidth={2} />

      <line x1={STRIP.x0} x2={STRIP.x1} y1={PAPER_ORIGIN_Y} y2={PAPER_ORIGIN_Y} stroke="var(--fg-muted)" strokeWidth={1.4} strokeDasharray="4 3" />
      <text x={JAR.x0 - 10} y={PAPER_ORIGIN_Y} textAnchor="end" dominantBaseline="central" fontSize={14} fill="var(--fg)" fontFamily="var(--font-sans)">
        origin
      </text>
      {p > 0 && (
        <g>
          <line x1={STRIP.x0} x2={STRIP.x1} y1={frontY} y2={frontY} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="6 3" />
          <text x={JAR.x0 - 10} y={frontY} textAnchor="end" dominantBaseline="central" fontSize={14} fill="var(--accent)" fontFamily="var(--font-sans)">
            front
          </text>
        </g>
      )}

      {spots.map((spot, i) => {
        const y = PAPER_ORIGIN_Y - spot.rf * p * PAPER_FRONT_UNITS
        const x = cx + (i === 0 ? -8 : 8)
        return (
          <g key={spot.id}>
            <circle cx={x} cy={y} r={6} fill={spot.color ?? 'var(--spot-1)'} stroke="var(--surface)" strokeWidth={0.8} />
            <text x={x + 14} y={y} dominantBaseline="central" fontSize={14} fill="var(--fg)" fontFamily="var(--font-sans)">
              {spot.id}
            </text>
          </g>
        )
      })}
    </g>
  )
}
