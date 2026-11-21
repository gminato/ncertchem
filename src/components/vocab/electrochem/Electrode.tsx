import React, { forwardRef } from 'react'
import { clamp01, hash01 } from './geometry'
import { METAL_FILL, type ElectrodeMaterial } from './materials'

export interface ElectrodeProps extends React.SVGAttributes<SVGGElement> {
  /** Centre x of the strip, in the parent's coordinates. */
  x?: number
  /** Top of the strip. The strip hangs down from here. */
  top?: number
  /** Total length of the strip, from its top to its tip. */
  length?: number
  width?: number
  material?: ElectrodeMaterial
  /** 0 to 1: how far the lower part has been eaten away (anode dissolving). */
  thinning?: number
  /** 0 to 1: thickness of a deposit on the lower part (cathode plating). */
  plating?: number
  /** Material of the deposit. Defaults to `material`. */
  depositMaterial?: ElectrodeMaterial
  /** Polarity badge shown above the strip. */
  polarity?: '+' | '−'
  /** Redox role, shown as a tag beside the badge. */
  role?: 'anode' | 'cathode'
}

const SAMPLES = 24

/** Outline of the strip with its lower part eaten away by `thinning`. */
function stripPath(cx: number, top: number, length: number, width: number, thinning: number): string {
  const erode = clamp01(thinning)
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES
    const y = top + s * length
    const band = clamp01((s - 0.35) / 0.65)
    const inset = erode * band * width * 0.42
    // Small irregular bites, deterministic per sample
    const biteL = erode * band * (0.8 + 2.4 * hash01(i + 3)) * (i % 3 === 0 ? 1 : 0.2)
    const biteR = erode * band * (0.8 + 2.4 * hash01(i + 41)) * (i % 4 === 0 ? 1 : 0.2)
    const xl = cx - width / 2 + inset + biteL
    const xr = cx + width / 2 - inset - biteR
    left.push(`${xl.toFixed(2)} ${y.toFixed(2)}`)
    right.unshift(`${xr.toFixed(2)} ${y.toFixed(2)}`)
  }
  return `M${left.join(' L')} L${right.join(' L')} Z`
}

/**
 * A metal strip or rod. Its top sits at `top`. The badge and role tag sit above it.
 * `thinning` and `plating` change the lower part only, so one component draws a
 * dissolving anode and a plated cathode.
 */
export const Electrode = forwardRef<SVGGElement, ElectrodeProps>(function Electrode(
  {
    x = 0,
    top = 0,
    length = 150,
    width = 16,
    material = 'cu',
    thinning = 0,
    plating = 0,
    depositMaterial,
    polarity,
    role,
    className,
    ...rest
  },
  ref
) {
  const fill = METAL_FILL[material]
  const deposit = METAL_FILL[depositMaterial ?? material]
  const body = stripPath(x, top, length, width, thinning)
  const pl = clamp01(plating)
  const offset = pl * 5
  const depositTop = top + length * 0.5
  const depositH = length * 0.5 - 2
  const grains = Array.from({ length: Math.round(pl * 14) }, (_, i) => ({
    gx: x + (hash01(i + 90) - 0.5) * (width + offset * 1.2),
    gy: depositTop + hash01(i + 120) * depositH,
    gr: 1.2 + hash01(i + 150) * 1.4,
  }))
  const roleColour = role === 'anode' ? 'var(--ox)' : 'var(--red)'
  const roleText = role === 'anode' ? 'Anode' : role === 'cathode' ? 'Cathode' : null

  return (
    <g ref={ref} className={className} aria-hidden="true" {...rest}>
      <path d={body} fill={fill} stroke="var(--glass-wall)" strokeWidth={1.2} strokeLinejoin="round" />
      {/* Lighter stripe along the metal, for a rod-like sheen */}
      <line
        x1={x - width / 4}
        x2={x - width / 4}
        y1={top + 8}
        y2={top + length * 0.6}
        stroke="var(--glass-sheen)"
        strokeOpacity={0.45}
        strokeWidth={2}
        strokeLinecap="round"
      />
      {pl > 0 && (
        <g>
          <rect
            x={x - width / 2 - offset}
            y={depositTop}
            width={width + offset * 2}
            height={depositH}
            rx={Math.min(offset, 4)}
            fill={deposit}
            fillOpacity={0.92}
            stroke="var(--glass-wall)"
            strokeWidth={0.8}
          />
          {grains.map((g, i) => (
            <circle key={i} cx={g.gx} cy={g.gy} r={g.gr} fill="var(--glass-sheen)" fillOpacity={0.5} />
          ))}
        </g>
      )}
      {polarity && (
        <g>
          <circle cx={x} cy={top - 20} r={11} fill="var(--surface)" stroke="var(--glass-wall)" strokeWidth={1.4} />
          <text x={x} y={top - 15} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
            {polarity}
          </text>
        </g>
      )}
      {roleText && (
        <text x={x + 18} y={top - 15} fontSize={14} fontWeight={600} fill={roleColour}>
          {roleText}
        </text>
      )}
    </g>
  )
})
