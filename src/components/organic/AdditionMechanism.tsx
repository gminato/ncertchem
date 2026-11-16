import React, { forwardRef } from 'react'
import { CurvedArrow } from './CurvedArrow'
import { SkeletalFormula, skeletalFrame } from './SkeletalFormula'
import { bondAnchor } from './arrows'
import type { Point } from './layout'
import { PRIMARY_CATION, PROPENE, SECONDARY_CATION, TWO_BROMOPROPANE, ONE_BROMOPROPANE } from './hydrocarbon-fixture'
import { formulaTextWidth, SCHEME_TEXT_SPECIES, stageAt, stageOpacity, unitClamp } from './hydrocarbon-geometry'

/** Size of the addition mechanism drawing, for a parent viewBox centred on the origin. */
export const ADDITION_MECHANISM_SIZE = { width: 900, height: 290 } as const

export type AdditionMode = 'ionic' | 'radical'
/** Ionic: the carbocation branch. `major` is the 2° carbocation (Markovnikov); `minor` the 1° one. */
export type AdditionBranch = 'major' | 'minor'
/** Radical chain steps: alkane halogenation, and the peroxide effect in HBr addition. */
export type RadicalStep = 'initiation' | 'propagation' | 'termination' | 'peroxide'

export interface AdditionMechanismProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  mode?: AdditionMode
  /** `major` (default): H⁺ adds to the terminal carbon, giving the 2° carbocation. `minor`: the 1° carbocation. Ionic only. */
  branch?: AdditionBranch
  /** Which radical step to draw. Radical only. */
  step?: RadicalStep
  /** 0 to 1: draws the arrows in order, and each stage as it is reached. */
  progress?: number
  x?: number
  y?: number
}

const ORB_STYLE = { fill: 'none', stroke: 'var(--orbital-pos)', strokeWidth: 1.8, strokeDasharray: '4 4' } as const

function Label({ x, y, children, size = 20, fill = 'var(--fg)', weight = 600 }: { x: number; y: number; children: React.ReactNode; size?: number; fill?: string; weight?: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={weight} fontFamily="var(--font-sans)" fill={fill}>
      {children}
    </text>
  )
}

/** Empty p orbital drawn on a carbocation: dashed lobes above and below the trigonal plane. */
function EmptyOrbital({ at }: { at: Point }) {
  return (
    <g>
      <ellipse cx={at.x} cy={at.y - 30} rx={11} ry={18} {...ORB_STYLE} />
      <ellipse cx={at.x} cy={at.y + 30} rx={11} ry={18} {...ORB_STYLE} />
    </g>
  )
}

function Caption({ x, y, children, emphasis = false }: { x: number; y: number; children: React.ReactNode; emphasis?: boolean }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={16} fontFamily="var(--font-sans)" fill={emphasis ? 'var(--fg)' : 'var(--fg-muted)'}>
      {children}
    </text>
  )
}

/** Lays radical-step tokens out in a row, returning each token's centre x and width. */
function tokenRow(tokens: Array<{ id: string; text: string }>, startX: number, gap = 22) {
  const out: Record<string, { cx: number; w: number; left: number }> = {}
  let x = startX
  for (const t of tokens) {
    const w = formulaTextWidth(t.text)
    out[t.id] = { cx: x + w / 2, w, left: x }
    x += w + gap
  }
  return { at: out, end: x - gap }
}

/** The centre x of the character at `index` within a token. */
function charCentre(left: number, text: string, index: number): number {
  return left + formulaTextWidth(text.slice(0, index)) + formulaTextWidth(text[index] ?? '') / 2
}

