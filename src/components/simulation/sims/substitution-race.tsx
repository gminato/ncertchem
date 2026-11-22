'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import {
  HALOGEN_TONE,
  MECHANISM_PROFILE_SIZE,
  MechanismProfile,
  PLANAR_CATION_SIZE,
  PlanarCation,
  ROLE_TONE,
  STEREO_SIZE,
  StereoCentre,
  type StereoGroup,
} from '@/components/vocab/organic6'
import {
  fig63Entry,
  rateFactor,
  raceSubstrates,
  rateLaw,
  type Mechanism,
  type RaceSubstrate,
  type SubstrateId,
} from '@/lib/chem/substitution-race'
import { NCERT_FIG_6_3_SN2_RELATIVE_RATE } from '@/lib/chem/ncert-c12-unit6-data'
import styles from './substitution-race.module.css'

const SUBSTRATES = raceSubstrates()

const SUBSTRATE_OPTIONS: { value: SubstrateId; label: string }[] = [
  { value: 'methyl', label: 'Methyl' },
  { value: 'primary', label: '1°' },
  { value: 'secondary', label: '2°' },
  { value: 'tertiary', label: '3°' },
  { value: 'allylic', label: 'Allylic' },
  { value: 'benzylic', label: 'Benzylic' },
]

const MECHANISM_OPTIONS: { value: Mechanism; label: string }[] = [
  { value: 'SN2', label: 'SN2 view' },
  { value: 'SN1', label: 'SN1 view' },
]

const MULTIPLIER_OPTIONS: { value: '1' | '2' | '3'; label: string }[] = [
  { value: '1', label: '×1' },
  { value: '2', label: '×2' },
  { value: '3', label: '×3' },
]

/** The three groups that stay on carbon while the leaving group is away (the drawing's umbrella). */
const KEPT_GROUPS: Record<SubstrateId, readonly [string, string, string]> = {
  methyl: ['H', 'H', 'H'],
  primary: ['H', 'H', 'CH₃'],
  secondary: ['H', 'CH₃', 'CH₃'],
  tertiary: ['CH₃', 'CH₃', 'CH₃'],
  allylic: ['H', 'H', 'CH=CH₂'],
  benzylic: ['H', 'H', 'C₆H₅'],
}

const SN1_ORDER = 'tertiary > secondary > primary > methyl'

function sameDegree(sub: RaceSubstrate, degree: string) {
  return sub.kind === 'alkyl' && sub.degree === degree
}

