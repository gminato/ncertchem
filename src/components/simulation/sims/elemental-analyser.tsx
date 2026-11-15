'use client'

import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, NumberField, Slider, Toggle } from '@/components/controls'
import { CariusTube, CombustionTrain, DumasApparatus, KjeldahlSetup } from '@/components/organic/lab'
import { useIsActive } from '@/components/simulation/useIsActive'
import type { SimulationProps } from '@/components/simulation/registry'
import { buildEmpiricalPipeline } from '@/lib/chem/empirical-pipeline'
import { formatFormula, molarMassOfCounts, molecularFormula as formulaOfCounts } from '@/lib/chem/formula'
import {
  ANALYSIS_CONDITIONS,
  carbonFromReadings,
  combustionReadings,
  compositionOf,
  dumasReadings,
  elementalSamples,
  empiricalFromPercentages,
  hydrogenFromReadings,
  kjeldahlApplicabilityOf,
  kjeldahlReadings,
  multiplierN,
  nitrogenDumasFromReadings,
  nitrogenKjeldahlFromReadings,
  oxygenByDifference,
  percentFromPrecipitate,
  precipitateReading,
  sampleFromSmiles,
  type CombustionReadings,
  type Composition,
  type DumasReadings,
  type ElementalSample,
  type KjeldahlReadings,
  type PrecipitateReading,
} from '@/lib/chem/elemental-analysis'
import styles from './elemental-analyser.module.css'

/** Duration of one analysis run, ms. */
const RUN_MS = 1400
/** Measurement error when it is switched on: ±0.5 % on each reading. */
const ERROR_FRACTION = 0.005
/** A learner's percentage is accepted within this many percentage points of the value from the readings. */
const TOLERANCE = 0.1
/** Nitrometer scale for the drawing, mL. */
const NITROMETER_ML = 50
/** At least 0.2 g keeps the Kjeldahl back-titre inside the 25 mL burette. */
const MASS_RANGE = { min: 0.2, max: 0.3 }
const HALOGENS = ['Cl', 'Br', 'I'] as const

type Method = 'dumas' | 'kjeldahl'
type PhosphorusMethod = 'molybdate' | 'pyrophosphate'
type Tab = 'CH' | 'N' | 'X' | 'S' | 'P' | 'O'

/** Everything the apparatus showed on the last run, with the method and mass used. */
interface RunData {
  sampleId: string
  mass: number
  nMethod: Method
  pMethod: PhosphorusMethod
  combustion: CombustionReadings
  dumas: DumasReadings
  kjeldahl: KjeldahlReadings
  precipitate: PrecipitateReading | null
}

/** The lab measures a value as v × (1 + u × ERROR_FRACTION), with u in [−1, 1], when the error is on. */
const measurer = (u: number) => (v: number) => v * (1 + u * ERROR_FRACTION)

/** Tab label for each analysis. Symbols are KaTeX-italic in the UI, percentages upright. */
function pctText(symbol: string): string {
  return `% ${symbol}`
}

/** Halogen present in a composition, if any. */
function halogenOf(comp: Composition): string | null {
  return HALOGENS.find((h) => comp.percent[h] !== undefined) ?? null
}

/** Name of the precipitate for the Carius analysis, as written in the lab. */
function precipitateName(kind: PrecipitateReading['kind'], element: string): string {
  if (kind === 'halogen') return `Ag${element}`
  if (kind === 'sulphur') return 'BaSO₄'
  if (kind === 'phosphorus-molybdate') return 'phosphomolybdate'
  return 'Mg₂P₂O₇'
}

/** Colour of the precipitate in the Carius tube. */
function precipitateColour(kind: PrecipitateReading['kind'], element: string): string {
  if (kind === 'halogen') {
    if (element === 'Br') return 'var(--agbr-pale-yellow)'
    if (element === 'I') return 'var(--agi-yellow)'
    return 'var(--agcl-white)'
  }
  if (kind === 'sulphur') return 'var(--precipitate)'
  return 'var(--phosphomolybdate-yellow)'
}

/** Symbols in the readouts are KaTeX-italic. */
function Sym({ children }: { children: ReactNode }) {
  return <span className="sym">{children}</span>
}

/** Random measurement offsets in [−1, 1], one per reading, when the error is switched on. */
function randomNoise(enabled: boolean): number[] {
  if (!enabled) return [0, 0, 0]
  return [Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1]
}

/**
 * The empirical formula from the learner's percentages, with oxygen by difference when the
 * compound has oxygen. Returns null when the percentages are not all positive (no JSX here).
 */
