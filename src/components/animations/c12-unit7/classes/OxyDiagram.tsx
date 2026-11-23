'use client'

import type { ReactNode } from 'react'
import { SkeletalFormula, drawingFrame, freeAngle } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { neighbours } from '@/lib/chem/molecule-parse'
import { isAromaticRingCarbon } from '@/lib/chem/haloalkanes'
import type { OxyClassification } from '@/lib/chem/c12-u7-s1-classification'

export interface OxyDiagramProps {
  graph: MolGraph
  classification: OxyClassification
  cx: number
  cy: number
  maxW: number
  maxH: number
  minScale?: number
  maxScale?: number
  /** Highlight each –OH oxygen with a soft crimson ring. */
  highlightOh?: boolean
  /** Number direct carbon neighbours of the C–OH carbon (for 1°/2°/3°). */
  numberCarbons?: boolean
  /** Label non-OH methyl substituent(s) on a phenol ring (e.g. CH₃ on 2-methylphenol). */
  labelRingAlkyl?: boolean
  /** Draw 120° trigonal planar angle arc on a vinylic C–OH carbon. */
  showPlanarAngle?: boolean
  /** Show lone pairs on oxygen atoms. */
  showLonePairs?: boolean
  /** Optional ether left/right arm labels & symmetry line. */
  etherOverlay?: {
    leftLabel: string
    rightLabel: string
    symmetrical: boolean
  }
  /** Surface fill token for small badge chips inside the drawing. */
  surfaceFill?: string
}

const MIN_DEFAULT = 42
const MAX_DEFAULT = 78

/** Computes fitted skeletal scale within [minScale, maxScale] for the given drawing box. */
export function fitOxyScale(
  graph: MolGraph,
  maxW: number,
  maxH: number,
  minScale = MIN_DEFAULT,
  maxScale = MAX_DEFAULT
): number {
  const frame = drawingFrame(graph, 1)
  const wUnits = Math.max(frame.bounds.width + 0.5, 2.2)
  const hUnits = Math.max(frame.bounds.height + 0.5, 1.8)
  const fit = Math.min(maxScale, maxW / wUnits, maxH / hUnits)
  return Math.max(minScale, Math.round(fit))
}

/** Collects all atoms in the two carbon branches attached to an ether oxygen. */
function etherArmAtoms(g: MolGraph, oIdx: number): [number[], number[]] {
  const nbs = neighbours(g, oIdx)
  if (nbs.length !== 2) return [[], []]
  const collect = (start: number): number[] => {
    const seen = new Set<number>([oIdx, start])
    const q = [start]
    const out: number[] = []
    while (q.length > 0) {
      const cur = q.shift() as number
      out.push(cur)
      for (const nb of neighbours(g, cur)) {
        if (!seen.has(nb.atom)) {
          seen.add(nb.atom)
          q.push(nb.atom)
        }
      }
    }
    return out
  }
  return [collect(nbs[0].atom), collect(nbs[1].atom)]
}

/** Infers the group label (CH₃, C₂H₅, C₆H₅) directly from the atoms in an ether branch. */
function etherArmGroupLabel(g: MolGraph, arm: readonly number[]): string {
  if (arm.some((i) => isAromaticRingCarbon(g, i))) return 'C₆H₅'
  if (arm.length === 1) return 'CH₃'
  if (arm.length === 2) return 'C₂H₅'
  return `C${arm.length}`
}

/**
 * Shared SVG renderer for Section 7.1 alcohols, phenols, and ethers.
 * Uses `SkeletalFormula` with chemically accurate overlays: sp³ (teal) vs sp² (amber) C–O
 * carbon rings, adjacent C=C or benzene highlights, –CH₂– spacer warnings, neighbour counts,
 * and ether arm symmetry brackets.
 */
