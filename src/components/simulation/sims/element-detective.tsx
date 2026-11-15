'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Button, Segmented, Toggle } from '@/components/controls'
import { TestTube, FusionTube, type TestTubeProps } from '@/components/organic/lab'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { ExtractDish } from '@/components/animations/unit8/lassaigne/ExtractDish'
import type { SimulationProps } from '@/components/simulation/registry'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  QUALITATIVE_ELEMENTS,
  evidenceFor,
  fuse,
  runTest,
  scoreAnswer,
  unknownCompounds,
  type Fusion,
  type QualitativeElement,
  type TestId,
  type TestOutcome,
  type UnknownCompound,
} from '@/lib/chem/qualitative-analysis'
import styles from './element-detective.module.css'

/** One test run on the bench: its outcome and the conditions it ran under. */
interface RunRecord {
  outcome: TestOutcome
  boiled: boolean
}

interface Bench {
  /** Fusion chosen before the sodium was added; locked once fused. */
  fusion: Fusion
  fused: boolean
  fusedWith: Fusion
  boiled: boolean
  results: Partial<Record<TestId, RunRecord>>
  answer: Set<QualitativeElement>
  checked: boolean
  scored: boolean
}

interface Tally {
  points: number
  possible: number
  rounds: number
}

const FRESH_BENCH: Bench = {
  fusion: 'standard',
  fused: false,
  fusedWith: 'standard',
  boiled: false,
  results: {},
  answer: new Set(),
  checked: false,
  scored: false,
}

const ALL = unknownCompounds()

