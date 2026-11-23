'use client'

import { useMemo, useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { SkeletalFormula, StructuralFormula } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  COMMERCIAL_BPS,
  FERMENTATION_LIMITS,
  METHANOL_WINDOW,
  evaluateDenaturationAndProperties,
  evaluateFermentation,
  evaluateMethanolReactor,
  type CommercialAlcoholChoice,
  type EthanolRoute,
  type FermentationFeedstock,
  type FermentationSeal,
  type MethanolCatalyst,
} from '@/lib/chem/c12-u7-s10-alcohols'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import styles from './commercial-alcohols-lab.module.css'

type LabMode = 'methanol' | 'fermentation' | 'properties'

const MODE_OPTIONS = [
  { value: 'methanol', label: 'Methanol Reactor' },
  { value: 'fermentation', label: 'Ethanol Fermentation' },
  { value: 'properties', label: 'Denaturation & Properties' },
] as const satisfies readonly { value: LabMode; label: string }[]

const CATALYST_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'zno-cr2o3', label: 'ZnO-Cr₂O₃' },
] as const satisfies readonly { value: MethanolCatalyst; label: string }[]

const FEEDSTOCK_OPTIONS = [
  { value: 'sucrose', label: 'Sucrose (Molasses / Cane)' },
  { value: 'grape-juice', label: 'Grape Juice (Glucose/Fructose)' },
] as const satisfies readonly { value: FermentationFeedstock; label: string }[]

const INVERTASE_OPTIONS = [
  { value: 'present', label: 'Present' },
  { value: 'absent', label: 'Absent' },
] as const

const SEAL_OPTIONS = [
  { value: 'anaerobic', label: 'Anaerobic (Sealed)' },
  { value: 'air-leak', label: 'Air Leak (O₂ present)' },
] as const satisfies readonly { value: FermentationSeal; label: string }[]

const ALCOHOL_OPTIONS = [
  { value: 'methanol', label: 'Methanol (CH₃OH)' },
  { value: 'ethanol', label: 'Ethanol (C₂H₅OH)' },
] as const satisfies readonly { value: CommercialAlcoholChoice; label: string }[]

const ROUTE_OPTIONS = [
  { value: 'fermentation', label: 'Sugar Fermentation' },
  { value: 'ethene-hydration', label: 'Hydration of Ethene (Sec. 7.4)' },
] as const satisfies readonly { value: EthanolRoute; label: string }[]

const PELLET_COORDS = [
  [252, 166], [282, 166], [312, 166], [342, 166], [372, 166], [402, 166],
  [267, 192], [297, 192], [327, 192], [357, 192], [387, 192],
] as const