export function SubstitutionRace({ reducedMotion: _reducedMotion }: SimulationProps) {
  const [substrateId, setSubstrateId] = useState<SubstrateId>('tertiary')
  const [mechanism, setMechanism] = useState<Mechanism>('SN2')
  const [rxMult, setRxMult] = useState<'1' | '2' | '3'>('1')
  const [nuMult, setNuMult] = useState<'1' | '2' | '3'>('1')

  const sub = SUBSTRATES.find((s) => s.id === substrateId) ?? SUBSTRATES[3]
  const rx = Number(rxMult)
  const nu = Number(nuMult)
  const factor = rateFactor(mechanism, rx, nu)
  const fig = fig63Entry(sub.kind, sub.degree)
  const others = KEPT_GROUPS[sub.id]
  const halogenLabel: StereoGroup = {
    label: (
      <>
        {sub.halogen}
        <Sup>δ−</Sup>
      </>
    ),
    tone: HALOGEN_TONE[sub.halogen],
    bondOrder: 0.5,
  }

  const rateText =
    mechanism === 'SN2'
      ? `${rateLaw('SN2')}. [RX] × ${rx} and [Nu⁻] × ${nu} make the rate ×${factor}.`
      : `${rateLaw('SN1')}. The nucleophile is not in the rate law, so the rate is ×${factor} whatever [Nu⁻] is.`
  const productText = `Product with HO⁻: ${sub.product.name}.`
  const figText = fig ? `Relative SN2 rate (Fig. 6.3): ${fig.display}.` : ''

  const liveSummary = [`${sub.name}, ${mechanism} view.`, rateText, figText, productText].filter(Boolean).join(' ')


  return (
    <div className={styles.lab}>
      <div className={styles.controls}>
        <Segmented label="Substrate" options={SUBSTRATE_OPTIONS} value={substrateId} onChange={setSubstrateId} />
        <Segmented label="Mechanism view" options={MECHANISM_OPTIONS} value={mechanism} onChange={setMechanism} />
        <Segmented label="[RX] multiplier" options={MULTIPLIER_OPTIONS} value={rxMult} onChange={setRxMult} />
        <Segmented label="[Nu⁻] multiplier" options={MULTIPLIER_OPTIONS} value={nuMult} onChange={setNuMult} />
      </div>

      <div className={styles.stage}>
        <p className={styles.caption}>
          {sub.name} ({sub.formula}) with HO⁻: {mechanism === 'SN2' ? 'one step, attack from the back' : 'two steps, through a planar carbocation'}
        </p>
        {mechanism === 'SN2' ? (
          <>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${STEREO_SIZE.width} ${STEREO_SIZE.height}`}
              role="img"
              aria-label={`Transition state of the SN2 reaction of ${sub.name} with hydroxide`}
            >
              <StereoCentre
                umbrella={[{ label: others[0] }, { label: others[1] }, { label: others[2] }]}
                incoming={{ label: <>HO<Sup>δ−</Sup></>, tone: ROLE_TONE.nucleophile, bondOrder: 0.5 }}
                leaving={halogenLabel}
                invert={0.5}
                bracketTS
              />
            </svg>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${MECHANISM_PROFILE_SIZE.width} ${MECHANISM_PROFILE_SIZE.height}`}
              role="img"
              aria-label="One-step energy profile: one hump, the transition state"
            >
              <MechanismProfile kind="one-step" />
            </svg>
          </>
        ) : (
          <>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${PLANAR_CATION_SIZE.width} ${PLANAR_CATION_SIZE.height}`}
              role="img"
              aria-label={`Planar carbocation from ${sub.name}, attacked from both faces`}
            >
              <PlanarCation groups={[others[0], others[1], others[2]]} attackTop attackBottom nucleophile="HO⁻" />
            </svg>
            <svg
              className={styles.svg}
              viewBox={`0 0 ${MECHANISM_PROFILE_SIZE.width} ${MECHANISM_PROFILE_SIZE.height}`}
              role="img"
              aria-label="Two-step energy profile: two humps with the carbocation in the valley"
            >
              <MechanismProfile kind="two-step" intermediateLabel={null} />
            </svg>
          </>
        )}
      </div>

      <div className={styles.readout}>
        <p className={styles.rate}>{rateText}</p>
        {mechanism === 'SN2' ? (
          <div className={styles.bars}>
            {NCERT_FIG_6_3_SN2_RELATIVE_RATE.map((row) => {
              const active = sameDegree(sub, row.degree)
              const width = Math.max((row.relativeRate / NCERT_FIG_6_3_SN2_RELATIVE_RATE[0].relativeRate) * 100, 0.5)
              return (
                <div key={row.degree} className={active ? styles.barRowActive : styles.barRow}>
                  <span className={styles.barName}>{row.unicode}</span>
                  <span className={styles.barTrack}>
                    <span className={styles.barFill} style={{ width: `${row.relativeRate === 0 ? 0 : width}%` }} />
                  </span>
                  <span className={styles.barValue}>{row.display}</span>
                </div>
              )
            })}
            {fig ? null : (
              <p className={styles.note}>
                Allylic and benzylic halides are not in Fig. 6.3, so no SN2 number is shown for them.
              </p>
            )}
          </div>
        ) : (
          <p className={styles.note}>
            The valley between the two humps is the planar carbocation. Carbocation stability: {SN1_ORDER}. Allylic and benzylic cations are stabilised by resonance, so these halides react very readily by SN1.
          </p>
        )}
        <p className={styles.product}>{productText}</p>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
