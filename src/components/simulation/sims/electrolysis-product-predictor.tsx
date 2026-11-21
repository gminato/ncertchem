'use client'

import { useState } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Segmented } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { Beaker, DcSource, Electrode, GasBubbles, Ion, VocabDefs, Wire } from '@/components/vocab'
import {
  E0_PERSULFATE,
  predictElectrolysis,
  resolveCase,
  type Candidate,
  type ElectrodeChoice,
  type Electrolyte,
  type Prediction,
  type SulphuricStrength,
} from '@/lib/chem/electrolysis-predictor'
import styles from './electrolysis-product-predictor.module.css'

const ELECTROLYTE_OPTIONS = [
  { value: 'molten-nacl', label: 'Molten NaCl' },
  { value: 'aqueous-nacl', label: 'Aqueous NaCl' },
  { value: 'h2so4', label: 'H₂SO₄' },
  { value: 'cuso4', label: 'CuSO₄(aq)' },
  { value: 'agno3', label: 'AgNO₃(aq)' },
  { value: 'kbr', label: 'KBr(aq)' },
] as const

const STRENGTH_OPTIONS = [
  { value: 'dilute', label: 'Dilute' },
  { value: 'concentrated', label: 'Concentrated' },
] as const

const ELECTRODE_OPTIONS = [
  { value: 'inert', label: 'Inert (Pt)' },
  { value: 'reactive', label: 'Reactive' },
] as const

const SCALE_MIN = -3
const SCALE_MAX = 2.2
const GAS_FORMULAS = ['H₂', 'O₂', 'Cl₂', 'Br₂'] as const
const DEPOSITS = { Cu: 'cu', Ag: 'ag' } as const

