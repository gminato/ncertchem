'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { Html, Line } from '@react-three/drei'
import { Quaternion, Vector3 } from 'three'
import { ATOM_COLOR_ELEMENTS } from '../vocab/atom'
import { Atom } from '../vocab/Atom'
import { Label } from '../vocab/Label'
import { VocabDefs } from '../vocab/VocabDefs'
import {
  add3,
  angleArcPoints,
  angleLabelPoint,
  bondSticks,
  cameraBasis,
  cross3,
  depthOf,
  fitToBox,
  len3,
  lerp3,
  norm3,
  perpendicularTo,
  projectOrthographic,
  scale3,
  sub3,
  type Vec2,
  type Vec3,
} from './geometry'
import {
  atomPositionMap,
  type AngleArc3D,
  type Dipole3D,
  type LonePair3D,
  type Molecule3DAtom,
  type Molecule3DBond,
  type Molecule3DData,
} from './molecule-data'

export type { Molecule3DAtom, Molecule3DBond, Molecule3DData, LonePair3D, AngleArc3D, Dipole3D }

/** Scene radius of each element's sphere, in scene units (one bond is 1 unit long). */
const RADIUS_3D: Record<string, number> = {
  H: 0.22,
  Be: 0.3,
  B: 0.34,
  C: 0.34,
  N: 0.33,
  O: 0.33,
  F: 0.3,
  Na: 0.42,
  P: 0.38,
  S: 0.4,
  Cl: 0.4,
  Xe: 0.5,
}
const RADIUS_3D_FALLBACK = 0.34

/** Sphere radius in scene units. Scaled from the 2D atom size so the two drawings agree. */
export function radius3D(element: string): number {
  return RADIUS_3D[element] ?? RADIUS_3D_FALLBACK
}

const STICK_RADIUS = 0.05
const LONE_PAIR_GAP = 0.42
const DASHES = 6
/** Camera used by the 3D stage by default (see Stage3D). The 2D fallback matches it. */
export const MOLECULE_CAMERA: Vec3 = [4.4, 2.4, 5.2]

/** Colours that Three.js can read: opaque hex values from the theme tokens. */
const TOKEN_VARS = {
  bond: '--bond',
  lonePair: '--lone-pair',
  dipole: '--dipole',
  fg: '--fg',
  fgMuted: '--fg-muted',
  surface: '--surface',
  'el-H': '--el-H',
  'el-C': '--el-C',
  'el-N': '--el-N',
  'el-O': '--el-O',
  'el-F': '--el-F',
  'el-Cl': '--el-Cl',
  'el-B': '--el-B',
  'el-Be': '--el-Be',
  'el-P': '--el-P',
  'el-S': '--el-S',
  'el-Xe': '--el-Xe',
  'el-other': '--el-other',
} as const
type TokenKey = keyof typeof TOKEN_VARS
type TokenColours = Record<TokenKey, string>

const FALLBACK_COLOURS: TokenColours = {
  bond: '#6B6862',
  lonePair: '#5B8DEF',
  dipole: '#B4532A',
  fg: '#1F2023',
  fgMuted: '#5C5B56',
  surface: '#FFFFFF',
  'el-H': '#D3CEC5',
  'el-C': '#3D4046',
  'el-N': '#3F55B8',
  'el-O': '#D8473F',
  'el-F': '#9BC45A',
  'el-Cl': '#3E9C5E',
  'el-B': '#C9867A',
  'el-Be': '#5E9EA0',
  'el-P': '#D9822B',
  'el-S': '#E0B02E',
  'el-Xe': '#4F9AB8',
  'el-other': '#A29D94',
}

function readTokenColours(): TokenColours {
  if (typeof document === 'undefined') return FALLBACK_COLOURS
  const style = getComputedStyle(document.documentElement)
  const out = { ...FALLBACK_COLOURS }
  for (const key of Object.keys(TOKEN_VARS) as TokenKey[]) {
    const value = style.getPropertyValue(TOKEN_VARS[key]).trim()
    if (value) out[key] = value
  }
  return out
}

function sameColours(a: TokenColours, b: TokenColours): boolean {
  return (Object.keys(a) as TokenKey[]).every((k) => a[k] === b[k])
}

/** The theme colours used by the molecule, kept in step with data-theme and the OS scheme. */
function useTokenColours(): TokenColours {
  const [colours, setColours] = useState<TokenColours>(readTokenColours)

  useEffect(() => {
    const update = () => setColours((prev) => {
      const next = readTokenColours()
      return sameColours(prev, next) ? prev : next
    })
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', update)
    return () => {
      observer.disconnect()
      scheme.removeEventListener('change', update)
    }
  }, [])

  return colours
}

