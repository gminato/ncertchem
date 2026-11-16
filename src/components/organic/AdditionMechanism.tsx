import React, { forwardRef } from 'react'
import { revealFraction, stageOpacity } from './hydrocarbon-geometry'

/** Size of every addition-mechanism drawing, for a parent viewBox. */
export const ADDITION_MECHANISM_SIZE = { width: 900, height: 290 } as const

export type AdditionMode = 'ionic' | 'radical'
export type AdditionBranch = 'major' | 'minor'
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

type Pt = { x: number; y: number }
const INK = 'var(--fg)'
const SIGMA = 'var(--sigma-bond)'
const LOBE = 'var(--orbital-pos)'
const STAGES = 3

/** A label on a surface-coloured halo, so the bonds stop cleanly behind it. */
function Atom({ x, y, children, size = 20, weight = 600, fill = INK }: { x: number; y: number; children: React.ReactNode; size?: number; weight?: number; fill?: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={size} fontWeight={weight} fontFamily="var(--font-sans)" fill={fill} stroke="var(--surface)" strokeWidth={6} strokeLinejoin="round" paintOrder="stroke">
      {children}
    </text>
  )
}

function Bond({ a, b, width = 3 }: { a: Pt; b: Pt; width?: number }) {
  return <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={SIGMA} strokeWidth={width} strokeLinecap="round" />
}

/** A double bond: two parallel lines offset to either side of the axis. */
function DoubleBond({ a, b }: { a: Pt; b: Pt }) {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  const nx = (-dy / len) * 4
  const ny = (dx / len) * 4
  return (
    <g>
      <Bond a={{ x: a.x + nx, y: a.y + ny }} b={{ x: b.x + nx, y: b.y + ny }} width={2.6} />
      <Bond a={{ x: a.x - nx, y: a.y - ny }} b={{ x: b.x - nx, y: b.y - ny }} width={2.6} />
    </g>
  )
}

/** A radical electron: a single dot beside an atom. */
function Dot({ at }: { at: Pt }) {
  return <circle cx={at.x} cy={at.y} r={3.6} fill={INK} />
}

/** A curved arrow from a π bond or a lone pair, with a full head. */
function CurvedArrow({ p0, c, p1, opacity = 1 }: { p0: Pt; c: Pt; p1: Pt; opacity?: number }) {
  const dx = p1.x - c.x
  const dy = p1.y - c.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  const back = { x: p1.x - ux * 9, y: p1.y - uy * 9 }
  const l = { x: back.x - uy * 5.5, y: back.y + ux * 5.5 }
  const r = { x: back.x + uy * 5.5, y: back.y - ux * 5.5 }
  return (
    <g opacity={opacity} stroke={INK} fill={INK}>
      <path d={`M${p0.x},${p0.y} Q${c.x},${c.y} ${back.x},${back.y}`} fill="none" strokeWidth={2.2} strokeLinecap="round" />
      <path d={`M${p1.x},${p1.y} L${l.x},${l.y} L${r.x},${r.y} Z`} strokeWidth={0.6} />
    </g>
  )
}

/** A fishhook (radical arrow): a curve from the electron to its new place, with one barb at the end. */
function Fishhook({ from, c, to }: { from: Pt; c: Pt; to: Pt }) {
  const dx = to.x - c.x
  const dy = to.y - c.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  // Single barb, on the outside of the curve.
  const barbTip = { x: to.x - ux * 9 + uy * 7, y: to.y - uy * 9 - ux * 7 }
  return (
    <g stroke={INK} fill="none" strokeWidth={2.2} strokeLinecap="round">
      <path d={`M${from.x},${from.y} Q${c.x},${c.y} ${to.x},${to.y}`} />
      <path d={`M${to.x},${to.y} L${barbTip.x},${barbTip.y}`} />
    </g>
  )
}

/** A reaction arrow between two species. */
function ReactionArrow({ x0, x1, y }: { x0: number; x1: number; y: number }) {
  return (
    <g stroke={INK} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none">
      <line x1={x0} x2={x1} y1={y} y2={y} />
      <path d={`M${x1 - 10},${y - 6} L${x1},${y} L${x1 - 10},${y + 6}`} />
    </g>
  )
}

