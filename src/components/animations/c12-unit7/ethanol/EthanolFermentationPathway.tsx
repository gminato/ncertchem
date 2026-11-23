'use client'

import { useMemo } from 'react'
import { SkeletalFormula } from '@/components/organic'
import { useReveal, useStepTween } from '@/components/animations/unit4/vbt/useStepTween'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ETHANOL_FACTS,
  ETHANOL_SMILES,
  ETHANOL_STEP_COUNT,
  ETHANOL_STEP_LABELS,
  ETHANOL_STEP_TITLES,
} from './ethanol-steps'

export interface EthanolFermentationPathwayProps {
  step: number
  reducedMotion: boolean
}

const W = 600
const H = 480

/** Six-membered glucose ring (left) and five-membered fructose ring (right) for sucrose/hexoses. */
function SugarRingPair({ splitProgress }: { splitProgress: number }) {
  const dx = 22 * splitProgress
  return (
    <g>
      {/* 6-membered hexagon (Glucose unit) */}
      <polygon
        points={`${-22 - dx},-16 ${-4 - dx},-26 ${14 - dx},-16 ${14 - dx},6 ${-4 - dx},16 ${-22 - dx},6`}
        fill="var(--accent-soft)"
        stroke="var(--accent)"
        strokeWidth={2}
      />
      {/* Glycosidic bridge disappears as sucrose cleaves */}
      {splitProgress < 0.7 && (
        <line
          x1={14 - dx}
          y1={-5}
          x2={22 + dx}
          y2={-5}
          stroke="var(--atom-o)"
          strokeWidth={2.5}
          opacity={1 - splitProgress / 0.7}
        />
      )}
      {/* 5-membered pentagon (Fructose unit) */}
      <polygon
        points={`${22 + dx},-16 ${40 + dx},-24 ${54 + dx},-6 ${44 + dx},14 ${24 + dx},12`}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={2}
      />
    </g>
  )
}

function FermentationVat({ step, reveal }: { step: number; reveal: number }) {
  const isAirLeak = step === 3
  const isBubbling = step === 1
  const isHalted = step === 2

  const liquidFill = isAirLeak ? 'var(--ox)' : step === 0 ? 'var(--caution-soft)' : 'var(--liquid)'
  const liquidOpacity = isAirLeak ? 0.35 : 0.75

  return (
    <g>
      {/* Left panel frame */}
      <rect x={16} y={62} width={174} height={368} rx={14} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />

      {/* Airlock status pill */}
      <rect
        x={26}
        y={74}
        width={154}
        height={32}
        rx={8}
        fill={isAirLeak ? 'var(--caution-soft)' : 'var(--success-soft)'}
        stroke={isAirLeak ? 'var(--caution)' : 'var(--success)'}
        strokeWidth={1.5}
      />
      <text
        x={103}
        y={96}
        textAnchor="middle"
        fontSize={16}
        fontWeight={600}
        fill={isAirLeak ? 'var(--caution)' : 'var(--success)'}
      >
        {isAirLeak ? 'Air leak: O₂ in' : 'Seal: No air'}
      </text>

      {/* One-way CO2 gas vent pipe + lid assembly */}
      <g transform={isAirLeak ? 'rotate(-8 30 158)' : undefined}>
        <path d="M 103 162 L 103 130 L 128 130" fill="none" stroke="var(--bond)" strokeWidth={3} strokeLinecap="round" />
        <rect x={30} y={158} width={146} height={12} rx={5} fill="var(--bond)" />
      </g>
      {isBubbling && (
        <g opacity={reveal}>
          <circle cx={103} cy={196} r={5} fill="var(--bubble-fill)" stroke="var(--bond)" strokeWidth={1.2} />
          <circle cx={110} cy={176} r={6} fill="var(--bubble-fill)" stroke="var(--bond)" strokeWidth={1.2} />
          <text x={134} y={136} fontSize={16} fontWeight={600} fill="var(--accent)">
            CO₂↑
          </text>
        </g>
      )}
      {isHalted && (
        <text x={134} y={136} fontSize={16} fontWeight={600} fill="var(--caution)">
          Halted
        </text>
      )}

      {/* O2 molecules outside when sealed, or entering when leaky */}
      {isAirLeak ? (
        <g opacity={reveal}>
          <circle cx={86} cy={176} r={8} fill="var(--atom-o)" fillOpacity={0.85} />
          <circle cx={100} cy={176} r={8} fill="var(--atom-o)" fillOpacity={0.85} />
          <text x={136} y={182} fontSize={16} fontWeight={600} fill="var(--atom-o)">
            O₂
          </text>
        </g>
      ) : (
        <g opacity={0.7}>
          <circle cx={40} cy={132} r={7} fill="var(--atom-o)" fillOpacity={0.55} />
          <circle cx={52} cy={132} r={7} fill="var(--atom-o)" fillOpacity={0.55} />
          <text x={66} y={138} fontSize={16} fill="var(--fg-muted)">
            O₂
          </text>
        </g>
      )}

      {/* Vat vessel */}
      <rect
        x={34}
        y={162}
        width={138}
        height={224}
        rx={16}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2.2}
      />
      {/* Liquid fill */}
      <rect
        x={38}
        y={238}
        width={130}
        height={144}
        rx={12}
        fill={liquidFill}
        fillOpacity={liquidOpacity}
        stroke="var(--liquid-edge)"
        strokeWidth={1.5}
      />

      <text x={103} y={290} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {step === 0 ? 'Sugar must' : isAirLeak ? 'CH₃COOH' : 'Yeast vat'}
      </text>
      <text x={103} y={316} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {step === 0 ? '+ H₂O' : isAirLeak ? 'oxidised' : 'C₂H₅OH'}
      </text>
      <text x={103} y={412} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {step === 3 ? 'Vinegar spoil' : 'Fermenter'}
      </text>
    </g>
  )
}

