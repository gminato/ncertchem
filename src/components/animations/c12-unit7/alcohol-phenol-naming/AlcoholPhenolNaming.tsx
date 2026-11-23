'use client'

import React from 'react'
import type { NomenclatureEntry } from '@/lib/chem/c12-u7-s2-nomenclature'
import { MoleculeDiagram } from '../nomenclature/MoleculeDiagram'
import { getAlcoholPhenolSteps, type AlcoholPhenolStepSpec } from './steps'

export interface AlcoholPhenolNamingProps {
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 440
const STEPS = getAlcoholPhenolSteps()

function HorizontalCard({
  y,
  h,
  entry,
  note,
}: {
  y: number
  h: number
  entry: NomenclatureEntry
  note: string
}) {
  return (
    <g>
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
        maxScale={54}
        showNumbering
      />
      <line x1={270} y1={y + 18} x2={270} y2={y + h - 18} stroke="var(--border)" strokeWidth={1} />
      <text x={288} y={y + 34} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {entry.condensedFormula}
      </text>
      <text x={288} y={y + 64} fontSize={16} fill="var(--fg)" fontFamily="var(--font-sans)">
        Common: <tspan fontWeight={600}>{entry.commonName ?? 'Not listed'}</tspan>
      </text>
      <text x={288} y={y + 96} fontSize={18} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
        {entry.iupacName}
      </text>
      <text x={288} y={y + 126} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        {note}
      </text>
    </g>
  )
}

function StepSimple({ spec }: { spec: AlcoholPhenolStepSpec }) {
  return (
    <>
      <HorizontalCard y={54} h={154} entry={spec.entries[0]} note="methane - e + ol" />
      <HorizontalCard y={222} h={158} entry={spec.entries[1]} note="-OH on C-2 -> propan-2-ol" />
    </>
  )
}

function StepBranched({ spec }: { spec: AlcoholPhenolStepSpec }) {
  const entry = spec.entries[0]
  return (
    <>
      <rect
        x={24}
        y={54}
        width={512}
        height={210}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <MoleculeDiagram
        structure={entry.structure}
        cx={280}
        cy={158}
        maxWidth={360}
        maxHeight={166}
        maxScale={62}
        showNumbering
      />
      <rect x={24} y={278} width={512} height={112} rx={12} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.2} />
      <text x={44} y={308} fontSize={16} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Formula: <tspan fill="var(--fg)" fontWeight={600}>{entry.condensedFormula}</tspan>
      </text>
      <text x={290} y={308} fontSize={16} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        Common: <tspan fill="var(--fg)" fontWeight={600}>{entry.commonName}</tspan>
      </text>
      <text x={44} y={346} fontSize={21} fontWeight={700} fill="var(--accent)" fontFamily="var(--font-sans)">
        IUPAC: {entry.iupacName}
      </text>
      <text x={44} y={374} fontSize={15} fill="var(--fwd)" fontWeight={600} fontFamily="var(--font-sans)">
        3 C parent carrying -OH; methyl branch sits at C-2
      </text>
    </>
  )
}

function StepPolyhydric({ spec }: { spec: AlcoholPhenolStepSpec }) {
  return (
    <>
      <HorizontalCard y={54} h={154} entry={spec.entries[0]} note="Keep -e before -diol" />
      <HorizontalCard y={222} h={158} entry={spec.entries[1]} note="Keep -e before -triol" />
    </>
  )
}

function StepCyclic({ spec }: { spec: AlcoholPhenolStepSpec }) {
  const [cycHex, methCycPent] = spec.entries
  const cards = [
    { x: 20, entry: cycHex, subtitle: '6 C ring, -OH at C-1' },
    { x: 290, entry: methCycPent, subtitle: 'C-1 at -OH -> 2 < 5' },
  ]
  return (
    <>
      {cards.map(({ x, entry, subtitle }) => (
        <g key={entry.id}>
          <rect
            x={x}
            y={56}
            width={250}
            height={324}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <MoleculeDiagram
            structure={entry.structure}
            cx={x + 125}
            cy={182}
            maxWidth={210}
            maxHeight={184}
            maxScale={52}
            showNumbering
          />
          <text
            x={x + 125}
            y={308}
            textAnchor="middle"
            fontSize={18}
            fontWeight={700}
            fill="var(--accent)"
            fontFamily="var(--font-sans)"
          >
            {entry.iupacName}
          </text>
          <text
            x={x + 125}
            y={336}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
          >
            {subtitle}
          </text>
          <text
            x={x + 125}
            y={362}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
          >
            Formula: {entry.condensedFormula}
          </text>
        </g>
      ))}
    </>
  )
}

