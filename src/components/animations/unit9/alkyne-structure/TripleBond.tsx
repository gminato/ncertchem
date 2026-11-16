'use client'

import React from 'react'
import { PiBondOrbitals } from '@/components/organic'
import { CarbideGenerator, CARBIDE_GENERATOR_SIZE } from '@/components/organic/lab'
import { bondLadder, type LadderRung, type TripleBondStepKind, TRIPLE_BOND_STEP_KINDS } from './triple-bond-steps'
import styles from './TripleBond.module.css'

export interface TripleBondProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'
/** Carbide generator progress on its Step: about three quarters of the water has dripped in. */
const CARBIDE_PROGRESS = 0.75

const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={40} textAnchor="middle" fontSize={21} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines }: { lines: readonly string[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text
          key={line}
          x={VIEW_WIDTH / 2}
          y={VIEW_HEIGHT - 44 + i * 24}
          textAnchor="middle"
          fontSize={16}
          fontWeight={500}
          fontFamily={FONT}
          fill="var(--fg-muted)"
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/** Step 1 and 2: the ethyne π cloud, first as two separate lobes, then merged into a cylinder. */
function PiStep({ merged }: { merged: boolean }) {
  return (
    <g>
      <Title>{merged ? 'Ethyne: the two π bonds merge into one cylinder' : 'Ethyne: two sideways overlaps, at right angles'}</Title>
      <g transform="translate(290 220) scale(1.9)">
        <PiBondOrbitals molecule="ethyne" merge={merged ? 1 : 0} showAngles={false} />
      </g>
      <Caption
        lines={
          merged
            ? ['The π electron density forms a cylinder round the C–C axis.', 'Its shape is cylindrically symmetrical, so the molecule is linear.']
            : ['Each carbon has two unhybridised p orbitals, perpendicular to the axis.', 'Each pair overlaps sideways to make one π bond.']
        }
      />
    </g>
  )
}

/** The bond drawn as one, two or three lines, the carbons at its ends, and its NCERT length. */
function Bond({ rung, row }: { rung: LadderRung; row: number }) {
  const x0 = 150
  const y = row
  const length = rung.lengthPm * 1.75
  const offsets = rung.order === 1 ? [0] : rung.order === 2 ? [-6, 6] : [-9, 0, 9]
  return (
    <g>
      {offsets.map((dy) => (
        <line key={dy} x1={x0} y1={y + dy} x2={x0 + length} y2={y + dy} stroke="var(--sigma-bond)" strokeWidth={rung.order === 1 ? 6 : 3.4} strokeLinecap="round" />
      ))}
      <circle cx={x0} cy={y} r={10} fill="var(--sigma-bond)" stroke="var(--surface)" strokeWidth={1.5} />
      <circle cx={x0 + length} cy={y} r={10} fill="var(--sigma-bond)" stroke="var(--surface)" strokeWidth={1.5} />
    </g>
  )
}

/** Step 3: the bond ladder, each row a bond drawn to scale with its length and enthalpy. */
function LadderStep() {
  const ladder = bondLadder()
  const rows = [150, 250, 350]
  return (
    <g>
      <Title>Extra shared pairs: shorter and stronger</Title>
      <text x={60} y={92} fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        Bond
      </text>
      <text x={500} y={92} textAnchor="middle" fontSize={15} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        Length and enthalpy
      </text>
      {ladder.map((rung, i) => (
        <g key={rung.label}>
          <text x={60} y={rows[i] + 8} fontSize={24} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            {rung.label}
          </text>
          <Bond rung={rung} row={rows[i]} />
          <text x={500} y={rows[i] - 2} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            {`${rung.lengthPm} pm`}
          </text>
          <text x={500} y={rows[i] + 22} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
            {`${rung.enthalpyKJ} kJ mol⁻¹`}
          </text>
        </g>
      ))}
      <Caption lines={['Bars are drawn to scale. More shared pairs, shorter and stronger.']} />
    </g>
  )
}

/** Step 4: the carbide generator, water dripping onto CaC₂ and the ethyne displacing water. */
function CarbideStep() {
  const scale = 0.95
  const x = (VIEW_WIDTH - CARBIDE_GENERATOR_SIZE.width * scale) / 2
  return (
    <g>
      <Title>Calcium carbide and water make ethyne</Title>
      <g transform={`translate(${x} 50) scale(${scale})`}>
        <CarbideGenerator progress={CARBIDE_PROGRESS} />
      </g>
      <Caption lines={['The ethyne gas pushes the water out of the jar.']} />
    </g>
  )
}

function renderStep(kind: TripleBondStepKind): React.ReactNode {
  switch (kind) {
    case 'pi-separate':
      return <PiStep merged={false} />
    case 'pi-cylinder':
      return <PiStep merged />
    case 'bond-ladder':
      return <LadderStep />
    case 'carbide':
      return <CarbideStep />
  }
}

function ariaFor(kind: TripleBondStepKind): string {
  switch (kind) {
    case 'pi-separate':
      return 'Ethyne: two p orbitals on each carbon overlap sideways to form two perpendicular pi bonds'
    case 'pi-cylinder':
      return 'Ethyne: the two pi bonds merge into a cylinder of electron density round the linear C-C axis'
    case 'bond-ladder':
      return 'Bond ladder: C-C 154 pm and 348 kJ per mol; C=C 134 pm and 681 kJ per mol; C triple-bond C 120 pm and 823 kJ per mol'
    case 'carbide':
      return 'Calcium carbide dripping with water in a flask, and ethyne displacing water from a gas jar'
  }
}

/** The triple-bond Scrolly: four Steps, each a drawing that fills the panel. */
export function TripleBond({ step, reducedMotion }: TripleBondProps) {
  const index = Math.min(TRIPLE_BOND_STEP_KINDS.length - 1, Math.max(0, Math.round(step)))
  const kind = TRIPLE_BOND_STEP_KINDS[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={ariaFor(kind)}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="triple-bond"
      data-step={index}
    >
      <g key={`step-${index}`} className={enter(reducedMotion)}>
        {renderStep(kind)}
      </g>
    </svg>
  )
}