function CentreTrack({ step, reveal }: { step: number; reveal: number }) {
  const etGraph = useMemo(() => parseSmiles(ETHANOL_SMILES.ethanol), [])
  const acidGraph = useMemo(() => parseSmiles(ETHANOL_SMILES.ethanoicAcid), [])

  return (
    <g>
      <rect x={200} y={62} width={220} height={368} rx={14} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />

      {step === 0 && (
        <g>
          <text x={310} y={92} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
            C₁₂H₂₂O₁₁ + H₂O
          </text>
          <g transform="translate(296, 128)">
            <SugarRingPair splitProgress={0} />
          </g>

          {/* Invertase badge */}
          <rect x={228} y={176} width={164} height={46} rx={10} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
          <text x={310} y={205} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--accent)">
            Invertase
          </text>
          <line x1={310} y1={222} x2={310} y2={244} stroke="var(--accent)" strokeWidth={2.5} />
          <polygon points="310,252 303,240 317,240" fill="var(--accent)" />

          {/* Split sugars */}
          <g opacity={reveal}>
            <g transform="translate(294, 290)">
              <SugarRingPair splitProgress={1} />
            </g>
            <text x={310} y={338} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
              Glucose + Fructose
            </text>
            <text x={310} y={366} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
              2 C₆H₁₂O₆
            </text>
          </g>
        </g>
      )}

      {step === 1 && (
        <g>
          <rect x={220} y={84} width={180} height={54} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
          <text x={310} y={117} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
            C₆H₁₂O₆ (hexoses)
          </text>

          <line x1={310} y1={140} x2={310} y2={166} stroke="var(--success)" strokeWidth={2.4} />
          <rect x={224} y={166} width={172} height={56} rx={10} fill="var(--success-soft)" stroke="var(--success)" strokeWidth={2} />
          <text x={310} y={191} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--success)">
            Zymase (yeast)
          </text>
          <text x={310} y={213} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
            Anaerobic
          </text>
          <line x1={310} y1={222} x2={310} y2={244} stroke="var(--success)" strokeWidth={2.4} />
          <polygon points="310,252 303,240 317,240" fill="var(--success)" />

          <g opacity={reveal}>
            <rect x={218} y={256} width={184} height={150} rx={12} fill="var(--surface)" stroke="var(--accent)" strokeWidth={1.8} />
            <g transform="translate(310, 314)">
              <SkeletalFormula graph={etGraph} scale={46} />
            </g>
            <text x={310} y={368} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
              2 C₂H₅OH + 2 CO₂
            </text>
            <text x={310} y={392} textAnchor="middle" fontSize={16} fill="var(--accent)">
              Ethanol + gas
            </text>
          </g>
        </g>
      )}

      {step === 2 && (
        <g>
          <rect x={220} y={84} width={180} height={54} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.5} />
          <text x={310} y={117} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
            Remaining C₆H₁₂O₆
          </text>

          {/* Zymase with inhibition gate */}
          <rect x={218} y={168} width={184} height={96} rx={12} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={2.4} />
          <text x={310} y={200} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--caution)">
            Zymase inhibited
          </text>
          <text x={310} y={226} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
            Alcohol &gt; 14%
          </text>
          <line x1={232} y1={246} x2={388} y2={246} stroke="var(--caution)" strokeWidth={4} strokeLinecap="round" />

          <g opacity={reveal}>
            <rect x={218} y={288} width={184} height={114} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.6} />
            <text x={310} y={326} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
              Reaction halts
            </text>
            <text x={310} y={356} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
              Max 14% directly
            </text>
            <text x={310} y={382} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
              Distil to enrich
            </text>
          </g>
        </g>
      )}

      {step === 3 && (
        <g>
          <rect x={218} y={84} width={184} height={60} rx={10} fill="var(--surface)" stroke="var(--border)" strokeWidth={1.6} />
          <text x={310} y={110} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
            C₂H₅OH + O₂
          </text>
          <text x={310} y={133} textAnchor="middle" fontSize={16} fill="var(--atom-o)">
            Atmospheric air
          </text>

          <line x1={310} y1={146} x2={310} y2={190} stroke="var(--caution)" strokeWidth={2.8} />
          <polygon points="310,200 303,187 317,187" fill="var(--caution)" />
          <text x={310} y={176} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--caution)" stroke="var(--surface-raised)" strokeWidth={4} paintOrder="stroke">
            Oxidation
          </text>

          <g opacity={reveal}>
            <rect x={218} y={208} width={184} height={198} rx={12} fill="var(--surface)" stroke="var(--caution)" strokeWidth={2} />
            <g transform="translate(310, 276)">
              <SkeletalFormula graph={acidGraph} scale={44} />
            </g>
            <text x={310} y={348} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
              CH₃COOH + H₂O
            </text>
            <text x={310} y={376} textAnchor="middle" fontSize={16} fill="var(--caution)">
              Ethanoic acid
            </text>
          </g>
        </g>
      )}
    </g>
  )
}