function MethanolReactorStage({
  catalyst,
  pressureAtm,
  temperatureK,
}: {
  catalyst: MethanolCatalyst
  pressureAtm: number
  temperatureK: number
}) {
  const res = evaluateMethanolReactor({ catalyst, pressureAtm, temperatureK })
  const meGraph = useMemo(() => parseSmiles('CO'), [])

  // Pressure meter x-mapping (50..350 atm -> x 36..170)
  const pTrackX = 36
  const pTrackW = 134
  const pToX = (p: number) => pTrackX + ((p - 50) / 300) * pTrackW
  const pOptX0 = pToX(200)
  const pOptX1 = pToX(300)
  const pCurrX = pToX(pressureAtm)

  // Temperature meter x-mapping (350..750 K -> x 36..170)
  const tToX = (t: number) => pTrackX + ((t - 350) / 400) * pTrackW
  const tOptX0 = tToX(573)
  const tOptX1 = tToX(673)
  const tCurrX = tToX(temperatureK)

  const heatOpacity = 0.06 + ((temperatureK - 350) / 400) * 0.24
  const fillH = Math.round((res.conversionPercent / 100) * 114)

  return (
    <svg
      className={styles.scene}
      viewBox="0 0 640 360"
      role="img"
      aria-label={`Methanol synthesis reactor: catalyst ${catalyst === 'zno-cr2o3' ? 'ZnO-Cr2O3' : 'none'}, ${pressureAtm} atm, ${temperatureK} K, conversion ${res.conversionPercent}%`}
    >
      {/* Left: Pressure & Temperature condition meters */}
      <rect x={16} y={24} width={174} height={312} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={103} y={50} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Reactor conditions
      </text>

      {/* Pressure track */}
      <text x={36} y={84} fontSize={15} fontWeight={600} fill="var(--fg)">
        P: {pressureAtm} atm
      </text>
      <rect x={pTrackX} y={96} width={pTrackW} height={16} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <rect x={pOptX0} y={96} width={pOptX1 - pOptX0} height={16} rx={4} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1.2} />
      <circle cx={pCurrX} cy={104} r={8} fill={res.inOptimalPressure ? 'var(--success)' : 'var(--caution)'} stroke="var(--surface)" strokeWidth={2} />
      <text x={103} y={134} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Band: 200-300 atm
      </text>

      {/* Temperature track */}
      <text x={36} y={178} fontSize={15} fontWeight={600} fill="var(--fg)">
        T: {temperatureK} K
      </text>
      <rect x={pTrackX} y={190} width={pTrackW} height={16} rx={8} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.2} />
      <rect x={tOptX0} y={190} width={tOptX1 - tOptX0} height={16} rx={4} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={1.2} />
      <circle cx={tCurrX} cy={198} r={8} fill={res.inOptimalTemperature ? 'var(--success)' : 'var(--heat)'} stroke="var(--surface)" strokeWidth={2} />
      <text x={103} y={228} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        Band: 573-673 K
      </text>

      {/* Gas feed */}
      <rect x={30} y={256} width={146} height={58} rx={10} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.6} />
      <text x={103} y={282} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        Feed: CO + 2 H₂
      </text>
      <text x={103} y={304} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        3 mol gas
      </text>

      {/* Feed arrow */}
      <line x1={190} y1={182} x2={214} y2={182} stroke="var(--accent)" strokeWidth={3} />
      <polygon points="222,182 210,175 210,189" fill="var(--accent)" />

      {/* Centre: High-pressure reactor */}
      <rect x={224} y={44} width={212} height={268} rx={20} fill="var(--surface)" stroke="var(--bond)" strokeWidth={3} />
      <rect x={230} y={50} width={200} height={256} rx={16} fill="var(--heat)" fillOpacity={heatOpacity} />
      <text x={330} y={80} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        High-pressure vessel
      </text>
      <text x={330} y={136} textAnchor="middle" fontSize={15} fontWeight={600} fill={catalyst === 'zno-cr2o3' ? 'var(--ox)' : 'var(--fg-muted)'}>
        {catalyst === 'zno-cr2o3' ? 'ZnO-Cr₂O₃ catalyst bed' : 'No catalyst present'}
      </text>

      {PELLET_COORDS.map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={9}
          fill={catalyst === 'zno-cr2o3' ? 'var(--ox)' : 'var(--surface-raised)'}
          fillOpacity={catalyst === 'zno-cr2o3' ? 0.85 : 0.7}
          stroke={catalyst === 'zno-cr2o3' ? 'var(--ox)' : 'var(--border)'}
          strokeWidth={1.5}
          strokeDasharray={catalyst === 'zno-cr2o3' ? undefined : '3 2'}
        />
      ))}

      <rect x={238} y={226} width={184} height={64} rx={10} fill="var(--surface)" stroke={res.isOptimal ? 'var(--success)' : 'var(--border)'} strokeWidth={1.6} />
      <text x={330} y={253} textAnchor="middle" fontSize={15} fontWeight={600} fill={res.isOptimal ? 'var(--success)' : 'var(--fg)'}>
        {res.isOptimal ? 'Optimal synthesis' : res.conversionPercent === 0 ? 'Reaction blocked' : 'Sub-optimal yield'}
      </text>
      <text x={330} y={276} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        3 gas mol → 1 CH₃OH
      </text>

      {/* Outlet arrow */}
      <line x1={438} y1={182} x2={466} y2={182} stroke="var(--liquid-edge)" strokeWidth={3} />
      <polygon points="474,182 462,175 462,189" fill="var(--liquid-edge)" />

      {/* Right: Receiver flask & conversion readout */}
      <rect x={476} y={24} width={148} height={312} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={550} y={52} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        CH₃OH yield
      </text>

      {/* Receiver beaker */}
      <rect x={502} y={72} width={96} height={126} rx={12} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      {fillH > 0 && (
        <rect x={506} y={194 - fillH} width={88} height={fillH} rx={8} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={1.5} />
      )}
      <text x={550} y={226} textAnchor="middle" fontSize={20} fontWeight={700} fill={res.isOptimal ? 'var(--success)' : 'var(--fg)'}>
        {res.conversionPercent}%
      </text>

      <g transform="translate(550, 272)">
        <StructuralFormula graph={meGraph} mode="complete" completeScale={19} scale={42} />
      </g>
      <text x={550} y={322} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        b.p. {res.bpK} K
      </text>
    </svg>
  )
}