/** A fixed shuffle of the unknowns (linear congruential generator), so the first unknown is always the same. */
function shuffledOrder(length: number, seed: number): number[] {
  const order = Array.from({ length }, (_, i) => i)
  let s = seed
  for (let i = length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

const ORDER = shuffledOrder(ALL.length, 11)

/** The ions the extract holds, as labels for the dish. */
function ionsOf(extract: ReturnType<typeof fuse>): string[] {
  const ions: string[] = []
  if (extract.cyanide) ions.push('CN⁻')
  if (extract.thiocyanate) ions.push('SCN⁻')
  if (extract.sulphide) ions.push('S²⁻')
  if (extract.halide) ions.push(`${extract.halide}⁻`)
  return ions
}

/** Digits as subscripts in a formula, e.g. C6H5Br → C₆H₅Br. */
function subscripted(formula: string): ReactNode {
  return formula.split(/(\d+)/).map((part, i) => (/^\d+$/.test(part) ? <sub key={i}>{part}</sub> : <span key={i}>{part}</span>))
}

/** Which test shows each element, for the reveal. */
const EVIDENCE: Record<QualitativeElement, string> = {
  C: 'Lime water turns milky when the gas from heating with CuO is passed through it (CO₂).',
  H: 'Anhydrous CuSO₄ turns from white to blue when water from heating with CuO reaches it.',
  N: 'Prussian blue shows cyanide; blood red shows thiocyanate, which also needs N.',
  S: 'Black PbS or violet nitroprusside shows sulphide; blood red also shows thiocyanate.',
  P: 'Peroxide fusion, then HNO₃ and ammonium molybdate, gives a yellow precipitate.',
  Cl: 'After boiling with HNO₃, AgNO₃ gives a white precipitate.',
  Br: 'After boiling with HNO₃, AgNO₃ gives a pale yellow precipitate.',
  I: 'After boiling with HNO₃, AgNO₃ gives a yellow precipitate.',
}

const TEST_NAME: Record<TestId, string> = {
  'lime-water': 'Carbon: lime water',
  'copper-sulphate': 'Hydrogen: anhydrous CuSO₄',
  'prussian-blue': 'Nitrogen: Prussian blue',
  'lead-acetate': 'Sulphur: lead acetate',
  nitroprusside: 'Sulphur: sodium nitroprusside',
  'blood-red': 'Nitrogen and sulphur: blood red',
  'silver-nitrate': 'Halogen: silver nitrate',
  phosphorus: 'Phosphorus: molybdate',
}

const TEST_REAGENT: Record<TestId, string> = {
  'lime-water': 'Heat the compound with CuO and pass the gas into lime water.',
  'copper-sulphate': 'Heat with CuO; anhydrous CuSO₄ catches the water.',
  'prussian-blue': 'Extract: boil with FeSO₄, then add conc. H₂SO₄.',
  'lead-acetate': 'Extract: acidify with acetic acid, then add lead acetate.',
  nitroprusside: 'Extract: add sodium nitroprusside.',
  'blood-red': 'Extract: add a Fe³⁺ solution.',
  'silver-nitrate': 'Extract: acidify with dilute HNO₃, then add AgNO₃. If N or S may be present, boil with conc. HNO₃ first.',
  phosphorus: 'Heat with Na₂O₂, boil with HNO₃, then add ammonium molybdate.',
}

const DRY_TESTS: readonly TestId[] = ['lime-water', 'copper-sulphate']
/** Tests that do not use the sodium fusion extract: they survive a clear of the extract. */
const BENCH_TESTS: readonly TestId[] = ['lime-water', 'copper-sulphate', 'phosphorus']

/** Why a result came out as it did, from the fusion and the elements. Shown under each test. */
function explain(test: TestId, record: RunRecord, el: ReadonlySet<QualitativeElement>, fusedWith: Fusion): string {
  const { outcome, boiled } = record
  switch (test) {
    case 'lime-water':
      return outcome.positive ? 'Carbon burns to CO₂, which turns lime water milky: CO₂ + Ca(OH)₂ → CaCO₃↓ + H₂O.' : 'No carbon, so no CO₂ and the lime water stays clear.'
    case 'copper-sulphate':
      return outcome.positive ? 'Hydrogen burns to water, and CuSO₄ turns blue: CuSO₄ + 5H₂O → CuSO₄·5H₂O.' : 'No hydrogen, so no water: the CuSO₄ stays white.'
    case 'prussian-blue':
      if (outcome.positive) return 'Free CN⁻ forms [Fe(CN)₆]⁴⁻, which with Fe³⁺ gives Prussian blue, Fe₄[Fe(CN)₆]₃.'
      if (el.has('N') && el.has('S') && fusedWith === 'standard')
        return 'With N and S together, the fusion makes NaSCN. There is no free cyanide, so no Prussian blue. Look for blood red instead.'
      return 'No nitrogen in the compound, so no cyanide and no blue.'
    case 'lead-acetate':
    case 'nitroprusside':
      if (outcome.positive) return 'Free S²⁻ from the fusion: black PbS with lead acetate, violet with nitroprusside.'
      if (el.has('S') && el.has('N') && fusedWith === 'standard')
        return 'With N and S in an ordinary fusion, the sulphur is thiocyanate, not sulphide. Only excess sodium frees S²⁻.'
      return 'No sulphur in the compound, so no sulphide.'
    case 'blood-red':
      if (outcome.positive) return 'NaSCN gives thiocyanate, and Fe³⁺ + SCN⁻ → [Fe(SCN)]²⁺, blood red. It needs both N and S.'
      if (fusedWith === 'excess' && el.has('N') && el.has('S'))
        return 'Excess sodium broke the thiocyanate down to CN⁻ and S²⁻, so there is no blood red.'
      return 'Blood red needs both N and S in the same compound.'
    case 'silver-nitrate':
      if (outcome.masked)
        return 'Not boiled: AgCN (white), AgSCN (white) or Ag₂S (black) would also precipitate and hide the halide colour. Boil with HNO₃ first.'
      if (!outcome.positive) return 'No halogen, so no silver halide.'
      if (!boiled) return 'The colour is clear, as no CN⁻ or S²⁻ was in the way.'
      return outcome.halide === 'Cl'
        ? 'AgCl is white and dissolves in ammonium hydroxide.'
        : outcome.halide === 'Br'
          ? 'AgBr is pale yellow and sparingly soluble in ammonium hydroxide.'
          : 'AgI is yellow and insoluble in ammonium hydroxide.'
    case 'phosphorus':
      return outcome.positive ? 'Phosphate forms the yellow ammonium phosphomolybdate precipitate.' : 'No phosphorus, so no yellow precipitate.'
  }
}

/** The tube drawn for a test result. Colours are the lab tokens. */
function tubeFor(test: TestId, record: RunRecord): Partial<TestTubeProps> {
  const { outcome } = record
  if (test === 'silver-nitrate') {
    if (outcome.masked) return { liquid: 'var(--liquid)', precipitate: { color: 'var(--fg-subtle)', amount: 0.5 } }
    if (!outcome.positive) return { liquid: 'var(--liquid)' }
    const halide = outcome.halide === 'Cl' ? { color: 'var(--agcl-white)', outline: true } : outcome.halide === 'Br' ? { color: 'var(--agbr-pale-yellow)', outline: true } : { color: 'var(--agi-yellow)' }
    return { liquid: 'var(--liquid)', precipitate: { ...halide, amount: 0.6 } }
  }
  if (test === 'lead-acetate') {
    return outcome.positive ? { liquid: 'var(--liquid)', precipitate: { color: 'var(--pbs-black)', amount: 0.6 } } : { liquid: 'var(--liquid)' }
  }
  if (test === 'copper-sulphate') {
    return { liquid: outcome.positive ? 'var(--cuso4-blue)' : 'var(--agcl-white)', liquidLevel: 0.5 }
  }
  if (test === 'lime-water') {
    return { liquid: outcome.positive ? 'var(--limewater-milky)' : 'var(--liquid)' }
  }
  const colour: Record<'prussian-blue' | 'nitroprusside' | 'blood-red' | 'phosphorus', string> = {
    'prussian-blue': 'var(--prussian-blue)',
    nitroprusside: 'var(--nitroprusside-violet)',
    'blood-red': 'var(--blood-red)',
    phosphorus: 'var(--phosphomolybdate-yellow)',
  }
  const key = test as keyof typeof colour
  return { liquid: outcome.positive ? colour[key] : 'var(--liquid)', liquidLevel: 0.7 }
}

/** A result tube that settles its solid as it appears (cut under reduced motion). */
function ResultTube({ tube, reducedMotion }: { tube: Partial<TestTubeProps>; reducedMotion: boolean }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true))
    return () => cancelAnimationFrame(frame)
  }, [])
  const progress = useTweenedNumber(shown ? 1 : 0, reducedMotion, 0.9)
  return (
    <svg viewBox="0 0 28 150" className={styles.tubeSvg} aria-hidden="true">
      <TestTube x={14} y={0} progress={progress} {...tube} />
    </svg>
  )
}

