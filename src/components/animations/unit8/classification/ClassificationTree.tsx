'use client'
import type { ReactNode } from 'react'

import { Label } from '@/components/vocab'
import { SkeletalFormula, subscriptDigits } from '@/components/organic'
import type { Subclass } from '@/lib/chem/classification'
import { boilingRises, classificationSteps, ladderMembers, treeLeaves, TREE_COLUMNS, type ColumnKey, type TreeLeaf } from './classification-steps'
import styles from './ClassificationTree.module.css'

export interface ClassificationTreeProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const ROOT_Y = 30
const BAR_Y = 70
const NODE_Y = 86
const NODE_H = 28
const NODE_W = 132
/** Centre y of the three leaves in a column. */
const LEAF_Y = [156, 262, 368] as const
/** Pixels per bond in the tree's leaves: the largest size at which three leaves fit a column. */
const LEAF_SCALE = 26
const LADDER_SCALE = 26
const LADDER_X = [62, 172, 282, 392, 502] as const

const STEPS = classificationSteps()

/** The subclass written under a leaf: short, so it fits a column on one line. */
const SHORT: Record<Subclass, string> = {
  'open chain': 'open chain',
  homocyclic: 'homocyclic',
  benzenoid: 'benzenoid',
  'non-benzenoid': 'non-benzenoid',
  'heterocyclic aromatic': 'aromatic',
  'heterocyclic non-aromatic': 'non-aromatic',
}

const subscripted = (text: string) => text.replace(/\d+/g, (d) => subscriptDigits(Number(d)))
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/** One leaf of a column: its drawing, its formula and its subclass from the lib. */
function Leaf({ leaf, x, y }: { leaf: TreeLeaf; x: number; y: number }) {
  return (
    <g data-testid="tree-leaf" data-smiles={leaf.smiles} data-class={leaf.ringClass}>
      <SkeletalFormula graph={leaf.graph} scale={LEAF_SCALE} x={x} y={y} />
      <Label x={x} y={y + 44} fontSize={15} fill="var(--fg)" fontWeight={600} textAnchor="middle">
        {subscripted(leaf.formula)}
      </Label>
      <Label x={x} y={y + 62} fontSize={14} fill="var(--fg-muted)" textAnchor="middle">
        {SHORT[leaf.subclass]}
      </Label>
    </g>
  )
}

/** The tree: a root, a bar, four class nodes, and the leaves of every column revealed so far. */
function Tree({ active, revealed, reducedMotion }: { active: ColumnKey; revealed: ColumnKey[]; reducedMotion: boolean }) {
  const first = TREE_COLUMNS[0].x
  const last = TREE_COLUMNS[TREE_COLUMNS.length - 1].x
  return (
    <g data-testid="tree" data-active={active}>
      <rect x={VIEW_WIDTH / 2 - 105} y={ROOT_Y - 15} width={210} height={30} rx={8} fill="var(--surface)" stroke="var(--fg-subtle)" strokeWidth={1.4} />
      <Label x={VIEW_WIDTH / 2} y={ROOT_Y} fontSize={16} fill="var(--fg)" fontWeight={600} textAnchor="middle">
        Organic compounds
      </Label>
      <g stroke="var(--fg-subtle)" strokeWidth={1.4} fill="none" opacity={0.7}>
        <line x1={VIEW_WIDTH / 2} x2={VIEW_WIDTH / 2} y1={ROOT_Y + 15} y2={BAR_Y} />
        <line x1={first} x2={last} y1={BAR_Y} y2={BAR_Y} />
        {TREE_COLUMNS.map((c) => (
          <line key={c.key} x1={c.x} x2={c.x} y1={BAR_Y} y2={NODE_Y} />
        ))}
      </g>
      {TREE_COLUMNS.map((c) => {
        const shown = revealed.includes(c.key)
        const isActive = c.key === active
        return (
          <g key={c.key} opacity={shown ? 1 : 0.35}>
            <rect
              x={c.x - NODE_W / 2}
              y={NODE_Y}
              width={NODE_W}
              height={NODE_H}
              rx={7}
              fill={isActive ? 'var(--accent-soft)' : 'var(--surface)'}
              stroke={isActive ? 'var(--accent)' : 'var(--fg-subtle)'}
              strokeWidth={isActive ? 1.8 : 1.2}
            />
            <Label x={c.x} y={NODE_Y + NODE_H / 2} fontSize={14} fill={isActive ? 'var(--accent)' : 'var(--fg)'} fontWeight={600} textAnchor="middle">
              {c.label}
            </Label>
            {shown
              ? treeLeaves(c).map((leaf, j) => (
                  <g key={leaf.smiles} className={enter(reducedMotion)}>
                    <Leaf leaf={leaf} x={c.x} y={LEAF_Y[j]} />
                  </g>
                ))
              : null}
          </g>
        )
      })}
    </g>
  )
}