function StepCresols({ spec }: { spec: AlcoholPhenolStepSpec }) {
  const [phenol, ortho, meta, para] = spec.entries
  const isomers = [
    { x: 20, entry: ortho, rel: 'ortho (1,2)' },
    { x: 196, entry: meta, rel: 'meta (1,3)' },
    { x: 372, entry: para, rel: 'para (1,4)' },
  ]
  return (
    <>
      <rect
        x={20}
        y={52}
        width={520}
        height={102}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <MoleculeDiagram
        structure={phenol.structure}
        cx={84}
        cy={103}
        maxWidth={96}
        maxHeight={82}
        maxScale={28}
        showNumbering={false}
      />
      <text x={156} y={84} fontSize={17} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-sans)">
        Phenol ({phenol.condensedFormula})
      </text>
      <text x={156} y={110} fontSize={15} fill="var(--accent)" fontWeight={600} fontFamily="var(--font-sans)">
        Accepted in both Common and IUPAC systems
      </text>
      <text x={156} y={134} fontSize={15} fill="var(--fg-muted)" fontFamily="var(--font-sans)">
        C-1 is -OH; o, m, p map to locants 2, 3, 4
      </text>

      {isomers.map(({ x, entry, rel }) => (
        <g key={entry.id}>
          <rect
            x={x}
            y={168}
            width={168}
            height={222}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <text
            x={x + 84}
            y={192}
            textAnchor="middle"
            fontSize={15}
            fontWeight={600}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
          >
            {rel}
          </text>
          <MoleculeDiagram
            structure={entry.structure}
            cx={x + 84}
            cy={264}
            maxWidth={146}
            maxHeight={112}
            maxScale={34}
            showNumbering={false}
          />
          <text
            x={x + 84}
            y={346}
            textAnchor="middle"
            fontSize={16}
            fontWeight={600}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
          >
            {entry.commonName}
          </text>
          <text
            x={x + 84}
            y={374}
            textAnchor="middle"
            fontSize={16}
            fontWeight={700}
            fill="var(--accent)"
            fontFamily="var(--font-sans)"
          >
            {entry.iupacName}
          </text>
        </g>
      ))}
    </>
  )
}

function StepBenzenediols({ spec }: { spec: AlcoholPhenolStepSpec }) {
  const cols = [
    { x: 20, entry: spec.entries[0], loc: '1,2-disubstituted' },
    { x: 196, entry: spec.entries[1], loc: '1,3-disubstituted' },
    { x: 372, entry: spec.entries[2], loc: '1,4-disubstituted' },
  ]
  return (
    <>
      {cols.map(({ x, entry, loc }) => (
        <g key={entry.id}>
          <rect
            x={x}
            y={56}
            width={168}
            height={330}
            rx={12}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <text
            x={x + 84}
            y={82}
            textAnchor="middle"
            fontSize={15}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
          >
            {loc}
          </text>
          <MoleculeDiagram
            structure={entry.structure}
            cx={x + 84}
            cy={186}
            maxWidth={148}
            maxHeight={164}
            maxScale={40}
            showNumbering
          />
          <text
            x={x + 84}
            y={298}
            textAnchor="middle"
            fontSize={16}
            fontWeight={600}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
          >
            {entry.commonName}
          </text>
          {entry.commonAlt ? (
            <text
              x={x + 84}
              y={322}
              textAnchor="middle"
              fontSize={15}
              fill="var(--fg-muted)"
              fontFamily="var(--font-sans)"
            >
              (or {entry.commonAlt})
            </text>
          ) : null}
          <text
            x={x + 84}
            y={358}
            textAnchor="middle"
            fontSize={16}
            fontWeight={700}
            fill="var(--accent)"
            fontFamily="var(--font-sans)"
          >
            {entry.iupacName}
          </text>
        </g>
      ))}
    </>
  )
}

export function AlcoholPhenolNaming({ step, reducedMotion }: AlcoholPhenolNamingProps) {
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

      {index === 0 && <StepSimple spec={current} />}
      {index === 1 && <StepBranched spec={current} />}
      {index === 2 && <StepPolyhydric spec={current} />}
      {index === 3 && <StepCyclic spec={current} />}
      {index === 4 && <StepCresols spec={current} />}
      {index === 5 && <StepBenzenediols spec={current} />}

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
