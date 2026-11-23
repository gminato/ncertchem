'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6/tones'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  CHAIN_LENGTHS,
  RING_OPTIONS,
  SUBSTITUENTS,
  buildChain,
  carbonylPositions,
  locantPosition,
  substituentPositions,
  type ChainLength,
  type SubstituentKind,
} from '@/lib/chem/carbonyl-namer'
import styles from './carbonyl-namer.module.css'

type Mode = 'chain' | (typeof RING_OPTIONS)[number]['id']

const MODES: readonly { value: Mode; label: string }[] = [
  { value: 'chain', label: 'Open chain' },
  ...RING_OPTIONS.map((r) => ({ value: r.id as Mode, label: r.label })),
]

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d])

/** One drawing scale for the whole view: the chain fits 470 units wide, and labels stay large. */
const MAX_SCALE = 70
const FIT_WIDTH = 470

/** Each atom's bonded neighbours, by index. */
function adjacency(g: MolGraph): number[][] {
  const adj: number[][] = g.atoms.map(() => [])
  for (const b of g.bonds) {
    adj[b.a].push(b.b)
    adj[b.b].push(b.a)
  }
  return adj
}

/** Ring numbering for the methylcyclohexane option: C1 carries CHO, and the methyl sits on C3, as the name says. */
function ringLocants(g: MolGraph, carbonylAtom: number, mode: Mode): { atom: number; label: string }[] {
  if (mode !== 'methylcyclohexane' || carbonylAtom < 0) return []
  const neighbours = (i: number) => g.bonds.flatMap((b) => (b.a === i ? [b.b] : b.b === i ? [b.a] : []))
  const ringC1 = neighbours(carbonylAtom).find((j) => g.atoms[j].element === 'C')
  const methyl = g.atoms.findIndex((a, i) => a.element === 'C' && neighbours(i).length === 1 && neighbours(i)[0] !== carbonylAtom)
  if (ringC1 === undefined || methyl < 0) return []
  return [
    { atom: ringC1, label: '1' },
    { atom: neighbours(methyl)[0], label: '3' },
  ]
}

/** The carbonyl carbon: the carbon double-bonded to an oxygen. */
function carbonylCarbonOf(g: MolGraph): number {
  const bond = g.bonds.find((b) => b.order === 2 && (g.atoms[b.a].element === 'O' || g.atoms[b.b].element === 'O'))
  if (!bond) return -1
  return g.atoms[bond.a].element === 'C' ? bond.a : bond.b
}

function sentenceFor(mode: Mode, verdict: 'aldehyde' | 'ketone', carbonyl: number, n: number): string {
  if (mode !== 'chain') {
    if (mode === 'benzaldehyde') return 'The CHO group hangs off the benzene ring. The name keeps the common name benzaldehyde.'
    if (mode === 'methylcyclohexane') return 'The CHO group sits on a ring carbon, so the ring takes the -carbaldehyde ending. That carbon is C1, and the methyl sits on C3.'
    return 'A ketone that joins a benzene ring to a methyl group takes the -phenone ending. NCERT calls it acetophenone.'
  }
  if (verdict === 'aldehyde') return `The carbonyl carbon is C1 and carries one H, so the name ends in -al. The chain of ${n} carbons is numbered from the CHO end.`
  return `The carbonyl carbon is C${carbonyl} and joins two carbon groups, so the name ends in -one. The chain is numbered so that the C=O gets the lowest number.`
}