/** A p orbital on a cation: dashed lobes above and below the trigonal plane, in perspective. */
function EmptyOrbital({ at }: { at: Pt }) {
  return (
    <g fill="none" stroke={LOBE} strokeWidth={1.8} strokeDasharray="4 4">
      <ellipse cx={at.x} cy={at.y - 24} rx={9} ry={14} />
      <ellipse cx={at.x} cy={at.y + 24} rx={9} ry={14} />
    </g>
  )
}

/** Caption under a stage. */
function Caption({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={INK}>
      {children}
    </text>
  )
}

/** Propene as a zig-zag around an origin, with the C=C at the left and the methyl at the right. */
function propeneAt(ox: number, oy: number) {
  return { A: { x: ox - 34.64, y: oy + 20 }, B: { x: ox, y: oy }, C: { x: ox + 34.64, y: oy + 20 } }
}

/** Ionic addition of HBr to propene: π attack on H⁺, the carbocation, and Br⁻ capture. */
function IonicAddition({ branch, progress }: { branch: AdditionBranch; progress: number }) {
  const major = branch === 'major'
  const stageX = [170, 460, 760]
  const opacities = [0, 1, 2].map((i) => stageOpacity(progress, STAGES, i))
  const a1 = revealFraction(progress, 0, 0.5)
  const a2 = revealFraction(progress, 0.5, 1)
  const oy = 150

  // Stage 1: propene and H⁺; the first arrow leaves the π bond (A=B) for the proton.
  const s1 = propeneAt(stageX[0], oy)
  const mid1 = { x: (s1.A.x + s1.B.x) / 2, y: (s1.A.y + s1.B.y) / 2 }
  const H1 = { x: stageX[0] + 10, y: oy - 74 }

  // Stage 2: the carbocation. Major: H on A (the terminal CH₃ side), cation on B (2°). Minor: H on B, cation on A (1°).
  const s2 = propeneAt(stageX[1], oy)
  const cation = major ? s2.B : s2.A
  const Br = { x: cation.x + 14, y: oy - 74 }
  const lonePair = { x: Br.x - 22, y: Br.y }

  // Stage 3: the product: Br on the cation carbon.
  const s3 = propeneAt(stageX[2], oy)
  const prodCation = major ? s3.B : s3.A

  return (
    <g>
      {/* Stage 1 */}
      <g opacity={opacities[0]}>
        <DoubleBond a={s1.A} b={s1.B} />
        <Bond a={s1.B} b={s1.C} width={3} />
        <Atom x={s1.A.x} y={s1.A.y}>H₂C</Atom>
        <Atom x={s1.B.x} y={s1.B.y}>CH</Atom>
        <Atom x={s1.C.x} y={s1.C.y}>CH₃</Atom>
        <Atom x={H1.x} y={H1.y} size={22} weight={700}>H⁺</Atom>
        <CurvedArrow p0={{ x: mid1.x - 4, y: mid1.y - 12 }} c={{ x: mid1.x - 48, y: mid1.y - 58 }} p1={{ x: H1.x - 16, y: H1.y + 6 }} opacity={a1} />
        <Caption x={stageX[0]} y={250}>1  π bond attacks H⁺</Caption>
      </g>

      {/* Stage 2 */}
      <g opacity={opacities[1]}>
        <Bond a={s2.A} b={s2.B} width={3} />
        <Bond a={s2.B} b={s2.C} width={3} />
        <Atom x={s2.A.x} y={s2.A.y}>{major ? 'H₃C' : '⁺H₂C'}</Atom>
        <Atom x={s2.B.x} y={s2.B.y}>{major ? '⁺CH' : 'CH₂'}</Atom>
        <Atom x={s2.C.x} y={s2.C.y}>CH₃</Atom>
        <EmptyOrbital at={cation} />
        <Atom x={Br.x} y={Br.y} size={22} weight={700}>Br⁻</Atom>
        <Dot at={{ x: lonePair.x - 6, y: lonePair.y - 9 }} />
        <Dot at={{ x: lonePair.x - 6, y: lonePair.y + 9 }} />
        <g opacity={a2}>
          <CurvedArrow p0={{ x: lonePair.x - 4, y: lonePair.y + 2 }} c={{ x: lonePair.x - 10, y: cation.y - 26 }} p1={{ x: cation.x - 4, y: cation.y - 12 }} />
        </g>
        <Caption x={stageX[1]} y={250}>{major ? '2  2° carbocation (major path)' : '2  1° carbocation (minor path)'}</Caption>
      </g>

      {/* Stage 3 */}
      <g opacity={opacities[2]}>
        <Bond a={s3.A} b={s3.B} width={3} />
        <Bond a={s3.B} b={s3.C} width={3} />
        <Atom x={s3.A.x} y={s3.A.y}>{major ? 'H₃C' : 'H₂C'}</Atom>
        <Atom x={s3.B.x} y={s3.B.y}>{major ? 'CHBr' : 'CH₂'}</Atom>
        <Atom x={s3.C.x} y={s3.C.y}>CH₃</Atom>
        {!major && <Atom x={prodCation.x} y={prodCation.y - 36} size={20}>Br</Atom>}
        <Caption x={stageX[2]} y={250}>{major ? '3  Br⁻ adds: 2-bromopropane' : '3  Br⁻ adds: 1-bromopropane'}</Caption>
      </g>

      <ReactionArrow x0={stageX[0] + 110} x1={stageX[0] + 180} y={oy} />
      <ReactionArrow x0={stageX[1] + 110} x1={stageX[1] + 180} y={oy} />
    </g>
  )
}