function GaugeRight({ step, reducedMotion }: { step: number; reducedMotion: boolean }) {
  const targetPct = step === 0 ? 0 : step === 1 ? 10 : step === 2 ? 14 : 5
  const tweened = useStepTween({ pct: targetPct }, reducedMotion)
  const pct = tweened.pct

  const barBottom = 248
  const barTop = 104
  const barH = barBottom - barTop
  const fillH = Math.max(0, (pct / 20) * barH)
  const limitY = barBottom - (ETHANOL_FACTS.inhibitionPercent / 20) * barH

  const statusHeading =
    step === 0
      ? 'Hydrolysis step'
      : step === 1
        ? 'Fresh / Wine'
        : step === 2
          ? '14% Ceiling'
          : 'Sour / Spoiled'

  const statusNote =
    step === 0
      ? '0% alcohol'
      : step === 1
        ? 'Zymase active'
        : step === 2
          ? 'Zymase stopped'
          : 'CH₃COOH acid'

  const isWarn = step === 2 || step === 3

  return (
    <g>
      <rect x={430} y={62} width={154} height={224} rx={14} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={507} y={88} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Ethanol %
      </text>

      {/* Gauge track */}
      <rect x={464} y={barTop} width={44} height={barH} rx={6} fill="var(--surface)" stroke="var(--bond)" strokeWidth={1.6} />
      {fillH > 0.5 && (
        <rect
          x={466}
          y={barBottom - fillH}
          width={40}
          height={fillH}
          rx={4}
          fill={step === 2 ? 'var(--caution)' : step === 3 ? 'var(--ox)' : 'var(--accent)'}
        />
      )}

      {/* 14% ceiling line */}
      <line x1={452} y1={limitY} x2={526} y2={limitY} stroke="var(--caution)" strokeWidth={2.4} strokeDasharray="5 3" />
      <text x={530} y={limitY + 5} fontSize={16} fontWeight={600} fill="var(--caution)">
        14%
      </text>
      <text x={530} y={barTop + 12} fontSize={16} fill="var(--fg-muted)">
        20%
      </text>
      <text x={530} y={barBottom} fontSize={16} fill="var(--fg-muted)">
        0%
      </text>
      <text x={486} y={274} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {Math.round(pct)}%
      </text>

      {/* Taste / potability card */}
      <rect
        x={430}
        y={298}
        width={154}
        height={132}
        rx={14}
        fill={isWarn ? 'var(--caution-soft)' : 'var(--surface-raised)'}
        stroke={isWarn ? 'var(--caution)' : 'var(--border)'}
        strokeWidth={1.8}
      />
      <text x={507} y={334} textAnchor="middle" fontSize={16} fontWeight={600} fill={isWarn ? 'var(--caution)' : 'var(--fg)'}>
        Status
      </text>
      <text x={507} y={368} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {statusHeading}
      </text>
      <text x={507} y={398} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {statusNote}
      </text>
    </g>
  )
}