function learnerEmpirical(entered: string[], entries: Record<string, number>, hasO: boolean, molarMass: number, formula: string) {
  try {
    const others: Record<string, number> = {}
    for (const s of entered) others[s] = entries[s]
    const percent: Record<string, number> = { ...others }
    if (hasO) percent.O = oxygenByDifference(others)
    const e = empiricalFromPercentages(percent)
    const truth = buildEmpiricalPipeline(formula)
    return {
      rows: e.rows,
      label: e.label,
      empiricalMass: molarMassOfCounts(e.counts),
      n: multiplierN(molarMass, e.counts),
      molecular: formatFormula(formulaOfCounts(e.counts, molarMass)),
      truthLabel: truth.empiricalLabel,
      matches: e.label === truth.empiricalLabel,
    }
  } catch {
    return null
  }
}

/**
 * The Elemental analyser: choose a sample and the methods, run the apparatus, then work each
 * percentage from the readings with the NCERT formulas. The true composition sets the readings;
 * the learner's percentages set the empirical formula.
 */
export function ElementalAnalyser({ reducedMotion }: SimulationProps) {
  const samples = useMemo(() => elementalSamples(), [])
  const [sampleId, setSampleId] = useState<string>(samples[0].id)
  const [customSmiles, setCustomSmiles] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [customSample, setCustomSample] = useState<ElementalSample | null>(null)
  const [mass, setMass] = useState(0.25)
  const [nMethod, setNMethod] = useState<Method>('dumas')
  const [pMethod, setPMethod] = useState<PhosphorusMethod>('molybdate')
  const [errorOn, setErrorOn] = useState(false)
  const [tab, setTab] = useState<Tab | null>(null)
  const [data, setData] = useState<RunData | null>(null)
  const [progress, setProgress] = useState(0)
  const [runToken, setRunToken] = useState(0)
  const [entries, setEntries] = useState<Record<string, number>>({})

  const rootRef = useRef<HTMLDivElement>(null)
  const active = useIsActive(rootRef)
  const activeRef = useRef(active)
  useEffect(() => {
    activeRef.current = active
  }, [active])

  // The run sweeps the apparatus from 0 to 1. The loop stops when the Simulation scrolls away.
  useEffect(() => {
    if (runToken === 0 || reducedMotion) return
    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      if (!activeRef.current) {
        setProgress(1)
        return
      }
      const f = Math.min(1, (now - start) / RUN_MS)
      setProgress(f < 1 ? 0.5 - 0.5 * Math.cos(Math.PI * f) : 1)
      if (f < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [runToken, reducedMotion])

  const sample: ElementalSample | null = useMemo(() => {
    if (sampleId === 'custom') return customSample
    return samples.find((s) => s.id === sampleId) ?? null
  }, [sampleId, customSample, samples])

  const comp = useMemo(() => (sample ? compositionOf(sample.formula) : null), [sample])
  const applicability = useMemo(() => {
    if (!sample) return { applicable: true, reasons: [] as string[] }
    return sample.smiles ? kjeldahlApplicabilityOf(sample.smiles) : { applicable: true, reasons: [] as string[] }
  }, [sample])

  if (!sample || !comp) {
    return <p className={styles.note}>Enter a valid structure to begin.</p>
  }

  const hasN = comp.percent.N !== undefined
  const halogen = halogenOf(comp)
  const hasS = comp.percent.S !== undefined
  const hasP = comp.percent.P !== undefined
  const hasO = comp.percent.O !== undefined
  const kjeldahlOk = applicability.applicable
  const effectiveNMethod: Method = kjeldahlOk ? nMethod : 'dumas'

  const tabs: { key: Tab; label: string }[] = [{ key: 'CH', label: 'C and H' }]
  if (hasN) tabs.push({ key: 'N', label: 'Nitrogen' })
  if (halogen) tabs.push({ key: 'X', label: `Halogen (${halogen})` })
  if (hasS) tabs.push({ key: 'S', label: 'Sulphur' })
  if (hasP) tabs.push({ key: 'P', label: 'Phosphorus' })
  if (hasO) tabs.push({ key: 'O', label: 'Oxygen' })
  const activeTab: Tab = tab && tabs.some((t) => t.key === tab) ? tab : 'CH'

  const current = data !== null && data.sampleId === sample.id && data.mass === mass && data.nMethod === effectiveNMethod && data.pMethod === pMethod ? data : null

  /** The percentage an element's analysis gives from the readings, or null before a run. */
  const expected = (key: string): number | null => {
    if (!current) return null
    if (key === 'C') return carbonFromReadings(current.combustion)
    if (key === 'H') return hydrogenFromReadings(current.combustion)
    if (key === 'N') {
      return current.nMethod === 'dumas' ? nitrogenDumasFromReadings(current.dumas) : nitrogenKjeldahlFromReadings(current.kjeldahl)
    }
    if (current.precipitate && current.precipitate.element === key) return percentFromPrecipitate(current.precipitate)
    return null
  }

  /** Elements whose percentage the learner enters (oxygen is found by difference). */
  const entered = Object.keys(comp.percent).filter((s) => s !== 'O')

  const run = () => {
    const u = randomNoise(errorOn)
    const nM = effectiveNMethod
    const pM = pMethod
    const precipKind: PrecipitateReading['kind'] | null = halogen
      ? 'halogen'
      : hasS
        ? 'sulphur'
        : hasP
          ? pM === 'molybdate'
            ? 'phosphorus-molybdate'
            : 'phosphorus-pyrophosphate'
          : null
    const precipElement = halogen ?? (hasS ? 'S' : hasP ? 'P' : 'S')
    const next: RunData = {
      sampleId: sample.id,
      mass,
      nMethod: nM,
      pMethod: pM,
      combustion: combustionReadings(comp, mass, measurer(u[0])),
      dumas: dumasReadings(comp, mass, measurer(u[1])),
      kjeldahl: kjeldahlOk && hasN ? kjeldahlReadings(comp, mass, measurer(u[1])) : { sampleMass: mass, acidMl: ANALYSIS_CONDITIONS.kjeldahlAcidMl, alkaliMl: 0, molarity: ANALYSIS_CONDITIONS.kjeldahlMolarity },
      precipitate: precipKind ? precipitateReading(comp, mass, precipKind, precipElement, measurer(u[2])) : null,
    }
    setData(next)
    setProgress(reducedMotion ? 1 : 0)
    setRunToken((t) => t + 1)
  }

  const chooseSample = (id: string) => {
    setSampleId(id)
    setTab(null)
    setData(null)
    setProgress(0)
    setEntries({})
  }

  const submitSmiles = () => {
    try {
      const s = sampleFromSmiles('custom', customSmiles.trim())
      if (!/C/.test(s.formula)) {
        setCustomError('Enter a compound that contains carbon.')
        return
      }
      setCustomSample(s)
      setCustomError(null)
      chooseSample('custom')
    } catch {
      setCustomError('The lib cannot read that structure. Use Kekulé SMILES, for example NC1=CC=CC=C1.')
    }
  }

  const randomise = () => {
    const pick = samples[Math.floor(Math.random() * samples.length)]
    setMass(Math.round((MASS_RANGE.min + Math.random() * (MASS_RANGE.max - MASS_RANGE.min)) * 1000) / 1000)
    setSampleId(pick.id)
    setTab(null)
    setData(null)
    setProgress(0)
    setEntries({})
  }

  const setEntry = (key: string, value: number) => setEntries((prev) => ({ ...prev, [key]: value }))

  // Empirical formula from the learner's percentages (oxygen by difference from them).
  const allEntered = entered.every((s) => (entries[s] ?? 0) > 0)
  const emp = allEntered ? learnerEmpirical(entered, entries, hasO, comp.molarMass, sample.formula) : null
  const empiricalBlock: ReactNode = emp ? (
    <div className={styles.card} data-testid="empirical-block">
      <h4 className={styles.cardTitle}>Empirical formula from your percentages</h4>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Element</th>
            <th>%</th>
            <th>Moles per 100 g</th>
            <th>Ratio</th>
          </tr>
        </thead>
        <tbody>
          {emp.rows.map((row) => (
            <tr key={row.symbol}>
              <td>{row.symbol}</td>
              <td>{row.percent.toFixed(2)}</td>
              <td>{row.moles.toFixed(3)}</td>
              <td>{row.ratio.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.line}>
        Empirical formula: <strong data-testid="empirical-label">{emp.label}</strong>. The empirical formula mass is {emp.empiricalMass.toFixed(2)} g mol⁻¹. With <Sym>M</Sym> = {comp.molarMass.toFixed(2)} g mol⁻¹, <Sym>n</Sym> = <Sym>M</Sym> ÷ {emp.empiricalMass.toFixed(2)} = {emp.n}, so the molecular formula is {emp.molecular}.
      </p>
      <p className={styles.note} data-testid="empirical-check">
        {emp.matches
          ? `Your numbers give the same empirical formula as the true composition (${emp.truthLabel}).`
          : `Your numbers give ${emp.label}, not ${emp.truthLabel}. A percentage a little out gives a different whole-number ratio. Recheck the readings.`}
      </p>
    </div>
  ) : allEntered ? (
    <p className={styles.note}>Your percentages do not give a positive set of values. Recheck the entries.</p>
  ) : null

  const summary = current
    ? `Run on ${sample.name ?? sample.formula}, ${mass.toFixed(3)} g. ${entered.map((s) => `${s} entered ${entries[s] ?? 0}`).join('; ')}.`
    : `Choose a sample and press Run analysis.`

  /** Lines of the apparatus readout for the active tab. */
  const readouts = (): { apparatus: ReactNode; lines: ReactNode[] } => {
    const r = current
    if (activeTab === 'CH') {
      return {
        apparatus: (
          <svg viewBox="0 0 360 236" className={styles.apparatus} role="img" aria-label="Liebig combustion train" data-testid="sim-apparatus">
            <CombustionTrain
              progress={progress}
              h2oGain={r ? `+${r.combustion.massH2O.toFixed(4)} g` : '—'}
              co2Gain={r ? `+${r.combustion.massCO2.toFixed(4)} g` : '—'}
              title="Liebig combustion train"
            />
          </svg>
        ),
        lines: r
          ? [
              <>Mass of CO₂ from the KOH bulbs: {r.combustion.massCO2.toFixed(4)} g. Mass of H₂O from the CaCl₂ tube: {r.combustion.massH2O.toFixed(4)} g.</>,
              <>
                <Sym>%C</Sym> = 12 × <Sym>m</Sym>₂ × 100 / (44 × <Sym>m</Sym>), with <Sym>m</Sym> = {r.combustion.sampleMass.toFixed(4)} g.
              </>,
              <>
                <Sym>%H</Sym> = 2 × <Sym>m</Sym>₁ × 100 / (18 × <Sym>m</Sym>), with <Sym>m</Sym>₁ = H₂O formed.
              </>,
            ]
          : [<>Press Run analysis to heat the sample and read the absorbers.</>],
      }
    }
    if (activeTab === 'N') {
      if (effectiveNMethod === 'dumas') {
        const vol = r ? r.dumas.volumeMl : 0
        return {
          apparatus: (
            <svg viewBox="0 0 360 292" className={styles.apparatus} role="img" aria-label="Dumas nitrometer" data-testid="sim-apparatus">
              <DumasApparatus
                volume={Math.min(1, (vol * progress) / NITROMETER_ML)}
                volumeLabel={r ? `${(vol * progress).toFixed(1)} mL` : '—'}
                progress={progress}
                title="Dumas nitrometer"
              />
            </svg>
          ),
          lines: r
            ? [
                <>
                  Nitrogen collected: {r.dumas.volumeMl.toFixed(1)} mL at {r.dumas.temperatureK} K and {r.dumas.pressureMmHg} mmHg. Aqueous tension {r.dumas.aqueousTensionMmHg} mmHg.
                </>,
                <>
                  <Sym>p</Sym>₁ = <Sym>p</Sym> − aqueous tension, then <Sym>V</Sym>(STP) = <Sym>p</Sym>₁ × <Sym>V</Sym> × 273 / (760 × <Sym>T</Sym>), and <Sym>%N</Sym> = 28 × <Sym>V</Sym>(STP) × 100 / (22400 × <Sym>m</Sym>).
                </>,
              ]
            : [<>Press Run analysis to collect the nitrogen.</>],
        }
      }
      return {
        apparatus: (
          <svg viewBox="0 0 360 300" className={styles.apparatus} role="img" aria-label="Kjeldahl titration" data-testid="sim-apparatus">
            <KjeldahlSetup stage="titrate" titrantMl={r ? r.kjeldahl.alkaliMl * progress : 0} endPoint={progress > 0.98} title="Kjeldahl titration" />
          </svg>
        ),
        lines: r
          ? [
              <>
                Acid taken <Sym>V</Sym> = {r.kjeldahl.acidMl.toFixed(2)} mL of {r.kjeldahl.molarity} M. Alkali for the excess <Sym>V</Sym>₁ = {r.kjeldahl.alkaliMl.toFixed(2)} mL of {r.kjeldahl.molarity} M.
              </>,
              <>
                <Sym>%N</Sym> = 1.4 × <Sym>M</Sym> × 2(<Sym>V</Sym> − <Sym>V</Sym>₁/2) × 100 / (1000 × <Sym>m</Sym>), with <Sym>m</Sym> = {r.kjeldahl.sampleMass.toFixed(4)} g.
              </>,
            ]
          : [<>Press Run analysis to titrate the excess acid.</>],
      }
    }
    if (activeTab === 'X' || activeTab === 'S' || activeTab === 'P') {
      const p = r?.precipitate ?? null
      const label = p ? precipitateName(p.kind, p.element) : activeTab === 'S' ? 'BaSO₄' : activeTab === 'P' ? (pMethod === 'molybdate' ? 'phosphomolybdate' : 'Mg₂P₂O₇') : 'AgX'
      const colour = p ? precipitateColour(p.kind, p.element) : 'var(--precipitate)'
      const lines: ReactNode[] = []
      if (p) {
        lines.push(<>{label} weighed: {p.mass.toFixed(4)} g, from a sample of {p.sampleMass.toFixed(4)} g.</>)
        if (p.kind === 'halogen') {
          lines.push(
            <>
              %{p.element} = {p.element === 'Cl' ? '35.5' : p.element === 'Br' ? '79.9' : '126.9'} × <Sym>m</Sym>₁ × 100 / (molar mass of AgX × <Sym>m</Sym>), with molar mass of AgX = 108 + <Sym>A</Sym><sub>r</sub>.
            </>
          )
        } else if (p.kind === 'sulphur') {
          lines.push(
            <>
              %S = 32 × <Sym>m</Sym>₁ × 100 / (233 × <Sym>m</Sym>), with 233 the molar mass of BaSO₄.
            </>
          )
        } else if (p.kind === 'phosphorus-molybdate') {
          lines.push(
            <>
              %P = 31 × <Sym>m</Sym>₁ × 100 / (1877 × <Sym>m</Sym>), with 1877 the molar mass of (NH₄)₃PO₄·12MoO₃.
            </>
          )
        } else {
          lines.push(
            <>
              %P = 62 × <Sym>m</Sym>₁ × 100 / (222 × <Sym>m</Sym>), with 222 the molar mass of Mg₂P₂O₇.
            </>
          )
        }
      } else {
        lines.push(<>Press Run analysis to oxidise the sample in the sealed tube.</>)
      }
      return {
        apparatus: (
          <svg viewBox="0 0 300 300" className={styles.apparatus} role="img" aria-label="Carius tube" data-testid="sim-apparatus">
            <CariusTube
              stage="settle"
              progress={progress}
              precipitateColor={colour}
              precipitateLabel={label}
              title={`Carius tube, ${label} settling`}
            />
          </svg>
        ),
        lines,
      }
    }
    return {
      apparatus: <p className={styles.note}>No apparatus: oxygen is not weighed. It is found by difference from the other elements (NCERT 8.10.6).</p>,
      lines: [<>%O = 100 − (sum of the percentages of all other elements).</>],
    }
  }

  const view = readouts()
  const inputFor = (key: string, label: string) => {
    const expectedValue = expected(key)
    const entry = entries[key] ?? 0
    const ok = expectedValue !== null && entry > 0 && Math.abs(entry - expectedValue) <= TOLERANCE
    const wrong = expectedValue !== null && entry > 0 && !ok
    return (
      <div className={styles.entry}>
        <NumberField
          label={label}
          value={entry}
          onChange={(v) => setEntry(key, v)}
          min={0}
          max={100}
          step={0.01}
          precision={2}
          unit="%"
          id={`entry-${key}`}
        />
        <p className={styles.feedback} role="status" data-testid={`check-${key}`}>
          {ok ? 'Within 0.10 of the value from the readings.' : wrong ? 'Not yet: recheck the formula, the masses and the molar mass.' : ''}
        </p>
      </div>
    )
  }

  const entryKeys: string[] =
    activeTab === 'CH' ? ['C', 'H'] : activeTab === 'N' ? ['N'] : activeTab === 'X' ? (halogen ? [halogen] : []) : activeTab === 'S' ? ['S'] : activeTab === 'P' ? ['P'] : []

  return (
    <div className={styles.sim} data-testid="elemental-analyser" ref={rootRef}>
      <div className={styles.sampleRow}>
        <div className={styles.presets} role="group" aria-label="Sample">
          {samples.map((s) => (
            <Button key={s.id} variant={sampleId === s.id ? 'primary' : 'secondary'} aria-pressed={sampleId === s.id} onClick={() => chooseSample(s.id)}>
              {s.name ?? s.formula}
            </Button>
          ))}
          {customSample && (
            <Button variant={sampleId === 'custom' ? 'primary' : 'secondary'} aria-pressed={sampleId === 'custom'} onClick={() => chooseSample('custom')}>
              {customSample.name ?? customSample.formula}
            </Button>
          )}
          <Button variant="secondary" onClick={randomise}>
            Random sample
          </Button>
        </div>
        <div className={styles.enter}>
          <label className={styles.enterLabel} htmlFor="smiles-input">
            Or enter a structure (SMILES)
          </label>
          <div className={styles.enterRow}>
            <input
              id="smiles-input"
              className={styles.input}
              type="text"
              value={customSmiles}
              onChange={(e) => setCustomSmiles(e.target.value)}
              placeholder="NC1=CC=CC=C1"
              aria-invalid={customError ? true : undefined}
              aria-describedby={customError ? 'smiles-error' : undefined}
            />
            <Button variant="secondary" onClick={submitSmiles} disabled={customSmiles.trim() === ''}>
              Use structure
            </Button>
          </div>
          {customError && (
            <p id="smiles-error" className={styles.error} role="alert">
              {customError}
            </p>
          )}
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.card}>
          <h4 className={styles.cardTitle}>Method</h4>
          <Slider label="Sample mass" value={mass} min={MASS_RANGE.min} max={MASS_RANGE.max} step={0.001} unit="g" format={(v) => `${v.toFixed(3)} g`} onChange={setMass} />
          {hasN && (
            <div className={styles.methodRow} role="group" aria-label="Nitrogen method">
              <span className={styles.methodLabel}>Nitrogen</span>
              <Button variant={effectiveNMethod === 'dumas' ? 'primary' : 'secondary'} aria-pressed={effectiveNMethod === 'dumas'} onClick={() => setNMethod('dumas')}>
                Dumas
              </Button>
              <Button
                variant={effectiveNMethod === 'kjeldahl' ? 'primary' : 'secondary'}
                aria-pressed={effectiveNMethod === 'kjeldahl'}
                disabled={!kjeldahlOk}
                onClick={() => setNMethod('kjeldahl')}
              >
                Kjeldahl
              </Button>
              {!kjeldahlOk && (
                <p className={styles.note} data-testid="kjeldahl-warning">
                  Kjeldahl does not convert nitrogen in {applicability.reasons.join(', ')}. Use Dumas.
                </p>
              )}
            </div>
          )}
          {hasP && (
            <div className={styles.methodRow} role="group" aria-label="Phosphorus method">
              <span className={styles.methodLabel}>Phosphorus</span>
              <Button variant={pMethod === 'molybdate' ? 'primary' : 'secondary'} aria-pressed={pMethod === 'molybdate'} onClick={() => setPMethod('molybdate')}>
                Phosphomolybdate
              </Button>
              <Button variant={pMethod === 'pyrophosphate' ? 'primary' : 'secondary'} aria-pressed={pMethod === 'pyrophosphate'} onClick={() => setPMethod('pyrophosphate')}>
                Mg₂P₂O₇
              </Button>
            </div>
          )}
          <Toggle label="Measurement error (±0.5 % on each reading)" checked={errorOn} onChange={setErrorOn} />
          <div className={styles.runRow}>
            <Button variant="primary" onClick={run}>
              Run analysis
            </Button>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.tabs} role="group" aria-label="Analysis">
            {tabs.map((t) => (
              <Button key={t.key} variant={activeTab === t.key ? 'primary' : 'secondary'} aria-pressed={activeTab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </Button>
            ))}
          </div>
          <div className={styles.stage}>{view.apparatus}</div>
          <div className={styles.readout}>
            {view.lines.map((line, i) => (
              <p key={i} className={styles.line}>
                {line}
              </p>
            ))}
          </div>
          {current &&
            entryKeys.map((k) => <Fragment key={k}>{inputFor(k, pctText(k))}</Fragment>)}
          {activeTab === 'O' && current && (
            <p className={styles.line} data-testid="oxygen-value">
              With the entries you have made, %O = {allEntered ? oxygenByDifference(Object.fromEntries(entered.map((s) => [s, entries[s]]))).toFixed(2) : '—'}.
            </p>
          )}
        </div>
      </div>

      {empiricalBlock}

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
