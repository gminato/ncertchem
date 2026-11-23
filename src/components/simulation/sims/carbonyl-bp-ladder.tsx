'use client'
import { useMemo, useState } from 'react'
import { Button, Slider, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, skeletalFrame } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { CARBONYL_BOILING_POINTS, unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  CHAIN_LADDER,
  SOLUBILITY_NOTES,
  WATER_CONTACT_NOTE,
  interactionsFor,
  polarSite,
} from '@/lib/chem/carbonyl-bp-model'
import styles from './carbonyl-bp-ladder.module.css'

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d])

const BOX_SCALE = 52
const LEFT_X = 150
const RIGHT_X = 410
const BOX_Y = 124

const BP = CARBONYL_BOILING_POINTS.map((r) => r.bpK)
const DOMAIN_MIN = Math.min(...BP) - 10
const DOMAIN_MAX = Math.max(...BP) + 10
const BAR_X0 = 196
const BAR_W = 236
const LADDER_TOP = 332
const RUNG_GAP = 40
const LADDER_BASE = LADDER_TOP + (CARBONYL_BOILING_POINTS.length - 1) * RUNG_GAP

const barEnd = (bpK: number) => BAR_X0 + ((bpK - DOMAIN_MIN) / (DOMAIN_MAX - DOMAIN_MIN)) * BAR_W

/** Shorten a segment, so lines stop short of atom labels (d0 at the start, d1 at the end). */
function inset(p: [number, number], q: [number, number], d0: number, d1 = d0): [number, number, number, number] {
  const dx = q[0] - p[0]
  const dy = q[1] - p[1]
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return [p[0] + ux * d0, p[1] + uy * d0, q[0] - ux * d1, q[1] - uy * d1]
}

