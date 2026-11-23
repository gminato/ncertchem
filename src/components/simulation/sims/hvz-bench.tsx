'use client'

import { useMemo, useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  BENCH_ACIDS,
  BENZOIC_META_ATOMS,
  benchAcid,
  benchOutcome,
  maxHvzSteps,
  type BenchHalogen,
  type BenchReaction,
} from '@/lib/chem/hvz-bench'
import styles from './hvz-bench.module.css'

const REACTIONS: readonly { value: BenchReaction; label: string }[] = [
  { value: 'hvz', label: 'Halogenation' },
  { value: 'nitration', label: 'Nitration' },
  { value: 'friedel-crafts', label: 'Friedel–Crafts' },
]

const HALOGENS: readonly { value: BenchHalogen; label: string }[] = [
  { value: 'Cl', label: 'Cl₂' },
  { value: 'Br', label: 'Br₂' },
]

const REAGENT: Record<BenchReaction, (h: BenchHalogen) => string> = {
  hvz: (h) => `${h}₂, red P`,
  nitration: () => 'HNO₃, H₂SO₄',
  'friedel-crafts': () => 'CH₃Cl, AlCl₃',
}

const SCALE = 40
const CX = 280
const Y_ACID = 112
const Y_PRODUCT = 318

/** Splits a sentence into lines of at most `max` characters, at word breaks. */
function wrap(text: string, max = 58): string[] {
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

export function HvzBench() {
  const [acidId, setAcidId] = useState('butanoic')
  const [reaction, setReaction] = useState<BenchReaction>('hvz')
  const [halogen, setHalogen] = useState<BenchHalogen>('Br')
  const [steps, setSteps] = useState(1)

  const acid = benchAcid(acidId)
  const maxSteps = maxHvzSteps(acid)
  const n = Math.min(steps, maxSteps)
  const outcome = benchOutcome(acid, reaction, halogen, n)

  const acidGraph = useMemo(() => parseSmiles(acid.smiles), [acid.smiles])
  const productGraph = useMemo(
    () => (outcome.productSmiles ? parseSmiles(outcome.productSmiles) : null),
    [outcome.productSmiles],
  )
  const acidName = unit8Name(acid.smiles)
  const productName = outcome.productSmiles ? unit8Name(outcome.productSmiles) : null

  const highlight =
    reaction === 'hvz' && acid.alphaIndex !== null
      ? [acid.alphaIndex]
      : reaction === 'nitration' && acid.ring
        ? BENZOIC_META_ATOMS
        : []

  const caption = productName ? `Product: ${productName}` : 'No product'
  const reasonLines = wrap(outcome.reason).slice(0, 3)
  const summary = productName ? `${productName}. ${outcome.reason}` : outcome.reason

  return (
    <div className={styles.root} data-testid="hvz-bench">
      <figure className={styles.stage}>
        <svg viewBox="0 0 560 500" role="img" aria-label={`${acidName} with ${REAGENT[reaction](halogen)}. ${summary}`} className={styles.drawing}>
          <text x={16} y={26} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {`Starting acid: ${acidName}`}
          </text>
          <SkeletalFormula graph={acidGraph} scale={SCALE} x={CX} y={Y_ACID} highlightAtoms={highlight} />

          <line x1={CX} y1={186} x2={CX} y2={236} stroke="var(--fg-muted)" strokeWidth={2.2} />
          <polygon points={`${CX - 7},230 ${CX + 7},230 ${CX},242`} fill="var(--fg-muted)" />
          <text x={CX + 20} y={216} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
            {REAGENT[reaction](halogen)}
          </text>
          {!outcome.productSmiles && (
            <g stroke="var(--fg-muted)" strokeWidth={2.4} strokeLinecap="round">
              <line x1={CX - 11} y1={200} x2={CX + 11} y2={224} />
              <line x1={CX + 11} y1={200} x2={CX - 11} y2={224} />
            </g>
          )}

          {productGraph && <SkeletalFormula graph={productGraph} scale={SCALE} x={CX} y={Y_PRODUCT} />}

          <text x={CX} y={412} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {caption}
          </text>
          {reasonLines.map((line, i) => (
            <text key={line} x={CX} y={440 + i * 22} textAnchor="middle" fontSize={15} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {line}
            </text>
          ))}
        </svg>
      </figure>

      <SimulationControls>
        <div className={styles.controls}>
          <label className={styles.field}>
            <span>Acid</span>
            <select className={styles.select} value={acidId} onChange={(e) => setAcidId(e.target.value)}>
              {BENCH_ACIDS.map((a) => (
                <option key={a.id} value={a.id}>
                  {unit8Name(a.smiles)}
                </option>
              ))}
            </select>
          </label>
          <Segmented<BenchReaction> label="Reaction" options={REACTIONS} value={reaction} onChange={setReaction} />
          {reaction === 'hvz' && (
            <>
              <Segmented<BenchHalogen> label="Halogen" options={HALOGENS} value={halogen} onChange={setHalogen} />
              <Slider label="HVZ steps" value={n} min={1} max={maxSteps} step={1} onChange={setSteps} disabled={maxSteps === 1} />
            </>
          )}
        </div>
        <p className={styles.summary} aria-live="polite">
          {summary}
        </p>
      </SimulationControls>
    </div>
  )
}