const fmtV = (v: number): string => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)} V`
const barPercent = (v: number): number => ((v - SCALE_MIN) / (SCALE_MAX - SCALE_MIN)) * 100

function isGas(product: string): boolean {
  return (GAS_FORMULAS as readonly string[]).includes(product)
}

/** Plain-language reason for the anode choice, built from the prediction's own numbers. */
function anodeReason(p: Prediction, winner: Candidate): string {
  switch (p.reason) {
    case 'only-ions-present':
      return 'Only one cation and one anion are present, so there is no competition.'
    case 'overpotential-of-O2': {
      const o2 = p.anode.find((c) => c.isOxygen)
      return `O₂ (${fmtV(o2?.e0 ?? 1.23)}) would win on E° alone, but its overpotential holds it back, so ${winner.product} forms.`
    }
    case 'concentration-favours-persulfate':
      return `At this acid strength S₂O₈²⁻ (${fmtV(E0_PERSULFATE)}) is preferred, so water is not oxidised.`
    case 'active-anode-dissolves':
      return 'The metal anode is oxidised first, so it dissolves and the metal deposits on the cathode.'
    case 'lower-E°':
      return p.anode.length === 1
        ? `Only ${winner.couple} is available to be oxidised here, so ${winner.product} forms.`
        : `${winner.couple} has the lower E° (${fmtV(winner.e0)}), so it is oxidised first.`
  }
}

function cathodeReason(p: Prediction): string {
  const [winner, loser] = p.cathode.filter((c) => c.selected).concat(p.cathode.filter((c) => !c.selected))
  if (!loser) return `Only ${winner.couple} is available to be reduced, so ${winner.product} forms.`
  return `${winner.couple} (${fmtV(winner.e0)}) is reduced before ${loser.couple} (${fmtV(loser.e0)}): the higher E° wins.`
}

function CandidateList({ title, list, rule }: { title: string; list: readonly Candidate[]; rule: string }) {
  return (
    <div className={styles.column}>
      <h3 className={styles.columnTitle}>{title}</h3>
      <ul className={styles.candidates}>
        {list.map((c) => (
          <li key={c.key} className={c.selected ? styles.winner : styles.loser} data-selected={c.selected}>
            <div className={styles.candidateHead}>
              <span className={styles.couple}>{c.couple}</span>
              <span className={styles.e0}>{fmtV(c.e0)}</span>
            </div>
            <div className={styles.half}>{c.half}</div>
            <div className={styles.track} aria-hidden="true">
              <span className={styles.zero} style={{ left: `${barPercent(0)}%` }} />
              <span
                className={c.e0 < 0 ? styles.barNeg : styles.barPos}
                style={
                  c.e0 < 0
                    ? { left: `${barPercent(c.e0)}%`, width: `${barPercent(0) - barPercent(c.e0)}%` }
                    : { left: `${barPercent(0)}%`, width: `${barPercent(c.e0) - barPercent(0)}%` }
                }
              />
            </div>
            <div className={styles.tag}>
              {c.selected ? (c.dissolves ? 'Dissolves' : `Forms: ${c.product}`) : 'Does not form'}
            </div>
          </li>
        ))}
      </ul>
      <p className={styles.rule}>{rule}</p>
    </div>
  )
}

export function ElectrolysisProductPredictor({ reducedMotion }: SimulationProps) {
  const [electrolyte, setElectrolyte] = useState<Electrolyte>('aqueous-nacl')
  const [strength, setStrength] = useState<SulphuricStrength>('dilute')
  const [electrodes, setElectrodes] = useState<ElectrodeChoice>('inert')
  const t = useAmbientTime(reducedMotion)

  const caseId = resolveCase(electrolyte, strength, electrodes)
  const p = predictElectrolysis(caseId)
  const cathodeWinner = p.cathode.find((c) => c.selected) ?? p.cathode[0]
  const anodeWinner = p.anode.find((c) => c.selected) ?? p.anode[0]

  const metal = electrolyte === 'cuso4' ? 'cu' : electrolyte === 'agno3' ? 'ag' : null
  const hasElectrodeChoice = metal !== null
  const isNaCl = electrolyte === 'molten-nacl' || electrolyte === 'aqueous-nacl'
  const inertMaterial = isNaCl ? 'graphite' : 'pt'
  const anodeMaterial = hasElectrodeChoice && electrodes === 'reactive' ? metal : inertMaterial
  const cathodeMaterial = hasElectrodeChoice && electrodes === 'reactive' ? metal : inertMaterial
  const depositKey = cathodeWinner.product as keyof typeof DEPOSITS
  const depositMaterial = DEPOSITS[depositKey]
  const anodeDissolves = anodeWinner.dissolves
  const tint = electrolyte === 'cuso4' ? 'blue' : 'clear'
  const liquidLabel = isNaCl && electrolyte === 'molten-nacl' ? 'molten NaCl' : null

  const anodeGas = isGas(anodeWinner.product)
  const cathodeGas = isGas(cathodeWinner.product)
  const persulfate = anodeWinner.product === 'S₂O₈²⁻'
  // Dissolving anode: the metal leaves as its cation, e.g. Cu²⁺ from copper.
  const dissolvingMetal = anodeWinner.product.replace(/[⁺²]+$/, '')
  const dissolvedCharge = anodeWinner.product.includes('²') ? '2+' : '+'

  const summary = `${p.description}. Cathode: ${cathodeWinner.product} forms. Anode: ${anodeWinner.product} ${
    anodeDissolves ? 'dissolves' : 'forms'
  }.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Electrolyte"
          options={ELECTROLYTE_OPTIONS}
          value={electrolyte}
          onChange={setElectrolyte}
        />
        {electrolyte === 'h2so4' ? (
          <Segmented
            label="Acid strength"
            options={STRENGTH_OPTIONS}
            value={strength}
            onChange={setStrength}
          />
        ) : null}
        {hasElectrodeChoice ? (
          <Segmented
            label="Electrodes"
            options={ELECTRODE_OPTIONS}
            value={electrodes}
            onChange={setElectrodes}
          />
        ) : null}
      </div>

      <h3 className={styles.caption}>{p.description}</h3>

      <div className={styles.stage}>
        <svg viewBox="0 0 400 380" className={styles.svg} role="img" aria-label={summary}>
          <VocabDefs />
          <DcSource x={30} y={44} width={320} height={52} voltage={6} />
          <Wire
            corners={[
              { x: 110, y: 28 },
              { x: 20, y: 28 },
              { x: 20, y: 140 },
              { x: 110, y: 140 },
            ]}
            t={t}
            electrons
            direction="reverse"
          />
          <Wire
            corners={[
              { x: 270, y: 28 },
              { x: 380, y: 28 },
              { x: 380, y: 140 },
              { x: 270, y: 140 },
            ]}
            t={t}
            electrons
            direction="forward"
          />
          <Beaker x={40} y={170} width={280} height={160} level={0.85} tint={tint} />
          <Electrode
            x={110}
            top={140}
            length={180}
            width={14}
            material={anodeMaterial}
            thinning={anodeDissolves ? 0.4 : 0}
            polarity="+"
            role="anode"
          />
          <Electrode
            x={270}
            top={140}
            length={180}
            width={14}
            material={cathodeMaterial}
            plating={cathodeWinner.product === 'Cu' || cathodeWinner.product === 'Ag' ? 0.7 : 0}
            depositMaterial={depositMaterial}
            polarity="−"
            role="cathode"
          />
          {anodeGas ? (
            <GasBubbles x={56} y={312} width={6} height={110} count={6} t={t} formula={anodeWinner.product} />
          ) : null}
          {cathodeGas ? (
            <GasBubbles x={284} y={312} width={6} height={110} count={6} t={t} formula={cathodeWinner.product} />
          ) : null}
          {persulfate ? <Ion x={110} y={250} kind="anion" formula="S₂O₈" charge="2−" /> : null}
          {anodeDissolves ? (
            <Ion x={110} y={250} kind="cation" formula={dissolvingMetal} charge={dissolvedCharge} />
          ) : null}
          {liquidLabel ? (
            <text x={180} y={300} textAnchor="middle" className={styles.svgLabel}>
              {liquidLabel}
            </text>
          ) : null}
          <text x={110} y={362} textAnchor="middle" className={styles.svgLabel}>
            {anodeDissolves ? `${dissolvingMetal} anode dissolves` : `${anodeWinner.product} at anode`}
          </text>
          <text x={270} y={362} textAnchor="middle" className={styles.svgLabel}>
            {`${cathodeWinner.product} at cathode`}
          </text>
        </svg>
      </div>

      <div className={styles.competition} role="region" aria-label="Competing half-reactions">
        <CandidateList
          title="Cathode: reduction (highest E° first)"
          list={p.cathode}
          rule={cathodeReason(p)}
        />
        <CandidateList
          title="Anode: oxidation (lowest E° first)"
          list={p.anode}
          rule={anodeReason(p, anodeWinner)}
        />
      </div>

      <p className={styles.readout} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