function elementColourKey(element: string): TokenKey {
  const key = `el-${element}` as TokenKey
  return (ATOM_COLOR_ELEMENTS as readonly string[]).includes(element) && key in TOKEN_VARS ? key : 'el-other'
}

/** Rotation that takes the cylinder/ellipsoid axis (+y) onto `dir`. */
function quaternionAlong(dir: Vec3): Quaternion {
  return new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(...norm3(dir)))
}

interface StickProps {
  from: Vec3
  to: Vec3
  dashed: boolean
  colour: string
}

function Stick({ from, to, dashed, colour }: StickProps) {
  const dir = sub3(to, from)
  const length = len3(dir)
  const quaternion = quaternionAlong(dir)

  if (!dashed) {
    return (
      <mesh position={lerp3(from, to, 0.5)} quaternion={quaternion}>
        <cylinderGeometry args={[STICK_RADIUS, STICK_RADIUS, length, 14]} />
        <meshStandardMaterial color={colour} roughness={0.5} />
      </mesh>
    )
  }

  // A dashed stick: DASHES short cylinders, each half of its slot.
  const dashLength = length / (DASHES * 2)
  return (
    <group>
      {Array.from({ length: DASHES }, (_, i) => {
        const t = (i + 0.5) / DASHES
        return (
          <mesh key={i} position={lerp3(from, to, t)} quaternion={quaternion}>
            <cylinderGeometry args={[STICK_RADIUS, STICK_RADIUS, dashLength, 10]} />
            <meshStandardMaterial color={colour} roughness={0.5} />
          </mesh>
        )
      })}
    </group>
  )
}

function LonePairLobe({ atom, direction, colour }: { atom: Vec3; direction: Vec3; colour: string }) {
  const dir = norm3(direction)
  const quaternion = quaternionAlong(dir)
  const centre = add3(atom, scale3(dir, LONE_PAIR_GAP))
  return (
    <mesh position={centre} quaternion={quaternion} scale={[0.62, 1, 0.62]} renderOrder={1}>
      <sphereGeometry args={[0.36, 36, 24]} />
      <meshStandardMaterial color={colour} transparent opacity={0.26} depthWrite={false} roughness={0.6} />
    </mesh>
  )
}

function Dipole({ from, to, label, colour }: Dipole3D & { colour: string }) {
  const dir = norm3(sub3(to, from))
  const length = len3(sub3(to, from))
  const headLength = Math.min(0.22, length * 0.36)
  const shaftEnd = sub3(to, scale3(dir, headLength))
  const perp = perpendicularTo(dir)
  const perp2 = norm3(cross3(dir, perp))
  const quaternion = quaternionAlong(dir)
  const shaftLength = len3(sub3(shaftEnd, from))
  const shaftMid = lerp3(from, shaftEnd, 0.5)
  const crossLength = 0.2

  return (
    <group>
      <mesh position={shaftMid} quaternion={quaternion}>
        <cylinderGeometry args={[0.035, 0.035, shaftLength, 14]} />
        <meshStandardMaterial color={colour} roughness={0.45} />
      </mesh>
      <mesh position={sub3(to, scale3(dir, headLength / 2))} quaternion={quaternion}>
        <coneGeometry args={[0.1, headLength, 18]} />
        <meshStandardMaterial color={colour} roughness={0.45} />
      </mesh>
      {/* The crossed tail: a small plus sign in the plane across the arrow. */}
      {[perp, perp2].map((axis, i) => (
        <mesh key={i} position={from} quaternion={quaternionAlong(axis)}>
          <cylinderGeometry args={[0.028, 0.028, crossLength, 12]} />
          <meshStandardMaterial color={colour} roughness={0.45} />
        </mesh>
      ))}
      {label && (
        <Html position={add3(to, scale3(dir, 0.22))} center pointerEvents="none">
          <span style={labelStyle(colour)}>{label}</span>
        </Html>
      )}
    </group>
  )
}

function labelStyle(colour: string): React.CSSProperties {
  return {
    fontFamily: 'var(--font-sans)',
    fontSize: 12,
    fontWeight: 600,
    color: colour,
    whiteSpace: 'nowrap',
    userSelect: 'none',
    textShadow: '0 0 4px var(--surface), 0 0 4px var(--surface)',
  }
}

