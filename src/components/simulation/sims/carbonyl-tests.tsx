'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  COMPOUNDS,
  TESTS,
  compoundName,
  compoundSmiles,
  reducedTestResult,
  reductionProduct,
  type CompoundId,
  type Outcome,
  type ReductionId,
  type TestId,
} from '@/lib/chem/carbonyl-tests'
import styles from './carbonyl-tests.module.css'

const REDUCTIONS: readonly { id: ReductionId; label: string; reagent: string }[] = [
  { id: 'none', label: 'No reductant', reagent: '' },
  { id: 'hydride', label: 'NaBH₄ or LiAlH₄', reagent: 'NaBH₄ or LiAlH₄' },
  { id: 'hydrocarbon', label: 'Clemmensen or Wolff–Kishner', reagent: 'Clemmensen or Wolff–Kishner' },
]

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d])

const COMPOUND_LABEL: Record<CompoundId, string> = {
  butanal: 'Aliphatic aldehyde',
  benzaldehyde: 'Aromatic aldehyde',
  'pentan-3-one': 'Ketone',
  'butan-2-one': 'Methyl ketone',
  'propan-2-ol': 'Alcohol (CH₃CH(OH) group)',
}

const SHORT_RESULT: Record<Outcome, string> = {
  mirror: 'mirror',
  'red-precipitate': 'red-brown',
  'yellow-precipitate': 'yellow',
  'no-change': 'no change',
}

function outcomeSentence(outcome: Outcome, test: TestId): string {
  switch (outcome) {
    case 'mirror':
      return "A silver mirror forms on the glass wall. The silver ions are reduced to metal, and the aldehyde is oxidised."
    case 'red-precipitate':
      return "A reddish-brown precipitate forms when the solution is heated."
    case 'yellow-precipitate':
      return "A yellow precipitate of iodoform, CHI₃, falls out of the solution."
    case 'no-change':
      return test === 'fehling'
        ? "No change: this compound does not respond to Fehling's solution."
        : "No change: this compound does not give this test."
  }
}

/** Glass tube at horizontal centre cx, with a liquid level and the test result drawn in it. */
function Tube({ cx, test, outcome, selected }: { cx: number; test: TestId; outcome: Outcome; selected: boolean }) {
  const blue = test === 'fehling'
  return (
    <g data-testid={`tube-${test}`} data-outcome={outcome}>
      {selected ? <rect x={cx - 38} y={96} width={76} height={296} rx={16} className={styles.selectedRack} /> : null}
      <path d={`M${cx - 24} 120 V348 A24 24 0 0 0 ${cx + 24} 348 V120`} fill="var(--surface)" stroke="var(--fg-subtle)" strokeWidth={2} />
      <path
        d={`M${cx - 22} 232 V348 A22 22 0 0 0 ${cx + 22} 348 V232 Z`}
        className={blue ? styles.blueLiquid : styles.clearLiquid}
      />
      {outcome === 'mirror' ? (
        <path d={`M${cx - 21} 240 V348 A21 21 0 0 0 ${cx + 21} 348 V240`} fill="none" stroke="var(--neutron)" strokeWidth={5} strokeLinecap="round" />
      ) : null}
      {outcome === 'red-precipitate'
        ? [[-10, 354], [-2, 359], [6, 355], [12, 360], [-5, 364], [3, 366]].map(([dx, y]) => (
            <circle key={`${dx}-${y}`} cx={cx + dx} cy={y} r={2.8} fill="var(--el-Br)" />
          ))
        : null}
      {outcome === 'yellow-precipitate'
        ? [[-10, 356], [-1, 362], [8, 357], [4, 366], [-6, 365]].map(([dx, y]) => (
            <rect key={`${dx}-${y}`} x={cx + dx - 2.5} y={y - 2.5} width={5} height={5} fill="var(--el-S)" transform={`rotate(45 ${cx + dx} ${y})`} />
          ))
        : null}
      <rect x={cx - 30} y={112} width={60} height={8} rx={3} fill="var(--fg-subtle)" />
      <text x={cx} y={410} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {TESTS.find((t) => t.id === test)?.label}
      </text>
      <text x={cx} y={434} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
        {SHORT_RESULT[outcome]}
      </text>
    </g>
  )
}

