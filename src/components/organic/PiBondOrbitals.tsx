import React, { forwardRef } from 'react'

/** Size of the π-orbital drawing, for a parent viewBox centred on the origin. */
export const PI_ORBITALS_SIZE = { width: 300, height: 230 } as const

export type PiMolecule = 'ethene' | 'ethyne' | 'benzene'

export interface PiBondOrbitalsProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  molecule: PiMolecule
  /**
   * 0 to 1. At 0 each p orbital is a separate lobe on its carbon; at 1 the lobes have merged into
   * the π cloud (ethene: one cloud above and one below the plane; ethyne: a cylinder around the
   * axis; benzene: a doughnut above and below the ring).
   */
  merge?: number
  /** Bond-angle labels at the sp² and sp carbons. */
  showAngles?: boolean
  x?: number
  y?: number
}

/** Plane coordinates (u along the screen, v into the page) projected to the screen. The molecular plane is seen from above, so out-of-plane height h is screen-up. */
function pt(u: number, v: number, h = 0): { x: number; y: number } {
  return { x: u + 0.4 * v, y: -0.5 * v - h }
}

const LOBE_H = 24
const LOBE_STYLE = {
  fill: 'var(--pi-lobe)',
  fillOpacity: 0.3,
  stroke: 'var(--pi-lobe)',
  strokeWidth: 1.6,
} as const

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function Bond({ a, b, width = 3.4 }: { a: { x: number; y: number }; b: { x: number; y: number }; width?: number }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--sigma-bond)" strokeWidth={width} strokeLinecap="round" />
}

function Atom({ at, label }: { at: { x: number; y: number }; label: string }) {
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={label === 'C' ? 7 : 5} fill={label === 'C' ? 'var(--sigma-bond)' : 'var(--surface)'} stroke="var(--sigma-bond)" strokeWidth={1.4} />
    </g>
  )
}

function Lobe({ cx, cy, rx, ry, opacity = 1 }: { cx: number; cy: number; rx: number; ry: number; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...LOBE_STYLE} opacity={opacity} />
}

