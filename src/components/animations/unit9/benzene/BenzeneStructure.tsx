'use client'

import React from 'react'
import { BenzeneRing, PiBondOrbitals } from '@/components/organic'
import { useSweptNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { benzeneBondPm, barLength, benzeneLadder, BENZENE_STEP_KINDS, type BenzeneStepKind } from './benzene-steps'
import styles from './benzene.module.css'

export interface BenzeneStructureProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'
/** Centre of the flat-top ring in the Steps that show only the ring. */
const RING_CX = VIEW_WIDTH / 2
const RING_CY = 212
/** Scale of the flat-top ring: its width is 2R = 340 units, 59% of the panel. */
const RING_SCALE = 1.85

const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={40} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines }: { lines: readonly React.ReactNode[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text key={i} x={VIEW_WIDTH / 2} y={396 + i * 26} textAnchor="middle" fontSize={17} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </g>
  )
}

/** Step 1: the double bonds slide from Kekulé A (1=2, 3=4, 5=6) to Kekulé B, drawn once at the start. */
function KekuleSlide({ reducedMotion }: { reducedMotion: boolean }) {
  const mix = useSweptNumber(0, 0, 1, reducedMotion, 1.4)
  return (
    <g>
      <Title>Kekulé’s ring: the double bonds slide</Title>
      <g transform={`translate(${RING_CX} ${RING_CY}) rotate(30) scale(${RING_SCALE})`}>
        <BenzeneRing variant="kekule" kekuleMix={mix} />
      </g>
      <Caption
        lines={[
          'Kekulé A and Kekulé B differ only in where the three double bonds sit.',
          'Both are real contributors, so the ring keeps swapping between them.',
        ]}
      />
    </g>
  )
}

/** Step 2: the ortho problem. Br on the two carbons of a double bond, or on the two carbons of a single bond. */
function OrthoPair() {
  const substituents = [
    { position: 1, label: 'Br' },
    { position: 2, label: 'Br' },
  ]
  return (
    <g>
      <Title>Kekulé’s form predicts two o-dibromides</Title>
      <g transform="translate(145 222) scale(1.05)">
        <BenzeneRing variant="kekule" kekuleMix={0} substituents={substituents} />
      </g>
      <g transform="translate(415 222) scale(1.05)">
        <BenzeneRing variant="kekule" kekuleMix={1} substituents={substituents} />
      </g>
      <text x={145} y={362} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Br on a double bond
      </text>
      <text x={415} y={362} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        Br on a single bond
      </text>
      <Caption
        lines={['Two isomers were predicted, but only one is found.', 'So the two Kekulé forms cannot be separate molecules.']}
      />
    </g>
  )
}

/** Step 3: the hybrid, drawn as a hexagon with an inscribed circle, its six bonds equal. */
function HybridCircle({ reducedMotion }: { reducedMotion: boolean }) {
  const shown = useSweptNumber(0, 0, 1, reducedMotion, 0.9)
  const pm = benzeneBondPm()
  return (
    <g>
      <Title>The hybrid: six equal bonds and one circle</Title>
      <g opacity={shown} transform={`translate(${RING_CX} ${RING_CY}) rotate(30) scale(${RING_SCALE})`}>
        <BenzeneRing variant="hexagon" />
      </g>
      <Caption
        lines={[`The circle stands for six delocalised electrons over six carbons.`, `Every C–C bond is ${pm} pm, the same length in all six places.`]}
      />
    </g>
  )
}

/** Step 4: the six p orbitals, first as separate lobes, then merged into two doughnuts above and below the ring. */
function PiDoughnuts({ reducedMotion }: { reducedMotion: boolean }) {
  const merge = useSweptNumber(0, 0, 1, reducedMotion, 1.6)
  return (
    <g>
      <Title>Six p orbitals merge into two doughnuts</Title>
      <g transform={`translate(${RING_CX} 222) scale(1.1)`}>
        <PiBondOrbitals molecule="benzene" merge={merge} showAngles={false} />
      </g>
      <Caption
        lines={['Each carbon’s unhybridised p orbital overlaps with both neighbours.', 'The electron cloud sits one doughnut above the ring and one below.']}
      />
    </g>
  )
}

/** Step 5: the bond ladder, each bar drawn to one scale in pm. Benzene's bond sits between the single and the double. */
function BondLadder({ reducedMotion }: { reducedMotion: boolean }) {
  const grow = useSweptNumber(0, 0, 1, reducedMotion, 1.2)
  const rows = [150, 240, 330]
  const x0 = 170
  return (
    <g>
      <Title>Benzene’s bond is between single and double</Title>
      {benzeneLadder().map((rung, i) => {
        const y = rows[i]
        const full = barLength(rung.lengthPm)
        return (
          <g key={rung.label}>
            <text x={40} y={y + 7} fontSize={20} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
              {rung.label}
            </text>
            <rect x={x0} y={y - 9} width={full * grow} height={18} rx={9} fill={i === 1 ? 'var(--pi-lobe)' : 'var(--sigma-bond)'} />
            <text x={x0 + full + 14} y={y + 7} fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)" opacity={grow}>
              {`${rung.lengthPm} pm`}
            </text>
          </g>
        )
      })}
      <Caption lines={['Bars share one scale.', 'Benzene’s bond is shorter than a single bond and longer than a double.']} />
    </g>
  )
}

const ARIA: Record<BenzeneStepKind, string> = {
  'kekule-slide': 'Kekulé structure of benzene: the three double bonds slide from one set of alternate bonds to the other',
  'ortho-pair': 'Two Kekulé forms of ortho-dibromobenzene, with Br on a double bond and with Br on a single bond',
  'hybrid-circle': 'Benzene drawn as a hexagon with an inscribed circle, all six bonds equal',
  'pi-doughnuts': 'Six p orbitals, one on each carbon, overlap sideways and merge into two doughnuts above and below the ring',
  'bond-ladder': 'Bars for a C–C single bond (154 pm), benzene (139 pm) and a C=C double bond (134 pm)',
}

function renderStep(kind: BenzeneStepKind, reducedMotion: boolean): React.ReactNode {
  switch (kind) {
    case 'kekule-slide':
      return <KekuleSlide reducedMotion={reducedMotion} />
    case 'ortho-pair':
      return <OrthoPair />
    case 'hybrid-circle':
      return <HybridCircle reducedMotion={reducedMotion} />
    case 'pi-doughnuts':
      return <PiDoughnuts reducedMotion={reducedMotion} />
    case 'bond-ladder':
      return <BondLadder reducedMotion={reducedMotion} />
  }
}

/** The benzene-structure Scrolly (Section 9.5.2): five Steps, each drawn to fill the panel. */
export function BenzeneStructure({ step, reducedMotion }: BenzeneStructureProps) {
  const index = Math.min(BENZENE_STEP_KINDS.length - 1, Math.max(0, Math.round(step)))
  const kind = BENZENE_STEP_KINDS[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={ARIA[kind]}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="benzene-structure"
      data-step={index}
    >
      <g key={`step-${index}`} className={enter(reducedMotion)}>
        {renderStep(kind, reducedMotion)}
      </g>
    </svg>
  )
}