export interface Molecule3DProps extends Molecule3DData {
  /** Overrides atom positions by id. Tween between poses by passing interpolated positions. */
  positions?: Readonly<Record<string, Vec3>>
  /** Element symbols drawn above the atoms. Off by default. */
  showSymbols?: boolean
}

/**
 * A ball-and-stick molecule for the Stage3D scene. Atoms are shaded spheres in
 * their element colours; bonds are sticks (multiple bonds are parallel sticks in
 * one plane); lone pairs are soft translucent lobes; angle arcs and dipoles are
 * optional overlays. Deterministic for given props. Render inside Stage3D.
 */
export function Molecule3D({ atoms, bonds, lonePairs = [], angleArcs = [], dipoles = [], positions, showSymbols = false }: Molecule3DProps) {
  const colours = useTokenColours()
  const at = useMemo(() => atomPositionMap(atoms, positions), [atoms, positions])
  const pos = (id: string): Vec3 => at.get(id) ?? [0, 0, 0]
  const elementOf = new Map(atoms.map((a) => [a.id, a.element]))

  return (
    <group>
      {bonds.flatMap((bond, bi) => {
        const a = pos(bond.a)
        const b = pos(bond.b)
        return bondSticks(a, b, bond.order).map((stick, si) => (
          <Stick
            key={`b-${bi}-${si}`}
            from={stick.from}
            to={stick.to}
            dashed={stick.dashed}
            colour={colours.bond}
          />
        ))
      })}

      {atoms.map((atom) => (
        <group key={atom.id} position={pos(atom.id)}>
          <mesh>
            <sphereGeometry args={[radius3D(atom.element), 40, 28]} />
            <meshStandardMaterial color={colours[elementColourKey(atom.element)]} roughness={0.34} metalness={0} />
          </mesh>
          {showSymbols && (
            <Html position={[0, radius3D(atom.element) + 0.16, 0]} center pointerEvents="none">
              <span style={labelStyle(colours.fg)}>{atom.element}</span>
            </Html>
          )}
        </group>
      ))}

      {lonePairs.map((lp, i) => (
        <LonePairLobe key={`lp-${i}`} atom={pos(lp.atom)} direction={lp.direction} colour={colours.lonePair} />
      ))}

      {angleArcs.map((arc, i) => (
        <AngleArcOverlay key={`arc-${i}`} arc={arc} at={pos} colour={colours.fgMuted} outset={arcLabelOutset(elementOf, arc)} />
      ))}

      {dipoles.map((d, i) => (
        <Dipole key={`dp-${i}`} {...d} colour={colours.dipole} />
      ))}
    </group>
  )
}

/** Gap between the largest atom on an angle and the angle's label. */
const ARC_LABEL_GAP = 0.16
/** Arc radius for every angle drawing, in scene units. */
const ARC_RADIUS = 0.5

/**
 * How far an angle label sits beyond the arc, measured from the vertex along the bisector: past
 * the larger of the two atoms it spans, so the label never lands on an atom.
 */
export function arcLabelOutset(elementOf: Map<string, string>, arc: AngleArc3D): number {
  const ra = radius3D(elementOf.get(arc.a) ?? '')
  const rb = radius3D(elementOf.get(arc.b) ?? '')
  return Math.max(ra, rb) + ARC_LABEL_GAP
}

function AngleArcOverlay({ arc, at, colour, outset }: { arc: AngleArc3D; at: (id: string) => Vec3; colour: string; outset: number }) {
  const centre = at(arc.centre)
  const a = at(arc.a)
  const b = at(arc.b)
  const radius = ARC_RADIUS
  const pts = angleArcPoints(centre, a, b, radius, 28)
  const labelAt = angleLabelPoint(centre, a, b, radius, outset)
  return (
    <group>
      <Line points={pts} color={colour} lineWidth={1.2} />
      <Html position={labelAt} center pointerEvents="none">
        <span style={labelStyle(colour)}>{arc.label}</span>
      </Html>
    </group>
  )
}

/* ------------------------------------------------------------------------- *
 * 2D fallback: the same data, drawn as an orthographic projection with the
 * same camera as the 3D stage, for browsers without WebGL.
 * ------------------------------------------------------------------------- */

const FALLBACK_W = 220
const FALLBACK_H = 200
const FALLBACK_PAD = 26

export interface Molecule3DFallbackProps extends Molecule3DData {
  positions?: Readonly<Record<string, Vec3>>
  showSymbols?: boolean
}