function FermentationStage({
  feedstock,
  invertasePresent,
  seal,
  batchProgress,
}: {
  feedstock: FermentationFeedstock
  invertasePresent: boolean
  seal: FermentationSeal
  batchProgress: number
}) {
  const res = evaluateFermentation({ feedstock, invertasePresent, seal, batchProgress })
  const ethanolGraph = useMemo(() => parseSmiles('CCO'), [])
  const acidGraph = useMemo(() => parseSmiles('CC(=O)O'), [])
  const isSour = seal === 'air-leak' && res.ethanoicAcidPercent > 0

  const barTop = 64
  const barBottom = 248
  const barH = barBottom - barTop
  const ethanolH = Math.round((res.ethanolPercent / FERMENTATION_LIMITS.gaugeMaxPercent) * barH)
  const acidH = Math.round((res.ethanoicAcidPercent / FERMENTATION_LIMITS.gaugeMaxPercent) * barH)
  const limitY = Math.round(barBottom - (FERMENTATION_LIMITS.zymaseInhibitionPercent / FERMENTATION_LIMITS.gaugeMaxPercent) * barH)

  const vatLiquidColor = !res.hexosesReady
    ? 'var(--caution-soft)'
    : seal === 'air-leak' && res.ethanoicAcidPercent > 0
      ? 'var(--ox)'
      : 'var(--liquid)'

  return (
    <svg
      className={styles.scene}
      viewBox="0 0 640 360"
      role="img"
      aria-label={`Ethanol fermentation vat: feedstock ${feedstock}, seal ${seal}, ethanol ${res.ethanolPercent}%, status ${res.zymaseStatus}`}
    >
      {/* Left: Fermentation vat */}
      <rect x={16} y={22} width={190} height={316} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />

      <rect
        x={28}
        y={34}
        width={166}
        height={32}
        rx={8}
        fill={seal === 'anaerobic' ? 'var(--success-soft)' : 'var(--caution-soft)'}
        stroke={seal === 'anaerobic' ? 'var(--success)' : 'var(--caution)'}
        strokeWidth={1.5}
      />
      <text
        x={111}
        y={56}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill={seal === 'anaerobic' ? 'var(--success)' : 'var(--caution)'}
      >
        {seal === 'anaerobic' ? 'Anaerobic seal' : 'Air leak: O₂ in'}
      </text>

      {/* Airlock pipe + lid assembly & CO2 bubbles */}
      <g transform={seal === 'air-leak' ? 'rotate(-8 38 112)' : undefined}>
        <path d="M 111 116 L 111 86 L 136 86" fill="none" stroke="var(--bond)" strokeWidth={2.8} strokeLinecap="round" />
        <rect x={38} y={112} width={146} height={10} rx={4} fill="var(--bond)" />
      </g>
      {res.co2Rate > 0 && (
        <g>
          <circle cx={111} cy={148} r={5} fill="var(--bubble-fill)" stroke="var(--bond)" strokeWidth={1.2} />
          <circle cx={120} cy={130} r={6} fill="var(--bubble-fill)" stroke="var(--bond)" strokeWidth={1.2} />
          <text x={144} y={92} fontSize={15} fontWeight={600} fill="var(--accent)">
            CO₂↑
          </text>
        </g>
      )}
      {seal === 'air-leak' && (
        <g>
          <circle cx={72} cy={128} r={7} fill="var(--atom-o)" />
          <circle cx={86} cy={128} r={7} fill="var(--atom-o)" />
          <text x={58} y={134} textAnchor="end" fontSize={15} fontWeight={600} fill="var(--atom-o)">
            O₂
          </text>
        </g>
      )}

      {/* Vessel */}
      <rect x={42} y={116} width={138} height={178} rx={14} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      <rect
        x={46}
        y={176}
        width={130}
        height={114}
        rx={10}
        fill={vatLiquidColor}
        fillOpacity={isSour ? 0.36 : 0.78}
        stroke="var(--liquid-edge)"
        strokeWidth={1.4}
      />
      <text x={111} y={226} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {feedstock === 'sucrose' ? 'Sucrose vat' : 'Grape must'}
      </text>
      <text x={111} y={252} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {batchProgress}% progress
      </text>
      <text x={111} y={322} textAnchor="middle" fontSize={15} fontWeight={600} fill={isSour ? 'var(--caution)' : 'var(--fg)'}>
        {isSour ? 'Sour / Spoiled' : !res.hexosesReady ? 'Unfermented' : batchProgress > 0 ? 'Fresh / Wine' : 'Ready'}
      </text>

      {/* Centre: Enzyme track */}
      <rect x={218} y={22} width={230} height={316} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />

      <rect
        x={232}
        y={36}
        width={202}
        height={72}
        rx={10}
        fill="var(--surface)"
        stroke={res.hexosesReady ? 'var(--accent)' : 'var(--caution)'}
        strokeWidth={1.8}
      />
      <text x={333} y={64} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        {feedstock === 'sucrose' ? 'Step 1: Invertase' : 'Grape sugars'}
      </text>
      <text x={333} y={90} textAnchor="middle" fontSize={15} fill={res.hexosesReady ? 'var(--accent)' : 'var(--caution)'}>
        {feedstock === 'sucrose'
          ? invertasePresent
            ? 'Sucrose → 2 C₆H₁₂O₆'
            : 'Absent: Sucrose uncut'
          : 'C₆H₁₂O₆ already ready'}
      </text>

      <line x1={333} y1={110} x2={333} y2={134} stroke={res.hexosesReady ? 'var(--accent)' : 'var(--border)'} strokeWidth={2.5} />
      <polygon points="333,142 326,130 340,130" fill={res.hexosesReady ? 'var(--accent)' : 'var(--border)'} />

      <rect
        x={232}
        y={144}
        width={202}
        height={84}
        rx={10}
        fill={res.zymaseInhibited ? 'var(--caution-soft)' : 'var(--surface)'}
        stroke={res.zymaseInhibited ? 'var(--caution)' : res.hexosesReady ? 'var(--success)' : 'var(--border)'}
        strokeWidth={1.8}
      />
      <text x={333} y={172} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        Step 2: Zymase (yeast)
      </text>
      <text
        x={333}
        y={198}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill={res.zymaseInhibited ? 'var(--caution)' : seal === 'air-leak' ? 'var(--ox)' : res.hexosesReady ? 'var(--success)' : 'var(--fg-muted)'}
      >
        {res.zymaseInhibited
          ? 'Inhibited (>14%)'
          : !res.hexosesReady
            ? 'Cannot act on sucrose'
            : seal === 'air-leak'
              ? 'O₂ oxidises product'
              : 'C₆H₁₂O₆ → 2 C₂H₅OH'}
      </text>

      {/* Product molecule / outcome box */}
      <rect x={232} y={244} width={202} height={80} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
      <g transform="translate(278, 284)">
        <SkeletalFormula graph={isSour ? acidGraph : ethanolGraph} scale={isSour ? 38 : 42} />
      </g>
      <text x={372} y={278} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        {isSour ? 'CH₃COOH' : 'C₂H₅OH'}
      </text>
      <text x={372} y={302} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">
        {isSour ? 'acidic' : 'b.p. 351 K'}
      </text>

      {/* Right: Alcohol % gauge */}
      <rect x={460} y={22} width={164} height={316} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={542} y={48} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Concentration
      </text>

      <rect x={492} y={barTop} width={44} height={barH} rx={6} fill="var(--surface)" stroke="var(--bond)" strokeWidth={1.6} />
      {ethanolH > 0 && (
        <rect
          x={494}
          y={barBottom - ethanolH}
          width={40}
          height={ethanolH}
          rx={4}
          fill={res.zymaseInhibited ? 'var(--caution)' : 'var(--accent)'}
        />
      )}
      {acidH > 0 && (
        <rect
          x={494}
          y={barBottom - ethanolH - acidH}
          width={40}
          height={acidH}
          rx={2}
          fill="var(--ox)"
        />
      )}

      {/* 14% cap line */}
      <line x1={478} y1={limitY} x2={554} y2={limitY} stroke="var(--caution)" strokeWidth={2.4} strokeDasharray="5 3" />
      <text x={560} y={limitY + 5} fontSize={15} fontWeight={600} fill="var(--caution)">
        14%
      </text>
      <text x={560} y={barTop + 14} fontSize={15} fill="var(--fg-muted)">
        20%
      </text>
      <text x={560} y={barBottom} fontSize={15} fill="var(--fg-muted)">
        0%
      </text>

      <text x={542} y={282} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--fg)">
        Ethanol: {res.ethanolPercent}%
      </text>
      <text x={542} y={310} textAnchor="middle" fontSize={15} fill={res.ethanoicAcidPercent > 0 ? 'var(--caution)' : 'var(--fg-muted)'}>
        {res.ethanoicAcidPercent > 0 ? `Acid: ${res.ethanoicAcidPercent}%` : 'Max cap: 14%'}
      </text>
    </svg>
  )
}

