'use client'

import { useMemo, useState } from 'react'
import { SkeletalFormula } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  REAGENTS_FOR,
  REAGENT_LABEL,
  STARTING,
  prepOutcome,
  startingName,
  startingSpec,
  type ByProduct,
  type Compound,
  type ReagentId,
  type StartingId,
  type Verdict,
} from '@/lib/chem/haloalkane-prep'
import styles from './haloalkane-prep-bench.module.css'

/** One skeletal scale for every molecule, so each one is drawn the same way wherever it appears. */
const SCALE = 50
const VIEW_WIDTH = 560
const VIEW_HEIGHT = 310
const LEFT_X = 115
const RIGHT_X = 445
const NAME_GAP = 52
const PILL_H = 30
const CHAR_W = 8.4
const PILL_GAP = 16

const KIND_GROUPS: readonly { label: string; kind: StartingKind }[] = [
  { label: 'Alcohols', kind: 'alcohol' },
  { label: 'Alkenes', kind: 'alkene' },
  { label: 'Alkanes', kind: 'alkane' },
  { label: 'Haloalkanes', kind: 'haloalkane' },
]

type StartingKind = (typeof STARTING)[number]['kind']

const VERDICT_BADGE: Record<Verdict, string> = {
  single: 'Single product',
  major: 'Major product',
  mixture: 'Mixture',
}

const STATE_GLYPH: Record<ByProduct['state'], string> = { gas: '↑', solid: '↓', liquid: '•' }

const GRAPHS = new Map<string, MolGraph>()
function graphOf(smiles: string): MolGraph {
  let g = GRAPHS.get(smiles)
  if (!g) {
    g = parseSmiles(smiles)
    GRAPHS.set(smiles, g)
  }
  return g
}

/** Splits a reagent label into short lines so it fits above the arrow. */
function wrapLabel(text: string, max = 15): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > max && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

interface PlacedPill {
  key: string
  glyph: string
  text: string
  x: number
  width: number
}

/** Lays the by-product pills out in one centred row under the drawing. */
function placePills(byProducts: readonly ByProduct[]): PlacedPill[] {
  const items = byProducts.map((b) => {
    const text = `${b.formula}  ${b.text}`
    return { key: b.formula, glyph: STATE_GLYPH[b.state], text, width: 40 + text.length * CHAR_W }
  })
  const total = items.reduce((sum, p) => sum + p.width, 0) + PILL_GAP * Math.max(0, items.length - 1)
  let x = (VIEW_WIDTH - total) / 2
  return items.map((p) => {
    const placed = { ...p, x }
    x += p.width + PILL_GAP
    return placed
  })
}

export function HaloalkanePrepBench() {
  const [startId, setStartId] = useState<StartingId>('butanol')
  const [reagentPick, setReagentPick] = useState<ReagentId>('hbr')

  const options = REAGENTS_FOR[startId]
  const reagent: ReagentId = options.includes(reagentPick) ? reagentPick : options[0]
  const outcome = useMemo(() => prepOutcome(startId, reagent), [startId, reagent])
  const start = startingSpec(startId)
  const startName = startingName(startId)

  if (!outcome) return null

  const products: readonly Compound[] = outcome.products
  const productNames = products.map((p) => p.name).join(' and ')
  const twoProducts = products.length > 1
  const rowY = twoProducts ? 142 : 128
  const productYs = twoProducts ? [84, 200] : [rowY]
  const pillY = twoProducts ? 272 : 222
  const reagentLines = wrapLabel(REAGENT_LABEL[reagent])
  const pills = placePills(outcome.byProducts)
  const byText = outcome.byProducts.map((b) => `${b.formula} ${b.text}`).join('; ')
  const liveSummary = `${startName} with ${REAGENT_LABEL[reagent]} gives ${productNames}.${byText ? ` By-products: ${byText}.` : ''}`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span>Starting material</span>
          <select value={startId} onChange={(e) => setStartId(e.target.value as StartingId)} data-testid="prep-start">
            {KIND_GROUPS.map((group) => (
              <optgroup key={group.kind} label={group.label}>
                {STARTING.filter((s) => s.kind === group.kind).map((s) => (
                  <option key={s.id} value={s.id}>
                    {`${startingName(s.id)}${s.tag ? ` (${s.tag})` : ''}`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Reagent</span>
          <select value={reagent} onChange={(e) => setReagentPick(e.target.value as ReagentId)} data-testid="prep-reagent">
            {options.map((r) => (
              <option key={r} value={r}>
                {REAGENT_LABEL[r]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
          role="img"
          aria-label={`${startName} with ${REAGENT_LABEL[reagent]} gives ${productNames}`}
        >
          <SkeletalFormula graph={graphOf(start.smiles)} scale={SCALE} x={LEFT_X} y={rowY} />
          <text x={LEFT_X} y={rowY + NAME_GAP} textAnchor="middle" className={styles.name}>
            {startName}
          </text>

          <line x1={205} y1={rowY} x2={340} y2={rowY} className={styles.arrow} />
          <polygon points={`350,${rowY} 338,${rowY - 7} 338,${rowY + 7}`} className={styles.arrowHead} />
          {reagentLines.map((line, i) => (
            <text key={line} x={272} y={rowY - 20 + i * 18} textAnchor="middle" className={styles.reagent}>
              {line}
            </text>
          ))}

          {products.map((p, i) => (
            <g key={p.smiles}>
              <SkeletalFormula graph={graphOf(p.smiles)} scale={SCALE} x={RIGHT_X} y={productYs[i]} />
              <text x={RIGHT_X} y={productYs[i] + NAME_GAP} textAnchor="middle" className={styles.name}>
                {p.name}
              </text>
            </g>
          ))}

          {pills.map((p) => (
            <g key={p.key}>
              <rect x={p.x} y={pillY} width={p.width} height={PILL_H} rx={PILL_H / 2} className={styles.pill} />
              <text x={p.x + 16} y={pillY + 20} className={styles.pillGlyph}>
                {p.glyph}
              </text>
              <text x={p.x + 34} y={pillY + 20} className={styles.pillText}>
                {p.text}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className={styles.readout}>
        <p className={styles.verdict} data-verdict={outcome.verdict}>
          <span className={styles.badge}>{VERDICT_BADGE[outcome.verdict]}</span>
          <span>{outcome.verdictText}</span>
        </p>
        <p className={styles.live} aria-live="polite">
          {liveSummary}
        </p>
      </div>
    </div>
  )
}
