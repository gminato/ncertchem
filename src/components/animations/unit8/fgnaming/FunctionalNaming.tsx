'use client'

import { Label } from '@/components/vocab'
import { SkeletalFormula } from '@/components/organic'
import { NCERT_FUNCTIONAL_PRIORITY } from '@/lib/chem/ncert-unit8-tables'
import { priorityRank } from '@/lib/chem/functional-namer'
import { typeset } from '@/lib/chem/functional-namer'
import { functionalNamingSteps, type DrawnMolecule, type FgStep, type RingRow } from './fgnaming-steps'
import styles from './FunctionalNaming.module.css'

export interface FunctionalNamingProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const STEPS = functionalNamingSteps()

/** The fade-in class, dropped under reduced motion so each Step is shown at once. */
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/** Splits text into lines of at most `width` characters, at word boundaries. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > width && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** A molecule of a Step: the skeletal drawing, with its highlights and locants. */
function Drawing({ molecule }: { molecule: DrawnMolecule }) {
  return (
    <SkeletalFormula
      graph={molecule.graph}
      scale={molecule.scale}
      x={molecule.x}
      y={molecule.y}
      highlightAtoms={molecule.highlightAtoms}
      highlightBonds={molecule.highlightBonds}
      locants={molecule.locants}
      innerCircles={molecule.innerCircles}
    />
  )
}

/** NCERT's list of decreasing priority as a 4 by 3 grid, with the Step's groups picked out. */
function Ladder({ present }: { present: FgStep['present'] }) {
  const CELL_W = 128
  const CELL_H = 38
  const GAP = 8
  const X0 = (VIEW_WIDTH - (4 * CELL_W + 3 * GAP)) / 2
  const Y0 = 246
  const ranks = new Set(present.map(priorityRank))
  return (
    <g>
      <Label x={VIEW_WIDTH / 2} y={226} fontSize={16} fill="var(--fg-muted)" textAnchor="middle">
        Order of decreasing priority (NCERT)
      </Label>
      {NCERT_FUNCTIONAL_PRIORITY.map((item, i) => {
        const col = i % 4
        const row = Math.floor(i / 4)
        const x = X0 + col * (CELL_W + GAP)
        const y = Y0 + row * (CELL_H + GAP)
        const picked = ranks.has(i)
        const label = typeset(item).replace(/-$/, '–')
        return (
          <g key={item} data-picked={picked ? 'true' : 'false'}>
            <rect
              x={x}
              y={y}
              width={CELL_W}
              height={CELL_H}
              rx={8}
              fill={picked ? 'var(--accent-soft)' : 'var(--surface-raised)'}
              stroke={picked ? 'var(--accent)' : 'var(--border)'}
              strokeWidth={picked ? 2 : 1}
            />
            <Label x={x + 10} y={y + CELL_H / 2 + 5} fontSize={14} fill="var(--fg-subtle)" textAnchor="start">
              {String(i + 1)}
            </Label>
            <Label x={x + CELL_W / 2 + 8} y={y + CELL_H / 2 + 6} fontSize={16} fill={picked ? 'var(--fg)' : 'var(--fg-muted)'} fontWeight={picked ? 600 : 400} textAnchor="middle">
              {label}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

/** Ortho, meta and para: three rings, each with its locants and the name the lib gives it. */
function Rows({ rows }: { rows: RingRow[] }) {
  return (
    <g>
      {rows.slice(1).map((row, i) => {
        const above = rows[i].molecule.y
        const y = (above + row.molecule.y) / 2
        return <line key={`rule-${row.relation}`} x1={40} x2={VIEW_WIDTH - 40} y1={y} y2={y} stroke="var(--fg-subtle)" strokeOpacity={0.25} />
      })}
      {rows.map((row) => (
        <g key={row.relation}>
          <Label x={40} y={row.molecule.y - 6} fontSize={22} fill="var(--fg)" fontWeight={600} textAnchor="start">
            {row.relation}
          </Label>
          <Label x={40} y={row.molecule.y + 18} fontSize={16} fill="var(--fg-muted)" textAnchor="start">
            {`positions ${row.locants}`}
          </Label>
          <Drawing molecule={row.molecule} />
          <Label x={300} y={row.molecule.y + 7} fontSize={20} fill="var(--fg)" fontWeight={600} textAnchor="start">
            {row.molecule.name}
          </Label>
        </g>
      ))}
    </g>
  )
}

/** One Step's content: the title, the drawing, the name in large type, and the reasoning lines. */
function StepPanel({ step, reducedMotion }: { step: FgStep; reducedMotion: boolean }) {
  const lineTop = step.big ? 326 : 300
  const lines = step.lines.flatMap((line) => wrap(line, 62))
  return (
    <g className={enter(reducedMotion)} data-testid="fgnaming-step">
      <Label x={VIEW_WIDTH / 2} y={36} fontSize={22} fill="var(--fg)" fontWeight={600} textAnchor="middle">
        {step.title}
      </Label>
      {step.layout === 'ladder' ? (
        <>
          {step.molecules.map((m) => (
            <Drawing key={m.smiles} molecule={m} />
          ))}
          <Ladder present={step.present} />
        </>
      ) : null}
      {step.layout === 'centred'
        ? step.molecules.map((m) => <Drawing key={m.smiles} molecule={m} />)
        : null}
      {step.layout === 'rows' ? <Rows rows={step.rows} /> : null}
      {step.big ? (
        <Label x={VIEW_WIDTH / 2} y={282} fontSize={26} fill="var(--fg)" fontWeight={600} textAnchor="middle" data-testid="fgnaming-name">
          {step.big}
        </Label>
      ) : null}
      {step.layout !== 'rows' && step.layout !== 'ladder'
        ? lines.map((line, i) => (
            <Label key={line} x={VIEW_WIDTH / 2} y={lineTop + i * 24} fontSize={16} fill="var(--fg-muted)" textAnchor="middle">
              {line}
            </Label>
          ))
        : null}
      {step.layout === 'ladder' && step.lines.length > 0
        ? wrap(step.lines[0], 62).map((line, i) => (
            <Label key={line} x={VIEW_WIDTH / 2} y={410 + i * 22} fontSize={16} fill="var(--fg-muted)" textAnchor="middle">
              {line}
            </Label>
          ))
        : null}
    </g>
  )
}

/**
 * The functional-naming Scrolly (Sections 8.5.3 and 8.5.4): the priority ladder, the principal
 * group and parent chain, the numbering, a ketone over an alcohol, ortho, meta and para rings, and
 * the alphabetical tie-break. The molecules and names come from the naming lib.
 */
export function FunctionalNaming({ step, reducedMotion }: FunctionalNamingProps) {
  const index = Math.min(Math.max(0, step), STEPS.length - 1)
  const current = STEPS[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`Naming step ${index + 1} of ${STEPS.length}: ${current.title}`}
      className={styles.panel}
      data-step={index}
    >
      <StepPanel key={`step-${index}`} step={current} reducedMotion={reducedMotion} />
    </svg>
  )
}