export function Molecule3DFallback({
  atoms,
  bonds,
  lonePairs = [],
  angleArcs = [],
  dipoles = [],
  positions,
  showSymbols = false,
}: Molecule3DFallbackProps) {
  const basis = cameraBasis(MOLECULE_CAMERA)
  const at = atomPositionMap(atoms, positions)
  const pos = (id: string): Vec3 => at.get(id) ?? [0, 0, 0]
  const elementOf = new Map(atoms.map((a) => [a.id, a.element]))

  // Project the atoms, then fit them into the viewBox with room for the spheres.
  const projected = atoms.map((atom) => projectOrthographic(pos(atom.id), basis))
  const fit = fitToBox(projected, FALLBACK_W, FALLBACK_H, FALLBACK_PAD)
  const toPx = (p: Vec3): Vec2 => {
    const q = projectOrthographic(p, basis)
    return { x: q.x * fit.scale + fit.tx, y: q.y * fit.scale + fit.ty }
  }
  const s = fit.scale

  const atomsByDepth = [...atoms].sort((a, b) => depthOf(pos(b.id), basis) - depthOf(pos(a.id), basis))

  return (
    <svg viewBox={`0 0 ${FALLBACK_W} ${FALLBACK_H}`} role="img" aria-label="Flat drawing of the molecule">
      <VocabDefs idPrefix="mol2d" />

      {bonds.flatMap((bond, bi) =>
        bondSticks(pos(bond.a), pos(bond.b), bond.order).map((stick, si) => {
          const p = toPx(stick.from)
          const q = toPx(stick.to)
          return (
            <line
              key={`b-${bi}-${si}`}
              x1={p.x}
              y1={p.y}
              x2={q.x}
              y2={q.y}
              strokeWidth={Math.max(2.4, 0.09 * s)}
              strokeLinecap="round"
              strokeDasharray={stick.dashed ? '3 3' : undefined}
              style={{ stroke: 'var(--bond)' }}
            />
          )
        })
      )}

      {lonePairs.map((lp: LonePair3D, i) => {
        const base = add3(pos(lp.atom), scale3(norm3(lp.direction), LONE_PAIR_GAP))
        const c = toPx(base)
        const tip = toPx(add3(pos(lp.atom), scale3(norm3(lp.direction), LONE_PAIR_GAP + 0.36)))
        const angle = (Math.atan2(tip.y - c.y, tip.x - c.x) * 180) / Math.PI
        const length = Math.hypot(tip.x - c.x, tip.y - c.y)
        return (
          <ellipse
            key={`lp-${i}`}
            cx={c.x}
            cy={c.y}
            rx={length}
            ry={length * 0.55}
            transform={`rotate(${angle} ${c.x} ${c.y})`}
            style={{ fill: 'var(--lone-pair)', fillOpacity: 0.26, stroke: 'var(--lone-pair)', strokeOpacity: 0.5 }}
            strokeWidth={0.8}
          />
        )
      })}

      {atomsByDepth.map((atom) => {
        const c = toPx(pos(atom.id))
        return (
          <g key={atom.id}>
            <Atom element={atom.element} x={c.x} y={c.y} r={radius3D(atom.element) * s} defsPrefix="mol2d" />
            {showSymbols && (
              <Label x={c.x} y={c.y - radius3D(atom.element) * s - 8} fontSize={12} fill="var(--fg)">
                {atom.element}
              </Label>
            )}
          </g>
        )
      })}

      {angleArcs.map((arc, i) => {
        const centre = pos(arc.centre)
        const pts = angleArcPoints(centre, pos(arc.a), pos(arc.b), ARC_RADIUS, 28).map(toPx)
        const label = toPx(angleLabelPoint(centre, pos(arc.a), pos(arc.b), ARC_RADIUS, arcLabelOutset(elementOf, arc)))
        return (
          <g key={`arc-${i}`}>
            <path
              d={pts.map((p, k) => `${k === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')}
              fill="none"
              strokeWidth={1}
              style={{ stroke: 'var(--fg-muted)' }}
            />
            <Label x={label.x} y={label.y} fontSize={11} fill="var(--fg)" halo>
              {arc.label}
            </Label>
          </g>
        )
      })}

      {dipoles.map((d, i) => {
        const p = toPx(d.from)
        const q = toPx(d.to)
        return (
          <g key={`dp-${i}`}>
            <line x1={p.x} y1={p.y} x2={q.x} y2={q.y} strokeWidth={2} style={{ stroke: 'var(--dipole)' }} />
            <circle cx={q.x} cy={q.y} r={3} style={{ fill: 'var(--dipole)' }} />
          </g>
        )
      })}
    </svg>
  )
}
