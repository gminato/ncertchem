'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { HybridOrbitals, type HybridKind } from '@/components/molecule'
import { vseprClass } from '@/lib/chem/vsepr'
import { Symbolised } from './symbols'
import { useReveal } from './useStepTween'
import { CENTRE_RADIUS, LIGAND_RADIUS, projectShape, type ProjectedAtom } from './hybrid-view'
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

/** Lobe drawings are scaled to fill most of the panel width. */
const LOBE_SCALE = 1.6
const LOBE_X = (600 - 340 * LOBE_SCALE) / 2
/** Where the molecule is drawn: below the lobes when there are lobes, in the upper area otherwise. */
const ANCHOR_WITH_LOBES = { x: 300, y: 392 }
const ANCHOR_GEOMETRY_ONLY = { x: 300, y: 230 }

/**
 * Each ligand's radius and bond style come from its depth: the back of the shape is slightly
 * smaller, drawn fainter, and its bonds are dashed.
 */
function depthCues(atoms: ProjectedAtom[]) {
  const max = Math.max(1e-9, ...atoms.map((a) => Math.abs(a.depth)))
  return (a: ProjectedAtom) => {
    const d = a.depth / max
    return { r: LIGAND_RADIUS * (1 + 0.1 * d), back: d < 0 }
  }
}

/**
 * The hybrid orbitals of each step (drawn as lobes for sp, sp² and sp³) beside the shape they
 * describe. The shape comes from the VSEPR positions, and hybridisation describes the bonding
 * in it. For sp³d and sp³d² only the geometry is drawn. Each shape is drawn with a yaw and a
 * pitch, so the back ligands sit clear of the centre and the front ones hide nothing.
 */
export function HybridGeometry({ step, reducedMotion }: HybridGeometryProps) {
  const index = Math.min(HYBRID_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = hybridStepAt(index)
  const reveal = useReveal(index, reducedMotion)
  const anchor = current.lobes ? ANCHOR_WITH_LOBES : ANCHOR_GEOMETRY_ONLY
  const atoms = projectShape(current.shape, anchor)
  const centre = atoms.find((a) => a.kind === 'centre')
  const ligands = atoms.filter((a) => a.kind === 'ligand').sort((a, b) => a.depth - b.depth)
  const lone = atoms.filter((a) => a.kind === 'lone')
  const cue = depthCues(ligands)

  return (
    <svg
      viewBox="0 0 600 594"
      role="img"
      aria-label={`Hybridisation and shape: ${current.caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-shape={current.shape}
    >
      <VocabDefs />

      {current.lobes ? (
        <g transform={`translate(${LOBE_X}, 0) scale(${LOBE_SCALE})`}>
          <HybridOrbitals kind={current.lobes as HybridKind} />
        </g>
      ) : (
        <Label x={300} y={60} fontSize={16} fill="var(--fg-muted)">
          Geometry only: no lobes drawn for sp³d or sp³d²
        </Label>
      )}

      <g opacity={reveal} data-testid="shape">
        {ligands.map((p) => {
          const { back } = cue(p)
          return (
            <line
              key={`bond-${p.id}`}
              x1={centre?.x}
              y1={centre?.y}
              x2={p.x}
              y2={p.y}
              strokeWidth={back ? 2 : 3}
              strokeLinecap="round"
              strokeDasharray={back ? '6 5' : undefined}
              style={{ stroke: 'var(--bond)', opacity: back ? 0.5 : 0.95 }}
            />
          )
        })}
        {lone.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={14} style={{ fill: 'var(--lone-pair)', fillOpacity: 0.55 }} />
        ))}
        {ligands.map((p) => {
          const { r, back } = cue(p)
          return (
            <g key={`lig-${p.id}`} opacity={back ? 0.6 : 1}>
              <circle cx={p.x} cy={p.y} r={r} style={{ fill: 'var(--surface)', stroke: 'var(--bond)' }} strokeWidth={back ? 1.4 : 2.2} />
              <Label x={p.x} y={p.y} fontSize={22} fill="var(--fg)">
                {DOMAINS[current.shape].ligand}
              </Label>
            </g>
          )
        })}
        {centre && (
          <g>
            <circle cx={centre.x} cy={centre.y} r={CENTRE_RADIUS} style={{ fill: 'var(--surface-raised)', stroke: 'var(--fg-muted)' }} strokeWidth={2} />
            <Label x={centre.x} y={centre.y} fontSize={26} fill="var(--fg)">
              {DOMAINS[current.shape].centre}
            </Label>
          </g>
        )}
      </g>

      <Label x={300} y={532} fontSize={18} fill="var(--fg)" data-testid="hybrid-angle">
        {`${DOMAINS[current.shape].bonds} bonds: ${angleText(current.shape)}`}
      </Label>

      <Label x={300} y={558} fontSize={16} fill="var(--fg)" data-testid="hybrid-caption">
        <Symbolised text={current.caption} />
      </Label>
      <Label x={300} y={582} fontSize={13} fill="var(--fg-subtle)">
        Coral lobes positive, teal negative. Dashed bonds lie behind. Schematic.
      </Label>
    </svg>
  )
}
