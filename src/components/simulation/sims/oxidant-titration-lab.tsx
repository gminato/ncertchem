'use client'

import { useId, useState } from 'react'
import { Button, Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { ION_COLOUR_TOKEN } from '@/components/vocab/dblock/tones'
import { titrationRatio, type OxidantKey } from '@/lib/chem/dblock'
import {
  BURETTE_CAPACITY_ML,
  DROP_ML,
  calculatedFe2Molarity,
  endPointDrops,
  formatMoles,
  reactedMoles,
} from '@/lib/chem/oxidant-titration'
import styles from './oxidant-titration-lab.module.css'

type OxidantChoice = 'mno4' | 'cr2o7'

const OXIDANT_OPTIONS = [
  { value: 'mno4', label: 'KMnO₄' },
  { value: 'cr2o7', label: 'K₂Cr₂O₇' },
] as const

const OXIDANT_OF: Readonly<Record<OxidantChoice, OxidantKey>> = { mno4: 'MnO4-', cr2o7: 'Cr2O7 2-' }
const OXIDANT_NAME: Readonly<Record<OxidantChoice, string>> = { mno4: 'MnO₄⁻', cr2o7: 'Cr₂O₇²⁻' }
const OXIDANT_MOLARITY = 0.02
const DEFAULT_FE_VOLUME_ML = 25
const DEFAULT_FE_MOLARITY = 0.05
const MAX_DROPS = BURETTE_CAPACITY_ML * 100

// Drawing geometry (viewBox units). The burette scale runs TOP (0 mL) to BOTTOM (25 mL).
const TOP = 50
const BOTTOM = 300
const TIP_Y = 318
const BAR_X = 290
const BAR_Y = 62
const BAR_H = 330
const FLASK_PATH = 'M141 352 L141 372 L108 412 L192 412 L159 372 L159 352 Z'
const BURETTE_PATH = `M139 ${TOP} L161 ${TOP} L161 ${BOTTOM} L150 ${TIP_Y} L139 ${BOTTOM} Z`

const TICKS = [0, 5, 10, 15, 20, 25] as const

/** The Oxidant Titration Lab: Fe²⁺ in a flask, KMnO₄ or K₂Cr₂O₇ from a burette, read by drops. */
export function OxidantTitrationLab() {
  const clipId = useId()
  const [oxidantChoice, setOxidantChoice] = useState<OxidantChoice>('mno4')
  const [fe2VolumeMl, setFe2VolumeMl] = useState(DEFAULT_FE_VOLUME_ML)
  const [fe2Molarity, setFe2Molarity] = useState(DEFAULT_FE_MOLARITY)
  const [drops, setDrops] = useState(0)

  const oxidant = OXIDANT_OF[oxidantChoice]
  const isPermanganate = oxidantChoice === 'mno4'
  const oxidantToken = isPermanganate ? ION_COLOUR_TOKEN.mno4 : ION_COLOUR_TOKEN.cr2o7

  const endDrops = endPointDrops({ oxidant, oxidantMolarity: OXIDANT_MOLARITY, fe2Molarity, fe2VolumeMl })
  const reached = drops >= endDrops
  const reading = drops * DROP_ML
  const fraction = Math.min(1, drops / endDrops)

  const { oxidantMol, fe2Mol } = reactedMoles({ oxidant, oxidantMolarity: OXIDANT_MOLARITY, drops })
  const fe2TotalMol = fe2Molarity * (fe2VolumeMl / 1000)
  const fe2LeftMol = fe2TotalMol - fe2Mol < 1e-12 ? 0 : fe2TotalMol - fe2Mol
  const fe2PerOxidant = titrationRatio(oxidant).fe2PerOxidant
  const calc = reached
    ? calculatedFe2Molarity({ oxidant, oxidantMolarity: OXIDANT_MOLARITY, drops: endDrops, fe2VolumeMl })
    : null
  const titreMl = endDrops * DROP_ML
  const matches = calc !== null && Math.abs(calc - fe2Molarity) / fe2Molarity < 0.005

  // Flask colour: pale green Fe²⁺ turns yellow as Fe³⁺ forms. Permanganate's end point is pale pink.
  const showPink = isPermanganate && reached
  const yellowOpacity = fraction
  const flashOpacity = drops > 0 && !reached ? 0.9 : 0

  let status: string
  if (!reached) {
    status = isPermanganate
      ? 'Before the end point. Each purple drop is decolourised as it lands, because Fe²⁺ reduces it at once.'
      : 'Before the end point. Each orange drop is reduced, and chromium(III) forms in the flask.'
  } else if (isPermanganate) {
    status = `End point: the flask stays pale pink at ${titreMl.toFixed(2)} mL, so the last drop was not decolourised.`
  } else {
    status = `End point by calculation at ${titreMl.toFixed(2)} mL. Dichromate gives no colour change of its own here, so a bench would need an indicator.`
  }

  const colourWord = showPink ? 'pale pink' : fraction > 0 ? 'yellow-green' : 'pale green'
  const ariaLabel = `Burette at ${reading.toFixed(2)} mL, flask ${colourWord}`
  const meniscusY = TOP + (reading / BURETTE_CAPACITY_ML) * (BOTTOM - TOP)

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <div className={styles.controls}>
          <Segmented
            label="Oxidant in the burette"
            options={OXIDANT_OPTIONS}
            value={oxidantChoice}
            onChange={(v) => setOxidantChoice(v)}
          />
          <div className={styles.sliderGrid}>
            <Slider
              label="Fe²⁺ volume"
              unit="mL"
              value={fe2VolumeMl}
              min={10}
              max={40}
              step={0.5}
              onChange={setFe2VolumeMl}
              format={(v) => v.toFixed(2)}
            />
            <Slider
              label="Fe²⁺ concentration"
              unit="mol dm⁻³"
              value={fe2Molarity}
              min={0.02}
              max={0.06}
              step={0.001}
              onChange={setFe2Molarity}
              format={(v) => v.toFixed(4)}
            />
            <Slider
              label="Burette reading"
              unit="mL"
              value={drops / 100}
              min={0}
              max={BURETTE_CAPACITY_ML}
              step={DROP_ML}
              onChange={(v) => setDrops(Math.min(MAX_DROPS, Math.max(0, Math.round(v * 100))))}
              format={(v) => v.toFixed(2)}
            />
          </div>
          <div className={styles.choices}>
            <Button variant="primary" onClick={() => setDrops((d) => Math.min(MAX_DROPS, d + 1))}>
              Add one drop (0.01 mL)
            </Button>
            <Button variant="secondary" onClick={() => setDrops((d) => Math.min(MAX_DROPS, d + 10))}>
              Add 10 drops
            </Button>
            <Button variant="secondary" onClick={() => setDrops(0)}>
              Reset burette
            </Button>
          </div>
        </div>
      </SimulationControls>

      <div className={styles.layout}>
        <div className={styles.stage}>
          <svg className={styles.rig} viewBox="0 0 460 470" role="img" aria-label={ariaLabel}>
            <defs>
              <clipPath id={`bur-${clipId}`}>
                <path d={BURETTE_PATH} />
              </clipPath>
              <clipPath id={`flask-${clipId}`}>
                <path d={FLASK_PATH} />
              </clipPath>
            </defs>

            <text x={12} y={30} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`Burette (mL): ${OXIDANT_NAME[oxidantChoice]} ${OXIDANT_MOLARITY.toFixed(4)} M`}
            </text>

            {/* Burette: liquid column falls from the meniscus to the tip */}
            <g clipPath={`url(#bur-${clipId})`}>
              <rect x={136} y={meniscusY} width={28} height={TIP_Y - meniscusY} fill={oxidantToken} opacity={0.9} />
            </g>
            <path d={BURETTE_PATH} fill="none" stroke="var(--glass-wall)" strokeWidth={2} />
            {TICKS.map((tick) => {
              const ty = TOP + (tick / BURETTE_CAPACITY_ML) * (BOTTOM - TOP)
              return (
                <g key={tick}>
                  <line x1={161} y1={ty} x2={167} y2={ty} stroke="var(--glass-wall)" strokeWidth={1.4} />
                  <text x={171} y={ty} dominantBaseline="central" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
                    {tick}
                  </text>
                </g>
              )
            })}
            <circle cx={150} cy={306} r={5.5} fill="var(--fg-muted)" />

            {/* Flask: Fe²⁺ solution, its colour changing as Fe³⁺ forms */}
            <g clipPath={`url(#flask-${clipId})`}>
              <rect x={100} y={384} width={100} height={40} fill={ION_COLOUR_TOKEN.fe2} />
              {showPink ? (
                <>
                  <rect x={100} y={384} width={100} height={40} fill={ION_COLOUR_TOKEN.mn2} />
                  <rect x={100} y={384} width={100} height={40} fill={ION_COLOUR_TOKEN.mn2} />
                </>
              ) : (
                <rect x={100} y={384} width={100} height={40} fill={ION_COLOUR_TOKEN.fe3} opacity={yellowOpacity} />
              )}
            </g>
            <path d={FLASK_PATH} fill="none" stroke="var(--glass-wall)" strokeWidth={2} />
            <circle cx={150} cy={366} r={6} fill={oxidantToken} opacity={flashOpacity} />

            <text x={150} y={440} textAnchor="middle" fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`Fe²⁺ ${fe2VolumeMl.toFixed(2)} mL, dilute H₂SO₄`}
            </text>
            <text x={150} y={460} textAnchor="middle" fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
              {`${fe2Molarity.toFixed(4)} mol dm⁻³`}
            </text>

            {/* Fe²⁺ oxidised: a bar that fills to 100 % at the end point */}
            <text x={BAR_X} y={48} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
              Fe²⁺ oxidised
            </text>
            <rect x={BAR_X} y={BAR_Y} width={40} height={BAR_H} fill="none" stroke="var(--glass-wall)" strokeWidth={1.4} />
            <rect
              x={BAR_X}
              y={BAR_Y + BAR_H * (1 - fraction)}
              width={40}
              height={BAR_H * fraction}
              fill={ION_COLOUR_TOKEN.fe3}
            />
            <text x={BAR_X} y={420} fontSize={15} fill="var(--fg)" fontFamily="var(--font-sans)">
              {`${Math.round(fraction * 100)} %`}
            </text>
          </svg>
        </div>

        <div className={styles.readout}>
          <p className={styles.reading}>
            <span>Burette reading</span>
            <strong>{`${reading.toFixed(2)} mL`}</strong>
          </p>
          <p className={styles.status} aria-live="polite">
            {status}
          </p>
          <dl className={styles.moles}>
            <dt>Oxidant delivered</dt>
            <dd>{formatMoles(oxidantMol)}</dd>
            <dt>
              Fe²⁺ oxidised ({fe2PerOxidant} per {OXIDANT_NAME[oxidantChoice]})
            </dt>
            <dd>{formatMoles(fe2Mol)}</dd>
            <dt>Fe²⁺ still in the flask</dt>
            <dd>{fe2LeftMol === 0 ? '0 mol' : formatMoles(fe2LeftMol)}</dd>
          </dl>
          {calc !== null ? (
            <p className={styles.calc}>
              <span>
                Calculated c(Fe²⁺) = {calc.toFixed(4)} mol dm⁻³ from a titre of {titreMl.toFixed(2)} mL.
              </span>{' '}
              <span>
                {matches ? 'It matches the set value' : 'It differs from the set value by the drop size'} ({fe2Molarity.toFixed(4)} mol dm⁻³).
              </span>
            </p>
          ) : (
            <p className={styles.calc}>
              <span>The calculated concentration appears once the end point is reached.</span>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default OxidantTitrationLab
