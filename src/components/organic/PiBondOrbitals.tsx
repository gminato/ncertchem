import React, { forwardRef } from 'react'

export type PiMolecule = 'ethene' | 'ethyne' | 'benzene'

/** View box of each molecule's drawing, centred on the origin. Use it as the parent's viewBox. */
export const PI_VIEWBOX: Record<PiMolecule, { x: number; y: number; width: number; height: number }> = {
  ethene: { x: -118, y: -84, width: 236, height: 168 },
  ethyne: { x: -124, y: -84, width: 248, height: 168 },
  benzene: { x: -200, y: -132, width: 400, height: 264 },
}

export interface PiBondOrbitalsProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  molecule: PiMolecule
  /**
   * 0 to 1. At 0 each p orbital is a separate lobe perpendicular to the plane of the molecule.
   * At 1 the lobes have merged into the π cloud: ethene, one cloud above and one below the plane;
   * ethyne, a cylinder round the axis; benzene, two doughnuts above and below the σ ring.
   */
  merge?: number
  /** Bond-angle labels (ethene and ethyne). */
  showAngles?: boolean
  x?: number
  y?: number
}

/**
 * The molecule's plane is seen from above at a slant: the point (u, v) in the plane projects to
 * x = u + 0.2v, y = -0.32v, and a height h out of the plane (towards the viewer above) is screen-up.
 */
function pt(u: number, v: number, h = 0): { x: number; y: number } {
  return { x: u + 0.2 * v, y: -0.32 * v - h }
}

const LOBE = { fill: 'var(--pi-lobe)', fillOpacity: 0.32, stroke: 'var(--pi-lobe)', strokeWidth: 1.8 } as const
const SIGMA = 'var(--sigma-bond)'

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function Bond({ a, b, width = 4 }: { a: { x: number; y: number }; b: { x: number; y: number }; width?: number }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SIGMA} strokeWidth={width} strokeLinecap="round" />
}

function Carbon({ at }: { at: { x: number; y: number } }) {
  return <circle cx={at.x} cy={at.y} r={8} fill={SIGMA} stroke="var(--surface)" strokeWidth={1.5} />
}

function Hydrogen({ at }: { at: { x: number; y: number } }) {
  return <circle cx={at.x} cy={at.y} r={7} fill="var(--surface)" stroke={SIGMA} strokeWidth={1.8} />
}

function Lobe({ cx, cy, rx, ry, opacity = 1 }: { cx: number; cy: number; rx: number; ry: number; opacity?: number }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...LOBE} opacity={opacity} />
}

function AngleLabel({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)" stroke="var(--surface)" strokeWidth={5} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  )
}

/**
 * π bonding in three molecules, drawn in a slanted view of the molecular plane. Ethene: the sp²
 * σ framework with the two p lobes merging into the π cloud above and below the plane. Ethyne:
 * the linear σ axis with two perpendicular π clouds that merge into a cylinder. Benzene: the σ
 * ring with six perpendicular p orbitals that merge into two doughnuts, above and below the ring.
 */