function StepFourDenaturation({ reveal }: { reveal: number }) {
  const etheneGraph = useMemo(() => parseSmiles(ETHANOL_SMILES.ethene), [])
  const pyrGraph = useMemo(() => parseSmiles(ETHANOL_SMILES.pyridine), [])

  return (
    <g>
      {/* Left: Two routes feeding ethanol */}
      <rect x={16} y={62} width={174} height={172} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={103} y={92} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Bio-fermentation
      </text>
      <text x={103} y={120} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        Molasses / grapes
      </text>
      <text x={103} y={148} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        Invertase + Zymase
      </text>
      <text x={103} y={182} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--accent)">
        Purified C₂H₅OH
      </text>

      <rect x={16} y={248} width={174} height={182} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />
      <text x={103} y={278} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Ethene hydration
      </text>
      <g transform="translate(103, 326)">
        <SkeletalFormula graph={etheneGraph} scale={44} />
      </g>
      <text x={103} y={376} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        CH₂=CH₂ + H₂O
      </text>
      <text x={103} y={404} textAnchor="middle" fontSize={16} fill="var(--accent)">
        H⁺ route (Sec. 7.4)
      </text>

      {/* Centre: Industrial drum + additives */}
      <rect x={212} y={62} width={196} height={368} rx={14} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.5} />

      {/* Feed arrows into central drum (rendered above panel border) */}
      <line x1={190} y1={154} x2={228} y2={236} stroke="var(--accent)" strokeWidth={2.6} />
      <polygon points="234,244 222,237 232,228" fill="var(--accent)" />
      <line x1={190} y1={330} x2={228} y2={280} stroke="var(--accent)" strokeWidth={2.6} />
      <polygon points="234,272 222,277 231,286" fill="var(--accent)" />
      {/* CuSO4 crystals */}
      <g opacity={reveal}>
        <polygon points="244,102 258,92 270,104 256,118" fill="var(--cuso4-blue)" />
        <polygon points="266,122 278,112 290,124 276,136" fill="var(--cuso4-blue)" />
        <text x={264} y={164} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--cuso4-blue)">
          CuSO₄
        </text>
      </g>
      {/* Pyridine foul odour */}
      <g opacity={reveal}>
        <g transform="translate(356, 114)">
          <SkeletalFormula graph={pyrGraph} scale={44} />
        </g>
        <text x={356} y={184} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--atom-n)">
          Pyridine
        </text>
      </g>

      {/* Industrial drum */}
      <rect x={236} y={202} width={148} height={210} rx={14} fill="var(--surface)" stroke="var(--bond)" strokeWidth={2.4} />
      <rect x={240} y={252} width={140} height={156} rx={10} fill="var(--cuso4-blue)" fillOpacity={0.32 * reveal} stroke="var(--cuso4-blue)" strokeWidth={1.5} />
      <line x1={236} y1={264} x2={384} y2={264} stroke="var(--bond)" strokeWidth={2} />
      <line x1={236} y1={356} x2={384} y2={356} stroke="var(--bond)" strokeWidth={2} />
      <text x={310} y={304} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        Industrial
      </text>
      <text x={310} y={330} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--fg)">
        C₂H₅OH
      </text>
      <text x={310} y={386} textAnchor="middle" fontSize={16} fill="var(--fg)">
        Blue + foul smell
      </text>

      {/* Right: Denaturation stamp & properties */}
      <rect x={420} y={62} width={164} height={368} rx={14} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={2} />
      <text x={502} y={108} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--caution)">
        Denatured
      </text>
      <text x={502} y={134} textAnchor="middle" fontSize={17} fontWeight={600} fill="var(--caution)">
        Alcohol
      </text>
      <rect x={434} y={156} width={136} height={54} rx={8} fill="var(--surface)" stroke="var(--caution)" strokeWidth={1.6} />
      <text x={502} y={180} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Unfit for
      </text>
      <text x={502} y={201} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Drinking
      </text>

      <text x={502} y={252} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        Additives:
      </text>
      <text x={502} y={282} textAnchor="middle" fontSize={16} fill="var(--cuso4-blue)">
        CuSO₄: colour
      </text>
      <text x={502} y={312} textAnchor="middle" fontSize={16} fill="var(--atom-n)">
        Pyridine: odour
      </text>

      <text x={502} y={366} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        b.p. 351 K
      </text>
      <text x={502} y={396} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        Paint solvent
      </text>
    </g>
  )
}