/**
 * The element detective: an unknown organic compound, the tests the learner chooses to run in any
 * order, and the elements the learner names. Results come from the compound's own atoms.
 */
export function ElementDetective({ reducedMotion }: SimulationProps) {
  const [round, setRound] = useState(0)
  const [bench, setBench] = useState<Bench>(FRESH_BENCH)
  const [tally, setTally] = useState<Tally>({ points: 0, possible: 0, rounds: 0 })

  const unknown: UnknownCompound = ALL[ORDER[round % ALL.length]]
  const elements = useMemo(() => new Set(unknown.elements), [unknown])
  const truthFormula = useMemo(() => molecularFormula(parseSmiles(unknown.smiles)), [unknown])
  const extract = fuse(elements, bench.fused ? bench.fusedWith : bench.fusion)
  const evidence = evidenceFor(
    Object.fromEntries(Object.entries(bench.results).map(([k, v]) => [k, v?.outcome])) as Partial<Record<TestId, TestOutcome>>
  )
  const score = scoreAnswer(elements, bench.answer)

  const update = (patch: Partial<Bench>) => setBench((b) => ({ ...b, ...patch }))

  const runOne = (test: TestId) => {
    const boiledNow = bench.boiled
    const outcome = runTest(test, elements, fuse(elements, bench.fusedWith), boiledNow)
    setBench((b) => ({ ...b, results: { ...b.results, [test]: { outcome, boiled: boiledNow } } }))
  }

  const check = () => {
    if (bench.scored) {
      update({ checked: true })
      return
    }
    setTally((t) => ({ points: t.points + score.correct, possible: t.possible + score.total, rounds: t.rounds + 1 }))
    update({ checked: true, scored: true })
  }

  const nextUnknown = () => {
    setRound((r) => r + 1)
    setBench(FRESH_BENCH)
  }

  const runsSoFar = Object.keys(bench.results).length
  const summary: ReactNode = bench.checked
    ? (
        <>
          Answer checked: {score.correct} of {score.total} elements right. The compound is <strong>{subscripted(truthFormula)}</strong>.
        </>
      )
    : bench.fused
      ? `Sodium fusion done. ${runsSoFar} test${runsSoFar === 1 ? '' : 's'} run. Tick the elements you think are present, then check.`
      : 'No sodium fusion yet. The carbon, hydrogen and phosphorus tests do not need it.'

  const renderRecordTube = (test: TestId) => {
    const record = bench.results[test]
    if (!record) return null
    return <ResultTube key={`${test}-${round}`} tube={tubeFor(test, record)} reducedMotion={reducedMotion} />
  }

  const testRow = (test: TestId, disabled: boolean, extra?: ReactNode) => {
    const record = bench.results[test]
    return (
      <li key={test} className={styles.testRow} data-testid={`test-${test}`}>
        <div className={styles.testText}>
          <p className={styles.testName}>{TEST_NAME[test]}</p>
          <p className={styles.reagent}>{TEST_REAGENT[test]}</p>
          {extra}
          <div className={styles.result} aria-live="polite">
            {record ? (
              <>
                <strong data-testid={`result-${test}`}>{resultLabel(test, record.outcome)}</strong>
                <span className={styles.reason}>{explain(test, record, elements, bench.fused ? bench.fusedWith : bench.fusion)}</span>
              </>
            ) : (
              <span className={styles.notRun}>Not run yet</span>
            )}
          </div>
        </div>
        <div className={styles.testSide}>
          {renderRecordTube(test)}
          <Button variant="secondary" disabled={disabled} onClick={() => runOne(test)}>
            {record ? 'Run again' : 'Run test'}
          </Button>
        </div>
      </li>
    )
  }

  return (
    <div className={styles.sim} data-testid="element-detective">
      <div className={styles.header}>
        <div>
          <p className={styles.kicker}>Unknown {round + 1}</p>
          <p className={styles.caption}>
            {tally.rounds === 0
              ? 'No answers checked yet.'
              : `${tally.points} of ${tally.possible} correct calls on ${tally.rounds} ${tally.rounds === 1 ? 'unknown' : 'unknowns'}.`}
          </p>
        </div>
        <Button variant="secondary" onClick={nextUnknown}>
          Next unknown
        </Button>
      </div>

      <div className={styles.layout}>
        <div className={styles.bench}>
          <h3 className={styles.h3}>Sodium fusion</h3>
          <svg viewBox="0 0 340 300" role="img" aria-label={bench.fused ? 'Fusion extract ready for testing' : 'Ignition tube with the compound and sodium'} className={styles.fusion}>
            {bench.fused ? <ExtractDish ions={ionsOf(extract)} /> : <FusionTube stage="sample" />}
          </svg>
          {bench.fused ? (
            <p className={styles.note}>Fused with {bench.fusedWith === 'excess' ? 'excess sodium' : 'the ordinary amount of sodium'}.</p>
          ) : (
            <>
              <Segmented<Fusion>
                label="Sodium used"
                value={bench.fusion}
                onChange={(v) => update({ fusion: v })}
                options={[
                  { value: 'standard', label: 'Ordinary amount' },
                  { value: 'excess', label: 'Excess sodium' },
                ]}
                className={styles.segmented}
              />
              <p className={styles.note}>
                {bench.fusion === 'excess'
                  ? 'Excess sodium turns any thiocyanate into cyanide and sulphide.'
                  : 'Ordinary sodium: N and S together leave thiocyanate behind.'}
              </p>
            </>
          )}
          <Button disabled={bench.fused} onClick={() => update({ fused: true, fusedWith: bench.fusion })}>
            {bench.fused ? 'Fused and filtered' : 'Fuse, quench and filter'}
          </Button>
          <Button
            variant="secondary"
            disabled={!bench.fused || bench.checked}
            onClick={() =>
              update({
                fused: false,
                results: Object.fromEntries(Object.entries(bench.results).filter(([k]) => BENCH_TESTS.includes(k as TestId))),
              })
            }
          >
            Clear the extract
          </Button>

          <h3 className={styles.h3}>Dry tests on the compound</h3>
          <ul className={styles.list}>{DRY_TESTS.map((t) => testRow(t, false))}</ul>
        </div>

        <div className={styles.tests}>
          <h3 className={styles.h3}>Tests on the extract</h3>
          <ul className={styles.list}>
            {testRow('prussian-blue', !bench.fused)}
            {testRow('lead-acetate', !bench.fused)}
            {testRow('nitroprusside', !bench.fused)}
            {testRow('blood-red', !bench.fused)}
            {testRow(
              'silver-nitrate',
              !bench.fused,
              <Toggle label="Boil with conc. HNO₃ first" checked={bench.boiled} onChange={(v) => update({ boiled: v })} />
            )}
          </ul>
          <h3 className={styles.h3}>Phosphorus</h3>
          <ul className={styles.list}>{testRow('phosphorus', false)}</ul>
        </div>
      </div>

      <div className={styles.answer}>
        <h3 className={styles.h3}>Which elements are present?</h3>
        <div className={styles.toggles} role="group" aria-label="Elements present">
          {QUALITATIVE_ELEMENTS.map((el) => (
            <Toggle
              key={el}
              label={el}
              checked={bench.answer.has(el)}
              disabled={bench.checked}
              onChange={(v) => {
                const next = new Set(bench.answer)
                if (v) next.add(el)
                else next.delete(el)
                update({ answer: next })
              }}
            />
          ))}
        </div>
        <div className={styles.actions}>
          <Button onClick={check} disabled={bench.checked}>
            Check my answer
          </Button>
          {bench.checked && (
            <Button variant="secondary" onClick={() => update({ checked: false })}>
              Change my answer
            </Button>
          )}
        </div>
        <p className={styles.summary} aria-live="polite" data-testid="detective-summary">
          {summary}
        </p>

        {bench.checked && (
          <ul className={styles.reveal} data-testid="reveal">
            <li className={styles.revealHead}>
              The compound: <strong>{subscripted(truthFormula)}</strong>
            </li>
            {QUALITATIVE_ELEMENTS.map((el) => {
              const present = elements.has(el)
              const right = present === bench.answer.has(el)
              return (
                <li key={el} className={right ? styles.right : styles.wrong}>
                  <strong>{el}</strong> — {present ? 'present' : 'absent'}. You said {bench.answer.has(el) ? 'present' : 'absent'}. {right ? '✓' : '✗'}{' '}
                  <span className={styles.reason}>
                    {present ? EVIDENCE[el] : 'No test for this element came out positive.'}
                    {present && !evidence.has(el) ? ' You did not run the test that shows it.' : ''}
                  </span>
                </li>
              )
            })}
            <li className={styles.note}>Oxygen is not tested here. It is found by difference, in Section 8.10.</li>
          </ul>
        )}
      </div>
    </div>
  )
}

/** The short result label shown in bold for a test. */
function resultLabel(test: TestId, outcome: TestOutcome): string {
  if (outcome.masked) return 'Unreadable'
  if (test === 'silver-nitrate' && outcome.positive && outcome.halide) return `${outcome.halide} present`
  if (test === 'lime-water') return outcome.positive ? 'Milky' : 'Clear'
  if (test === 'copper-sulphate') return outcome.positive ? 'Blue' : 'No change'
  if (test === 'prussian-blue') return outcome.positive ? 'Prussian blue' : 'No blue'
  if (test === 'lead-acetate') return outcome.positive ? 'Black PbS' : 'No black'
  if (test === 'nitroprusside') return outcome.positive ? 'Violet' : 'No violet'
  if (test === 'blood-red') return outcome.positive ? 'Blood red' : 'No blood red'
  if (test === 'phosphorus') return outcome.positive ? 'Yellow' : 'No yellow'
  return outcome.positive ? 'Positive' : 'Negative'
}