function DenaturationAndPropertiesStage({
  alcohol,
  ethanolRoute,
  hasCopperSulphate,
  hasPyridine,
}: {
  alcohol: CommercialAlcoholChoice
  ethanolRoute: EthanolRoute
  hasCopperSulphate: boolean
  hasPyridine: boolean
}) {
  const res = evaluateDenaturationAndProperties({
    alcohol,
    ethanolRoute,
    hasCopperSulphate,
    hasPyridine,
  })
  const molGraph = useMemo(() => parseSmiles(alcohol === 'methanol' ? 'CO' : 'CCO'), [alcohol])
  const pyrGraph = useMemo(() => parseSmiles('C1=CC=NC=C1'), [])

  // Boiling point thermometer scale: 290 K..370 K mapped to y=268..74
  const yOfBp = (bpK: number) => Math.round(268 - ((bpK - 290) / (370 - 290)) * 184)
  const yMe = yOfBp(COMMERCIAL_BPS.methanolK)
  const yEt = yOfBp(COMMERCIAL_BPS.ethanolK)

  const beakerFill = res.liquidTint === 'blue' ? 'var(--cuso4-blue)' : 'var(--liquid)'
  const beakerOpacity = res.liquidTint === 'blue' ? 0.45 : 0.72

  return (
    <svg
      className={styles.scene}
      viewBox="0 0 640 360"
      role="img"
      aria-label={`${res.name} boiling point ${res.bpK} K, status ${res.safetyBadge}`}
    >
      {/* Left: Side-by-side boiling point thermometers */}
      <rect x={16} y={22} width={274} height={316} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={153} y={50} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Boiling point comparison
      </text>

      {/* Methanol thermometer */}
      <rect x={76} y={70} width={22} height={212} rx={11} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={1.8} />
      <rect
        x={81}
        y={yMe}
        width={12}
        height={282 - yMe}
        rx={5}
        fill={alcohol === 'methanol' ? 'var(--accent)' : 'var(--fg-muted)'}
      />
      <circle cx={87} cy={286} r={16} fill={alcohol === 'methanol' ? 'var(--accent)' : 'var(--fg-muted)'} stroke="var(--glass-wall)" strokeWidth={1.8} />
      <text x={87} y={yMe - 10} textAnchor="middle" fontSize={16} fontWeight={600} fill={alcohol === 'methanol' ? 'var(--accent)' : 'var(--fg)'}>
        337 K
      </text>
      <text x={87} y={324} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        CH₃OH
      </text>

      {/* Ethanol thermometer */}
      <rect x={198} y={70} width={22} height={212} rx={11} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={1.8} />
      <rect
        x={203}
        y={yEt}
        width={12}
        height={282 - yEt}
        rx={5}
        fill={alcohol === 'ethanol' ? 'var(--accent)' : 'var(--fg-muted)'}
      />
      <circle cx={209} cy={286} r={16} fill={alcohol === 'ethanol' ? 'var(--accent)' : 'var(--fg-muted)'} stroke="var(--glass-wall)" strokeWidth={1.8} />
      <text x={209} y={yEt - 10} textAnchor="middle" fontSize={16} fontWeight={600} fill={alcohol === 'ethanol' ? 'var(--accent)' : 'var(--fg)'}>
        351 K
      </text>
      <text x={209} y={324} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
        C₂H₅OH
      </text>

      {/* +14 K delta bracket */}
      <line x1={104} y1={yMe} x2={192} y2={yMe} stroke="var(--accent)" strokeWidth={1.5} strokeDasharray="4 3" />
      <line x1={148} y1={yEt} x2={148} y2={yMe} stroke="var(--accent)" strokeWidth={2.2} />
      <text x={148} y={yEt - 6} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--accent)">
        +14 K
      </text>

      {/* Right: Liquid flask & additives */}
      <rect x={304} y={22} width={320} height={316} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={464} y={50} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {alcohol === 'methanol' ? 'Methanol sample' : 'Commercial ethanol sample'}
      </text>

      {/* Pyridine odour waves above beaker */}
      {res.hasOdourVapour && (
        <g>
          <path d="M 380 114 Q 372 100 382 88 Q 392 76 382 66" fill="none" stroke="var(--atom-n)" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M 412 114 Q 404 100 414 88 Q 424 76 414 66" fill="none" stroke="var(--atom-n)" strokeWidth={2.4} strokeLinecap="round" />
          <path d="M 444 114 Q 436 100 446 88 Q 456 76 446 66" fill="none" stroke="var(--atom-n)" strokeWidth={2.4} strokeLinecap="round" />
          <g transform="translate(546, 108)">
            <SkeletalFormula graph={pyrGraph} scale={42} />
          </g>
          <text x={546} y={172} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--atom-n)">
            Pyridine odour
          </text>
        </g>
      )}

      {/* Beaker */}
      <rect x={346} y={120} width={134} height={154} rx={12} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2.2} />
      <rect
        x={350}
        y={170}
        width={126}
        height={100}
        rx={8}
        fill={beakerFill}
        fillOpacity={beakerOpacity}
        stroke={res.liquidTint === 'blue' ? 'var(--cuso4-blue)' : 'var(--liquid-edge)'}
        strokeWidth={1.6}
      />
      <text x={413} y={226} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {res.liquidTint === 'blue' ? 'Blue CuSO₄' : 'Colourless'}
      </text>

      {/* Molecule diagram beside flask */}
      {!res.hasOdourVapour && (
        <g>
          <g transform="translate(546, 152)">
            <SkeletalFormula graph={molGraph} scale={44} />
          </g>
          <text x={546} y={208} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--fg)">
            {res.formula}
          </text>
        </g>
      )}

      {/* Route / status strip inside right panel */}
      <rect
        x={322}
        y={288}
        width={284}
        height={38}
        rx={8}
        fill={alcohol === 'methanol' || res.isDenatured ? 'var(--caution-soft)' : 'var(--surface)'}
        stroke={alcohol === 'methanol' || res.isDenatured ? 'var(--caution)' : 'var(--border)'}
        strokeWidth={1.6}
      />
      <text
        x={464}
        y={312}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill={alcohol === 'methanol' || res.isDenatured ? 'var(--caution)' : 'var(--fg)'}
      >
        {alcohol === 'methanol'
          ? 'Poisonous: HCHO / HCOOH'
          : res.isFullyDenatured
            ? 'Denatured: Unfit for drinking'
            : res.isDenatured
              ? 'Partially denatured'
              : ethanolRoute === 'fermentation'
                ? 'Route: Sugar fermentation'
                : 'Route: Ethene hydration'}
      </text>
    </svg>
  )
}

