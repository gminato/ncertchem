'use client'

import type { ReactNode } from 'react'
import { Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { CurvedArrow, ResonanceSet, SkeletalFormula } from '@/components/organic'
import { HALOGEN_TONE, MechanismProfile, PlanarCation, ROLE_TONE, StereoCentre } from '@/components/vocab/organic6'
import { formulaUnicode } from '@/lib/chem/haloalkanes'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import {
  ALLYL_CATION_CONTRIBUTORS,
  BENZYL_CATION_SMILES,
  FORMULAS,
  NAMES,
  SN2_STRIP,
  SN2_SN1_BEATS,
  sn2BarHeight,
} from './sn2-sn1-steps'

export interface Sn2Sn1ScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 660
const STAGE_H = 340
const PROFILE_Y = 360
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const BAR_MAX = 150
const BAR_BASE = 470

function Caption({ x, y, children, fill = INK }: { x: number; y: number; children: ReactNode; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={14} fill={fill}>
      {children}
    </text>
  )
}

function BacksideApproach() {
  return (
    <g>
      <StereoCentre
        y={(H - STAGE_H) / 2}
        umbrella={[{ label: 'H' }, { label: 'H' }, { label: 'H' }]}
        incoming={{ label: 'HO⁻', tone: ROLE_TONE.nucleophile, bondOrder: 0 }}
        leaving={{ label: 'Br', tone: HALOGEN_TONE.Br }}
        invert={0}
      />
      <CurvedArrow from={{ x: 112, y: 262 }} to={{ x: 262, y: 300 }} bend={-0.25} />
      <Caption x={W / 2} y={H - 60}>{`${NAMES.methylBromide} (CH₃Br) with HO⁻ from the side away from Br`}</Caption>
      <Caption x={W / 2} y={H - 34} fill={MUTED}>
        The lone pair on oxygen moves to the carbon
      </Caption>
    </g>
  )
}

function TransitionState() {
  return (
    <g>
      <StereoCentre
        y={(H - STAGE_H) / 2}
        umbrella={[{ label: 'H' }, { label: 'H' }, { label: 'H' }]}
        incoming={{ label: <>HO<Sup>δ−</Sup></>, tone: ROLE_TONE.nucleophile, bondOrder: 0.5 }}
        leaving={{ label: <>Br<Sup>δ−</Sup></>, tone: HALOGEN_TONE.Br, bondOrder: 0.5 }}
        invert={0.5}
        bracketTS
      />
      <Caption x={W / 2} y={H - 60}>Transition state ‡: carbon bonded to five atoms</Caption>
      <Caption x={W / 2} y={H - 34} fill={MUTED}>
        Both bonds are partial, so both are drawn dashed
      </Caption>
    </g>
  )
}

function InvertedProduct() {
  return (
    <g>
      <StereoCentre
        y={0}
        umbrella={[{ label: 'H' }, { label: 'H' }, { label: 'H' }]}
        incoming={{ label: 'HO', tone: ROLE_TONE.nucleophile, bondOrder: 1 }}
        invert={1}
      />
      <Caption x={W / 2} y={318}>{`${NAMES.methanol} (CH₃OH) + Br⁻`}</Caption>
      <MechanismProfile kind="one-step" x={10} y={PROFILE_Y} />
    </g>
  )
}

function CrowdingStrip() {
  const base = BAR_BASE
  const colW = W / SN2_STRIP.length
  return (
    <g>
      {SN2_STRIP.map((row, i) => {
        const cx = colW * i + colW / 2
        const h = sn2BarHeight(row.relativeRate, BAR_MAX)
        return (
          <g key={row.smiles}>
            <SkeletalFormula graph={parseSmiles(row.smiles)} scale={34} x={cx} y={140} />
            <Caption x={cx} y={246}>{row.unicode}</Caption>
            <rect
              x={cx - 26}
              y={base - h}
              width={52}
              height={Math.max(h, 0)}
              rx={3}
              fill={row.relativeRate > 0 ? ROLE_TONE.nucleophile : MUTED}
            />
            <Caption x={cx} y={base - h - 10}>{row.display}</Caption>
            <Caption x={cx} y={base + 22} fill={MUTED}>{row.degree}</Caption>
          </g>
        )
      })}
      <line x1={20} y1={base} x2={W - 20} y2={base} stroke="var(--bond)" strokeWidth={1.5} />
      <Caption x={W / 2} y={H - 60}>Relative SN2 rate (ethyl bromide = 1)</Caption>
      <Caption x={W / 2} y={H - 34} fill={MUTED}>More groups around the carbon, slower SN2</Caption>
    </g>
  )
}

function Sn1Ionisation() {
  return (
    <g>
      <PlanarCation x={0} y={0} />
      <Caption x={W / 2} y={352}>
        {`${formulaUnicode(FORMULAS.tertButylBromide)} → (CH₃)₃C⁺ + Br⁻ (${NAMES.tertButylBromide})`}
      </Caption>
      <MechanismProfile kind="two-step" x={10} y={PROFILE_Y} />
    </g>
  )
}

function Sn1AttackAndResonance() {
  return (
    <g>
      <PlanarCation x={0} y={0} attackTop attackBottom nucleophile="HO⁻" />
      <ResonanceSet
        x={150}
        y={520}
        scale={26}
        arrowGap={50}
        contributors={ALLYL_CATION_CONTRIBUTORS.map((smiles) => ({ graph: parseSmiles(smiles) }))}
      />
      <Caption x={150} y={610} fill={MUTED}>allylic cation</Caption>
      <SkeletalFormula graph={parseSmiles(BENZYL_CATION_SMILES)} scale={28} x={440} y={520} highlightAtoms={[6]} />
      <Caption x={440} y={610} fill={MUTED}>benzylic cation</Caption>
      <Caption x={W / 2} y={640} fill={MUTED}>Charge spread over the allyl or ring carbons</Caption>
    </g>
  )
}

const BEAT_VIEW = {
  'backside-approach': BacksideApproach,
  'transition-state': TransitionState,
  'inverted-product': InvertedProduct,
  'crowding-strip': CrowdingStrip,
  'sn1-ionisation': Sn1Ionisation,
  'sn1-attack-and-resonance': Sn1AttackAndResonance,
} as const

export function Sn2Sn1Scrolly({ step }: Sn2Sn1ScrollyProps) {
  const index = Math.min(SN2_SN1_BEATS.length - 1, Math.max(0, Math.round(step)))
  const beat = SN2_SN1_BEATS[index]
  const View = BEAT_VIEW[beat]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`SN2 and SN1 mechanisms, Step ${index + 1} of ${SN2_SN1_BEATS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <View />
    </svg>
  )
}
