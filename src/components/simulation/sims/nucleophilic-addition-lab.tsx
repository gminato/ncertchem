'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { bondAnchor, CurvedArrow, drawingFrame, lonePairPoint, outwardAngle, SkeletalFormula, skeletalFrame } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  CARBONYLS,
  alkoxideSmiles,
  carbonylById,
  cyanohydrinSmiles,
  nameOf,
  verdict,
  type Carbonyl,
  type NucleophileId,
} from '@/lib/chem/nucleophilic-addition'
import styles from './nucleophilic-addition-lab.module.css'

type Stage = '1' | '2' | '3'

/** Molecule scale: bond length in viewBox units. */
const SCALE = 110
/** The bisulphite stage sets the carbonyl on the left and the adduct on the right, so it is a little smaller. */
const BIS_SCALE = 84
const CX = 300
const CY = 165
const INK = 'var(--fg)'
const ARROW_GAP = 10
const TAU_3 = (2 * Math.PI) / 3
/** Lone-pair dots sit this far from the oxygen centre. */
const LONE_PAIR_R = 0.42 * SCALE

const NUCLEOPHILES: readonly { value: NucleophileId; label: string; text: string }[] = [
  { value: 'cyanide', label: 'CN⁻ with a base', text: '⁻:C≡N:' },
  { value: 'bisulphite', label: 'HSO₃⁻ from NaHSO₃', text: 'HSO₃⁻' },
]

const STAGES: readonly { value: Stage; label: string }[] = [
  { value: '1', label: '1 Attack' },
  { value: '2', label: '2 Intermediate' },
  { value: '3', label: '3 Product' },
]

/** The bisulphite adduct as a salt, written by hand: the namer cannot draw S with four bonds. */
const ADDUCT_TEXT: Record<Carbonyl['id'], string> = {
  methanal: 'CH₂(OH)SO₃Na',
  ethanal: 'CH₃CH(OH)SO₃Na',
  propanone: '(CH₃)₂C(OH)SO₃Na',
  butanone: 'CH₃CH₂C(CH₃)(OH)SO₃Na',
}

type Pt = { x: number; y: number }

/** Index of the carbonyl carbon (the C bonded to the one O by a double bond). */
function carbonylCarbon(g: MolGraph): number {
  const o = g.atoms.findIndex((a) => a.element === 'O')
  const b = g.bonds.find((x) => x.order === 2 && (x.a === o || x.b === o))
  if (!b) throw new Error('no C=O in graph')
  return b.a === o ? b.b : b.a
}

function oxygen(g: MolGraph): number {
  return g.atoms.findIndex((a) => a.element === 'O')
}

function unit(v: Pt): Pt {
  const d = Math.hypot(v.x, v.y) || 1
  return { x: v.x / d, y: v.y / d }
}

