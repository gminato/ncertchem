'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import { HALOGEN_TONE, halogenLabel } from '@/components/vocab/organic6/tones'
import {
  ALKYL_GROUPS,
  HALIDE_HALOGENS,
  TABLE_6_3_LIQUIDS,
  halideProperties,
  table63Liquid,
  type HalideProperties,
} from '@/lib/chem/halide-properties'
import { NCERT_TABLE_6_3, ROOM_TEMPERATURE_K, WATER_DENSITY_G_PER_ML, type AlkylGroup, type Halogen } from '@/lib/chem/ncert-c12-unit6-data'
import styles from './halide-properties-lab.module.css'

const SOURCE_OPTIONS = [
  { value: 'alkyl', label: 'Alkyl halide, R–X' },
  { value: 'liquid', label: 'Liquid from Table 6.3' },
] as const satisfies readonly { value: string; label: string }[]

const ALKYL_OPTIONS = [
  { value: 'methyl', label: 'methyl, CH₃–X' },
  { value: 'ethyl', label: 'ethyl, C₂H₅–X' },
  { value: 'n-propyl', label: 'n-propyl, C₃H₇–X' },
] as const satisfies readonly { value: AlkylGroup; label: string }[]

const HALOGEN_OPTIONS = HALIDE_HALOGENS.map((h) => ({ value: h, label: halogenLabel(h) }))

const LIQUID_OPTIONS = NCERT_TABLE_6_3.map((r) => ({ value: r.ce, label: r.unicode }))

type Source = (typeof SOURCE_OPTIONS)[number]['value']

/** Thermometer scale: 100 K at the bulb (y 340), 400 K at the top (y 40). One drawn unit per kelvin. */
const yOf = (kelvin: number) => 340 - (kelvin - 100)
const TUBE_TOP = 40
const WATER_TOP = 68
const WATER_BOTTOM = 312
const WATER_MID = (WATER_TOP + WATER_BOTTOM) / 2
const NO_BP = "not in this lab's data"

function summary(p: HalideProperties): string {
  const boil =
    p.bpK === null || p.phase === null
      ? `${p.unicode} has no boiling point in this lab's data.`
      : `${p.unicode} boils at ${p.bpK} K (standard data), so it is ${p.phase === 'gas' ? 'a gas' : 'a liquid'} at ${ROOM_TEMPERATURE_K} K.`
  if (!p.density || !p.layer) return `${boil} Table 6.3 has no density for this compound.`
  return `${boil} Its density is ${p.density.printed} g mL⁻¹, so it ${p.layer} in water (water is ${WATER_DENSITY_G_PER_ML.toFixed(2)} g mL⁻¹).`
}

