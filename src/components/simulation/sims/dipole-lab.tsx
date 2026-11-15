'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { Atom, Label, VocabDefs } from '@/components/vocab'
import { DipoleArrow } from '@/components/molecule/DipoleArrow'
import { Button, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { ncertDipoleFor } from '@/lib/chem/dipole'
import {
  LAB_MOLECULES,
  labMolecule,
  lonePairComparison,
  printedRow,
  sceneFor,
  type LabMoleculeKey,
  type Point,
} from './dipole-lab-model'
import styles from './dipole-lab.module.css'

// Two panels in one SVG (viewBox 720 × 380). Left: the molecule with each bond dipole on its bond.
// Right: the same dipoles laid tip to tail, ending in the net dipole or the μ = 0 badge.
const VIEW = { width: 720, height: 380 }
const PANEL_Y = 36
const PANEL_H = 336
const PANEL_W = 344
const LEFT = { x: 8, cx: 180, cy: 206 }
const RIGHT = { x: 368, cx: 540, cy: 206 }

/** Atom radius on the left panel, in SVG units. Chosen so each symbol reads at 16 px. */
const ATOM_R = 22
/** Distance from the centre to each ligand nucleus on the left panel, in SVG units. */
const BOND_R = 128
/** Bond and lone-pair arrows run from INNER·BOND_R to OUTER·BOND_R along their direction. */
const INNER = 0.36
const OUTER = 0.76
/** Arrows are drawn larger with a transform around their midpoint; DipoleArrow's own size is fixed. */
const ARROW_SCALE = 1.45
const NET_SCALE = 1.5
const DURATION = 1.8

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}
/** Smoothstep easing for the step-in of each arrow and of the net dipole. */
function smooth(v: number): number {
  const t = clamp01(v)
  return t * t * (3 - 2 * t)
}
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
function lerpPoint(a: Point, b: Point, t: number): Point {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) }
}

/** Formats a debye value as NCERT Table 4.5 prints it: two decimals, and a bare 0 for zero. */
function formatDebye(value: number): string {
  return value === 0 ? '0' : value.toFixed(2)
}

/** A DipoleArrow enlarged by a transform about its midpoint. */
function BigArrow({ from, to, scale }: { from: Point; to: Point; scale: number }) {
  const mx = (from.x + to.x) / 2
  const my = (from.y + to.y) / 2
  return (
    <g transform={`translate(${mx} ${my}) scale(${scale}) translate(${-mx} ${-my})`}>
      <DipoleArrow from={from} to={to} positiveLabel="" negativeLabel="" />
    </g>
  )
}

/**
 * Dipole lab. Pick a molecule, then compare the bond dipoles drawn on the molecule (left) with
 * the same dipoles stacked tip to tail (right). Arrow directions come from the 3D model; the
 * magnitudes on the right are model units from Pauling electronegativity differences and a fixed
 * lone-pair term. The printed NCERT Table 4.5 debye value is the one in the readout below.
 */