export function CommercialAlcoholsLab(_props: SimulationProps) {
  const [mode, setMode] = useState<LabMode>('methanol')

  // Methanol Reactor controls
  const [catalyst, setCatalyst] = useState<MethanolCatalyst>('zno-cr2o3')
  const [pressureAtm, setPressureAtm] = useState<number>(METHANOL_WINDOW.defaultPressureAtm)
  const [temperatureK, setTemperatureK] = useState<number>(METHANOL_WINDOW.defaultTemperatureK)

  // Ethanol Fermentation controls
  const [feedstock, setFeedstock] = useState<FermentationFeedstock>('sucrose')
  const [invertasePresent, setInvertasePresent] = useState<boolean>(true)
  const [seal, setSeal] = useState<FermentationSeal>('anaerobic')
  const [batchProgress, setBatchProgress] = useState<number>(60)

  // Denaturation & Properties controls
  const [alcohol, setAlcohol] = useState<CommercialAlcoholChoice>('ethanol')
  const [ethanolRoute, setEthanolRoute] = useState<EthanolRoute>('fermentation')
  const [hasCopperSulphate, setHasCopperSulphate] = useState<boolean>(false)
  const [hasPyridine, setHasPyridine] = useState<boolean>(false)

  const methanolRes = evaluateMethanolReactor({ catalyst, pressureAtm, temperatureK })
  const fermentationRes = evaluateFermentation({ feedstock, invertasePresent, seal, batchProgress })
  const propertiesRes = evaluateDenaturationAndProperties({
    alcohol,
    ethanolRoute,
    hasCopperSulphate,
    hasPyridine,
  })

  const liveSummary =
    mode === 'methanol'
      ? `Methanol reactor: ${methanolRes.conversionPercent}% conversion, ${methanolRes.status}, boiling point ${methanolRes.bpK} K.`
      : mode === 'fermentation'
        ? `Ethanol fermentation: ${fermentationRes.ethanolPercent}% ethanol, ${fermentationRes.zymaseStatus}, taste ${fermentationRes.tasteStatus}.`
        : `${propertiesRes.name}: boiling point ${propertiesRes.bpK} K, ${propertiesRes.safetyBadge}.`

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Mode</span>
          <Segmented label="Lab mode" options={MODE_OPTIONS} value={mode} onChange={setMode} />
        </div>

        {mode === 'methanol' && (
          <>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Catalyst</span>
              <Segmented label="Catalyst" options={CATALYST_OPTIONS} value={catalyst} onChange={setCatalyst} />
            </div>
            <div className={`${styles.controlGroup} ${styles.sliderWrap}`}>
              <Slider
                label="Pressure"
                min={METHANOL_WINDOW.pressureMinAtm}
                max={METHANOL_WINDOW.pressureMaxAtm}
                step={METHANOL_WINDOW.pressureStepAtm}
                value={pressureAtm}
                unit="atm"
                onChange={setPressureAtm}
              />
              <span className={styles.sliderBandHint}>NCERT optimal: 200-300 atm</span>
            </div>
            <div className={`${styles.controlGroup} ${styles.sliderWrap}`}>
              <Slider
                label="Temperature"
                min={METHANOL_WINDOW.temperatureMinK}
                max={METHANOL_WINDOW.temperatureMaxK}
                step={METHANOL_WINDOW.temperatureStepK}
                value={temperatureK}
                unit="K"
                onChange={setTemperatureK}
              />
              <span className={styles.sliderBandHint}>NCERT optimal: 573-673 K</span>
            </div>
          </>
        )}

        {mode === 'fermentation' && (
          <>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Feedstock</span>
              <Segmented label="Feedstock" options={FEEDSTOCK_OPTIONS} value={feedstock} onChange={setFeedstock} />
            </div>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Invertase</span>
              <Segmented
                label="Invertase"
                options={INVERTASE_OPTIONS}
                value={invertasePresent ? 'present' : 'absent'}
                onChange={(v) => setInvertasePresent(v === 'present')}
              />
            </div>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Vat seal</span>
              <Segmented label="Vat seal" options={SEAL_OPTIONS} value={seal} onChange={setSeal} />
            </div>
            <div className={`${styles.controlGroup} ${styles.sliderWrap}`}>
              <Slider
                label="Batch progress"
                min={0}
                max={100}
                step={5}
                value={batchProgress}
                unit="%"
                onChange={setBatchProgress}
              />
              <span className={styles.sliderBandHint}>Zymase inhibition ceiling: 14% ethanol</span>
            </div>
          </>
        )}

        {mode === 'properties' && (
          <>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Alcohol</span>
              <Segmented label="Alcohol" options={ALCOHOL_OPTIONS} value={alcohol} onChange={setAlcohol} />
            </div>
            {alcohol === 'ethanol' && (
              <>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Ethanol route</span>
                  <Segmented label="Ethanol route" options={ROUTE_OPTIONS} value={ethanolRoute} onChange={setEthanolRoute} />
                </div>
                <div className={styles.controlGroup}>
                  <span className={styles.controlLabel}>Denaturing additives</span>
                  <div className={styles.checkboxRow} role="group" aria-label="Denaturing additives">
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={hasCopperSulphate}
                        onChange={(e) => setHasCopperSulphate(e.target.checked)}
                      />
                      <span>Copper sulphate (colour)</span>
                    </label>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={hasPyridine}
                        onChange={(e) => setHasPyridine(e.target.checked)}
                      />
                      <span>Pyridine (foul odour)</span>
                    </label>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </SimulationControls>

      <div className={styles.stage}>
        {mode === 'methanol' && (
          <MethanolReactorStage catalyst={catalyst} pressureAtm={pressureAtm} temperatureK={temperatureK} />
        )}
        {mode === 'fermentation' && (
          <FermentationStage
            feedstock={feedstock}
            invertasePresent={invertasePresent}
            seal={seal}
            batchProgress={batchProgress}
          />
        )}
        {mode === 'properties' && (
          <DenaturationAndPropertiesStage
            alcohol={alcohol}
            ethanolRoute={ethanolRoute}
            hasCopperSulphate={hasCopperSulphate}
            hasPyridine={hasPyridine}
          />
        )}
      </div>

      {mode === 'methanol' && (
        <div className={styles.readoutGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Balanced Equation</span>
            <span className={styles.statValue}>{methanolRes.equation}</span>
            <span className={styles.statSub}>{methanolRes.diagnostic}</span>
          </div>
          <div className={`${styles.statCard} ${methanolRes.isOptimal ? styles.statCardSuccess : styles.statCardAlert}`}>
            <span className={styles.statLabel}>Reactor Conversion</span>
            <span className={styles.statValue} data-testid="primary-metric">
              {methanolRes.conversionPercent}% ({methanolRes.status})
            </span>
            <span className={styles.statSub}>{methanolRes.byProduct}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Boiling Point &amp; Uses</span>
            <span className={styles.statValue}>{methanolRes.bpK} K</span>
            <span className={styles.statSub}>{methanolRes.uses}</span>
          </div>
          <div className={`${styles.statCard} ${styles.statCardAlert}`}>
            <span className={styles.statLabel}>Toxicity Hazard</span>
            <span className={styles.statValue}>Severely poisonous</span>
            <span className={styles.statSub}>{methanolRes.safetyNote}</span>
          </div>
        </div>
      )}

      {mode === 'fermentation' && (
        <div className={styles.readoutGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Active Reaction</span>
            <span className={styles.statValue}>{fermentationRes.equation}</span>
            <span className={styles.statSub}>{fermentationRes.diagnostic}</span>
          </div>
          <div
            className={`${styles.statCard} ${
              fermentationRes.zymaseInhibited || seal === 'air-leak' || !fermentationRes.hexosesReady
                ? styles.statCardAlert
                : styles.statCardSuccess
            }`}
          >
            <span className={styles.statLabel}>Ethanol Concentration &amp; Enzyme</span>
            <span className={styles.statValue} data-testid="primary-metric">
              {fermentationRes.ethanolPercent}% v/v ({fermentationRes.zymaseStatus})
            </span>
            <span className={styles.statSub}>{fermentationRes.byProduct}</span>
          </div>
          <div className={`${styles.statCard} ${seal === 'air-leak' ? styles.statCardAlert : ''}`}>
            <span className={styles.statLabel}>Taste &amp; Oxidation Status</span>
            <span className={styles.statValue}>{fermentationRes.tasteStatus}</span>
            <span className={styles.statSub}>
              {fermentationRes.ethanoicAcidPercent > 0
                ? `CH₃COOH formed: ${fermentationRes.ethanoicAcidPercent}%`
                : 'No ethanoic acid formed'}
            </span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Boiling Point &amp; Limit</span>
            <span className={styles.statValue}>{fermentationRes.bpK} K (14% cap)</span>
            <span className={styles.statSub}>Higher strength requires distillation</span>
          </div>
        </div>
      )}

      {mode === 'properties' && (
        <div className={styles.readoutGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Production Equation</span>
            <span className={styles.statValue}>{propertiesRes.equation}</span>
            <span className={styles.statSub}>{propertiesRes.byProduct}</span>
          </div>
          <div
            className={`${styles.statCard} ${
              alcohol === 'methanol' || propertiesRes.isDenatured ? styles.statCardAlert : ''
            }`}
          >
            <span className={styles.statLabel}>Safety &amp; Denaturation</span>
            <span className={styles.statValue} data-testid="primary-metric">
              {propertiesRes.safetyBadge}
            </span>
            <span className={styles.statSub}>{propertiesRes.toxicityNote}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Normal Boiling Point</span>
            <span className={styles.statValue}>
              {propertiesRes.bpK} K ({alcohol === 'ethanol' ? '14 K above methanol' : '14 K below ethanol'})
            </span>
            <span className={styles.statSub}>Colourless pure liquid at room temperature</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Industrial Applications</span>
            <span className={styles.statValue}>{propertiesRes.name}</span>
            <span className={styles.statSub}>{propertiesRes.uses}</span>
          </div>
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