export function HalidePropertiesLab() {
  const [source, setSource] = useState<Source>('alkyl')
  const [alkyl, setAlkyl] = useState<AlkylGroup>('n-propyl')
  const [halogen, setHalogen] = useState<Halogen>('Br')
  const [liquid, setLiquid] = useState<string>(TABLE_6_3_LIQUIDS[0])
  const p = source === 'alkyl' ? halideProperties(alkyl, halogen) : table63Liquid(liquid)
  const tone = HALOGEN_TONE[p.halogen]
  const phaseClass = p.phase === 'gas' ? styles.gas : styles.liquid
  const halideMid = p.layer === 'sinks' ? (WATER_MID + WATER_BOTTOM) / 2 : (WATER_TOP + WATER_MID) / 2
  const waterMid = p.layer === 'sinks' ? (WATER_TOP + WATER_MID) / 2 : (WATER_MID + WATER_BOTTOM) / 2

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented label="Compounds" options={SOURCE_OPTIONS} value={source} onChange={setSource} />
        {source === 'alkyl' ? (
          <>
            <Segmented label="Alkyl group" options={ALKYL_OPTIONS} value={alkyl} onChange={setAlkyl} />
            <Segmented label="Halogen" options={HALOGEN_OPTIONS} value={halogen} onChange={setHalogen} />
          </>
        ) : (
          <Segmented label="Liquid" options={LIQUID_OPTIONS} value={liquid} onChange={setLiquid} />
        )}
      </div>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox="0 0 520 380" role="img" aria-label={`Thermometer and test tube for ${p.unicode}: boiling point ${p.bpK === null ? NO_BP : `${p.bpK} K`}, density ${p.density ? `${p.density.printed} g mL⁻¹` : 'not in Table 6.3'}`}>
          {/* Thermometer: boiling point against the room-temperature line */}
          <text x={160} y={28} textAnchor="middle" className={styles.title}>boiling point / K</text>
          <line x1={20} x2={146} y1={yOf(ROOM_TEMPERATURE_K)} y2={yOf(ROOM_TEMPERATURE_K)} className={styles.roomLine} />
          <text x={20} y={yOf(ROOM_TEMPERATURE_K) - 8} className={styles.muted}>room 298 K</text>
          <rect x={150} y={TUBE_TOP} width={20} height={300} rx={10} className={styles.glass} />
          {p.bpK !== null ? (
            <rect x={154} y={yOf(p.bpK)} width={12} height={350 - yOf(p.bpK)} className={phaseClass} />
          ) : null}
          <circle cx={160} cy={350} r={17} className={styles.glass} />
          {p.bpK !== null ? <circle cx={160} cy={350} r={13} className={phaseClass} /> : null}
          {p.parent ? (
            <>
              <line x1={140} x2={150} y1={yOf(p.parent.bpK)} y2={yOf(p.parent.bpK)} className={styles.parentTick} />
              <text x={134} y={yOf(p.parent.bpK) + 5} textAnchor="end" className={styles.label}>
                {p.parent.unicode} {p.parent.bpK} K
              </text>
            </>
          ) : null}
          {p.bpK !== null && p.phase !== null ? (
            <>
              <text x={172} y={yOf(p.bpK) + 5} className={styles.value}>{p.bpK} K</text>
              <text x={172} y={yOf(p.bpK) + 23} className={styles.phase}>{p.phase}</text>
            </>
          ) : (
            <>
              <text x={20} y={200} className={styles.muted}>boiling point</text>
              <text x={20} y={218} className={styles.muted}>not in this</text>
              <text x={20} y={236} className={styles.muted}>lab&apos;s data</text>
            </>
          )}

          {/* Test tube: where the liquid settles against water */}
          <text x={360} y={28} textAnchor="middle" className={styles.title}>density / g mL⁻¹</text>
          <rect x={320} y={64} width={80} height={252} rx={8} className={styles.glass} />
          {p.density && p.layer ? (
            <>
              <rect x={324} y={p.layer === 'sinks' ? WATER_TOP : WATER_MID} width={72} height={WATER_BOTTOM - WATER_MID} className={styles.water} />
              <rect x={324} y={p.layer === 'sinks' ? WATER_MID : WATER_TOP} width={72} height={WATER_BOTTOM - WATER_MID} style={{ fill: tone }} className={styles.halideLayer} />
              <text x={412} y={waterMid - 4} className={styles.label}>water</text>
              <text x={412} y={waterMid + 14} className={styles.label}>1.00</text>
              <text x={412} y={halideMid - 4} className={styles.value}>{p.density.printed}</text>
              <text x={412} y={halideMid + 14} className={styles.label}>g mL⁻¹</text>
              <text x={412} y={halideMid + 34} className={styles.phase}>{p.layer}</text>
            </>
          ) : (
            <>
              <rect x={324} y={WATER_TOP} width={72} height={WATER_BOTTOM - WATER_TOP} className={styles.water} />
              <text x={412} y={WATER_MID - 4} className={styles.label}>water</text>
              <text x={412} y={WATER_MID + 14} className={styles.label}>1.00</text>
              <text x={360} y={345} textAnchor="middle" className={styles.muted}>density not in Table 6.3</text>
            </>
          )}
        </svg>
      </div>

      <div className={styles.readout}>
        <div className={styles.stat}>
          <span className={styles.statLabel}>{p.unicode}, boiling point{p.bpK === null ? '' : ' (standard data)'}</span>
          <span className={styles.statValue}>{p.bpK === null ? NO_BP : `${p.bpK} K`}</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>At {ROOM_TEMPERATURE_K} K</span>
          <span className={styles.statValue}>{p.phase === null ? NO_BP : p.phase === 'gas' ? 'gas' : 'liquid'}</span>
        </div>
        {p.parent ? (
          <div className={styles.stat}>
            <span className={styles.statLabel}>Parent alkane</span>
            <span className={styles.statValue}>{p.parent.unicode}: {p.parent.bpK} K</span>
          </div>
        ) : null}
        <div className={styles.stat}>
          <span className={styles.statLabel}>Density (Table 6.3)</span>
          <span className={styles.statValue}>{p.density ? `${p.density.printed} g mL⁻¹` : 'not in Table 6.3'}</span>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary(p)}
      </p>
    </div>
  )
}
