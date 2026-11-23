'use client'

import { useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { Sub } from '@/components/animations/c12-unit1/ChemSvg'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SUBSTITUENT_ACIDITY_ORDER } from '@/lib/chem/ncert-c12-unit8-data'
import {
  PKA_AXIS,
  RULER_ACIDS,
  STRIP,
  TUBE_SAMPLES,
  fizzes,
  formatPka,
  pkaRow,
  rulerX,
  stripRank,
  substituentFormula,
  tubeEquation,
  type RulerAcid,
  type SubGroup,
  type SubPosition,
  type TubeSample,
} from '@/lib/chem/acid-strength-lab'
import styles from './acid-strength-lab.module.css'

const L = 50
const RW = 460
const AX = 170
const X = (v: number) => rulerX(v, L, RW)
const FONT = 'var(--font-sans)'

/** NCERT's band cut-offs (pKa 1, 5, 15), as in pkaBand in the data lib. */
const BANDS = [
  { name: 'strong', from: PKA_AXIS.min, to: 1, centre: -3.5, opacity: 0.22 },
  { name: 'moderately strong', from: 1, to: 5, centre: 3, opacity: 0.15 },
  { name: 'weak', from: 5, to: 15, centre: 10, opacity: 0.09 },
  { name: 'extremely weak', from: 15, to: PKA_AXIS.max, centre: 16.5, opacity: 0.04 },
] as const
const TICKS = [-8, -4, 0, 4, 8, 12, 16]
const tick = (v: number) => (v < 0 ? `−${Math.abs(v)}` : String(v))

const TUBE_PATH = 'M 205 40 L 215 40 L 215 190 Q 215 226 250 226 L 310 226 Q 345 226 345 190 L 345 40 L 355 40'
const LIQUID_PATH = 'M 217 150 L 217 190 Q 217 224 250 224 L 310 224 Q 343 224 343 190 L 343 150 Z'
const BUBBLES: readonly [number, number][] = [
  [240, 190], [262, 202], [300, 186], [322, 200], [250, 164], [290, 172], [318, 160], [272, 212], [306, 210],
]

const STRIP_TOP = 56
const STRIP_STEP = 18

function RulerDrawing({ acid }: { acid: RulerAcid }) {
  const chosen = pkaRow(acid)
  const hcl = pkaRow('Hydrochloric acid')
  const phenol = pkaRow('Phenol')
  const ethanol = pkaRow('Ethanol')
  return (
    <svg viewBox="0 0 560 270" role="img" aria-label={`pKₐ ruler: ${acid} at ${formatPka(chosen.pKa)}`} className={styles.drawing} data-testid="acid-ruler">
      <text x={L} y={30} fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
        NCERT pK<Sub>a</Sub> values, lower = stronger
      </text>
      {BANDS.map((b) => (
        <rect key={b.name} x={X(b.from)} y={AX - 14} width={X(b.to) - X(b.from)} height={28} fill="var(--accent)" fillOpacity={b.opacity} />
      ))}
      <line x1={X(PKA_AXIS.min)} x2={X(PKA_AXIS.max)} y1={AX} y2={AX} stroke="var(--fg-muted)" strokeWidth={1.5} />
      {TICKS.map((v) => (
        <g key={v}>
          <line x1={X(v)} x2={X(v)} y1={AX + 14} y2={AX + 20} stroke="var(--fg-muted)" strokeWidth={1.5} />
          <text x={X(v)} y={AX + 44} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
            {tick(v)}
          </text>
        </g>
      ))}
      {BANDS.map((b) => (
        <text key={`${b.name}-label`} x={X(b.centre)} y={AX + 80} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg)">
          {b.name}
        </text>
      ))}
      <circle cx={X(hcl.pKa)} cy={AX} r={6} fill="var(--fg-muted)" />
      <text x={L} y={AX - 34} fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">{`HCl ${formatPka(hcl.pKa)}`}</text>
      <circle cx={X(phenol.pKa)} cy={AX} r={6} fill="var(--fg-muted)" />
      <text x={X(phenol.pKa)} y={AX - 34} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">{`Phenol ${formatPka(phenol.pKa)}`}</text>
      <circle cx={X(ethanol.pKa)} cy={AX} r={6} fill="var(--fg-muted)" />
      <text x={X(ethanol.pKa)} y={AX - 66} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">{`Ethanol ${formatPka(ethanol.pKa, ethanol.approx)}`}</text>
      <line x1={X(chosen.pKa)} x2={X(chosen.pKa)} y1={72} y2={AX - 12} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 4" />
      <text x={X(chosen.pKa)} y={62} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {`${acid}: pKₐ ${formatPka(chosen.pKa)}`}
      </text>
      <circle cx={X(chosen.pKa)} cy={AX} r={9} fill="var(--accent)" />
    </svg>
  )
}

