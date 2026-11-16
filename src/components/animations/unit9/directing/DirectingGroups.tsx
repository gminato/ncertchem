'use client'

import React from 'react'
import { SkeletalFormula, drawingFrame, deltaText, type Bounds } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { PushArrowOverlay } from '@/components/animations/unit8/effects/PushArrows'
import { hybridOf, speciesForms, type ResonanceSpecies } from '@/lib/chem/resonance-species'
import { DIRECTING_STEP_KINDS, extraRow, groupColumns, groupLabel, nitroSpecies, PHENOL, sigmaRow, type DirectingStepKind, type SigmaItem } from './directing-steps'
import styles from './DirectingGroups.module.css'

export interface DirectingGroupsProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'
/** The widest a row of drawings may be: the panel less a margin on each side. */
const ROW_MAX_WIDTH = 530

/** Each Step's kind, in order. The Scrolly passes the Step index. */
const KINDS: readonly DirectingStepKind[] = DIRECTING_STEP_KINDS

/**
 * The largest bond length (up to `maxScale`) at which a row of graphs fits `maxWidth` across. Label room
 * does not scale with the bonds, so the width is measured at each candidate scale.
 */
function fitRowScale(graphs: readonly MolGraph[], gap: number, maxWidth: number, maxScale: number): number {
  for (let s = maxScale; s >= 20; s -= 2) {
    const total = graphs.reduce((t, g) => t + drawingFrame(g, s).bounds.width, 0) + gap * (graphs.length - 1)
    if (total <= maxWidth) return s
  }
  return 20
}

/** A row of drawings centred on `centreX`, with a gap between them, each item's bounds known. */
function rowLayout(bounds: Bounds[], gap: number, centreX: number) {
  const width = bounds.reduce((t, b) => t + b.width, 0) + gap * (bounds.length - 1)
  let cursor = centreX - width / 2
  return bounds.map((b) => {
    const cx = cursor + b.width / 2
    cursor += b.width + gap
    return cx
  })
}

/**
 * One resonance row: the forms of a species with curved arrows on the first form, and optionally the
 * hybrid on a second row (with its δ charges). Same electron-pushing layout as the Unit 8 figure.
 */
function ContributorRows({
  species,
  forms,
  scale,
  gap,
  centreY,
  centreX = VIEW_WIDTH / 2,
  arrows,
  hybrid,
  labels,
}: {
  species: ResonanceSpecies
  forms: number
  scale: number
  gap: number
  centreY: number
  centreX?: number
  arrows: boolean
  hybrid: boolean
  labels?: readonly string[]
}) {
  const graphs = speciesForms(species).slice(0, forms)
  const hy = hybridOf(species)
  const fitted = fitRowScale(graphs, gap, ROW_MAX_WIDTH, scale)
  const formBounds = graphs.map((g) => drawingFrame(g, fitted).bounds)
  const hybridBounds = drawingFrame(hy.graph, fitted).bounds
  const row1 = rowLayout(formBounds, gap, centreX)
  const rowGap = 34
  const h1 = Math.max(...formBounds.map((b) => b.height))
  const h2 = hybridBounds.height
  const top = hybrid ? centreY - (h1 + rowGap + h2) / 2 : centreY - h1 / 2
  const y1 = top + h1 / 2
  const y2 = top + h1 + rowGap + h2 / 2
  const arrowsOf = arrows ? species.pushes[0] : undefined
  return (
    <g>
      {graphs.map((g, i) => (
        <SkeletalFormula
          key={`f${i}`}
          graph={g}
          scale={fitted}
          x={row1[i]}
          y={y1}
          showLonePairs
          overlay={i === 0 && arrowsOf ? <PushArrowOverlay graph={g} scale={scale} arrows={arrowsOf} /> : undefined}
        />
      ))}
      {formBounds.slice(0, -1).map((_, i) => (
        <ResonanceSign key={`r${i}`} x={(row1[i] + row1[i + 1]) / 2} y={y1} width={gap} />
      ))}
      {labels?.map((text, i) => (
        <text key={`l${i}`} x={row1[i]} y={y1 + h1 / 2 + 22} textAnchor="middle" fontSize={16} fontFamily={FONT} fill="var(--fg-muted)">
          {text}
        </text>
      ))}
      {hybrid && (
        <>
          <SkeletalFormula
            graph={hy.graph}
            scale={fitted}
            x={VIEW_WIDTH / 2}
            y={y2}
            innerCircles={species.innerCircles}
            partialBonds={hy.partialBonds}
            partialCharges={hy.charges.map((c) => ({ atom: c.atom, label: c.label }))}
          />
        </>
      )}
    </g>
  )
}

/** The double-headed resonance arrow between two forms. */
function ResonanceSign({ x, y, width }: { x: number; y: number; width: number }) {
  const h = Math.max(18, width - 22) / 2
  return (
    <g stroke="var(--fg-muted)" fill="var(--fg-muted)" strokeWidth={2}>
      <line x1={x - h + 6} y1={y} x2={x + h - 6} y2={y} />
      <polygon points={`${x - h},${y} ${x - h + 9},${y - 5} ${x - h + 9},${y + 5}`} />
      <polygon points={`${x + h},${y} ${x + h - 9},${y - 5} ${x + h - 9},${y + 5}`} />
    </g>
  )
}