function Label({ at, size = 20, children, weight = 600 }: { at: Pt; size?: number; children: ReactNode; weight?: number }) {
  return (
    <text x={at.x} y={at.y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={weight} fill="var(--fg)" fontFamily="var(--font-sans)" stroke="var(--surface)" strokeWidth={6} strokeLinejoin="round">
      {children}
    </text>
  )
}

/** A lone pair on an oxygen: two dots either side of the outward direction. */
function LonePair({ o, th }: { o: Pt; th: number }) {
  return (
    <g fill={INK}>
      {[-0.16, 0.16].map((d) => {
        const p = lonePairPoint(o, th + d, LONE_PAIR_R)
        return <circle key={d} cx={p.x} cy={p.y} r={2.8} />
      })}
    </g>
  )
}

/** The negative charge, drawn as a circle with a minus sign. */
function Minus({ at }: { at: Pt }) {
  return (
    <g>
      <circle cx={at.x} cy={at.y} r={8} fill="var(--surface)" stroke={INK} strokeWidth={1.5} />
      <line x1={at.x - 4} x2={at.x + 4} y1={at.y} y2={at.y} stroke={INK} strokeWidth={1.8} />
    </g>
  )
}

/** Equilibrium arrow: two half-headed harpoons, one above the other, pointing opposite ways (as ReactionScheme draws it). */
function Equilibrium({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const head = (tip: number, dir: 1 | -1, yy: number) => {
    const bx = tip - 11 * dir
    return `M${bx},${yy - 6} L${tip},${yy} L${bx},${yy + 6}`
  }
  return (
    <g stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round">
      <line x1={x1} x2={x2 - 2} y1={y - 4} y2={y - 4} />
      <path d={head(x2, 1, y - 4)} />
      <line x1={x2} x2={x1 + 2} y1={y + 4} y2={y + 4} />
      <path d={head(x1, -1, y + 4)} />
    </g>
  )
}

export function NucleophilicAdditionLab() {
  const [carbonylId, setCarbonylId] = useState<Carbonyl['id']>('ethanal')
  const [nucleophile, setNucleophile] = useState<NucleophileId>('cyanide')
  const [stage, setStage] = useState<Stage>('1')

  const carbonyl = carbonylById(carbonylId)
  const nu = NUCLEOPHILES.find((n) => n.value === nucleophile)!
  const v = verdict(carbonyl, nucleophile)

  const carbonylGraph = useMemo(() => parseSmiles(carbonyl.smiles), [carbonyl.smiles])
  const carbonylFrame = useMemo(() => skeletalFrame(carbonylGraph, SCALE), [carbonylGraph])
  const C = carbonylFrame.points[carbonylCarbon(carbonylGraph)]
  const O = carbonylFrame.points[oxygen(carbonylGraph)]

  const alkoxideGraph = useMemo(() => parseSmiles(alkoxideSmiles(carbonylId)), [carbonylId])
  // The charge and lone pairs of O⁻ are drawn here, not by SkeletalFormula, so the ⊖ clears the dots.
  const alkoxideBare = useMemo<MolGraph>(
    () => ({ atoms: alkoxideGraph.atoms.map((a) => ({ ...a, charge: 0 })), bonds: alkoxideGraph.bonds }),
    [alkoxideGraph],
  )
  const alk = useMemo(() => drawingFrame(alkoxideGraph, SCALE), [alkoxideGraph])
  const alkOi = oxygen(alkoxideGraph)
  const alkO = alk.points[alkOi]
  const th0 = outwardAngle(alk.points, alk.adj, alkOi)
  const acidAt = lonePairPoint(alkO, th0, 100)
  const hTip: Pt = { x: acidAt.x - 21, y: acidAt.y - 10 }

  const cyanGraph = useMemo(() => parseSmiles(cyanohydrinSmiles(carbonylId)), [carbonylId])
  const product = nucleophile === 'cyanide' ? nameOf(cyanohydrinSmiles(carbonylId)) : 'hydrogensulphite addition compound'

  const summary = `${carbonyl.label} with ${nu.label}: addition ${v.rate}${v.favoured ? `, ${v.favoured}` : ''}. Product: ${product}.`

  // Stage 1: the nucleophile approaches from the side away from O (ketones: O is not in the way), and the
  // curved arrows run from its lone pair to C and from the C=O π bond to O, as in the Scrolly.
  const away = unit({ x: C.x - O.x, y: C.y - O.y })
  const src: Pt = { x: C.x + away.x * 84, y: C.y + away.y * 84 }
  const nuAt: Pt = { x: C.x + away.x * 104, y: C.y + away.y * 104 }

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        <svg viewBox="0 0 600 340" role="img" aria-label={`${carbonyl.label} and ${nu.label}, stage ${stage}`} className={styles.svg}>
          {stage === '1' && (
            <g transform={`translate(${CX} ${CY})`}>
              <SkeletalFormula graph={carbonylGraph} scale={SCALE} showLonePairs
                overlay={
                  <>
                    <Label at={nuAt}>{nu.text}</Label>
                    <CurvedArrow from={src} to={C} bend={-0.3} gap={8} />
                    <CurvedArrow from={bondAnchor(C, O)} to={O} bend={0.4} gap={ARROW_GAP} />
                  </>
                }
              />
            </g>
          )}
          {stage === '2' && (
            <g transform={`translate(${CX} ${CY})`}>
              {nucleophile === 'cyanide' ? (
                <SkeletalFormula graph={alkoxideBare} scale={SCALE} showLonePairs={false}
                  overlay={
                    <>
                      {[th0 - TAU_3, th0, th0 + TAU_3].map((t) => (
                        <LonePair key={t} o={alkO} th={t} />
                      ))}
                      <Minus at={lonePairPoint(alkO, th0 + Math.PI / 3, 62)} />
                      <Label at={acidAt} size={18}>H–C≡N</Label>
                      <CurvedArrow from={lonePairPoint(alkO, th0, LONE_PAIR_R)} to={hTip} bend={0.3} gap={0} />
                    </>
                  }
                />
              ) : (
                <SkeletalFormula graph={carbonylGraph} scale={SCALE} showLonePairs
                  overlay={
                    <>
                      <Label at={{ x: C.x, y: C.y - 64 }} size={18}>SO₃H on the sp³ carbon</Label>
                      <Label at={{ x: O.x + 22, y: O.y - 22 }} size={18}>O⁻</Label>
                    </>
                  }
                />
              )}
            </g>
          )}
          {stage === '3' && (nucleophile === 'cyanide' ? (
            <g transform={`translate(${CX} ${CY})`}>
              <SkeletalFormula graph={cyanGraph} scale={SCALE} showLonePairs overlay={<Label at={{ x: 0, y: 128 }} size={18}>cyanohydrin</Label>} />
            </g>
          ) : (
            <g>
              <g transform={`translate(120 ${CY})`}>
                <SkeletalFormula graph={carbonylGraph} scale={BIS_SCALE} showLonePairs />
              </g>
              <Equilibrium x1={238} x2={318} y={CY} />
              <Label at={{ x: 278, y: CY - 16 }} size={18}>NaHSO₃</Label>
              <Label at={{ x: 460, y: CY }} size={24}>{ADDUCT_TEXT[carbonylId]}</Label>
            </g>
          ))}
        </svg>
        <div className={styles.stageLabel}>{STAGES.find((s) => s.value === stage)!.label}</div>
      </div>

      <p className={styles.product}>
        <span className={styles.productKey}>Product: </span>
        {product}
      </p>
      <p className={styles.reason}>{v.reason}</p>
      <p className={styles.srOnly} aria-live="polite">{summary}</p>

      <SimulationControls>
        <Segmented
          label="Carbonyl compound"
          options={CARBONYLS.map((c) => ({ value: c.id, label: c.label }))}
          value={carbonylId}
          onChange={setCarbonylId}
        />
        <Segmented label="Nucleophile" options={NUCLEOPHILES.map((n) => ({ value: n.value, label: n.label }))} value={nucleophile} onChange={setNucleophile} />
        <Segmented label="Stage" options={STAGES} value={stage} onChange={setStage} />
      </SimulationControls>
    </div>
  )
}
