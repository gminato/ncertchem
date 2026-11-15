'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { HybridOrbitals, type HybridKind } from '@/components/molecule'
import { moleculeGeometry } from '@/lib/chem/hybrid-explorer'
import { vseprClass } from '@/lib/chem/vsepr'
import { Symbolised } from './symbols'
import { useReveal } from './useStepTween'
import { HYBRID_STEP_COUNT, hybridStepAt, type GeometryShape } from './vbt-steps'

export interface HybridGeometryProps {
  step: number
  reducedMotion: boolean
}

/** Domain counts (bonded atoms and lone pairs) for each drawn shape. */
const DOMAINS: Record<GeometryShape, { bonds: number; lp: number; centre: string; ligand: string }> = {
  BeCl2: { bonds: 2, lp: 0, centre: 'Be', ligand: 'Cl' },
  BCl3: { bonds: 3, lp: 0, centre: 'B', ligand: 'Cl' },
  CH4: { bonds: 4, lp: 0, centre: 'C', ligand: 'H' },
  H2O: { bonds: 2, lp: 2, centre: 'O', ligand: 'H' },
  PCl5: { bonds: 5, lp: 0, centre: 'P', ligand: 'Cl' },
  SF6: { bonds: 6, lp: 0, centre: 'S', ligand: 'F' },
}

/** The angle printed under each shape: NCERT's reported angle where it gives one, else the ideal. */
function angleText(shape: GeometryShape): string {
  if (shape === 'PCl5') return '120° and 90°'
  if (shape === 'SF6') return '90°'
  const d = DOMAINS[shape]
  const cls = vseprClass(d.bonds, d.lp)
  const angle = cls.reportedAngle ?? cls.idealAngles[0]
  return `${angle}°`
}

const SHAPE_CENTRE = { x: 478, y: 118 }
const SHAPE_SCALE = 38
/** Yaw (about the vertical axis) so that three-dimensional shapes show their depth. */
const YAW = (24 * Math.PI) / 180

interface Projected {
  x: number
  y: number
  depth: number
  element: string
  kind: 'centre' | 'ligand' | 'lone'
  id: string
}

/**
 * Projects a scene-space geometry onto the drawing plane. The shape is yawed for depth, then
 * turned in the plane (so BeCl₂ can lie flat). Screen y points down, so it is negated.
 */
function project(shape: GeometryShape, turnDeg: number): Projected[] {
  const g = moleculeGeometry(shape)
  const turn = (turnDeg * Math.PI) / 180
  const place = ([x, y, z]: readonly number[]) => {
    const xr = x * Math.cos(YAW) + z * Math.sin(YAW)
    const zr = -x * Math.sin(YAW) + z * Math.cos(YAW)
    const sx = xr * Math.cos(turn) - y * Math.sin(turn)
    const sy = xr * Math.sin(turn) + y * Math.cos(turn)
    return { x: SHAPE_CENTRE.x + sx * SHAPE_SCALE, y: SHAPE_CENTRE.y - sy * SHAPE_SCALE, depth: zr }
  }
  const out: Projected[] = g.atoms.map((a) => ({
    ...place(a.position),
    element: a.element,
    kind: a.id === DOMAINS[shape].centre ? 'centre' : 'ligand',
    id: a.id,
  }))
  for (const lp of g.lonePairs) {
    const p = place(lp.direction.map((v) => v * 0.55))
    out.push({ ...p, element: '', kind: 'lone', id: `lp-${lp.atom}-${p.x.toFixed(1)}` })
  }
  return out
}

/**
 * The hybrid orbitals of each step (drawn as lobes for sp, sp² and sp³) beside the shape they
 * describe. The shape comes from the VSEPR positions, and hybridisation describes the bonding
 * in it. For sp³d and sp³d² only the geometry is drawn.
 */
export function HybridGeometry({ step, reducedMotion }: HybridGeometryProps) {
  const index = Math.min(HYBRID_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = hybridStepAt(index)
  const reveal = useReveal(index, reducedMotion)
  const points = project(current.shape, current.turn)
  const centre = points.find((p) => p.kind === 'centre')
  const ligands = points.filter((p) => p.kind === 'ligand').sort((a, b) => a.depth - b.depth)
  const lone = points.filter((p) => p.kind === 'lone')

  return (
    <svg
      viewBox="0 0 600 340"
      role="img"
      aria-label={`Hybridisation and shape: ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-shape={current.shape}
    >
      <VocabDefs />

      <g transform="translate(10, 40)">
        {current.lobes ? (
          <HybridOrbitals kind={current.lobes as HybridKind} />
        ) : (
          <Label x={170} y={90} fontSize={14} fill="var(--fg-muted)">
            Geometry only: no lobes drawn for sp³d or sp³d²
          </Label>
        )}
      </g>

      <g opacity={reveal} data-testid="shape">
        {ligands.map((p) => (
          <line
            key={`bond-${p.id}`}
            x1={centre?.x}
            y1={centre?.y}
            x2={p.x}
            y2={p.y}
            strokeWidth={2.6}
            strokeLinecap="round"
            style={{ stroke: 'var(--bond)', opacity: p.depth < 0 ? 0.45 : 0.9 }}
          />
        ))}
        {lone.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={9} style={{ fill: 'var(--lone-pair)', fillOpacity: 0.55 }} />
        ))}
        {ligands.map((p) => (
          <g key={`lig-${p.id}`} opacity={p.depth < 0 ? 0.55 : 1}>
            <circle cx={p.x} cy={p.y} r={13} style={{ fill: 'var(--surface)', stroke: 'var(--bond)' }} strokeWidth={1.4} />
            <Label x={p.x} y={p.y} fontSize={13} fill="var(--fg)">
              {DOMAINS[current.shape].ligand}
            </Label>
          </g>
        ))}
        {centre && (
          <g>
            <circle cx={centre.x} cy={centre.y} r={15} style={{ fill: 'var(--surface-raised)', stroke: 'var(--fg-muted)' }} strokeWidth={1.4} />
            <Label x={centre.x} y={centre.y} fontSize={14} fill="var(--fg)">
              {DOMAINS[current.shape].centre}
            </Label>
          </g>
        )}
      </g>

      <Label x={478} y={248} fontSize={14} fill="var(--fg)" data-testid="hybrid-angle">
        {`${DOMAINS[current.shape].bonds} bonds: ${angleText(current.shape)}`}
      </Label>

      <Label x={300} y={292} fontSize={15} fill="var(--fg)" data-testid="hybrid-caption">
        <Symbolised text={current.caption} />
      </Label>
      <Label x={300} y={320} fontSize={13} fill="var(--fg-subtle)">
        Coral lobes positive, teal negative. Shapes are schematic.
      </Label>
    </svg>
  )
}