export function DipoleLab({ reducedMotion }: SimulationProps) {
  const [key, setKey] = useState<LabMoleculeKey>('H2O')
  const [lonePairOn, setLonePairOn] = useState(true)
  const [run, setRun] = useState(0)
  const [progress, setProgress] = useState(0)

  const molecule = labMolecule(key)
  const hasLonePairs = molecule.lonePairs > 0
  const lonePairActive = hasLonePairs && lonePairOn
  const scene = useMemo(() => sceneFor(molecule, lonePairActive), [molecule, lonePairActive])
  const comparison = useMemo(() => lonePairComparison(molecule), [molecule])
  const row = printedRow(molecule)

  // Each change replays the sum from the start. Reduced motion skips straight to the end state.
  useEffect(() => {
    if (reducedMotion) return
    const tween = { t: 0 }
    const anim = gsap.to(tween, {
      t: 1,
      duration: DURATION,
      ease: 'none',
      onUpdate: () => setProgress(tween.t),
    })
    return () => {
      anim.kill()
    }
  }, [key, lonePairActive, run, reducedMotion])

  const shown = reducedMotion ? 1 : progress
  const count = scene.arrows.length
  const bondCount = scene.arrows.filter((a) => a.kind === 'bond').length
  const netAlpha = smooth((shown - 0.8) / 0.2)
  const bondsAlpha = smooth(shown * count - bondCount)

  // Right panel: fit the chain (and the bond resultant) inside the panel, centred.
  const chain = useMemo(() => {
    const pts: Point[] = [{ x: 0, y: 0 }, scene.net, scene.bondResultant]
    for (const a of scene.arrows) pts.push(a.chainStart, a.chainEnd)
    const minX = Math.min(...pts.map((p) => p.x))
    const maxX = Math.max(...pts.map((p) => p.x))
    const minY = Math.min(...pts.map((p) => p.y))
    const maxY = Math.max(...pts.map((p) => p.y))
    const s = Math.min(2.2, 280 / Math.max(maxX - minX, 1), 180 / Math.max(maxY - minY, 1))
    const mx = (minX + maxX) / 2
    const my = (minY + maxY) / 2
    return { s, ox: RIGHT.cx - s * mx, oy: RIGHT.cy - s * my }
  }, [scene])
  const toRight = (p: Point): Point => ({ x: chain.ox + chain.s * p.x, y: chain.oy + chain.s * p.y })

  const shapeText = printedRow(molecule).geometry
  const shapeLabel = shapeText.charAt(0).toUpperCase() + shapeText.slice(1)
  const magnitudeText = scene.netIsZero
    ? 'The arrows cancel: the net dipole is zero.'
    : 'The arrows do not cancel: the net dipole is not zero.'
  const isAmmoniaPair = key === 'NH3' || key === 'NF3'
  const lonePairNote = !hasLonePairs
    ? ''
    : lonePairActive
      ? key === 'NH3'
        ? 'The lone pair points the same way as the N–H bond dipoles, so the two add up.'
        : key === 'NF3'
          ? 'The lone pair points against the N–F bond dipoles, so it cuts the net dipole.'
          : 'The lone pairs add to the bond dipoles.'
      : 'With the lone pair switched off, only the bond dipoles are summed.'

  const summary = `${molecule.label}: ${shapeText}. NCERT Table 4.5: μ = ${formatDebye(row.dipoleD)} D. ${magnitudeText}`

  return (
    <div className={styles.root} data-dipole-molecule={key}>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label={`${molecule.label} bond dipoles on the molecule, and the same dipoles added tip to tail. ${summary}`}
        className={styles.svg}
      >
        <VocabDefs />

        {/* Left panel: the molecule with its dipoles on the bonds. */}
        <g data-panel="molecule">
          <rect x={LEFT.x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={8} fill="none" stroke="var(--border)" />
          <Label x={LEFT.x + 16} y={24} fontSize={14} fill="var(--fg-muted)" textAnchor="start">
            Bond dipoles, on their bonds
          </Label>

          {scene.arrows
            .filter((a) => a.kind === 'bond' && a.nucleus)
            .map((a, i) => {
              const end = { x: LEFT.cx + a.direction.x * BOND_R, y: LEFT.cy + a.direction.y * BOND_R }
              return (
                <line
                  key={`bondline-${i}`}
                  x1={LEFT.cx}
                  y1={LEFT.cy}
                  x2={end.x}
                  y2={end.y}
                  stroke="var(--bond)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  opacity={0.5}
                />
              )
            })}

          {scene.lobes.map((lobe, i) => {
            const len = Math.hypot(lobe.x, lobe.y) || 1
            const d = { x: lobe.x / len, y: lobe.y / len }
            return (
              <circle
                key={`lobe-${i}`}
                data-layer="lone-pair-lobe"
                cx={LEFT.cx + d.x * OUTER * BOND_R * 0.8}
                cy={LEFT.cy + d.y * OUTER * BOND_R * 0.8}
                r={24}
                fill="var(--fg-subtle)"
                opacity={hasLonePairs ? (lonePairActive ? 0.28 : 0.12) : 0}
              />
            )
          })}

          {scene.arrows.map((a, i) => {
            if (a.kind === 'lone-pair' && !lonePairActive) return null
            const inner = { x: LEFT.cx + a.direction.x * INNER * BOND_R, y: LEFT.cy + a.direction.y * INNER * BOND_R }
            const outer = { x: LEFT.cx + a.direction.x * OUTER * BOND_R, y: LEFT.cy + a.direction.y * OUTER * BOND_R }
            const from = a.headOutward ? inner : outer
            const to = a.headOutward ? outer : inner
            return (
              <g
                key={`left-${a.kind}-${i}`}
                data-layer={a.kind === 'bond' ? 'bond-dipole' : 'lone-pair-dipole'}
              >
                <BigArrow from={from} to={to} scale={ARROW_SCALE} />
              </g>
            )
          })}

          {scene.arrows
            .filter((a) => a.kind === 'bond' && a.nucleus)
            .map((a, i) => {
              const p = { x: LEFT.cx + a.direction.x * BOND_R, y: LEFT.cy + a.direction.y * BOND_R }
              return (
                <g key={`nucleus-${i}`}>
                  <Atom element={a.label} x={p.x} y={p.y} r={ATOM_R} />
                  <Label x={p.x} y={p.y} fontSize={18} fill="var(--fg)" halo>
                    {a.label}
                  </Label>
                </g>
              )
            })}

          <Atom element={molecule.centre} x={LEFT.cx} y={LEFT.cy} r={ATOM_R} />
          <Label x={LEFT.cx} y={LEFT.cy} fontSize={18} fill="var(--fg)" halo>
            {molecule.centre}
          </Label>
        </g>

        {/* Right panel: the same dipoles tip to tail, then the net dipole. */}
        <g data-panel="sum">
          <rect x={RIGHT.x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={8} fill="none" stroke="var(--border)" />
          <Label x={RIGHT.x + 16} y={24} fontSize={14} fill="var(--fg-muted)" textAnchor="start">
            Tip to tail: the vector sum
          </Label>

          {lonePairActive && (
            <g data-layer="bond-resultant" opacity={bondsAlpha}>
              <line
                x1={toRight({ x: 0, y: 0 }).x}
                y1={toRight({ x: 0, y: 0 }).y}
                x2={toRight(scene.bondResultant).x}
                y2={toRight(scene.bondResultant).y}
                stroke="var(--fg-muted)"
                strokeWidth={2}
                strokeDasharray="5 4"
              />
              <Label
                x={toRight(scene.bondResultant).x + 12}
                y={toRight(scene.bondResultant).y}
                fontSize={13}
                fill="var(--fg-muted)"
                textAnchor="start"
              >
                bonds only
              </Label>
            </g>
          )}

          {scene.arrows.map((a, i) => {
            if (a.kind === 'lone-pair' && !lonePairActive) return null
            const f = smooth(shown * count - i)
            if (f <= 0.001) return null
            const from = toRight(a.chainStart)
            const to = toRight(lerpPoint(a.chainStart, a.chainEnd, f))
            return (
              <g
                key={`chain-${a.kind}-${i}`}
                data-layer={a.kind === 'bond' ? 'chain-bond-dipole' : 'chain-lone-pair-dipole'}
              >
                <BigArrow from={from} to={to} scale={ARROW_SCALE} />
              </g>
            )
          })}

          <circle cx={toRight({ x: 0, y: 0 }).x} cy={toRight({ x: 0, y: 0 }).y} r={3} fill="var(--fg-muted)" />

          <g data-layer="net-dipole" opacity={netAlpha}>
            {!scene.netIsZero && (
              <>
                <BigArrow from={toRight({ x: 0, y: 0 })} to={toRight(scene.net)} scale={NET_SCALE} />
                <Label
                  x={toRight(scene.net).x + 16}
                  y={toRight(scene.net).y - 16}
                  fontSize={18}
                  fill="var(--dipole)"
                >
                  <tspan className="sym">μ</tspan>
                </Label>
              </>
            )}
          </g>

          {scene.netIsZero && (
            <g data-layer="zero-badge" opacity={netAlpha}>
              <rect
                x={RIGHT.cx - 118}
                y={330}
                width={236}
                height={30}
                rx={15}
                fill="var(--surface)"
                stroke="var(--dipole)"
                strokeWidth={1.5}
              />
              <Label x={RIGHT.cx} y={345} fontSize={15} fill="var(--fg)">
                closes on itself: <tspan className="sym">μ</tspan> = 0
              </Label>
            </g>
          )}
        </g>
      </svg>

      <div className={styles.readout} aria-live="polite">
        <p className={styles.heading}>
          {molecule.label} <span className={styles.geometry}>{shapeLabel}</span>
        </p>
        <p className={styles.line}>
          NCERT Table 4.5: <span className="sym">μ</span> = {formatDebye(row.dipoleD)} D
        </p>
        <p className={styles.line}>{magnitudeText}</p>
        {hasLonePairs && <p className={styles.line}>{lonePairNote}</p>}
        {hasLonePairs && (
          <p className={styles.line}>
            Model, in arbitrary units: the bond dipoles alone give {comparison.bondsOnly.toFixed(2)}; with the lone
            pair, {comparison.withLonePairs.toFixed(2)}.
          </p>
        )}
        {isAmmoniaPair && (
          <p className={styles.line}>
            NCERT Table 4.5: NH₃ {formatDebye(ncertDipoleFor('NH3') ?? 0)} D, NF₃ {formatDebye(ncertDipoleFor('NF3') ?? 0)} D.
            The lone pair is why NH₃ is the larger.
          </p>
        )}
        <p className={styles.note}>
          Qualitative model. Arrow lengths on the right use Pauling electronegativity differences and a fixed
          lone-pair term, not measured dipoles. Crossed tail: δ⁺ end. Arrow head: δ⁻ end.
        </p>
      </div>

      <SimulationControls>
        <label className={styles.field}>
          <span>Molecule</span>
          <select
            className={styles.select}
            value={key}
            onChange={(e) => setKey(e.target.value as LabMoleculeKey)}
          >
            {LAB_MOLECULES.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </label>
        <Toggle
          label="Lone-pair dipole"
          checked={lonePairActive}
          disabled={!hasLonePairs}
          onChange={setLonePairOn}
        />
        <Button variant="secondary" onClick={() => setRun((r) => r + 1)}>
          Replay sum
        </Button>
      </SimulationControls>
    </div>
  )
}