/** Each step's content centre and scale, so the equation fills the card's width. */
const RADICAL_FRAME: Record<RadicalStep, { cx: number; cy: number; scale: number }> = {
  initiation: { cx: 435, cy: 130, scale: 1.9 },
  propagation: { cx: 360, cy: 138, scale: 1.6 },
  termination: { cx: 245, cy: 146, scale: 1.3 },
  peroxide: { cx: 340, cy: 128, scale: 1.55 },
}

/** One radical step as a real equation, with fishhooks only on the reactant side. */
function RadicalStepDrawing({ step }: { step: RadicalStep }) {
  const f = RADICAL_FRAME[step]
  return (
    <g transform={`translate(450 145) scale(${f.scale}) translate(${-f.cx} ${-f.cy})`}>
      {radicalEquation(step)}
    </g>
  )
}

function radicalEquation(step: RadicalStep) {
  if (step === 'initiation') {
    // Cl–Cl → Cl• + Cl•: two fishhooks start at the middle of the bond and end on one Cl each.
    return (
      <g>
        <Atom x={250} y={150}>Cl</Atom>
        <Atom x={330} y={150}>Cl</Atom>
        <Bond a={{ x: 262, y: 150 }} b={{ x: 318, y: 150 }} width={3.2} />
        <Fishhook from={{ x: 290, y: 136 }} c={{ x: 268, y: 104 }} to={{ x: 258, y: 138 }} />
        <Fishhook from={{ x: 290, y: 136 }} c={{ x: 312, y: 104 }} to={{ x: 322, y: 138 }} />
        <ReactionArrow x0={380} x1={440} y={150} />
        <Atom x={500} y={150}>Cl</Atom>
        <Dot at={{ x: 514, y: 138 }} />
        <Atom x={600} y={150}>Cl</Atom>
        <Dot at={{ x: 614, y: 138 }} />
      </g>
    )
  }
  if (step === 'propagation') {
    // Cl• + H–CH₃ → H–Cl + •CH₃
    return (
      <g>
        <Atom x={90} y={150}>Cl</Atom>
        <Dot at={{ x: 104, y: 137 }} />
        <Atom x={150} y={150} size={22}>+</Atom>
        <Atom x={210} y={150}>H</Atom>
        <Bond a={{ x: 222, y: 150 }} b={{ x: 246, y: 150 }} width={3.2} />
        <Atom x={268} y={150}>CH₃</Atom>
        <Fishhook from={{ x: 104, y: 136 }} c={{ x: 118, y: 96 }} to={{ x: 148, y: 110 }} />
        <Fishhook from={{ x: 232, y: 136 }} c={{ x: 200, y: 92 }} to={{ x: 156, y: 112 }} />
        <Fishhook from={{ x: 236, y: 160 }} c={{ x: 238, y: 186 }} to={{ x: 258, y: 164 }} />
        <ReactionArrow x0={320} x1={380} y={150} />
        <Atom x={400} y={150}>H</Atom>
        <Bond a={{ x: 412, y: 150 }} b={{ x: 470, y: 150 }} width={3.2} />
        <Atom x={482} y={150}>Cl</Atom>
        <Atom x={540} y={150} size={22}>+</Atom>
        <Dot at={{ x: 568, y: 136 }} />
        <Atom x={588} y={150}>CH₃</Atom>
      </g>
    )
  }
  if (step === 'termination') {
    // Two equations: Cl• + •Cl → Cl–Cl, and •CH₃ + •CH₃ → CH₃–CH₃, each with a fishhook from each radical.
    return (
      <g>
        <Atom x={80} y={96}>Cl</Atom>
        <Dot at={{ x: 94, y: 83 }} />
        <Atom x={170} y={96}>Cl</Atom>
        <Dot at={{ x: 184, y: 83 }} />
        <Fishhook from={{ x: 94, y: 80 }} c={{ x: 110, y: 52 }} to={{ x: 124, y: 88 }} />
        <Fishhook from={{ x: 184, y: 80 }} c={{ x: 164, y: 52 }} to={{ x: 146, y: 88 }} />
        <ReactionArrow x0={230} x1={290} y={96} />
        <Atom x={330} y={96}>Cl</Atom>
        <Bond a={{ x: 342, y: 96 }} b={{ x: 390, y: 96 }} width={3.2} />
        <Atom x={400} y={96}>Cl</Atom>

        <Atom x={80} y={206}>CH₃</Atom>
        <Dot at={{ x: 104, y: 193 }} />
        <Atom x={170} y={206}>CH₃</Atom>
        <Dot at={{ x: 194, y: 193 }} />
        <Fishhook from={{ x: 104, y: 190 }} c={{ x: 118, y: 162 }} to={{ x: 124, y: 198 }} />
        <Fishhook from={{ x: 194, y: 190 }} c={{ x: 176, y: 162 }} to={{ x: 146, y: 198 }} />
        <ReactionArrow x0={230} x1={290} y={206} />
        <Atom x={330} y={206}>CH₃</Atom>
        <Bond a={{ x: 352, y: 206 }} b={{ x: 382, y: 206 }} width={3.2} />
        <Atom x={400} y={206}>CH₃</Atom>
      </g>
    )
  }
  // Peroxide: Br• + CH₂=CH–CH₃ → BrCH₂–•CH–CH₃
  return (
    <g>
      <Atom x={80} y={150}>Br</Atom>
      <Dot at={{ x: 96, y: 137 }} />
      <Atom x={140} y={150} size={22}>+</Atom>
      <Atom x={200} y={150}>H₂C</Atom>
      <DoubleBond a={{ x: 214, y: 150 }} b={{ x: 246, y: 128 }} />
      <Atom x={252} y={120}>CH</Atom>
      <Bond a={{ x: 258, y: 112 }} b={{ x: 290, y: 130 }} width={3} />
      <Atom x={302} y={140}>CH₃</Atom>
      <Fishhook from={{ x: 96, y: 136 }} c={{ x: 120, y: 92 }} to={{ x: 150, y: 110 }} />
      <Fishhook from={{ x: 214, y: 132 }} c={{ x: 170, y: 86 }} to={{ x: 154, y: 110 }} />
      <Fishhook from={{ x: 232, y: 110 }} c={{ x: 252, y: 84 }} to={{ x: 262, y: 102 }} />
      <ReactionArrow x0={350} x1={410} y={150} />
      <Atom x={424} y={150}>BrCH₂</Atom>
      <Bond a={{ x: 452, y: 146 }} b={{ x: 484, y: 124 }} width={3} />
      <Atom x={496} y={116}>CH</Atom>
      <Dot at={{ x: 510, y: 100 }} />
      <Bond a={{ x: 506, y: 122 }} b={{ x: 532, y: 136 }} width={3} />
      <Atom x={546} y={144}>CH₃</Atom>
    </g>
  )
}

/** Addition of HBr to propene, drawn as ionic steps (Markovnikov) or as radical equations. */
export const AdditionMechanism = forwardRef<SVGGElement, AdditionMechanismProps>(function AdditionMechanism(
  { mode = 'ionic', branch = 'major', step = 'initiation', progress = 1, x = 0, y = 0, ...rest },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {mode === 'ionic' ? <IonicAddition branch={branch} progress={p} /> : <RadicalStepDrawing step={step} />}
    </g>
  )
})