export const PiBondOrbitals = forwardRef<SVGGElement, PiBondOrbitalsProps>(function PiBondOrbitals(
  { molecule, merge = 0, showAngles = true, x = 0, y = 0, ...rest },
  ref
) {
  const m = Math.min(1, Math.max(0, merge))

  if (molecule === 'ethene') {
    const c1 = pt(-33, 0)
    const c2 = pt(33, 0)
    const mid = pt(0, 0)
    // Hydrogens lie in the plane at 120° from the C=C axis, out to either side of each carbon.
    const hs = [
      { cu: -33, v: 60 },
      { cu: -33, v: -60 },
      { cu: 33, v: 60 },
      { cu: 33, v: -60 },
    ]
    const cx1 = lerp(c1.x, mid.x, m)
    const cx2 = lerp(c2.x, mid.x, m)
    const rx = lerp(12, 40, m)
    const ry = lerp(14, 14, m)
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <Bond a={c1} b={c2} width={5} />
        {hs.map((h, i) => {
          const from = h.cu < 0 ? c1 : c2
          const end = pt(h.cu + (h.cu < 0 ? -30 : 30), h.v)
          return (
            <g key={`h-${i}`}>
              <Bond a={from} b={end} />
              <Hydrogen at={end} />
            </g>
          )
        })}
        {/* Upper lobes and lower lobes: separate at 0, one cloud above and one below at 1 */}
        {[-1, 1].map((sgn) => (
          <g key={`lobes-${sgn}`}>
            <Lobe cx={cx1} cy={c1.y - sgn * 44} rx={rx} ry={ry} />
            <Lobe cx={cx2} cy={c2.y - sgn * 44} rx={rx} ry={ry} />
          </g>
        ))}
        <Carbon at={c1} />
        <Carbon at={c2} />
        {showAngles && (
          <>
            <AngleLabel x={-80} y={0}>
              120°
            </AngleLabel>
            <AngleLabel x={80} y={0}>
              120°
            </AngleLabel>
          </>
        )}
      </g>
    )
  }

  if (molecule === 'ethyne') {
    const c1 = pt(-38, 0)
    const c2 = pt(38, 0)
    const h1 = pt(-98, 0)
    const h2 = pt(98, 0)
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <Bond a={h1} b={h2} width={3} />
        <Bond a={h1} b={c1} width={4} />
        <Bond a={c1} b={c2} width={5} />
        <Bond a={c2} b={h2} width={4} />
        <Hydrogen at={h1} />
        <Hydrogen at={h2} />
        {/* Four lobes per carbon: up and down (one π), front and back (the other π) */}
        <g opacity={1 - m}>
          {[-38, 38].map((u) => (
            <g key={`lobe-${u}`}>
              <Lobe cx={pt(u, 0).x} cy={pt(u, 0, 44).y} rx={11} ry={14} />
              <Lobe cx={pt(u, 0).x} cy={pt(u, 0, -44).y} rx={11} ry={14} />
              <Lobe cx={pt(u, 40).x} cy={pt(u, 40).y} rx={13} ry={7} />
              <Lobe cx={pt(u, -40).x} cy={pt(u, -40).y} rx={13} ry={7} />
            </g>
          ))}
        </g>
        {/* The merged cylinder: both π clouds as one tube around the axis */}
        <g opacity={m}>
          <rect x={-72} y={-36} width={144} height={72} rx={36} {...LOBE} />
        </g>
        <Carbon at={c1} />
        <Carbon at={c2} />
        {showAngles && (
          <AngleLabel x={0} y={-80}>
            180°
          </AngleLabel>
        )}
      </g>
    )
  }

  // Benzene: the σ ring in the plane, six lobes perpendicular to it, merged into two doughnuts.
  const R = 100
  const verts = Array.from({ length: 6 }, (_, k) => {
    const th = (k * 60 * Math.PI) / 180
    return { u: R * Math.cos(th), v: R * Math.sin(th) }
  })
  const ringPath = (h: number) => {
    const steps = 96
    const parts: string[] = []
    for (let i = 0; i <= steps; i++) {
      const th = (i / steps) * Math.PI * 2
      const p = pt(R * Math.cos(th), R * Math.sin(th), h)
      parts.push(`${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    }
    return parts.join(' ') + ' Z'
  }
  const DOUGH_H = 78
  const LOBE_H = 46
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* σ ring and the C–H bonds, in the plane */}
      {verts.map((p, k) => {
        const q = verts[(k + 1) % 6]
        return <Bond key={`cc-${k}`} a={pt(p.u, p.v)} b={pt(q.u, q.v)} width={4.4} />
      })}
      {verts.map((p, k) => {
        const len = Math.hypot(p.u, p.v)
        const end = pt(p.u + (p.u / len) * 56, p.v + (p.v / len) * 56)
        return (
          <g key={`ch-${k}`}>
            <Bond a={pt(p.u, p.v)} b={end} width={3} />
            <Hydrogen at={end} />
          </g>
        )
      })}
      {/* Six lobes, one per carbon, perpendicular to the ring */}
      <g opacity={1 - m}>
        {verts.flatMap((p, k) => {
          const c = pt(p.u, p.v)
          return [
            <Lobe key={`up-${k}`} cx={c.x} cy={c.y - LOBE_H} rx={11} ry={17} />,
            <Lobe key={`dn-${k}`} cx={c.x} cy={c.y + LOBE_H} rx={11} ry={17} />,
          ]
        })}
      </g>
      {/* Two doughnuts, above and below the ring */}
      <g opacity={m}>
        <path d={ringPath(DOUGH_H)} fill="none" stroke="var(--pi-lobe)" strokeWidth={lerp(4, 18, m)} strokeOpacity={0.4} />
        <path d={ringPath(-DOUGH_H)} fill="none" stroke="var(--pi-lobe)" strokeWidth={lerp(4, 18, m)} strokeOpacity={0.4} />
      </g>
      {verts.map((p, k) => (
        <Carbon key={`c-${k}`} at={pt(p.u, p.v)} />
      ))}
    </g>
  )
})