function SubstituentDrawing({ group, position }: { group: SubGroup; position: SubPosition }) {
  const formula = substituentFormula(group, position)
  const rank = stripRank(formula)
  return (
    <svg viewBox="0 0 560 290" role="img" aria-label={`NCERT series, strongest first, with ${formula ?? 'no entry'} marked`} className={styles.drawing} data-testid="acid-series">
      <text x={24} y={30} fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">Strongest first (1 = strongest)</text>
      {STRIP.map((e, i) => {
        const y = STRIP_TOP + i * STRIP_STEP
        const isChosen = i + 1 === rank
        return (
          <g key={e.formula}>
            {isChosen && <rect x={24} y={y - 13} width={512} height={18} rx={4} fill="var(--accent-soft)" />}
            <text x={70} y={y} textAnchor="end" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">{i + 1}</text>
            <text x={96} y={y} fontSize={16} fontFamily={FONT} fontWeight={isChosen ? 600 : 400} fill={isChosen ? 'var(--fg)' : 'var(--fg-muted)'}>
              {e.formula}
            </text>
            {isChosen && (
              <text x={520} y={y} textAnchor="end" fontSize={16} fontFamily={FONT} fontWeight={600} fill="var(--accent)">your case</text>
            )}
            {e.formula === 'CH₃COOH' && (
              <text x={520} y={y} textAnchor="end" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">reference</text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function TubeDrawing({ sample }: { sample: TubeSample }) {
  const label = TUBE_SAMPLES.find((s) => s.id === sample)?.label ?? ''
  const eq = tubeEquation(sample)
  const fizz = fizzes(sample)
  return (
    <svg viewBox="0 0 560 270" role="img" aria-label={`${label} with NaHCO₃: ${fizz ? 'fizz' : 'no fizz'}`} className={styles.drawing} data-testid="acid-tube">
      <text x={280} y={26} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">{`${label} + NaHCO₃`}</text>
      <path d={TUBE_PATH} fill="none" stroke="var(--border)" strokeWidth={3} />
      <path d={LIQUID_PATH} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.5} />
      {fizz &&
        BUBBLES.map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={4.5} fill="var(--bubble-fill)" stroke="var(--fg-muted)" strokeWidth={1} />)}
      <text x={380} y={120} fontSize={18} fontWeight={600} fontFamily={FONT} fill={fizz ? 'var(--fg)' : 'var(--fg-muted)'}>
        {fizz ? 'CO₂ gas: yes' : 'No fizz'}
      </text>
      <text x={380} y={146} fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">{fizz ? 'the test for COOH' : 'no CO₂ from phenol'}</text>
      <text x={280} y={252} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg)">
        {eq ?? 'Phenol gives no CO₂ with NaHCO₃'}
      </text>
    </svg>
  )
}

export function AcidStrengthLab() {
  const [acid, setAcid] = useState<RulerAcid>('Acetic acid')
  const [group, setGroup] = useState<SubGroup>('Cl')
  const [position, setPosition] = useState<SubPosition>('alpha')
  const [sample, setSample] = useState<TubeSample>('acetic')

  const chosen = pkaRow(acid)
  const phenol = pkaRow('Phenol')
  const ethanol = pkaRow('Ethanol')
  const formula = substituentFormula(group, position)
  const rank = stripRank(formula)
  const sampleLabel = TUBE_SAMPLES.find((s) => s.id === sample)?.label ?? ''

  const rulerText = `${acid} has pKₐ ${formatPka(chosen.pKa)}, a ${chosen.band} acid. It is ${chosen.pKa < phenol.pKa ? 'stronger' : 'weaker'} than phenol (pKₐ ${formatPka(phenol.pKa)}) and ${chosen.pKa < ethanol.pKa ? 'stronger' : 'weaker'} than ethanol (pKₐ ${formatPka(ethanol.pKa, ethanol.approx)}).`
  const where = position === 'alpha' ? 'on the carbon next to COOH (α)' : 'one carbon further from COOH (β)'
  const subText = formula
    ? `${group} ${where}: ${formula} is number ${rank} of the ${STRIP.length} entries shown, strongest first.`
    : `NCERT's series lists no acid for ${group} ${where}, so no rank is shown.`
  const tubeText = fizzes(sample)
    ? `${sampleLabel} gives CO₂ with NaHCO₃: a fizz, the test for COOH.`
    : `${sampleLabel} gives no fizz with NaHCO₃: phenol does not give CO₂ in this test.`

  return (
    <div className={styles.root} data-testid="acid-strength-lab">
      <section className={styles.panel} aria-label="Acid on the pKₐ ruler">
        <h3 className={styles.heading}>1. An acid on the pKₐ ruler</h3>
        <RulerDrawing acid={acid} />
      </section>
      <section className={styles.panel} aria-label="Substituent on the acid">
        <h3 className={styles.heading}>2. A group on the acetic acid chain</h3>
        <SubstituentDrawing group={group} position={position} />
      </section>
      <section className={styles.panel} aria-label="Test tube with sodium hydrogencarbonate">
        <h3 className={styles.heading}>3. Test tube with NaHCO₃</h3>
        <TubeDrawing sample={sample} />
      </section>
      <p className={styles.summary} aria-live="polite">{`${rulerText} ${subText} ${tubeText}`}</p>
      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Acid on the ruler"
            options={RULER_ACIDS.map((a) => ({ value: a, label: a }))}
            value={acid}
            onChange={setAcid}
          />
          <div className={styles.group} role="group" aria-label="Group on the chain">
            {SUBSTITUENT_ACIDITY_ORDER.map((g) => (
              <Button
                key={g}
                type="button"
                variant={g === group ? 'primary' : 'secondary'}
                aria-pressed={g === group}
                onClick={() => setGroup(g)}
              >
                {g}
              </Button>
            ))}
          </div>
          <Segmented
            label="Place of the group"
            options={[
              { value: 'alpha', label: 'α, next to COOH' },
              { value: 'beta', label: 'β, one further' },
            ]}
            value={position}
            onChange={setPosition}
          />
          <Segmented
            label="Sample in the test tube"
            options={TUBE_SAMPLES.map((s) => ({ value: s.id, label: s.label }))}
            value={sample}
            onChange={setSample}
          />
        </div>
      </SimulationControls>
    </div>
  )
}