export function CarbonylBpLadder() {
  const [index, setIndex] = useState(3)
  const [dipoleOn, setDipoleOn] = useState(true)
  const [hBondOn, setHBondOn] = useState(true)
  const [chain, setChain] = useState(0)

  const row = CARBONYL_BOILING_POINTS[index]
  const graph = useMemo(() => parseSmiles(row.smiles), [row.smiles])
  const frame = useMemo(() => skeletalFrame(graph, BOX_SCALE), [graph])
  const formula = molecularFormula(graph)
  const site = polarSite(graph)
  const attractions = interactionsFor(row.smiles)
  const hasDipole = attractions.includes('dipole–dipole')
  const hasHBond = attractions.includes('hydrogen bonding')
  // An O–H molecule is drawn from its O end on the right (the same molecule, written OCCC), so the two O atoms face each other.
  const rightSmiles = hasHBond ? 'OCCC' : row.smiles
  const rightGraph = useMemo(() => parseSmiles(rightSmiles), [rightSmiles])
  const rightFrame = useMemo(() => skeletalFrame(rightGraph, BOX_SCALE), [rightGraph])

  const pts = frame.points
  const rightPts = rightFrame.points
  const carbons = graph.atoms.flatMap((a, i) => (a.element === 'C' ? [i] : []))
  const rightCarbons = rightGraph.atoms.flatMap((a, i) => (a.element === 'C' ? [i] : []))
  const rightmostC = carbons.reduce((best, i) => (pts[i].x > pts[best].x ? i : best), carbons[0])
  const leftmostC = rightCarbons.reduce((best, i) => (rightPts[i].x < rightPts[best].x ? i : best), rightCarbons[0])
  const atLeft = (i: number): [number, number] => [LEFT_X + pts[i].x, BOX_Y + pts[i].y]
  const atRight = (i: number): [number, number] => [RIGHT_X + rightPts[i].x, BOX_Y + rightPts[i].y]

  // In an O–H molecule the van der Waals dots run under the hydrogen bond, between the lowest carbons facing each other, so the two never cross.
  const lowLeftC = carbons.reduce((best, i) => (pts[i].y > pts[best].y || (pts[i].y === pts[best].y && pts[i].x > pts[best].x) ? i : best), carbons[0])
  const lowRightC = rightCarbons.reduce((best, i) => (rightPts[i].y > rightPts[best].y || (rightPts[i].y === rightPts[best].y && rightPts[i].x < rightPts[best].x) ? i : best), rightCarbons[0])
  const shiftDown = (p: [number, number]): [number, number] => [p[0], p[1] + 22]
  const vdW = hasHBond
    ? inset(shiftDown(atLeft(lowLeftC)), shiftDown(atRight(lowRightC)), 12)
    : inset(atLeft(rightmostC), atRight(leftmostC), 12)
  const dipoleLine = site && hasDipole && dipoleOn ? inset(atLeft(site.oxygen), atRight(site.partner), 14) : null
  const leftOxygen = graph.atoms.findIndex((a) => a.element === 'O')
  const rightOxygen = rightGraph.atoms.findIndex((a) => a.element === 'O')
  const hBondSegment = hasHBond && hBondOn ? inset(atLeft(leftOxygen), atRight(rightOxygen), 26, 18) : null

  const notes: string[] = [
    'Van der Waals contacts (short dots): in every molecule.',
  ]
  if (dipoleOn) {
    notes.push(
      hasDipole
        ? 'Dipole–dipole (dashed): δ⁻ on O pulls on δ⁺ on C.'
        : 'Dipole–dipole: none, no C=O or C–O–C group.',
    )
  }
  if (hBondOn) {
    notes.push(
      hasHBond
        ? 'Hydrogen bond (dotted): O–H to the next O.'
        : 'Hydrogen bond: none, no O–H group.',
    )
  }

  const chainName = unit8Name(CHAIN_LADDER[chain].smiles)
  const solubility = SOLUBILITY_NOTES[chain]
  const summary = `${row.name} boils at ${row.bpK} K. Its strongest attraction is ${row.attraction}. Water: ${chainName}. ${solubility} ${WATER_CONTACT_NOTE}`

  return (
    <div className={styles.root} data-testid="carbonyl-bp-ladder">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 560 540" role="img" aria-label={summary} className={styles.drawing} data-testid="carbonyl-drawing">
            <rect x={8} y={8} width={544} height={258} rx={12} fill="var(--surface)" stroke="var(--border)" />
            <text x={24} y={34} fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {`Two ${row.name.toLowerCase()} molecules`}
            </text>
            <SkeletalFormula graph={graph} scale={BOX_SCALE} x={LEFT_X} y={BOX_Y} highlightAtoms={site ? [site.oxygen] : []} />
            <SkeletalFormula graph={rightGraph} scale={BOX_SCALE} x={RIGHT_X} y={BOX_Y} highlightAtoms={site ? [site.oxygen] : []} />
            <line x1={vdW[0]} y1={vdW[1]} x2={vdW[2]} y2={vdW[3]} stroke="var(--fg-muted)" strokeWidth={2} strokeDasharray="2 5" strokeLinecap="round" />
            {dipoleLine && site && (
              <g>
                <line x1={dipoleLine[0]} y1={dipoleLine[1]} x2={dipoleLine[2]} y2={dipoleLine[3]} stroke="var(--dipole)" strokeWidth={2.5} strokeDasharray="8 5" />
                <text x={atLeft(site.oxygen)[0] - 26} y={atLeft(site.oxygen)[1] - 22} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-minus)">δ⁻</text>
                <text x={atRight(site.partner)[0] + 12} y={atRight(site.partner)[1] + 36} fontSize={16} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--delta-plus)">δ⁺</text>
              </g>
            )}
            {hBondSegment && (
              <line x1={hBondSegment[0]} y1={hBondSegment[1]} x2={hBondSegment[2]} y2={hBondSegment[3]} stroke="var(--accent)" strokeWidth={3.5} strokeDasharray="0 6" strokeLinecap="round" />
            )}
            {notes.map((note, i) => (
              <text key={note} x={24} y={210 + i * 22} fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                {note}
              </text>
            ))}

            <text x={24} y={LADDER_TOP - 26} fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              Boiling points
            </text>
            <line x1={BAR_X0} y1={LADDER_BASE + 22} x2={BAR_X0 + BAR_W} y2={LADDER_BASE + 22} stroke="var(--border)" strokeWidth={1.5} />
            <text x={BAR_X0 + BAR_W} y={LADDER_BASE + 44} textAnchor="end" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              b.p. / K
            </text>
            {CARBONYL_BOILING_POINTS.map((r, i) => {
              const y = LADDER_BASE - i * RUNG_GAP
              const selected = i === index
              const end = barEnd(r.bpK)
              return (
                <g key={r.name} onClick={() => setIndex(i)} style={{ cursor: 'pointer' }}>
                  <text x={24} y={y + 5} fontSize={15} fontWeight={selected ? 700 : 400} fontFamily="var(--font-sans)" fill={selected ? 'var(--accent)' : 'var(--fg)'}>
                    {r.name}
                  </text>
                  <rect x={BAR_X0} y={y - 8} width={end - BAR_X0} height={16} rx={3} fill={selected ? 'var(--accent)' : 'var(--fg-muted)'} opacity={selected ? 0.9 : 0.35} />
                  <text x={end + 8} y={y + 5} fontSize={15} fontWeight={selected ? 700 : 400} fontFamily="var(--font-sans)" fill="var(--fg)">
                    {`${r.bpK} K`}
                  </text>
                </g>
              )
            })}
          </svg>
          <figcaption className={styles.caption}>
            {row.name}, {subscript(formula)}.
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading}>Water solubility</p>
          <p className={styles.summary}>{chainName}: {solubility}</p>
          <p className={styles.condition}>{WATER_CONTACT_NOTE}</p>
          <p className={styles.srOnly} aria-live="polite" data-testid="carbonyl-live">
            {summary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="Compound">
            {CARBONYL_BOILING_POINTS.map((r, i) => (
              <Button
                key={r.name}
                variant="secondary"
                aria-pressed={i === index}
                className={i === index ? styles.pressed : undefined}
                onClick={() => setIndex(i)}
              >
                {r.name}
              </Button>
            ))}
          </div>
          <div className={styles.group} role="group" aria-label="Attractions">
            <Toggle label="Dipole–dipole" checked={dipoleOn} onChange={setDipoleOn} />
            <Toggle label="Hydrogen bonds" checked={hBondOn} onChange={setHBondOn} />
          </div>
          <Slider
            label="Chain length"
            value={chain}
            min={0}
            max={CHAIN_LADDER.length - 1}
            step={1}
            format={(v) => unit8Name(CHAIN_LADDER[v].smiles)}
            onChange={setChain}
          />
        </div>
      </SimulationControls>
    </div>
  )
}
