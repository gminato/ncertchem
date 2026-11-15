import React, { forwardRef } from 'react'
import { rateState, ratesEqual, type RateConfig } from './geometry'

/** Drawing size in SVG units. Parents use it as the viewBox. */
export const RATE_BARS_SIZE = { width: 360, height: 140 } as const

const BAR = { x: 20, w: 320, h: 22 }
const FWD_Y = 30
const REV_Y = 74

export interface RateBarsProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** 0 = reaction just started (only the forward rate), 1 = equilibrium (rates equal). */
  progress?: number
  /** Rates at progress 0 and the common equilibrium value. Defaults give a forward-only start. */
  config?: Partial<RateConfig>
  /** Label for the forward bar. */
  forwardLabel?: React.ReactNode
  /** Label for the reverse bar. */
  reverseLabel?: React.ReactNode
  /** Accessible name for the chart. */
  title?: string
  x?: number
  y?: number
}

const DEFAULTS: RateConfig = { forwardStart: 1, reverseStart: 0, equilibrium: 0.6 }

/**
 * Forward and reverse rates as two horizontal bars. The bars share one fixed scale, so a
 * bar that shrinks or grows is a real change in rate. At equilibrium they match and an
 * "equal rates" marker appears between them.
 */
export const RateBars = forwardRef<SVGGElement, RateBarsProps>(function RateBars(
  { progress = 1, config, forwardLabel = 'Forward rate', reverseLabel = 'Reverse rate', title, x = 0, y = 0, className, ...rest },
  ref
) {
  const cfg: RateConfig = { ...DEFAULTS, ...config }
  const p = Math.min(1, Math.max(0, progress))
  const { forward, reverse } = rateState(p, cfg)
  const scale = Math.max(cfg.forwardStart, cfg.reverseStart, cfg.equilibrium, 1e-9) * 1.08
  const fw = (forward / scale) * BAR.w
  const rw = (reverse / scale) * BAR.w
  const equal = ratesEqual(forward, reverse)

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} className={className} role="img" aria-label={title ?? 'Forward and reverse rates'} {...rest}>
      {/* Forward */}
      <text x={BAR.x} y={FWD_Y - 12} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fwd)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        {forwardLabel}
      </text>
      <text x={BAR.x + BAR.w} y={FWD_Y - 12} textAnchor="end" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" style={{ fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
        {forward.toFixed(2)}
      </text>
      <rect x={BAR.x} y={FWD_Y} width={BAR.w} height={BAR.h} rx={6} fill="var(--surface-raised)" />
      <rect x={BAR.x} y={FWD_Y} width={Math.max(0, fw)} height={BAR.h} rx={6} fill="var(--fwd)" />

      {/* Reverse */}
      <text x={BAR.x} y={REV_Y - 12} fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--rev)" dominantBaseline="central" style={{ userSelect: 'none' }}>
        {reverseLabel}
      </text>
      <text x={BAR.x + BAR.w} y={REV_Y - 12} textAnchor="end" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" dominantBaseline="central" style={{ fontVariantNumeric: 'tabular-nums', userSelect: 'none' }}>
        {reverse.toFixed(2)}
      </text>
      <rect x={BAR.x} y={REV_Y} width={BAR.w} height={BAR.h} rx={6} fill="var(--surface-raised)" />
      <rect x={BAR.x} y={REV_Y} width={Math.max(0, rw)} height={BAR.h} rx={6} fill="var(--rev)" />

      {/* Equal-rates marker */}
      <g opacity={equal ? 1 : 0} style={{ transition: 'opacity 0.3s ease' }}>
        <rect x={BAR.x + BAR.w / 2 - 66} y={112} width={132} height={24} rx={12} fill="var(--surface)" stroke="var(--fg)" strokeWidth={1.4} />
        <text x={BAR.x + BAR.w / 2} y={124.5} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" style={{ userSelect: 'none' }}>
          equal rates
        </text>
      </g>
    </g>
  )
})