function RadicalStepDrawing({ step, progress }: { step: RadicalStep; progress: number }) {
  const y = ADDITION_MECHANISM_SIZE.height / 2 - 6
  const p = unitClamp(progress)
  const arrowP = unitClamp(p * 2)
  const fishP = unitClamp(p * 2 - 1)
  const size = SCHEME_TEXT_SPECIES

  // Each step: reactant tokens, product tokens and the fishhooks as [fromAnchor, toAnchor] pairs.
  type Spec = {
    left: Array<{ id: string; text: string }>
    right: Array<{ id: string; text: string }>
    title: string
    caption: string
    /** Fishhook arrows: from a token to a token, drawn above the row. `a` bends up, `b` bends down. */
    hooks: Array<[string, string, 'a' | 'b']>
  }
  const specs: Record<RadicalStep, Spec> = {
    initiation: {
      title: 'Initiation',
      caption: 'Light splits the Cl–Cl bond into two chlorine radicals',
      left: [{ id: 'bond', text: 'Cl–Cl' }],
      right: [
        { id: 'a', text: 'Cl•' },
        { id: 'b', text: '•Cl' },
      ],
      hooks: [
        ['bond', 'a', 'a'],
        ['bond', 'b', 'b'],
      ],
    },
    propagation: {
      title: 'Propagation',
      caption: 'A chlorine radical takes H, leaving a methyl radical',
      left: [
        { id: 'cl', text: 'Cl•' },
        { id: 'ch', text: 'H–CH₃' },
      ],
      right: [
        { id: 'hcl', text: 'H–Cl' },
        { id: 'me', text: '•CH₃' },
      ],
      hooks: [
        ['cl', 'hcl', 'a'],
        ['ch', 'me', 'b'],
      ],
    },
    termination: {
      title: 'Termination',
      caption: 'Two radicals meet and pair up, and the chain stops',
      left: [
        { id: 'a', text: 'Cl•' },
        { id: 'b', text: '•Cl' },
      ],
      right: [{ id: 'bond', text: 'Cl–Cl' }],
      hooks: [
        ['a', 'bond', 'a'],
        ['b', 'bond', 'b'],
      ],
    },
    peroxide: {
      title: 'Peroxide effect: radical addition',
      caption: 'Br• adds to the terminal carbon, so the radical forms on the middle carbon',
      left: [
        { id: 'br', text: 'Br•' },
        { id: 'alk', text: 'CH₂=CH–CH₃' },
      ],
      right: [{ id: 'prod', text: 'BrCH₂–CH•–CH₃' }],
      hooks: [
        ['br', 'prod', 'a'],
        ['alk', 'prod', 'b'],
      ],
    },
  }
  const spec = specs[step]
  const leftRow = tokenRow(spec.left, 0, 26)
  const arrowW = 96
  const rightStart = leftRow.end + 26 + arrowW + 26
  const rightRow = tokenRow(spec.right, rightStart, 26)
  const shift = (ADDITION_MECHANISM_SIZE.width - rightRow.end) / 2
  const leftAt = (id: string) => ({ ...leftRow.at[id], cx: leftRow.at[id].cx + shift })
  const rightAt = (id: string) => ({ ...rightRow.at[id], cx: rightRow.at[id].cx + shift })
  // A fishhook starts and ends at the centre of its token: a radical dot, or the middle of a bond.
  const tokenFor = (id: string) => (spec.left.some((t) => t.id === id) ? leftAt(id) : rightAt(id))

  return (
    <g>
      <Label x={ADDITION_MECHANISM_SIZE.width / 2} y={36} size={22} weight={600}>
        {spec.title}
      </Label>
      {spec.left.map((t) => (
        <text key={`l-${t.id}`} x={leftAt(t.id).cx} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontFamily="var(--font-sans)" fill="var(--fg)">
          {t.text}
        </text>
      ))}
      {spec.right.map((t) => (
        <text key={`r-${t.id}`} x={rightAt(t.id).cx} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontFamily="var(--font-sans)" fill="var(--fg)">
          {t.text}
        </text>
      ))}
      <g opacity={arrowP}>
        <line x1={leftRow.end + 26 + shift} x2={leftRow.end + 26 + arrowW + shift - 2} y1={y} y2={y} stroke="var(--fg-muted)" strokeWidth={2.2} />
        <path d={`M${leftRow.end + 26 + arrowW + shift - 12},${y - 7} L${leftRow.end + 26 + arrowW + shift},${y} L${leftRow.end + 26 + arrowW + shift - 12},${y + 7}`} fill="none" stroke="var(--fg-muted)" strokeWidth={2.2} strokeLinejoin="round" strokeLinecap="round" />
        {step === 'initiation' && (
          <Label x={leftRow.end + 26 + arrowW / 2 + shift} y={y - 22} size={16} fill="var(--fg-muted)" weight={500}>
            hν
          </Label>
        )}
      </g>
      {spec.hooks.map(([from, to, which], i) => (
        <CurvedArrow
          key={`hook-${i}`}
          from={{ x: tokenFor(from).cx, y: y - 22 }}
          to={{ x: tokenFor(to).cx, y: y - 22 }}
          bend={which === 'a' ? -0.3 : -0.55}
          kind="radical"
          progress={fishP}
          gap={8}
          headSize={9}
        />
      ))}
      <Caption x={ADDITION_MECHANISM_SIZE.width / 2} y={ADDITION_MECHANISM_SIZE.height - 40}>
        {spec.caption}
      </Caption>
    </g>
  )
}

