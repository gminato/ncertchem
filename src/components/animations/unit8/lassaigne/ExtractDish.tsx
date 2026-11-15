import React, { useId } from 'react'

/**
 * The sodium fusion extract being filtered: a funnel over a china dish, drawn in 340 × 300 units
 * so it can sit beside the FusionTube. Optional ion chips sit above the funnel. Used for the
 * extract Step and for the element detective once the compound is fused.
 */
export interface ExtractDishProps {
  /** Ion chips above the drawing, e.g. ['CN⁻', 'S²⁻']. Empty for no chips. */
  ions?: readonly string[]
  /** Text under the dish. */
  caption?: string
}

const RIM = 'M50,176 Q58,214 130,214 Q202,214 210,176 Z'
const FUNNEL = 'M60,40 L200,40 L140,128 L140,150 L120,150 L120,128 Z'
const CHIP_HEIGHT = 30
const CHIP_TOP = 4

/** Width of a chip for an ion label: a fixed padding plus a rough advance per character. */
function chipWidth(label: string): number {
  return Math.max(46, label.length * 11 + 22)
}

export function ExtractDish({ ions = [], caption = 'sodium fusion extract' }: ExtractDishProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const clip = `ed-${uid}`
  const widths = ions.map(chipWidth)
  const gap = 12
  const totalWidth = widths.reduce((a, w) => a + w, 0) + gap * Math.max(0, ions.length - 1)
  const left = 130 - totalWidth / 2
  const xs = widths.map((_, i) => left + widths.slice(0, i).reduce((sum, w) => sum + w + gap, 0))

  return (
    <g role="img" aria-label={ions.length > 0 ? `Extract holding ${ions.join(', ')}` : 'Sodium fusion extract being filtered'}>
      <defs>
        <clipPath id={clip}>
          <path d={RIM} />
        </clipPath>
      </defs>

      {ions.map((ion, i) => {
        const w = widths[i]
        const x = xs[i]
        return (
          <g key={`${ion}-${i}`}>
            <rect x={x} y={CHIP_TOP} width={w} height={CHIP_HEIGHT} rx={CHIP_HEIGHT / 2} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.2} />
            <text x={x + w / 2} y={CHIP_TOP + CHIP_HEIGHT / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg)">
              {ion}
            </text>
          </g>
        )
      })}

      {/* Filter funnel, with one drop falling into the dish */}
      <path d={FUNNEL} fill="var(--surface)" stroke="var(--glass)" strokeWidth={1.6} strokeLinejoin="round" />
      <line x1={60} x2={200} y1={40} y2={40} stroke="var(--glass)" strokeWidth={2.4} strokeLinecap="round" />
      <circle cx={130} cy={162} r={3} fill="var(--liquid-edge)" />

      <path d={RIM} fill="var(--surface)" stroke="var(--glass)" strokeWidth={2} />
      <g clipPath={`url(#${clip})`}>
        <rect x={50} y={184} width={160} height={30} fill="var(--liquid)" />
      </g>
      <ellipse cx={130} cy={176} rx={80} ry={4} fill="none" stroke="var(--glass)" strokeWidth={1.4} />

      <text x={130} y={254} textAnchor="middle" fontSize={14} fontFamily="var(--font-sans)" fill="var(--fg)">
        {caption}
      </text>
    </g>
  )
}
