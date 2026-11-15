import React, { useId } from 'react'

/**
 * The sodium fusion extract in a china dish, drawn in the same 340 × 300 units as FusionTube so
 * the two can be swapped. Optional ion chips sit above the dish. Used for the extract Step and
 * for the element detective once the compound is fused.
 */
export interface ExtractDishProps {
  /** Ion chips above the dish, e.g. ['CN⁻', 'S²⁻']. Empty for no chips. */
  ions?: readonly string[]
  /** Text under the dish. */
  caption?: string
}

const RIM = 'M50,176 Q58,214 130,214 Q202,214 210,176 Z'
const CHIP_HEIGHT = 30

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
    <g role="img" aria-label={ions.length > 0 ? `Extract holding ${ions.join(', ')}` : 'Sodium fusion extract'}>
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
            <rect x={x} y={112} width={w} height={CHIP_HEIGHT} rx={CHIP_HEIGHT / 2} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={1.2} />
            <text x={x + w / 2} y={112 + CHIP_HEIGHT / 2} textAnchor="middle" dominantBaseline="central" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg)">
              {ion}
            </text>
          </g>
        )
      })}

      <path d={RIM} fill="var(--surface)" stroke="var(--glass)" strokeWidth={2} />
      <g clipPath={`url(#${clip})`}>
        <rect x={50} y={184} width={160} height={30} fill="var(--liquid)" />
      </g>
      <ellipse cx={130} cy={176} rx={80} ry={4} fill="none" stroke="var(--glass)" strokeWidth={1.4} />

      <text x={130} y={246} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
        {caption}
      </text>
    </g>
  )
}