/** The alcohol ladder: five members with the carbon each adds shaded, and the names from the lib. */
function Ladder({ reducedMotion }: { reducedMotion: boolean }) {
  const members = ladderMembers()
  return (
    <g data-testid="ladder" className={enter(reducedMotion)}>
      <Label x={VIEW_WIDTH / 2} y={50} fontSize={18} fill="var(--fg)" fontWeight={600} textAnchor="middle">
        Alcohols, C₁ to C₅: one CH₂ per step
      </Label>
      {members.map((m, i) => (
        <g key={m.smiles} data-testid="ladder-member" data-name={m.name}>
          <SkeletalFormula graph={m.graph} scale={LADDER_SCALE} x={LADDER_X[i]} y={160} highlightAtoms={i > 0 ? [m.newCarbon] : []} />
          <Label x={LADDER_X[i]} y={240} fontSize={15} fill="var(--fg)" fontWeight={600} textAnchor="middle">
            {m.name}
          </Label>
          <Label x={LADDER_X[i]} y={262} fontSize={14} fill="var(--fg-muted)" textAnchor="middle">
            {subscripted(m.formula)}
          </Label>
        </g>
      ))}
      {members.slice(1).map((m, i) => (
        <Label key={`ch2-${m.smiles}`} x={(LADDER_X[i] + LADDER_X[i + 1]) / 2} y={302} fontSize={14} fill="var(--accent)" fontWeight={600} textAnchor="middle">
          +CH₂
        </Label>
      ))}
      <Label x={VIEW_WIDTH / 2} y={352} fontSize={15} fill="var(--fg-muted)" textAnchor="middle">
        Each shaded carbon is the one added to the member before it.
      </Label>
      <Label x={VIEW_WIDTH / 2} y={374} fontSize={15} fill="var(--fg-muted)" textAnchor="middle">
        The –OH group is the same in every member.
      </Label>
    </g>
  )
}

/** Normal boiling points as bars, with the rise at each CH₂ step. Values from the lib's data. */
function Boiling({ reducedMotion }: { reducedMotion: boolean }) {
  const members = ladderMembers()
  const rises = boilingRises(members)
  const BASE = 380
  const TOP_MAX = 150
  const scale = (BASE - TOP_MAX) / Math.max(...members.map((m) => m.boilingPointC))
  const xs = members.map((_, i) => 90 + i * 100)
  return (
    <g data-testid="boiling" className={enter(reducedMotion)}>
      <Label x={28} y={50} fontSize={16} fill="var(--fg)" fontWeight={600} textAnchor="start">
        Normal boiling point, °C
      </Label>
      <line x1={40} x2={VIEW_WIDTH - 30} y1={BASE} y2={BASE} stroke="var(--fg-subtle)" strokeOpacity={0.5} />
      {members.map((m, i) => {
        const h = m.boilingPointC * scale
        return (
          <g key={m.smiles} data-testid="boiling-bar" data-bp={m.boilingPointC}>
            <rect x={xs[i] - 28} y={BASE - h} width={56} height={h} rx={5} fill="var(--accent)" fillOpacity={0.85} />
            <Label x={xs[i]} y={BASE - h - 10} fontSize={15} fill="var(--fg)" fontWeight={600} textAnchor="middle">
              {m.boilingPointC} °C
            </Label>
            <Label x={xs[i]} y={BASE + 22} fontSize={15} fill="var(--fg)" textAnchor="middle">
              {m.name}
            </Label>
          </g>
        )
      })}
      {rises.map((r, i) => (
        <Label key={`rise-${i}`} x={(xs[i] + xs[i + 1]) / 2} y={124} fontSize={14} fill="var(--accent)" fontWeight={600} textAnchor="middle">
          +{r} °C
        </Label>
      ))}
    </g>
  )
}

/**
 * The classification-tree Scrolly visual (Section 8.4). Steps 1 to 4 sort the molecules into the
 * tree one class at a time; step 5 lays out the alcohol series; step 6 plots the boiling points.
 * Each Step fades in, and under reduced motion it is shown at once.
 */
export function ClassificationTree({ step, reducedMotion }: ClassificationTreeProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const active = STEPS[index]
  let body: ReactNode
  let label: string
  if (active.kind === 'tree') {
    body = <Tree active={active.active} revealed={active.revealed} reducedMotion={reducedMotion} />
    label = `The organic compounds sorted into classes, showing the ${active.active} class`
  } else if (active.kind === 'ladder') {
    body = <Ladder reducedMotion={reducedMotion} />
    label = 'The alcohol series from methanol to pentan-1-ol, each member one CH₂ longer'
  } else {
    body = <Boiling reducedMotion={reducedMotion} />
    label = 'Bar chart of the normal boiling points of the first five alcohols, rising at each step'
  }
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="classification-tree"
      data-step={index}
    >
      {body}
    </svg>
  )
}
