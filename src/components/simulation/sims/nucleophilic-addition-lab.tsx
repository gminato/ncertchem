'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { CurvedArrow, SkeletalFormula, skeletalFrame } from '@/components/organic'
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

const SCALE = 70
const CX = 300
const CY = 165

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

function Label({ at, size = 20, children, weight = 600 }: { at: Pt; size?: number; children: ReactNode; weight?: number }) {
  return (
    <text x={at.x} y={at.y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={weight} fill="var(--fg)" fontFamily="var(--font-sans)" stroke="var(--surface)" strokeWidth={6} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
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
  const alkoxideFrame = useMemo(() => skeletalFrame(alkoxideGraph, SCALE), [alkoxideGraph])
  const alkO = alkoxideFrame.points[oxygen(alkoxideGraph)]

  const cyanGraph = useMemo(() => parseSmiles(cyanohydrinSmiles(carbonylId)), [carbonylId])
  const product = nucleophile === 'cyanide' ? nameOf(cyanohydrinSmiles(carbonylId)) : 'hydrogensulphite addition compound'

  const summary = `${carbonyl.label} with ${nu.label}: addition ${v.rate}${v.favoured ? `, ${v.favoured}` : ''}. Product: ${product}.`

  // Stage 1 overlay: the nucleophile lone pair goes to C, and the C=O π bond goes to O.
  const mid: Pt = { x: (C.x + O.x) / 2, y: (C.y + O.y) / 2 }
  const attackFrom: Pt = { x: C.x - 6, y: C.y - 92 }
  const attackTo: Pt = { x: C.x, y: C.y - 16 }

  return (
    <div className={styles.root}>
      <div className={styles.stage}>
        <svg viewBox="0 0 600 340" role="img" aria-label={`${carbonyl.label} and ${nu.label}, stage ${stage}`} className={styles.svg}>
          {stage === '1' && (
            <>
              <g transform={`translate(${CX} ${CY})`}>
                <SkeletalFormula graph={carbonylGraph} scale={SCALE} showLonePairs
                  overlay={
                    <>
                      <Label at={{ x: C.x, y: C.y - 110 }}>{nu.text}</Label>
                      <CurvedArrow from={attackFrom} to={attackTo} bend={-0.3} gap={6} />
                      <CurvedArrow from={mid} to={O} bend={-0.5} gap={16} />
                    </>
                  }
                />
              </g>
            </>
          )}
          {stage === '2' && (
            <g transform={`translate(${CX} ${CY})`}>
              {nucleophile === 'cyanide' ? (
                <SkeletalFormula graph={alkoxideGraph} scale={SCALE} showLonePairs
                  overlay={
                    <>
                      <Label at={{ x: alkO.x + 40, y: alkO.y + 96 }} size={18}>H–C≡N</Label>
                      <CurvedArrow from={{ x: alkO.x, y: alkO.y + 20 }} to={{ x: alkO.x, y: alkO.y + 84 }} bend={0} gap={6} />
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
          {stage === '3' && (
            <g transform={`translate(${CX} ${CY})`}>
              {nucleophile === 'cyanide' ? (
                <SkeletalFormula graph={cyanGraph} scale={SCALE} showLonePairs overlay={<Label at={{ x: 0, y: 110 }} size={18}>cyanohydrin</Label>} />
              ) : (
                <Label at={{ x: 0, y: -10 }} size={26}>{ADDUCT_TEXT[carbonylId]}</Label>
              )}
            </g>
          )}
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
