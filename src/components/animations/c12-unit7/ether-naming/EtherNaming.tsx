'use client'

import React from 'react'
import { MoleculeDiagram } from '../nomenclature/MoleculeDiagram'
import { getEtherSteps, type EtherStepSpec } from './steps'

export interface EtherNamingProps {
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440
const STEPS = getEtherSteps()

function StepCommon({ spec }: { spec: EtherStepSpec }) {
  const notes = ['two methyls -> di-', 'two ethyls -> di-', 'm before n-propyl', 'methyl + isopropyl']
  const cells = [
    { x: 20, y: 54, entry: spec.entries[0], note: notes[0] },
    { x: 290, y: 54, entry: spec.entries[1], note: notes[1] },
    { x: 20, y: 228, entry: spec.entries[2], note: notes[2] },
    { x: 290, y: 228, entry: spec.entries[3], note: notes[3] },
  ]
  return (
    <>
      {cells.map(({ x, y, entry, note }) => (
        <g key={entry.id}>
          <rect
            x={x}
            y={y}
            width={250}
            height={160}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <MoleculeDiagram
            structure={entry.structure}
            cx={x + 125}
            cy={y + 58}
            maxWidth={210}
            maxHeight={82}
            maxScale={44}
            showNumbering={false}
          />
          <text
            x={x + 125}
            y={y + 118}
            textAnchor="middle"
            fontSize={16}
            fontWeight={700}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
          >
            {entry.commonName}
          </text>
          <text
            x={x + 125}
            y={y + 142}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
          >
            {note}
          </text>
        </g>
      ))}
    </>
  )
}

function StepAlkoxyalkane({ spec }: { spec: EtherStepSpec }) {
  const [oneMethoxy, twoMethoxy] = spec.entries
  const rows = [
    {
      y: 54,
      h: 154,
      entry: oneMethoxy,
      subLine: 'Methoxy (-OCH₃) at C-1',
    },
    {
      y: 222,
      h: 162,
      entry: twoMethoxy,
      subLine: 'Methoxy (-OCH₃) at C-2',
    },
  ]
  return (
    <>
      {rows.map(({ y, h, entry, subLine }) => (
        <g key={entry.id}>
          <rect
            x={20}
            y={y}
            width={520}
            height={h}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <MoleculeDiagram
            structure={entry.structure}
            cx={145}
            cy={y + h / 2}
            maxWidth={210}
            maxHeight={h - 24}
            maxScale={46}
            showNumbering
          />
          <line x1={266} y1={y + 18} x2={266} y2={y + h - 18} stroke="var(--border)" strokeWidth={1} />
          <text x={282} y={y + 36} fontSize={15} fontWeight={600} fill="var(--fwd)" fontFamily="var(--font-sans)">
            {entry.parentRuleBadge}
          </text>
          <text x={282} y={y + 68} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
            {subLine}
          </text>
          <text x={282} y={y + 102} fontSize={19} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
            {entry.iupacName}
          </text>
          <text x={282} y={y + 132} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
            Common: {entry.commonName}
          </text>
        </g>
      ))}
    </>
  )
}

function StepArylEthers({ spec }: { spec: EtherStepSpec }) {
  const [anisole, phenetole] = spec.entries
  const cards = [
    { x: 20, entry: anisole, altLine: 'Accepted IUPAC/Common: Anisole' },
    { x: 290, entry: phenetole, altLine: 'Common alt: Phenetole' },
  ]
  return (
    <>
      {cards.map(({ x, entry, altLine }) => (
        <g key={entry.id}>
          <rect
            x={x}
            y={56}
            width={250}
            height={328}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <MoleculeDiagram
            structure={entry.structure}
            cx={x + 125}
            cy={168}
            maxWidth={210}
            maxHeight={164}
            maxScale={46}
            showNumbering={false}
          />
          <text
            x={x + 125}
            y={274}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            fill="var(--fwd)"
            fontFamily="var(--font-sans)"
          >
            {entry.parentRuleBadge}
          </text>
          <text
            x={x + 125}
            y={308}
            textAnchor="middle"
            fontSize={19}
            fontWeight={700}
            fill="var(--accent)"
            fontFamily="var(--font-sans)"
          >
            {entry.iupacName}
          </text>
          <text
            x={x + 125}
            y={338}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
          >
            {entry.commonName}
          </text>
          <text
            x={x + 125}
            y={364}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
          >
            {altLine}
          </text>
        </g>
      ))}
    </>
  )
}

function StepParentFlip({ spec }: { spec: EtherStepSpec }) {
  const [isopentyl, heptyl] = spec.entries
  const rows = [
    {
      y: 54,
      h: 156,
      entry: isopentyl,
      ruleColor: 'var(--accent)',
      detail: 'Benzene parent; 5-C alkoxy group',
    },
    {
      y: 224,
      h: 162,
      entry: heptyl,
      ruleColor: 'var(--fwd)',
      detail: 'Heptane parent; 1-phenoxy group',
    },
  ]
  return (
    <>
      {rows.map(({ y, h, entry, ruleColor, detail }) => (
        <g key={entry.id}>
          <rect
            x={20}
            y={y}
            width={520}
            height={h}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <MoleculeDiagram
            structure={entry.structure}
            cx={148}
            cy={y + h / 2}
            maxWidth={228}
            maxHeight={h - 24}
            maxScale={42}
            showNumbering={entry.id.includes('heptyl')}
          />
          <line x1={276} y1={y + 18} x2={276} y2={y + h - 18} stroke="var(--border)" strokeWidth={1} />
          <text x={290} y={y + 36} fontSize={15} fontWeight={700} fill={ruleColor} fontFamily="var(--font-sans)">
            {entry.parentRuleBadge}
          </text>
          <text x={290} y={y + 66} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
            {detail}
          </text>
          <text x={290} y={y + 102} fontSize={17} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
            {entry.iupacName}
          </text>
          <text x={290} y={y + 132} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
            Common: {entry.commonName}
          </text>
        </g>
      ))}
    </>
  )
}

function StepDietherAndCyclo({ spec }: { spec: EtherStepSpec }) {
  const [dimethoxy, cycloEther] = spec.entries
  return (
    <>
      <rect
        x={20}
        y={54}
        width={520}
        height={146}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <MoleculeDiagram
        structure={dimethoxy.structure}
        cx={145}
        cy={127}
        maxWidth={215}
        maxHeight={116}
        maxScale={44}
        showNumbering
      />
      <line x1={262} y1={72} x2={262} y2={182} stroke="var(--border)" strokeWidth={1} />
      <text x={278} y={88} fontSize={15} fontWeight={600} fill="var(--fwd)" fontFamily="var(--font-sans)">
        Ethane (2 C) + two -OCH₃
      </text>
      <text x={278} y={124} fontSize={19} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
        {dimethoxy.iupacName}
      </text>
      <text x={278} y={156} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Both C-1 and C-2 carry methoxy (di-)
      </text>

      <rect
        x={20}
        y={214}
        width={520}
        height={176}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <MoleculeDiagram
        structure={cycloEther.structure}
        cx={135}
        cy={302}
        maxWidth={198}
        maxHeight={150}
        maxScale={44}
        showNumbering
      />
      <line x1={250} y1={232} x2={250} y2={372} stroke="var(--border)" strokeWidth={1} />
      <text x={266} y={248} fontSize={15} fontWeight={700} fill="var(--fwd)" fontFamily="var(--font-sans)">
        Locant set &#123;1, 1, 2&#125; &lt; &#123;1, 2, 2&#125;
      </text>
      <text x={266} y={284} fontSize={18} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
        2-Ethoxy-1,1-
      </text>
      <text x={266} y={308} fontSize={18} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
        dimethylcyclohexane
      </text>
      <text x={266} y={342} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Start at C(CH₃)₂ (C-1); ethoxy at C-2
      </text>
      <text x={266} y={366} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Alphabetical: ethoxy before dimethyl
      </text>
    </>
  )
}

export function EtherNaming({ step, reducedMotion }: EtherNamingProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const current = STEPS[index]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={current.ariaLabel}
      data-step={index}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
    >
      <text
        x={W / 2}
        y={32}
        textAnchor="middle"
        fontSize={20}
        fontWeight={700}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        {current.title}
      </text>

      {index === 0 && <StepCommon spec={current} />}
      {index === 1 && <StepAlkoxyalkane spec={current} />}
      {index === 2 && <StepArylEthers spec={current} />}
      {index === 3 && <StepParentFlip spec={current} />}
      {index === 4 && <StepDietherAndCyclo spec={current} />}

      <text
        x={W / 2}
        y={420}
        textAnchor="middle"
        fontSize={15}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        {current.footer}
      </text>
    </svg>
  )
}