export function OxyDiagram({
  graph,
  classification,
  cx,
  cy,
  maxW,
  maxH,
  minScale = MIN_DEFAULT,
  maxScale = MAX_DEFAULT,
  highlightOh = false,
  numberCarbons = false,
  labelRingAlkyl = false,
  showPlanarAngle = false,
  showLonePairs = false,
  etherOverlay,
  surfaceFill = 'var(--surface)',
}: OxyDiagramProps) {
  const scale = fitOxyScale(graph, maxW, maxH, minScale, maxScale)
  const frame = drawingFrame(graph, scale)
  const isSp2 = classification.carbonHybridisation === 'sp²'
  const cRingColor = isSp2 ? 'var(--ox)' : 'var(--orbital-neg)'

  const underlays: ReactNode[] = []
  const overlays: ReactNode[] = []

  // 1. Aromatic ring wash (for benzylic, spacer-benzene, or phenol)
  if (
    (classification.subclassKind === 'benzylic' ||
      classification.family === 'phenol' ||
      classification.spacerAtoms.length > 0) &&
    frame.ringCentres.length > 0
  ) {
    const rc = frame.ringCentres[0]
    const ringTone =
      classification.family === 'phenol'
        ? 'var(--ox)'
        : classification.spacerAtoms.length > 0
          ? 'var(--fg-muted)'
          : 'var(--accent)'
    underlays.push(
      <circle
        key="ring-glow"
        cx={rc.x}
        cy={rc.y}
        r={0.68 * scale}
        fill={ringTone}
        fillOpacity={0.11}
        stroke={ringTone}
        strokeOpacity={0.35}
        strokeWidth={1.6}
        strokeDasharray="4 3"
      />
    )
  }

  // 2. Adjacent C=C highlight for allylic or vinylic alcohols
  if (
    (classification.subclassKind === 'allylic' || classification.subclassKind === 'vinylic') &&
    classification.decidingAtoms.length === 2
  ) {
    const [a, b] = classification.decidingAtoms
    const pa = frame.points[a]
    const pb = frame.points[b]
    underlays.push(
      <line
        key="cc-double-glow"
        x1={pa.x}
        y1={pa.y}
        x2={pb.x}
        y2={pb.y}
        stroke="var(--ox)"
        strokeOpacity={0.25}
        strokeWidth={0.44 * scale}
        strokeLinecap="round"
      />
    )
  }

  // 3. Ether arm highlights & optional vertical mirror line
  if (classification.family === 'ether' && classification.oxygenIndices.length === 1) {
    const oIdx = classification.oxygenIndices[0]
    const oPt = frame.points[oIdx]
    const [arm1, arm2] = etherArmAtoms(graph, oIdx)
    const arm1X = arm1.reduce((s, i) => s + frame.points[i].x, 0) / Math.max(arm1.length, 1)
    const arm2X = arm2.reduce((s, i) => s + frame.points[i].x, 0) / Math.max(arm2.length, 1)
    const leftArm = arm1X <= arm2X ? arm1 : arm2
    const rightArm = arm1X <= arm2X ? arm2 : arm1
    const same = classification.etherSymmetry === 'simple'
    const leftTone = 'var(--orbital-neg)'
    const rightTone = same ? 'var(--orbital-neg)' : 'var(--ox)'

    for (const [arm, tone, prefix] of [
      [leftArm, leftTone, 'l'],
      [rightArm, rightTone, 'r'],
    ] as const) {
      for (const idx of arm) {
        const pt = frame.points[idx]
        underlays.push(
          <circle
            key={`arm-${prefix}-${idx}`}
            cx={pt.x}
            cy={pt.y}
            r={0.28 * scale}
            fill={tone}
            fillOpacity={0.18}
          />
        )
      }
      // Highlight bonds inside the arm
      graph.bonds.forEach((b, bi) => {
        if (arm.includes(b.a) && arm.includes(b.b)) {
          underlays.push(
            <line
              key={`armb-${prefix}-${bi}`}
              x1={frame.points[b.a].x}
              y1={frame.points[b.a].y}
              x2={frame.points[b.b].x}
              y2={frame.points[b.b].y}
              stroke={tone}
              strokeOpacity={0.24}
              strokeWidth={0.34 * scale}
              strokeLinecap="round"
            />
          )
        }
      })
    }

    if (etherOverlay) {
      if (etherOverlay.symmetrical) {
        const minY = Math.min(...frame.points.map((p) => p.y)) - 0.55 * scale
        const maxY = Math.max(...frame.points.map((p) => p.y)) + 0.55 * scale
        underlays.push(
          <line
            key="ether-mirror"
            x1={oPt.x}
            y1={minY}
            x2={oPt.x}
            y2={maxY}
            stroke="var(--accent)"
            strokeWidth={1.8}
            strokeDasharray="5 4"
          />
        )
      }
      const leftXs = leftArm.map((i) => frame.points[i].x)
      const rightXs = rightArm.map((i) => frame.points[i].x)
      const lx = (Math.min(...leftXs) + Math.max(...leftXs)) / 2
      const rx = (Math.min(...rightXs) + Math.max(...rightXs)) / 2
      const armY = Math.max(...frame.points.map((p) => p.y)) + 0.62 * scale
      const actualLeftLabel = etherArmGroupLabel(graph, leftArm)
      const actualRightLabel = etherArmGroupLabel(graph, rightArm)
      overlays.push(
        <g key="ether-arm-labels">
          <text
            x={lx}
            y={armY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={leftTone}
          >
            {actualLeftLabel}
          </text>
          <text
            x={rx}
            y={armY}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill={rightTone}
          >
            {actualRightLabel}
          </text>
        </g>
      )
    }
  }

  // 4. Numbered direct carbon neighbours (1°, 2°, 3°) — computed before spacer label so CH₂ avoids badges
  const badgeAnglesByAtom = new Map<number, number[]>()
  if (numberCarbons && classification.carbonIndices.length === 1) {
    const cIdx = classification.carbonIndices[0]
    const cNbs = neighbours(graph, cIdx)
      .filter((nb) => graph.atoms[nb.atom].element === 'C')
      .map((nb) => nb.atom)
    cNbs.forEach((nbIdx, k) => {
      const pt = frame.points[nbIdx]
      const dx = pt.x - frame.points[cIdx].x
      const dy = pt.y - frame.points[cIdx].y
      const len = Math.hypot(dx, dy) || 1
      const isSpacer = classification.spacerAtoms.includes(nbIdx)
      const bx = isSpacer ? pt.x - (dx / len) * 0.28 * scale : pt.x + (dx / len) * 0.18 * scale
      const by = isSpacer ? pt.y - (dy / len) * 0.28 * scale : pt.y + (dy / len) * 0.18 * scale
      if (isSpacer) {
        badgeAnglesByAtom.set(nbIdx, [Math.atan2(by - pt.y, bx - pt.x)])
      }
      overlays.push(
        <g key={`cnb-${nbIdx}`}>
          <circle cx={bx} cy={by} r={10.5} fill={surfaceFill} stroke="var(--accent)" strokeWidth={1.8} />
          <text
            x={bx}
            y={by}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--accent)"
          >
            {k + 1}
          </text>
        </g>
      )
    })
  }

  // 5. Spacer –CH₂– caution ring (when non-benzylic)
  for (const sp of classification.spacerAtoms) {
    const p = frame.points[sp]
    const extra = badgeAnglesByAtom.get(sp) ?? []
    const th = freeAngle(frame.points, frame.adj, sp, extra)
    const labelPos = { x: p.x + Math.cos(th) * 0.48 * scale, y: p.y + Math.sin(th) * 0.48 * scale }
    underlays.push(
      <circle
        key={`sp-ring-${sp}`}
        cx={p.x}
        cy={p.y}
        r={0.32 * scale}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
        strokeWidth={2.2}
        strokeDasharray="4 3"
      />
    )
    overlays.push(
      <text
        key={`sp-lab-${sp}`}
        x={labelPos.x}
        y={labelPos.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={15}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--caution)"
      >
        CH₂
      </text>
    )
  }

  // 6. C–O carbon ring (sp³ teal or sp² amber)
  if (classification.family !== 'ether') {
    for (const cIdx of classification.carbonIndices) {
      const pt = frame.points[cIdx]
      underlays.push(
        <circle
          key={`co-c-${cIdx}`}
          cx={pt.x}
          cy={pt.y}
          r={0.32 * scale}
          fill={cRingColor}
          fillOpacity={0.18}
          stroke={cRingColor}
          strokeWidth={2.6}
        />
      )
    }
  }

  // 7. Optional –OH oxygen halos
  if (highlightOh) {
    for (const oIdx of classification.oxygenIndices) {
      const pt = frame.points[oIdx]
      underlays.push(
        <circle
          key={`oh-halo-${oIdx}`}
          cx={pt.x}
          cy={pt.y}
          r={0.35 * scale}
          fill="var(--atom-o)"
          fillOpacity={0.14}
          stroke="var(--atom-o)"
          strokeWidth={1.8}
        />
      )
    }
  }

  // 8. Explicit –CH₃ label on phenol ring alkyl substituent (e.g. 2-methylphenol)
  if (labelRingAlkyl && classification.ringSubstituentAtoms.length > 0) {
    for (const subIdx of classification.ringSubstituentAtoms) {
      if (graph.atoms[subIdx]?.element !== 'C') continue
      const pt = frame.points[subIdx]
      const nb = neighbours(graph, subIdx)[0]?.atom
      const pNb = nb !== undefined ? frame.points[nb] : { x: 0, y: 0 }
      const dx = pt.x - pNb.x
      const dy = pt.y - pNb.y
      const len = Math.hypot(dx, dy) || 1
      const lx = pt.x + (dx / len) * 0.24 * scale
      const ly = pt.y + (dy / len) * 0.24 * scale
      overlays.push(
        <g key={`ring-alkyl-${subIdx}`}>
          <rect x={lx - 18} y={ly - 10} width={36} height={20} rx={4} fill={surfaceFill} />
          <text
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            CH₃
          </text>
        </g>
      )
    }
  }

  // 9. Trigonal planar 120° angle arc for vinylic alcohol (ethenol)
  if (showPlanarAngle && classification.subclassKind === 'vinylic' && classification.carbonIndices.length === 1) {
    const cIdx = classification.carbonIndices[0]
    const pc = frame.points[cIdx]
    const nbs = neighbours(graph, cIdx)
    if (nbs.length === 2) {
      const p1 = frame.points[nbs[0].atom]
      const p2 = frame.points[nbs[1].atom]
      const a1 = Math.atan2(p1.y - pc.y, p1.x - pc.x)
      const a2 = Math.atan2(p2.y - pc.y, p2.x - pc.x)
      let diff = a2 - a1
      while (diff > Math.PI) diff -= 2 * Math.PI
      while (diff < -Math.PI) diff += 2 * Math.PI
      const r = 0.44 * scale
      const sx = pc.x + r * Math.cos(a1)
      const sy = pc.y + r * Math.sin(a1)
      const ex = pc.x + r * Math.cos(a1 + diff)
      const ey = pc.y + r * Math.sin(a1 + diff)
      const sweep = diff >= 0 ? 1 : 0
      const midA = a1 + diff / 2
      const tx = pc.x + (r + 17) * Math.cos(midA)
      const ty = pc.y + (r + 17) * Math.sin(midA)
      overlays.push(
        <g key="planar-120">
          <path
            d={`M ${sx.toFixed(1)} ${sy.toFixed(1)} A ${r.toFixed(1)} ${r.toFixed(1)} 0 0 ${sweep} ${ex.toFixed(1)} ${ey.toFixed(1)}`}
            fill="none"
            stroke="var(--ox)"
            strokeWidth={2}
          />
          <text
            x={tx}
            y={ty}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={15}
            fontWeight={700}
            fontFamily="var(--font-sans)"
            fill="var(--ox)"
          >
            120°
          </text>
        </g>
      )
    }
  }

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      {underlays}
      <SkeletalFormula graph={graph} scale={scale} showLonePairs={showLonePairs} overlay={overlays} />
    </g>
  )
}