/** A row of σ-complexes (arenium ions), each with its label under it, and the oxonium arrows where there is one. */
function SigmaRow({ items, scale, centreY, gap = 30 }: { items: SigmaItem[]; scale: number; centreY: number; gap?: number }) {
  const fitted = fitRowScale(items.map((it) => it.graph), gap, ROW_MAX_WIDTH, scale)
  const bounds = items.map((it) => drawingFrame(it.graph, fitted).bounds)
  const xs = rowLayout(bounds, gap, VIEW_WIDTH / 2)
  const maxH = Math.max(...bounds.map((b) => b.height))
  return (
    <g>
      {items.map((it, i) => (
        <g key={it.label}>
          <SkeletalFormula graph={it.graph} scale={fitted} x={xs[i]} y={centreY} showLonePairs />
          <text x={xs[i]} y={centreY + maxH / 2 + 26} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            {it.label}
          </text>
          <text x={xs[i]} y={centreY + maxH / 2 + 48} textAnchor="middle" fontSize={15} fontFamily={FONT} fill="var(--fg-muted)">
            {it.note}
          </text>
        </g>
      ))}
    </g>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <text x={VIEW_WIDTH / 2} y={44} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
      {children}
    </text>
  )
}

function Caption({ lines }: { lines: readonly React.ReactNode[] }) {
  return (
    <g>
      {lines.map((line, i) => (
        <text key={i} x={VIEW_WIDTH / 2} y={392 + i * 24} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </g>
  )
}

function DonorStep() {
  return (
    <g>
      <Title>−OH: the lone pair feeds the ring (+R)</Title>
      <ContributorRows species={PHENOL} forms={3} scale={50} gap={40} centreY={196} arrows hybrid labels={['I', 'II', 'III']} />
      <Caption
        lines={[
          <React.Fragment key="a">Electron density rises at the ortho and para carbons ({deltaText('δ−')}).</React.Fragment>,
          'So the OH group activates the ring for electrophiles.',
        ]}
      />
    </g>
  )
}

function WithdrawerStep() {
  return (
    <g>
      <Title>−NO₂: the ring feeds the nitro group (−R)</Title>
      <ContributorRows species={nitroSpecies()} forms={3} scale={50} gap={40} centreY={196} arrows hybrid labels={['I', 'II', 'III']} />
      <Caption
        lines={[
          <React.Fragment key="a">Electron density falls at the ortho and para carbons ({deltaText('δ+')}).</React.Fragment>,
          'The meta carbons keep more electron density.',
        ]}
      />
    </g>
  )
}

function SigmaStep() {
  return (
    <g>
      <Title>Phenol + NO₂⁺: three σ-complexes</Title>
      <SigmaRow items={sigmaRow()} scale={42} centreY={190} gap={36} />
      <Caption
        lines={[
          'Each attack leaves one sp³ carbon and a + on the ring.',
          'The + sits ortho or para to the attacked carbon.',
        ]}
      />
    </g>
  )
}

function ExtraStep() {
  return (
    <g>
      <Title>The extra form: OH reaches the +</Title>
      <SigmaRow items={extraRow()} scale={42} centreY={190} gap={36} />
      <Caption
        lines={[
          'For ortho and para attacks, the + can sit on C–OH.',
          'The O lone pair forms C=O⁺H: a form meta cannot have.',
        ]}
      />
    </g>
  )
}

function TableStep() {
  const cols = groupColumns()
  const colX = [VIEW_WIDTH * 0.18, VIEW_WIDTH * 0.5, VIEW_WIDTH * 0.82]
  const heads = ['o, p: activating', 'o, p: halogens', 'm: deactivating']
  const lists = [cols.activating, cols.halogens, cols.meta]
  return (
    <g>
      <Title>Where each group sends the attack</Title>
      {lists.map((list, c) => (
        <g key={c}>
          <text x={colX[c]} y={112} textAnchor="middle" fontSize={19} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
            {heads[c]}
          </text>
          {list.map((g, r) => (
            <text key={g.group} x={colX[c]} y={156 + r * 30} textAnchor="middle" fontSize={20} fontFamily={FONT} fill="var(--fg)">
              {groupLabel(g.group)}
            </text>
          ))}
        </g>
      ))}
      <Caption
        lines={[
          'Activating groups and halogens send it to o and p.',
          'The deactivating groups in the right column send it to m.',
        ]}
      />
    </g>
  )
}

function renderStep(kind: DirectingStepKind): React.ReactNode {
  switch (kind) {
    case 'donor':
      return <DonorStep />
    case 'withdrawer':
      return <WithdrawerStep />
    case 'sigma':
      return <SigmaStep />
    case 'extra':
      return <ExtraStep />
    case 'table':
      return <TableStep />
  }
}

function ariaFor(kind: DirectingStepKind): string {
  switch (kind) {
    case 'donor':
      return 'Phenol: three resonance forms in which the OH lone pair moves into the ring, and the hybrid with δ minus on the ortho and para carbons'
    case 'withdrawer':
      return 'Nitrobenzene: three resonance forms in which the ring gives electrons to the nitro group, and the hybrid with δ plus on the ortho and para carbons'
    case 'sigma':
      return 'Phenol with an NO2 plus attack at the ortho, meta and para carbons: three arenium ions with a positive charge on the ring'
    case 'extra':
      return 'The extra form for the ortho and para attacks on phenol, with the positive charge on the carbon that bears OH; the meta attack has no such form'
    case 'table':
      return 'Table of NCERT groups: activating groups and halogens direct to the ortho and para carbons, and the deactivating groups direct to the meta carbons'
  }
}

/** The directing-groups Scrolly: five Steps (Section 9.5.6). The drawing fades in on each Step. */
export function DirectingGroups({ step, reducedMotion }: DirectingGroupsProps) {
  const kind = KINDS[Math.max(0, Math.min(step, KINDS.length - 1))]
  return (
    <svg viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`} role="img" aria-label={ariaFor(kind)} className={styles.drawing} data-step={kind}>
      <g key={kind} className={reducedMotion ? undefined : styles.enter}>
        {renderStep(kind)}
      </g>
    </svg>
  )
}
