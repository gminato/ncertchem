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
        const label = typeset(item).replace(/-$/, '–').replace(/^COCl$/, '–COCl')
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

/** Centre x of the ring rows' drawings. */
const RING_CX = 215
/** Bond length of the ring rows, in units. */
const RING_R = 28

/**
 * One ring of the ortho, meta and para rows, drawn here rather than by the skeletal layout so
 * that every row has the same orientation: the chlorine sits on the right vertex, and the methyl
 * group sits 1, 2 or 3 vertices round from it, so every substituent points right, up or left.
 * Kekulé bonds are the three inner lines.
 */
function RingRowDrawing({ row }: { row: RingRow }) {
  const cx = RING_CX
  const cy = row.cy
  const dir = (k: number) => ({ x: Math.cos((k * Math.PI) / 3), y: -Math.sin((k * Math.PI) / 3) })
  const vertex = (k: number) => ({ x: cx + RING_R * dir(k).x, y: cy + RING_R * dir(k).y })
  const edges = Array.from({ length: 6 }, (_, k) => k)
  const methylEnd = (() => {
    const d = dir(row.methylOffset)
    const v = vertex(row.methylOffset)
    return { x: v.x + RING_R * d.x, y: v.y + RING_R * d.y, d }
  })()
  const clEnd = { x: vertex(0).x + RING_R, y: vertex(0).y }
  const labelFor = (end: { x: number; y: number; d: { x: number } }) =>
    end.d.x > 0.3
      ? { x: end.x + 6, y: end.y + 5, anchor: 'start' as const }
      : { x: end.x - 6, y: end.y + 5, anchor: 'end' as const }
  const clLabel = labelFor({ x: clEnd.x, y: clEnd.y, d: { x: 1 } })
  const meLabel = labelFor(methylEnd)
  const c = { x: cx, y: cy }
  const inner = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
    const towardsCentre = { x: (c.x - mid.x) * 0.35, y: (c.y - mid.y) * 0.35 }
    const at = (t: number) => ({ x: a.x + (b.x - a.x) * t + towardsCentre.x, y: a.y + (b.y - a.y) * t + towardsCentre.y })
    return { p: at(0.18), q: at(0.82) }
  }
  return (
    <g>
      {edges.map((k) => {
        const a = vertex(k)
        const b = vertex((k + 1) % 6)
        const i = k % 2 === 0 ? inner(a, b) : null
        return (
          <g key={`edge-${k}`}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
            {i ? <line x1={i.p.x} y1={i.p.y} x2={i.q.x} y2={i.q.y} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" /> : null}
          </g>
        )
      })}
      <line x1={vertex(0).x} y1={vertex(0).y} x2={clEnd.x} y2={clEnd.y} stroke="var(--fg)" strokeWidth={2} strokeLinecap="round" />
      <Label x={clLabel.x} y={clLabel.y} fontSize={16} fill="var(--atom-hal)" textAnchor={clLabel.anchor}>
        Cl
      </Label>
      <line
        x1={vertex(row.methylOffset).x}
        y1={vertex(row.methylOffset).y}
        x2={methylEnd.x}
        y2={methylEnd.y}
        stroke="var(--fg)"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Label x={meLabel.x} y={meLabel.y} fontSize={16} fill="var(--fg)" textAnchor={meLabel.anchor}>
        CH₃
      </Label>
    </g>
  )
}

/** Ortho, meta and para: three rings, each with its locants and the name the lib gives it. */
function Rows({ rows }: { rows: RingRow[] }) {
  return (
    <g>
      {rows.slice(1).map((row, i) => {
        // Midway between the bottom of the row above (cy + 24) and the top of this row (cy - 54).
        const y = (rows[i].cy + 24 + row.cy - 54) / 2
        return <line key={`rule-${row.relation}`} x1={40} x2={VIEW_WIDTH - 40} y1={y} y2={y} stroke="var(--fg-subtle)" strokeOpacity={0.25} />
      })}
      {rows.map((row) => (
        <g key={row.relation}>
          <Label x={24} y={row.cy - 4} fontSize={22} fill="var(--fg)" fontWeight={600} textAnchor="start">
            {row.relation}
          </Label>
          <Label x={24} y={row.cy + 20} fontSize={14} fill="var(--fg-muted)" textAnchor="start">
            {`positions ${row.locants}`}
          </Label>
          <RingRowDrawing row={row} />
          <Label x={330} y={row.cy + 6} fontSize={17} fill="var(--fg)" fontWeight={600} textAnchor="start">
            {row.name}
          </Label>
        </g>
      ))}
    </g>
  )
}

/** One Step's content: the title, the drawing, the name in large type, and the reasoning lines. */
function StepPanel({ step, reducedMotion }: { step: FgStep; reducedMotion: boolean }) {
  const lineTop = step.big ? 340 : 300
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
        <Label x={VIEW_WIDTH / 2} y={300} fontSize={26} fill="var(--fg)" fontWeight={600} textAnchor="middle" data-testid="fgnaming-name">
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
