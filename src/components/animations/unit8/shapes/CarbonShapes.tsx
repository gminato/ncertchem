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
 * Step 4: the π bond of ethene, drawn side on. The two carbons sit on the C=C axis, and each has a
 * p orbital, a dumbbell standing above and below the axis. Turning the right CH₂ about that axis
 * turns its p orbital end-on, so its lobes move onto the axis and the sideways overlap, which is
 * the π bond, fades. The projection of each lobe is scaled by cos θ, so the tween is physical.
 */
const PI_C1 = { x: 262, y: 200 }
const PI_C2 = { x: 318, y: 200 }
const PI_LOBE_R = 34
const PI_LOBE_OFFSET = 46

function PiOverlap({ turn, label }: { turn: number; label: string }) {
  const c = Math.cos((turn * Math.PI) / 180)
  const overlap = Math.max(0, c)
  const endOn = 1 - Math.abs(c)
  const dy = PI_LOBE_OFFSET * c
  const topMid = { x: (PI_C1.x + PI_C2.x) / 2, y: (PI_C1.y - PI_LOBE_OFFSET + PI_C2.y - dy) / 2 }
  const botMid = { x: (PI_C1.x + PI_C2.x) / 2, y: (PI_C1.y + PI_LOBE_OFFSET + PI_C2.y + dy) / 2 }
  return (
    <svg viewBox="0 0 580 440" role="img" aria-label={label} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <VocabDefs />
      <g transform="translate(290 200) scale(1.7) translate(-290 -200)">
      <line x1={180} x2={400} y1={PI_C1.y} y2={PI_C1.y} strokeWidth={1.4} strokeDasharray="5 5" style={{ stroke: 'var(--fg-subtle)' }} />
      <Label x={408} y={PI_C1.y} textAnchor="start" fontSize={9.5} fill="var(--fg-muted)">
        C=C axis
      </Label>
      {/* The fixed CH₂ (left): its p orbital stands along the vertical */}
      <circle cx={PI_C1.x} cy={PI_C1.y - PI_LOBE_OFFSET} r={PI_LOBE_R} style={{ fill: 'var(--orbital-pos)', fillOpacity: 0.85, stroke: 'var(--orbital-pos)' }} />
      <circle cx={PI_C1.x} cy={PI_C1.y + PI_LOBE_OFFSET} r={PI_LOBE_R} style={{ fill: 'var(--orbital-neg)', fillOpacity: 0.85, stroke: 'var(--orbital-neg)' }} />
      {/* The turning CH₂ (right): its lobes move onto the axis as cos θ */}
      <g data-testid="pi-turning" data-turn={Math.round(turn)}>
        <circle cx={PI_C2.x} cy={PI_C2.y - dy} r={PI_LOBE_R} style={{ fill: 'var(--orbital-pos)', fillOpacity: 0.85, stroke: 'var(--orbital-pos)' }} />
        <circle cx={PI_C2.x} cy={PI_C2.y + dy} r={PI_LOBE_R} style={{ fill: 'var(--orbital-neg)', fillOpacity: 0.85, stroke: 'var(--orbital-neg)' }} />
      </g>
      {/* The overlap lenses: they exist only while the lobes face each other */}
      <ellipse cx={topMid.x} cy={topMid.y} rx={9} ry={20} style={{ fill: 'var(--orbital-pos)' }} opacity={overlap} data-testid="pi-lens" />
      <ellipse cx={botMid.x} cy={botMid.y} rx={9} ry={20} style={{ fill: 'var(--orbital-neg)' }} opacity={overlap} />
      {/* End-on view of the turned orbital: a ring with a dot on its axis */}
      <g opacity={endOn} data-testid="pi-end-on">
        <circle cx={PI_C2.x} cy={PI_C2.y} r={PI_LOBE_R * 0.5} strokeWidth={2} style={{ fill: 'none', stroke: 'var(--fg)' }} />
        <circle cx={PI_C2.x} cy={PI_C2.y} r={3.5} style={{ fill: 'var(--fg)' }} />
      </g>
      <circle cx={PI_C1.x} cy={PI_C1.y} r={3.5} style={{ fill: 'var(--fg)' }} />
      <circle cx={PI_C2.x} cy={PI_C2.y} r={3.5} style={{ fill: 'var(--fg)' }} />
      </g>
      <Label x={290} y={392} fontSize={18} fill="var(--fg)" data-testid="pi-caption">
        {turn < 45 ? 'Parallel p orbitals overlap sideways: the π bond' : 'Turned by 90°: the p orbitals miss, and the π bond is lost'}
      </Label>
      <Label x={290} y={420} fontSize={16} fill="var(--fg-muted)">
        {turn < 45 ? 'The C=C bond is a σ bond plus this π bond.' : 'The π bond must break before the CH₂ groups can rotate.'}
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
