'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { Atom, Label, VocabDefs } from '@/components/vocab'
import { DipoleArrow } from '@/components/molecule/DipoleArrow'
import { Button, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { ncertDipoleFor } from '@/lib/chem/dipole'
import { printedSiDipole } from '@/lib/chem/dipole-units'
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

// SVG viewBox 560 × 330. The central atom sits at CENTRE; the fitted drawing stays inside HALF.
const VIEW = { width: 560, height: 330 }
const CENTRE = { x: 280, y: 165 }
const HALF = { x: 240, y: 150 }
const MAX_FIT = 1.6
const DURATION = 1.8

/** Easing for the morph from bonds in place to the tip-to-tail chain. */
function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}
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

/** Formats a printed debye value as NCERT does, with two decimals and a bare 0 for zero. */
function formatDebye(value: number): string {
  return value === 0 ? '0' : value.toFixed(2)
}

/**
 * Dipole lab. Choose a molecule and watch its bond dipoles (crossed tail on the δ⁺ end)
 * stack tip to tail into the net dipole. The arrows are a qualitative model: the lengths are
 * electronegativity differences and a fixed lone-pair term, not debye values. The printed
 * NCERT Table 4.5 value is shown beside them.
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
  const si = printedSiDipole(molecule.key)

  // Each change replays the morph from the start. Reduced motion skips straight to the end state.
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
  const morph = smooth((shown - 0.25) / 0.55)
  const netAlpha = smooth((shown - 0.8) / 0.2)

  // Fit every point of the drawing inside the box, with the centre atom at CENTRE.
  const scale = useMemo(() => {
    const points: Point[] = [scene.net]
    for (const a of scene.arrows) {
      points.push(a.bondStart, a.bondEnd, a.chainStart, a.chainEnd)
      if (a.nucleus) points.push(a.nucleus)
    }
    points.push(...scene.lobes)
    let maxX = 1
    let maxY = 1
    for (const p of points) {
      maxX = Math.max(maxX, Math.abs(p.x))
      maxY = Math.max(maxY, Math.abs(p.y))
    }
    return Math.min(MAX_FIT, HALF.x / maxX, HALF.y / maxY)
  }, [scene])

  const toPx = (p: Point): Point => ({ x: CENTRE.x + p.x * scale, y: CENTRE.y + p.y * scale })

  const shapeText = row.geometry.charAt(0).toUpperCase() + row.geometry.slice(1)
  const magnitudeText = scene.netIsZero
    ? 'The arrows cancel: the model net dipole is zero.'
    : 'The arrows do not cancel: the model net dipole is not zero.'
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

  const summary = `${molecule.label}: ${shapeText.toLowerCase()}. NCERT Table 4.5 prints ${formatDebye(row.dipoleD)} D. ${magnitudeText}`

  return (
    <div className={styles.root} data-dipole-molecule={key}>
      <svg
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        role="img"
        aria-label={`${molecule.label} bond dipoles drawn tip to tail. ${summary}`}
        className={styles.svg}
      >
        <VocabDefs />

        {scene.arrows
          .filter((a) => a.kind === 'bond' && a.nucleus)
          .map((a) => {
            const end = toPx(a.nucleus!)
            return (
              <line
                key={`bond-${a.label}-${a.nucleus!.x.toFixed(1)}-${a.nucleus!.y.toFixed(1)}`}
                x1={CENTRE.x}
                y1={CENTRE.y}
                x2={end.x}
                y2={end.y}
                stroke="var(--bond)"
                strokeWidth={2}
                strokeLinecap="round"
                opacity={0.45}
              />
            )
          })}

        {scene.lobes.map((lobe, i) => {
          const p = toPx(lobe)
          return (
            <circle
              key={`lobe-${i}`}
              data-layer="lone-pair-lobe"
              cx={p.x}
              cy={p.y}
              r={9}
              fill="var(--fg-subtle)"
              opacity={hasLonePairs ? 0.35 : 0}
            />
          )
        })}

        {scene.arrows
          .filter((a) => a.nucleus)
          .map((a) => {
            const p = toPx(a.nucleus!)
            const dir = a.direction
            const labelAt = { x: p.x + dir.x * 26 * scale, y: p.y + dir.y * 26 * scale }
            return (
              <g key={`nucleus-${a.label}-${p.x.toFixed(1)}-${p.y.toFixed(1)}`}>
                <Atom element={a.label} x={p.x} y={p.y} />
                <Label x={labelAt.x} y={labelAt.y} fontSize={16} fill="var(--fg)">
                  {a.label}
                </Label>
              </g>
            )
          })}

        {scene.arrows.map((a, i) => {
          const start = toPx(lerpPoint(a.bondStart, a.chainStart, morph))
          const end = toPx(lerpPoint(a.bondEnd, a.chainEnd, morph))
          return (
            <g key={`arrow-${a.kind}-${a.label}-${i}`} data-layer={a.kind === 'bond' ? 'bond-dipole' : 'lone-pair-dipole'}>
              <DipoleArrow from={start} to={end} positiveLabel="" negativeLabel="" />
            </g>
          )
        })}

        <Atom element={molecule.centre} x={CENTRE.x} y={CENTRE.y} />
        <Label x={CENTRE.x} y={CENTRE.y} fontSize={16} fill="var(--fg)" halo>
          {molecule.centre}
        </Label>

        <g data-layer="net-dipole" opacity={netAlpha}>
          {!scene.netIsZero && (
            <>
              <DipoleArrow from={toPx({ x: 0, y: 0 })} to={toPx(scene.net)} positiveLabel="" negativeLabel="" />
              <Label
                x={toPx(scene.net).x + 14}
                y={toPx(scene.net).y - 14}
                fontSize={17}
                fill="var(--dipole)"
              >
                <tspan className="sym">μ</tspan>
              </Label>
            </>
          )}
          {scene.netIsZero && (
            <Label x={CENTRE.x} y={VIEW.height - 16} fontSize={15} fill="var(--fg-muted)">
              Net dipole: <tspan className="sym">μ</tspan> = 0. The chain closes on itself.
            </Label>
          )}
        </g>
      </svg>

      <div className={styles.readout} aria-live="polite">
        <p className={styles.heading}>
          {molecule.label} <span className={styles.geometry}>{shapeText}</span>
        </p>
        <p className={styles.line}>
          NCERT Table 4.5: <span className="sym">μ</span> = {formatDebye(row.dipoleD)} D
          {si ? (
            <>
              {' '}
              (NCERT prints {si})
            </>
          ) : null}
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
          Qualitative model. Arrow lengths use Pauling electronegativity differences and a fixed lone-pair term,
          not measured dipoles. Crossed tail: δ⁺ end. Arrow head: δ⁻ end.
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