export function CarbonylTests() {
  const [compound, setCompound] = useState<CompoundId>('butanal')
  const [test, setTest] = useState<TestId>('tollens')
  const [reduction, setReduction] = useState<ReductionId>('none')

  const smiles = compoundSmiles(compound)
  const graph = useMemo(() => parseSmiles(smiles), [smiles])
  const name = compoundName(compound)
  const formula = subscript(molecularFormula(graph))
  const results = TESTS.map((t) => ({ id: t.id, ...reducedTestResult(compound, reduction, t.id) }))
  const active = results.find((r) => r.id === test)!
  const reduced = reductionProduct(compound, reduction)
  const reducedGraph = useMemo(() => (reduced ? parseSmiles(reduced.smiles) : null), [reduced])
  const reagent = REDUCTIONS.find((r) => r.id === reduction)?.reagent ?? ''

  const testLabel = TESTS.find((t) => t.id === test)?.label ?? ''
  const productLine = active.productLabel ? `Product: ${active.productLabel}.` : 'No product to name.'
  const reductionLine = reduction === 'none'
    ? ''
    : reduced
      ? `Reduced with ${reagent}: ${reduced.name}.`
      : `${reagent} has no carbonyl group to reduce, so ${name} is unchanged.`
  const live = `${name}, ${testLabel}: ${outcomeSentence(active.outcome, test)} ${productLine} ${reductionLine}`.trim()

  return (
    <div className={styles.root} data-testid="carbonyl-tests">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 560 480" role="img" aria-label={live} className={styles.drawing} data-testid="carbonyl-drawing">
            <text x={24} y={36} fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {name}
            </text>
            <text x={24} y={60} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              {`${COMPOUND_LABEL[compound]}, ${formula}`}
            </text>
            <SkeletalFormula graph={graph} scale={40} x={130} y={150} />
            {reduced && reducedGraph ? (
              <g>
                <line x1={130} y1={222} x2={130} y2={262} stroke="var(--fg-muted)" strokeWidth={2} />
                <path d="M124 256 L130 268 L136 256 Z" fill="var(--fg-muted)" />
                <text x={146} y={248} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                  {reagent}
                </text>
                <SkeletalFormula graph={reducedGraph} scale={40} x={130} y={340} />
                <text x={24} y={420} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg)">
                  {`Product: ${reduced.name}`}
                </text>
              </g>
            ) : reduction !== 'none' ? (
              <text x={24} y={262} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                No carbonyl group to reduce.
              </text>
            ) : null}
            {TESTS.map((t, i) => (
              <Tube
                key={t.id}
                cx={320 + i * 100}
                test={t.id}
                outcome={results[i].outcome}
                selected={t.id === test}
              />
            ))}
          </svg>
          <figcaption className={styles.caption}>
            {name}, {formula}. Tube results for the three tests on the same compound.
            <br />
            {`Tests run on: ${reduced ? reduced.name : name}.`}
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading} data-testid="carbonyl-heading">
            {name}
          </p>
          <p className={styles.verdict}>{outcomeSentence(active.outcome, test)}</p>
          <p className={styles.summary}>{productLine}</p>
          {reductionLine ? <p className={styles.summary}>{reductionLine}</p> : null}
          <p className={styles.srOnly} aria-live="polite" data-testid="carbonyl-live">
            {live}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="Compound">
            {COMPOUNDS.map((c) => (
              <Button
                key={c.id}
                variant="secondary"
                aria-pressed={c.id === compound}
                className={c.id === compound ? styles.pressed : undefined}
                onClick={() => setCompound(c.id)}
              >
                {compoundName(c.id)}
              </Button>
            ))}
          </div>
          <div className={styles.group} role="group" aria-label="Test">
            {TESTS.map((t) => (
              <Button
                key={t.id}
                variant="secondary"
                aria-pressed={t.id === test}
                className={t.id === test ? styles.pressed : undefined}
                onClick={() => setTest(t.id)}
              >
                {t.label}
              </Button>
            ))}
          </div>
          <div className={styles.group} role="group" aria-label="Reducing agent">
            {REDUCTIONS.map((r) => (
              <Button
                key={r.id}
                variant="secondary"
                aria-pressed={r.id === reduction}
                className={r.id === reduction ? styles.pressed : undefined}
                onClick={() => setReduction(r.id)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