function Label({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" stroke="var(--surface)" strokeWidth={4} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  )
}

/**
 * π bonding in three molecules: ethene (sp² σ framework, the two p lobes merging into the π cloud
 * above and below the plane), ethyne (two perpendicular π clouds around the linear σ axis, merging
 * into a cylinder) and benzene (six p orbitals merging into the delocalised ring above and below).
 */
export const PiBondOrbitals = forwardRef<SVGGElement, PiBondOrbitalsProps>(function PiBondOrbitals(
  { molecule, merge = 0, showAngles = true, x = 0, y = 0, ...rest },
  ref
) {
  const m = Math.min(1, Math.max(0, merge))
  const ringProps = { stroke: 'var(--pi-lobe)', fill: 'none', strokeLinecap: 'round' as const }

  if (molecule === 'ethene') {
    const c1 = pt(-33, 0)
    const c2 = pt(33, 0)
    const mid = pt(0, 0)
    // Hydrogens at 120° from the C=C axis, on both sides of the plane's long axis.
    const hs = [
      { c: -33, v: 52 },
      { c: -33, v: -52 },
      { c: 33, v: 52 },
      { c: 33, v: -52 },
    ]
    const cx1 = lerp(c1.x, mid.x, m)
    const cx2 = lerp(c2.x, mid.x, m)
    const rx = lerp(10, 36, m)
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <Bond a={c1} b={c2} width={4.4} />
        {hs.map((h, i) => {
          const cp = h.c < 0 ? c1 : c2
          const end = pt(h.c + (h.c < 0 ? -30 : 30), h.v)
          return (
            <g key={`h-${i}`}>
              <Bond a={cp} b={end} />
              <Atom at={end} label="H" />
            </g>
          )
        })}
        {/* Upper and lower lobes: separate at 0, merged into one cloud at 1 */}
        <g opacity={1}>
          <Lobe cx={cx1} cy={c1.y - LOBE_H} rx={rx} ry={18} opacity={1} />
          <Lobe cx={cx2} cy={c2.y - LOBE_H} rx={rx} ry={18} opacity={1} />
          <Lobe cx={cx1} cy={c1.y + LOBE_H} rx={rx} ry={18} opacity={1} />
          <Lobe cx={cx2} cy={c2.y + LOBE_H} rx={rx} ry={18} opacity={1} />
        </g>
        <Atom at={c1} label="C" />
        <Atom at={c2} label="C" />
        {showAngles && (
          <>
            <Label x={-70} y={0}>
              120°
            </Label>
            <Label x={70} y={0}>
              120°
            </Label>
          </>
        )}
      </g>
    )
  }

  if (molecule === 'ethyne') {
    const a = -40
    const b = 40
    const c1 = pt(a, 0)
    const c2 = pt(b, 0)
    const mid = pt(0, 0)
    const cap = lerp(0, 1, m)
    const half = LOBE_H
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        {/* Linear σ axis with the two C–H bonds */}
        <Bond a={pt(-100, 0)} b={pt(100, 0)} width={3} />
        <Bond a={c1} b={c2} width={4.4} />
        <Atom at={pt(-100, 0)} label="H" />
        <Atom at={pt(100, 0)} label="H" />
        <Atom at={c1} label="C" />
        <Atom at={c2} label="C" />
        {/* Four lobes: up and down (π in the plane), front and back (the second π) */}
        <g opacity={1 - cap}>
          {[a, b].map((u, i) => (
            <g key={`lobe-${i}`}>
              <Lobe cx={pt(u, 0).x} cy={pt(u, 0, half + 4).y} rx={14} ry={16} />
              <Lobe cx={pt(u, 0).x} cy={pt(u, 0, -half - 4).y} rx={14} ry={16} />
              <Lobe cx={pt(u, 40).x} cy={pt(u, 40).y} rx={13} ry={8} />
              <Lobe cx={pt(u, -40).x} cy={pt(u, -40).y} rx={13} ry={8} />
            </g>
          ))}
        </g>
        {/* The merged cylinder: both π clouds as one tube around the axis */}
        <g opacity={cap}>
          <rect x={mid.x - 62} y={mid.y - 24} width={124} height={48} rx={24} {...LOBE_STYLE} />
        </g>
        {showAngles && (
          <Label x={0} y={-62}>
            180°
          </Label>
        )}
      </g>
    )
  }

  // Benzene
  const R = 74
  const verts = Array.from({ length: 6 }, (_, k) => {
    const th = (k * 60 * Math.PI) / 180
    return { u: R * Math.cos(th), v: R * Math.sin(th) }
  })
  const ringPoints = (h: number) => {
    const steps = 72
    const pts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2
      const p = pt(R * Math.cos(th), R * Math.sin(th), h)
      pts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    }
    return pts.join(' ') + ' Z'
  }
  const ringWidth = lerp(4, 22, m)
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* σ framework: ring and C–H bonds */}
      {verts.map((p, k) => {
        const q = verts[(k + 1) % 6]
        return <Bond key={`cc-${k}`} a={pt(p.u, p.v)} b={pt(q.u, q.v)} width={3.4} />
      })}
      {verts.map((p, k) => {
        const len = Math.hypot(p.u, p.v)
        const hu = p.u + (p.u / len) * 44
        const hv = p.v + (p.v / len) * 44
        return (
          <g key={`ch-${k}`}>
            <Bond a={pt(p.u, p.v)} b={pt(hu, hv)} width={2.4} />
          </g>
        )
      })}
      {/* Lobes: separate at 0, fading as the doughnut forms */}
      <g opacity={1 - m}>
        {verts.flatMap((p, k) => {
          const c = pt(p.u, p.v)
          return [
            <Lobe key={`up-${k}`} cx={c.x} cy={c.y - LOBE_H} rx={9} ry={16} />,
            <Lobe key={`dn-${k}`} cx={c.x} cy={c.y + LOBE_H} rx={9} ry={16} />,
          ]
        })}
      </g>
      {/* Doughnut above and below the ring */}
      <g opacity={m} >
        <path d={ringPoints(LOBE_H)} {...ringProps} strokeWidth={ringWidth} strokeOpacity={0.45} />
        <path d={ringPoints(-LOBE_H)} {...ringProps} strokeWidth={ringWidth} strokeOpacity={0.45} />
      </g>
      {verts.map((p, k) => (
        <Atom key={`a-${k}`} at={pt(p.u, p.v)} label="C" />
      ))}
      {showAngles && <Label x={0} y={-4}>120°</Label>}
    </g>
  )
})
