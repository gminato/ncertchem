'use client'

import { Stage3DLazy } from '@/components/stage3d'
import { Molecule3D, Molecule3DFallback, OverlapDiagram, cameraForMolecule, type Molecule3DData } from '@/components/molecule'
import { Label, VocabDefs } from '@/components/vocab'
import { useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import {
  carbonCarbonLengthPm,
  idealBondAngle,
  ethyleneScene,
  ethyneScene,
  methaneScene,
  type ShapeScene,
} from '@/lib/chem/carbon-shapes'
import { SHAPE_STEP_COUNT, degreeText, hybridLabel, piTurnDegrees, shapeStep, type ShapeStepKind } from './carbon-shapes-steps'

export interface CarbonShapesProps {
  step: number
  reducedMotion: boolean
}

/** The 3D scene for a Step, converted to the Molecule3D data shape. Bond orders 1.5 are not used here. */
function sceneData(scene: ShapeScene, arcs: Molecule3DData['angleArcs'] = []): Molecule3DData {
  return {
    atoms: scene.atoms.map((a) => ({ id: a.id, element: a.element, position: a.position })),
    bonds: scene.bonds.map((b) => ({ a: b.a, b: b.b, order: b.order })),
    angleArcs: arcs,
  }
}

/** The three molecules of Steps 1 to 3, with the angle arcs drawn where the angle is not 180°. */
function moleculeFor(kind: Exclude<ShapeStepKind, 'pi'>): Molecule3DData {
  if (kind === 'methane') {
    return sceneData(methaneScene(), [{ a: 'H1', centre: 'C', b: 'H2', label: degreeText(idealBondAngle('sp3')) }])
  }
  if (kind === 'ethene') {
    return sceneData(ethyleneScene(), [{ a: 'H1', centre: 'C1', b: 'C2', label: degreeText(idealBondAngle('sp2')) }])
  }
  return sceneData(ethyneScene())
}

/** The bond-length bars: one row per C–C bond order, drawn to scale and lit for the current Step. */
const BOND_ROWS: { order: 1 | 2 | 3; name: string }[] = [
  { order: 1, name: 'C–C single' },
  { order: 2, name: 'C=C double' },
  { order: 3, name: 'C≡C triple' },
]
const PM_TO_PX = 2.2

function BondLengthBars({ lit }: { lit: 1 | 2 | 3 | null }) {
  return (
    <svg viewBox="0 0 580 116" role="img" aria-label="C–C bond lengths: 154 pm single, 134 pm double, 120 pm triple" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {BOND_ROWS.map((row, i) => {
        const pm = carbonCarbonLengthPm(row.order)
        const y = 24 + i * 34
        const on = lit === row.order
        return (
          <g key={row.order} opacity={lit === null || on ? 1 : 0.35} data-bond-order={row.order}>
            <Label x={0} y={y} textAnchor="start" fontSize={16} fill={on ? 'var(--fg)' : 'var(--fg-muted)'}>
              {row.name}
            </Label>
            <rect x={150} y={y - 9} width={pm * PM_TO_PX} height={18} rx={4} style={{ fill: on ? 'var(--bond)' : 'var(--fg-subtle)' }} />
            <Label x={150 + pm * PM_TO_PX + 10} y={y} textAnchor="start" fontSize={16} fill="var(--fg)">
              {`${pm} pm`}
            </Label>
          </g>
        )
      })}
    </svg>
  )
}

/**
 * Step 4: the π bond of ethene, drawn side on. The two sp² carbons are joined by the σ line, and
 * each carries a p orbital standing vertically: two lobes, one above and one below the plane. The
 * lobes of the two orbitals are parallel at 0°, so the overlap regions above and below the C–C
 * axis are shaded: that is the π bond. Turning the right CH₂ about the C–C axis foreshortens its
 * p orbital by cos θ, so its lobes come in towards the axis and the shaded overlap fades to
 * nothing at 90°.
 */
const PI_C1 = { x: 272, y: 200 }
const PI_C2 = { x: 308, y: 200 }
const PI_LOBE_R = 30
const PI_LOBE_OFFSET = 44

function PiOverlap({ turn, label }: { turn: number; label: string }) {
  const turned = turn >= 45
  const c = Math.cos((turn * Math.PI) / 180)
  const overlap = Math.max(0, Math.min(1, c))
  const dy = PI_LOBE_OFFSET * c
  const mid = (PI_C1.x + PI_C2.x) / 2
  const topLens = { x: mid, y: (PI_C1.y - PI_LOBE_OFFSET + PI_C2.y - dy) / 2 }
  const botLens = { x: mid, y: (PI_C1.y + PI_LOBE_OFFSET + PI_C2.y + dy) / 2 }
  const lobeStyle = (token: string) => ({ fill: `var(${token})`, fillOpacity: 0.85, stroke: `var(${token})` })
  return (
    <svg viewBox="0 0 580 440" role="img" aria-label={label} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <VocabDefs />
      <g transform="translate(290 200) scale(1.7) translate(-290 -200)">
        {/* The σ bond joining the two carbons */}
        <line x1={PI_C1.x} y1={PI_C1.y} x2={PI_C2.x} y2={PI_C2.y} strokeWidth={5} strokeLinecap="round" style={{ stroke: 'var(--fg)' }} />
        {/* The fixed CH₂ (left): its p orbital stands vertically */}
        <circle cx={PI_C1.x} cy={PI_C1.y - PI_LOBE_OFFSET} r={PI_LOBE_R} style={lobeStyle('--orbital-pos')} />
        <circle cx={PI_C1.x} cy={PI_C1.y + PI_LOBE_OFFSET} r={PI_LOBE_R} style={lobeStyle('--orbital-neg')} />
        {/* The turning CH₂ (right): its p orbital foreshortens by cos θ */}
        <g data-testid="pi-turning" data-turn={Math.round(turn)}>
          <circle cx={PI_C2.x} cy={PI_C2.y - dy} r={PI_LOBE_R} style={lobeStyle('--orbital-pos')} />
          <circle cx={PI_C2.x} cy={PI_C2.y + dy} r={PI_LOBE_R} style={lobeStyle('--orbital-neg')} />
        </g>
        {/* The π overlap: shaded wherever the parallel lobes face each other */}
        <ellipse cx={topLens.x} cy={topLens.y} rx={12} ry={26} style={{ fill: 'var(--orbital-pos)' }} opacity={overlap} data-testid="pi-lens" />
        <ellipse cx={botLens.x} cy={botLens.y} rx={12} ry={26} style={{ fill: 'var(--orbital-neg)' }} opacity={overlap} />
        <circle cx={PI_C1.x} cy={PI_C1.y} r={3.5} style={{ fill: 'var(--fg)' }} />
        <circle cx={PI_C2.x} cy={PI_C2.y} r={3.5} style={{ fill: 'var(--fg)' }} />
      </g>
      <Label x={420} y={PI_C1.y - 58} textAnchor="start" fontSize={16} fill="var(--fg-muted)" opacity={overlap}>
        π overlap above
      </Label>
      <Label x={420} y={PI_C1.y + 58} textAnchor="start" fontSize={16} fill="var(--fg-muted)" opacity={overlap}>
        π overlap below
      </Label>
      <Label x={290} y={392} fontSize={18} fill="var(--fg)" data-testid="pi-caption">
        {turned ? 'Turned by 90°: the p orbitals miss, and the π bond is lost' : 'Parallel p orbitals overlap sideways: the π bond'}
      </Label>
      <Label x={290} y={420} fontSize={16} fill="var(--fg-muted)">
        {turned ? 'The π bond must break before the CH₂ groups can rotate.' : 'The C=C bond is a σ bond plus this π bond.'}
      </Label>
    </svg>
  )
}

/**
 * The shapes Scrolly: methane, ethene and ethyne in 3D with their bond angles and the C–C bond
 * length bars drawn to scale, then the π bond of ethene and the twist that breaks it. The
 * 3D stage is loaded only in the browser; its 2D fallback shows the same molecule.
 */
export function CarbonShapes({ step, reducedMotion }: CarbonShapesProps) {
  const index = Math.min(SHAPE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = shapeStep(index)
  const turn = useStepTween({ turn: piTurnDegrees(index) }, reducedMotion).turn

  if (current.kind === 'pi') {
    return (
      <div data-step={index} style={{ width: '100%' }}>
        <PiOverlap turn={turn} label={`${current.title}. ${current.caption}`} />
      </div>
    )
  }

  const data = moleculeFor(current.kind)
  const litOrder = current.kind === 'methane' ? null : current.kind === 'ethene' ? 2 : 3
  const hybrid = current.hybrid
  return (
    <div data-step={index} style={{ width: '100%' }}>
      <Stage3DLazy
        key={current.kind}
        label={`${current.title}: the molecule in 3D. Drag to rotate.`}
        cameraPosition={cameraForMolecule(data)}
        fallback={<Molecule3DFallback {...data} showSymbols />}
      >
        <Molecule3D {...data} showSymbols />
      </Stage3DLazy>
      <p
        data-testid="shape-badge"
        style={{ margin: '8px 0 4px', fontFamily: 'var(--font-sans)', fontSize: 16, color: 'var(--fg)' }}
      >
        {hybrid ? `${hybridLabel(hybrid)} carbon, bond angle ${degreeText(idealBondAngle(hybrid))}` : ''}
      </p>
      <BondLengthBars lit={litOrder} />
    </div>
  )
}