export function CarbonylNamer() {
  const [mode, setMode] = useState<Mode>('chain')
  const [n, setN] = useState<ChainLength>(4)
  const [carbonylPick, setCarbonylPick] = useState(1)
  const [subPick, setSubPick] = useState<SubstituentKind>('none')
  const [atPick, setAtPick] = useState(2)

  const carbonylOptions = carbonylPositions(n)
  const carbonyl = carbonylOptions.includes(carbonylPick) ? carbonylPick : 1
  const subOptions = substituentPositions(n, carbonyl)
  const substituent: SubstituentKind = subPick !== 'none' && subOptions.length > 0 ? subPick : 'none'
  const at = substituent !== 'none' ? (subOptions.includes(atPick) ? atPick : subOptions[0]) : null

  const chain = buildChain({ n, carbonyl, substituent, at })
  const ring = RING_OPTIONS.find((r) => r.id === mode)
  const graph = parseSmiles(ring ? ring.smiles : chain.smiles)
  const name = ring ? unit8Name(ring.smiles) : chain.name
  const common = ring ? ring.common : chain.common
  const verdict = ring ? ring.verdict : chain.verdict
  const formula = molecularFormula(graph)
  const carbonylAtom = ring ? carbonylCarbonOf(graph) : chain.carbonylCarbon
  const sentence = sentenceFor(mode, verdict, carbonyl, n)
  const scale = Math.min(MAX_SCALE, FIT_WIDTH / drawingFrame(graph, 1).bounds.width)
  const frame = drawingFrame(graph, scale)
  const adj = adjacency(graph)
  const locants = ring ? ringLocants(graph, carbonylAtom, mode) : chain.carbons.map((atom, k) => ({ atom, label: String(k + 1) }))
  const verdictLabel = verdict === 'aldehyde' ? 'Aldehyde' : 'Ketone'
  const commonText = common ?? 'NCERT gives no common name for this one'
  const summary = `${name}. ${verdictLabel}. ${commonText}. ${sentence}`

  return (
    <div className={styles.root} data-testid="carbonyl-namer">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 560 470" role="img" aria-label={summary} className={styles.drawing} data-testid="namer-drawing">
            <text x={280} y={38} textAnchor="middle" fontSize={24} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
              {name}
            </text>
            <text x={280} y={66} textAnchor="middle" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {common ? `Common name: ${common}` : 'No common name in NCERT for this one'}
            </text>
            <SkeletalFormula
              graph={graph}
              scale={scale}
              x={280}
              y={240}
              overlay={
                <g>
                  {carbonylAtom >= 0 ? (
                    <circle cx={frame.points[carbonylAtom].x} cy={frame.points[carbonylAtom].y} r={0.2 * scale} fill={ROLE_TONE.electrophilicCarbon} />
                  ) : null}
                  {locants.map((l) => {
                    const p = locantPosition(l.atom, frame.points, adj[l.atom])
                    return (
                      <text key={l.atom} x={p.x} y={p.y} fontSize={15} fontWeight={700} textAnchor="middle" dominantBaseline="central" fill="var(--fg)">
                        {l.label}
                      </text>
                    )
                  })}
                </g>
              }
            />
            <text x={280} y={412} textAnchor="middle" fontSize={22} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
              {verdictLabel}
            </text>
            <text x={280} y={440} textAnchor="middle" fontSize={17} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {subscript(formula)}
            </text>
          </svg>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading}>{name}</p>
          <p className={styles.verdict} data-testid="namer-verdict">{verdictLabel}</p>
          <p className={styles.summary}>{sentence}</p>
          <p className={styles.srOnly} aria-live="polite" data-testid="namer-live">
            {summary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented label="Molecule" options={MODES} value={mode} onChange={setMode} />
          {mode === 'chain' && (
            <>
              <Segmented
                label="Chain length"
                options={CHAIN_LENGTHS.map((c) => ({ value: String(c), label: `${c} carbons` }))}
                value={String(n)}
                onChange={(v) => setN(Number(v) as ChainLength)}
              />
              <Segmented
                label="C=O position"
                options={carbonylOptions.map((p) => ({ value: String(p), label: p === 1 ? 'C1 (CHO)' : `C${p} (ketone)` }))}
                value={String(carbonyl)}
                onChange={(v) => setCarbonylPick(Number(v))}
              />
              <Segmented
                label="Substituent"
                options={SUBSTITUENTS.map((s) => ({ value: s.id, label: s.label }))}
                value={substituent}
                onChange={(v) => setSubPick(v as SubstituentKind)}
              />
              {substituent !== 'none' && (
                <Segmented
                  label="Substituent on"
                  options={subOptions.map((p) => ({ value: String(p), label: `C${p}` }))}
                  value={String(at)}
                  onChange={(v) => setAtPick(Number(v))}
                />
              )}
            </>
          )}
        </div>
      </SimulationControls>
    </div>
  )
}