/**
 * Electrophilic addition to propene, HBr, in two arrows over three stages: H⁺ adds and the
 * carbocation forms, then Br⁻ attacks it. `branch` shows the less stable 1° carbocation as the
 * minor path. The radical mode draws the chain steps with fishhook arrows.
 */
export const AdditionMechanism = forwardRef<SVGGElement, AdditionMechanismProps>(function AdditionMechanism(
  { mode = 'ionic', branch = 'major', step = 'initiation', progress = 1, x = 0, y = 0, ...rest },
  ref
) {
  if (mode === 'radical') {
    return (
      <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
        <RadicalStepDrawing step={step} progress={progress} />
      </g>
    )
  }

  const p = unitClamp(progress)
  const a1 = unitClamp(p * 2)
  const a2 = unitClamp(p * 2 - 1)
  const stage = stageAt(p, 3).index
  const CY = 128
  const X = [170, 460, 760] as const
  const SCALE = 40

  const propFrame = skeletalFrame(PROPENE, SCALE)
  const cation = branch === 'major' ? SECONDARY_CATION : PRIMARY_CATION
  const cationAtom = branch === 'major' ? 1 : 2
  const catFrame = skeletalFrame(cation, SCALE)
  const product = branch === 'major' ? TWO_BROMOPROPANE : ONE_BROMOPROPANE

  // Stage 1: the π bond of propene (atoms 1 and 2) to the H⁺ above it.
  const pi = bondAnchor(propFrame.points[1], propFrame.points[2], 0.5)
  const hPlus: Point = { x: pi.x + X[0], y: pi.y + CY - 74 }
  // Stage 2: Br⁻ attacks the cation carbon from the open side.
  const cat = catFrame.points[cationAtom]
  const catPt: Point = { x: cat.x + X[1], y: cat.y + CY }
  const brPt: Point = { x: catPt.x + 96, y: catPt.y - 52 }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {/* Stage 1 */}
      <g opacity={stageOpacity(p, 3, 0)}>
        <g transform={`translate(${X[0]}, ${CY})`}>
          <SkeletalFormula graph={PROPENE} scale={SCALE} />
        </g>
        <text x={hPlus.x} y={hPlus.y} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          H⁺
        </text>
        <CurvedArrow from={{ x: pi.x + X[0], y: pi.y + CY }} to={{ x: hPlus.x, y: hPlus.y + 14 }} bend={-0.35} progress={a1} gap={6} />
      </g>

      {/* Stage 2: the carbocation with its empty p orbital, and Br⁻ attacking */}
      <g opacity={stageOpacity(p, 3, 1)}>
        <g transform={`translate(${X[1]}, ${CY})`}>
          <SkeletalFormula graph={cation} scale={SCALE} />
        </g>
        <EmptyOrbital at={catPt} />
        <text x={brPt.x} y={brPt.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
          Br⁻
        </text>
        <CurvedArrow from={{ x: brPt.x - 16, y: brPt.y + 6 }} to={{ x: catPt.x + 8, y: catPt.y - 6 }} bend={0.3} progress={a2} gap={6} />
        <text x={X[1]} y={CY + 84} textAnchor="middle" dominantBaseline="central" fontSize={16} fontFamily="var(--font-sans)" fill={branch === 'major' ? 'var(--accent)' : 'var(--fg-subtle)'} fontStyle="italic">
          {branch === 'major' ? 'more stable: 2° carbocation' : 'less stable: 1° carbocation (minor)'}
        </text>
      </g>

      {/* Stage 3: the product */}
      <g opacity={stageOpacity(p, 3, 2)}>
        <g transform={`translate(${X[2]}, ${CY})`}>
          <SkeletalFormula graph={product} scale={SCALE} />
        </g>
        <text x={X[2]} y={CY + 84} textAnchor="middle" dominantBaseline="central" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          {branch === 'major' ? '2-bromopropane (major)' : '1-bromopropane (minor)'}
        </text>
      </g>

      <Caption x={X[0]} y={ADDITION_MECHANISM_SIZE.height - 40} emphasis={stage === 0}>
        1  H⁺ adds to the C=C
      </Caption>
      <Caption x={X[1]} y={ADDITION_MECHANISM_SIZE.height - 40} emphasis={stage === 1}>
        2  Br⁻ attacks the cation
      </Caption>
      <Caption x={X[2]} y={ADDITION_MECHANISM_SIZE.height - 40} emphasis={stage === 2}>
        3  Bromoalkane formed
      </Caption>
    </g>
  )
})
