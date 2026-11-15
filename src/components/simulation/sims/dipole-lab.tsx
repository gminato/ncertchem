'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { Label, VocabDefs } from '@/components/vocab'
import { atomColor } from '@/components/vocab/atom'
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

// One SVG (viewBox 760 × 400), two equal panels. Left: the molecule with each bond dipole on its
// bond. Right: the same dipoles tip to tail, from a marked origin, ending in the bold net dipole.
const VIEW = { width: 760, height: 400 }
const PANEL_Y = 36
const PANEL_H = 340
const PANEL_W = 368
const LEFT = { x: 8, cx: 192, cy: 206 }
const RIGHT = { x: 384, cx: 568, cy: 206 }
/** Vertical band for the tip-to-tail chain: below the panel title and above the badge. */
const CHAIN_TOP = 84
const CHAIN_BOTTOM = 316
const CHAIN_CENTRE_Y = (CHAIN_TOP + CHAIN_BOTTOM) / 2

/** Atom radius on the left panel, in SVG units. */
const ATOM_R = 25
/** Distance from the centre to each ligand nucleus on the left panel, in SVG units. */
const BOND_R = 136
/** Bond and lone-pair arrows run from INNER·BOND_R to OUTER·BOND_R along their direction. */
const INNER = 0.36
const OUTER = 0.76
/** Left-panel arrows are drawn larger with a transform around their midpoint. */
const ARROW_SCALE = 1.45
/** Shortest drawn length of the net arrow on the right, in SVG units. Shorter nets are drawn at this length. */
const NET_MIN_PX = 56
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

/**
 * Symbol ink for each element, so the symbol contrasts with its disc in both themes. The disc
 * colours come from --el-* tokens that change lightness between themes, so the ink is set by
 * CSS class (see dipole-lab.module.css) rather than a fixed colour.
 */
const WHITE_ON_BOTH = new Set(['C'])
const WHITE_IN_LIGHT_ONLY = new Set(['O', 'N', 'Cl', 'Na', 'Fe', 'Cu'])
function inkClass(element: string): string {
  if (WHITE_ON_BOTH.has(element)) return styles.inkWhite
  if (WHITE_IN_LIGHT_ONLY.has(element)) return styles.inkFlip
  return styles.inkDark
}

/** A plain disc with the element symbol centred on it. No outline, no halo. */
function Disc({ element, x, y }: { element: string; x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={ATOM_R} fill={atomColor(element)} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-sans)"
        fontStyle="normal"
        fontWeight={600}
        fontSize={17}
        className={inkClass(element)}
      >
        {element}
      </text>
    </g>
  )
}

/** A DipoleArrow enlarged by a transform about its midpoint. Used on the left panel only. */
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
 * A plain vector arrow with no crossed tail, for the tip-to-tail panel. The head sits at `to`.
 */
function Vector({
  from,
  to,
  colour,
  width,
  dashed = false,
}: {
  from: Point
  to: Point
  colour: string
  width: number
  dashed?: boolean
}) {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy)
  if (len < 0.5) return null
  const ux = dx / len
  const uy = dy / len
  const head = Math.min(len * 0.6, 8 + width * 1.5)
  const halfWidth = 3.5 + width * 0.7
  const bx = to.x - ux * head
  const by = to.y - uy * head
  return (
    <g>
      <line
        x1={from.x}
        y1={from.y}
        x2={dashed ? to.x : bx}
        y2={dashed ? to.y : by}
        stroke={colour}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? '5 4' : undefined}
      />
      {!dashed && (
        <path
          d={`M${to.x},${to.y} L${bx - uy * halfWidth},${by + ux * halfWidth} L${bx + uy * halfWidth},${by - ux * halfWidth} Z`}
          fill={colour}
        />
      )}
    </g>
  )
}