export function EthanolFermentationPathway({ step, reducedMotion }: EthanolFermentationPathwayProps) {
  const index = Math.min(ETHANOL_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)

  const captions = [
    'Invertase splits sucrose into glucose and fructose (both C₆H₁₂O₆).',
    'Zymase in yeast converts hexoses anaerobically to ethanol and CO₂.',
    'Beyond 14% alcohol, ethanol inhibits zymase and stops fermentation.',
    'An air leak admits O₂, oxidising ethanol into sour ethanoic acid.',
    'CuSO₄ (blue) and pyridine (foul odour) denature industrial spirit.',
  ]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ETHANOL_STEP_LABELS[index]}
      style={{ width: '100%', height: '100%', maxHeight: '100%', display: 'block' }}
      data-step={index}
      data-testid="ethanol-fermentation-visual"
    >
      <text x={W / 2} y={34} textAnchor="middle" fontSize={19} fontWeight={600} fill="var(--fg)">
        {ETHANOL_STEP_TITLES[index]}
      </text>

      {index < 4 ? (
        <>
          <FermentationVat step={index} reveal={reveal} />
          <CentreTrack step={index} reveal={reveal} />
          <GaugeRight step={index} reducedMotion={reducedMotion} />
        </>
      ) : (
        <StepFourDenaturation reveal={reveal} />
      )}

      <text x={W / 2} y={462} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {captions[index]}
      </text>
    </svg>
  )
}