/** The subscript-numbered dipole symbol, e.g. μ₁, with the μ set in the .sym style. */
function MuSub({ sub }: { sub: string }) {
  return (
    <>
      <tspan className="sym">μ</tspan>
      <tspan dy="0.3em" fontSize="0.7em">
        {sub}
      </tspan>
    </>
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

  // Right panel: scale the chain so it fills the band, centred. The net arrow has a minimum length.
  const fit = useMemo(() => {
    const pts: Point[] = [{ x: 0, y: 0 }, scene.net, scene.bondResultant]
    for (const a of scene.arrows) pts.push(a.chainStart, a.chainEnd)
    const minX = Math.min(...pts.map((p) => p.x))
    const maxX = Math.max(...pts.map((p) => p.x))
    const minY = Math.min(...pts.map((p) => p.y))
    const maxY = Math.max(...pts.map((p) => p.y))
    const s = Math.min(2.6, 290 / Math.max(maxX - minX, 1), (CHAIN_BOTTOM - CHAIN_TOP) / Math.max(maxY - minY, 1))
    const mx = (minX + maxX) / 2
    const my = (minY + maxY) / 2
    const netLen = Math.hypot(scene.net.x, scene.net.y)
    const netSmall = !scene.netIsZero && netLen * s < NET_MIN_PX
    const netDraw =
      netSmall && netLen > 1e-9
        ? { x: (scene.net.x / netLen) * (NET_MIN_PX / s), y: (scene.net.y / netLen) * (NET_MIN_PX / s) }
        : scene.net
    return { s, ox: RIGHT.cx - s * mx, oy: CHAIN_CENTRE_Y - s * my, netDraw, netSmall }
  }, [scene])
  const toRight = (p: Point): Point => ({ x: fit.ox + fit.s * p.x, y: fit.oy + fit.s * p.y })
  const origin = toRight({ x: 0, y: 0 })

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

  // Bond arrows are numbered μ₁, μ₂ … in the order the ligands are listed.
  const bondNumbers = scene.arrows.map(
    (_, i) => scene.arrows.slice(0, i + 1).filter((b) => b.kind === 'bond').length
  )

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
                r={26}
                fill="var(--lone-pair)"
                opacity={hasLonePairs ? (lonePairActive ? 0.3 : 0.12) : 0}
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
              <g key={`left-${a.kind}-${i}`} data-layer={a.kind === 'bond' ? 'bond-dipole' : 'lone-pair-dipole'}>
                <BigArrow from={from} to={to} scale={ARROW_SCALE} />
              </g>
            )
          })}

          {scene.arrows
            .filter((a) => a.kind === 'bond' && a.nucleus)
            .map((a, i) => {
              const p = { x: LEFT.cx + a.direction.x * BOND_R, y: LEFT.cy + a.direction.y * BOND_R }
              return <Disc key={`nucleus-${i}`} element={a.label} x={p.x} y={p.y} />
            })}

          <Disc element={molecule.centre} x={LEFT.cx} y={LEFT.cy} />
        </g>

        {/* Right panel: the same dipoles tip to tail from a marked origin, then the net dipole. */}
        <g data-panel="sum">
          <rect x={RIGHT.x} y={PANEL_Y} width={PANEL_W} height={PANEL_H} rx={8} fill="none" stroke="var(--border)" />
          <Label x={RIGHT.x + 16} y={24} fontSize={14} fill="var(--fg-muted)" textAnchor="start">
            Tip to tail: the vector sum
          </Label>

          {lonePairActive && (
            <g data-layer="bond-resultant" opacity={bondsAlpha}>
              <Vector from={origin} to={toRight(scene.bondResultant)} colour="var(--fg-muted)" width={2} dashed />
              <Label
                x={toRight(scene.bondResultant).x + 10}
                y={toRight(scene.bondResultant).y - 10}
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
            const isBond = a.kind === 'bond'
            const n = bondNumbers[i]
            const from = toRight(a.chainStart)
            const to = toRight(lerpPoint(a.chainStart, a.chainEnd, f))
            const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
            const dx = to.x - from.x
            const dy = to.y - from.y
            const len = Math.hypot(dx, dy) || 1
            const offset = { x: (-dy / len) * 14, y: (dx / len) * 14 }
            return (
              <g key={`chain-${a.kind}-${i}`} opacity={f} data-layer={isBond ? 'chain-bond-dipole' : 'chain-lone-pair-dipole'}>
                <Vector
                  from={from}
                  to={to}
                  colour={isBond ? 'var(--bond)' : 'var(--lone-pair-edge)'}
                  width={2}
                />
                {len > 14 && (
                  <Label x={mid.x + offset.x} y={mid.y + offset.y} fontSize={13} fill={isBond ? 'var(--fg)' : 'var(--lone-pair-edge)'}>
                    {isBond ? <MuSub sub={String(n)} /> : <MuSub sub="lp" />}
                  </Label>
                )}
              </g>
            )
          })}

          <circle cx={origin.x} cy={origin.y} r={4.5} fill="var(--fg)" data-layer="origin" />

          <g data-layer="net-dipole" opacity={netAlpha}>
            {!scene.netIsZero && (
              <>
                <Vector from={origin} to={toRight(fit.netDraw)} colour="var(--dipole)" width={5} />
                <Label
                  x={toRight(fit.netDraw).x + 14}
                  y={toRight(fit.netDraw).y + 4}
                  fontSize={16}
                  fill="var(--dipole)"
                  textAnchor="start"
                >
                  <MuSub sub="" />
                  {' (net'}
                  {fit.netSmall ? ', small' : ''}
                  {')'}
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
        {fit.netSmall && (
          <p className={styles.line}>
            The net arrow on the right is drawn at a minimum length, so the small net stays readable. Its true model
            value is small.
          </p>
        )}
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
