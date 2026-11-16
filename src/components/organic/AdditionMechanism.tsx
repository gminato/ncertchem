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
const STAGES = 3
/** Centre of each stage's column. */
const COLUMNS = [150, 450, 750] as const
const SPECIES_SIZE = 24
const EQUATION_SIZE = 26

/** Approximate advance of a run of text, in px at a font size (for laying out equations on one line). */
function textWidth(s: string, size: number): number {
  let w = 0
  for (const ch of s) {
    if (ch === ' ') w += 0.3
    else if (ch === '–') w += 0.55
    else if (ch === '=' || ch === '+') w += 0.6
    else if (ch === '̇') w += 0
    else if (/[₀-₉⁺⁻•]/.test(ch)) w += 0.6
    else if (/[A-Z]/.test(ch)) w += 0.7
    else w += 0.6
  }
  return w * size
}

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

/** A fishhook from `from` up and over to `to`, bowing upwards. */
function Hook({ from, to }: { from: Pt; to: Pt }) {
  const c = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - 22 }
  return <Fishhook from={from} c={c} to={to} />
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

/** Caption under a stage. */
function Caption({ x, y, children }: { x: number; y: number; children: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill={INK}>
      {children}
    </text>
  )
}

/** Plain text on one line, left edge at x. */
function Run({ x, y, size, children, weight = 600 }: { x: number; y: number; size: number; children: string; weight?: number }) {
  return (
    <text x={x} y={y} textAnchor="start" dominantBaseline="central" fontSize={size} fontWeight={weight} fontFamily="var(--font-sans)" fill={INK}>
      {children}
    </text>
  )
}

/** One part of an equation on one line: a species (its text pieces), an operator, or an arrow. */
type Part = { kind: 'sp'; pieces: string[] } | { kind: 'op'; text: string } | { kind: 'arrow' }

interface Placed {
  kind: Part['kind']
  /** Left edge of the part. */
  x: number
  /** Advance of each text piece of a species, and where each starts. */
  pieceX: number[]
  pieceW: number[]
  pieces: string[]
  text: string
}

const OP_GAP = 12
const ARROW_W = 72
const ARROW_GAP = 14

/** Lays parts out left to right, centred on cx. Items are returned in the same order as the parts. */
function layoutEq(parts: Part[], size: number, cx: number): Placed[] {
  const widths = parts.map((p) => {
    if (p.kind === 'sp') return p.pieces.reduce((a, t) => a + textWidth(t, size), 0)
    if (p.kind === 'op') return textWidth(p.text, size) + 2 * OP_GAP
    return ARROW_W + 2 * ARROW_GAP
  })
  const total = widths.reduce((a, b) => a + b, 0)
  let cursor = cx - total / 2
  return parts.map((p, i) => {
    const start = cursor
    cursor += widths[i]
    if (p.kind === 'sp') {
      let px = start
      const pieceX = p.pieces.map((t) => {
        const at = px
        px += textWidth(t, size)
        return at
      })
      return { kind: 'sp', x: start, pieceX, pieceW: p.pieces.map((t) => textWidth(t, size)), pieces: p.pieces, text: '' }
    }
    if (p.kind === 'op') return { kind: 'op', x: start + OP_GAP, pieceX: [], pieceW: [], pieces: [], text: p.text }
    return { kind: 'arrow', x: start + ARROW_GAP, pieceX: [], pieceW: [], pieces: [], text: '' }
  })
}

/** Draws the placed parts of an equation on the line y. */
function EquationRow({ items, y, size }: { items: Placed[]; y: number; size: number }) {
  return (
    <g>
      {items.map((it, i) => {
        if (it.kind === 'sp') {
          return it.pieces.map((t, j) => (
            <Run key={`${i}-${j}`} x={it.pieceX[j]} y={y} size={size}>
              {t}
            </Run>
          ))
        }
        if (it.kind === 'op') {
          return (
            <Run key={i} x={it.x} y={y} size={size}>
              {it.text}
            </Run>
          )
        }
        return <ReactionArrow key={i} x0={it.x} x1={it.x + ARROW_W} y={y} />
      })}
    </g>
  )
}

/** Centre of piece j of a placed species. */
function pieceCentre(it: Placed, j: number): number {
  return it.pieceX[j] + it.pieceW[j] / 2
}

/** Propene, the π bond, and the carbocation stages, as one-line condensed formulas in three columns. */
function IonicAddition({ branch, progress }: { branch: AdditionBranch; progress: number }) {
  const major = branch === 'major'
  const opacities = [0, 1, 2].map((i) => stageOpacity(progress, STAGES, i))
  const a1 = revealFraction(progress, 0, 0.5)
  const a2 = revealFraction(progress, 0.5, 1)
  const y = 150
  const hY = 84

  // Stage 1: CH₃–CH=CH₂ and H⁺. The π bond is the '=' (piece 3), and H⁺ joins the terminal carbon (piece 4).
  const s1 = layoutEq([{ kind: 'sp', pieces: ['CH₃', '–', 'CH', '=', 'CH₂'] }], SPECIES_SIZE, COLUMNS[0])[0]
  const pi = { x: pieceCentre(s1, 3), y: y - 18 }
  const h1 = { x: pieceCentre(s1, 4), y: hY }

  // Stage 2: the carbocation. Major: H on the terminal carbon, so the 2° cation is the middle carbon. Minor: the 1° cation on the end carbon.
  const s2pieces = major ? ['CH₃', '–', 'C⁺H', '–', 'CH₃'] : ['CH₃', '–', 'CH₂', '–', 'CH₂⁺']
  const s2 = layoutEq([{ kind: 'sp', pieces: s2pieces }], SPECIES_SIZE, COLUMNS[1])[0]
  const cationPiece = major ? 2 : 4
  const cation = { x: pieceCentre(s2, cationPiece), y }
  const br = { x: cation.x + 14, y: hY }

  // Stage 3: the bromide, Br on the cation carbon.
  const s3pieces = major ? ['CH₃', '–', 'CHBr', '–', 'CH₃'] : ['CH₃', '–', 'CH₂', '–', 'CH₂Br']
  const s3 = layoutEq([{ kind: 'sp', pieces: s3pieces }], SPECIES_SIZE, COLUMNS[2])[0]

  // Reaction arrows run in the gaps between the species' edges.
  const arrowA = { x0: s1.x + textWidth('CH₃–CH=CH₂', SPECIES_SIZE) + 14, x1: s2.x - 14 }
  const arrowB = { x0: s2.x + textWidth(s2pieces.join(''), SPECIES_SIZE) + 14, x1: s3.x - 14 }

  return (
    <g>
      {/* Stage 1 */}
      <g opacity={opacities[0]}>
        <EquationRow items={[s1]} y={y} size={SPECIES_SIZE} />
        <Run x={h1.x - 10} y={h1.y} size={22} weight={700}>H⁺</Run>
        <g opacity={a1}>
          <CurvedArrow p0={{ x: pi.x, y: pi.y - 4 }} c={{ x: pi.x + 6, y: pi.y - 52 }} p1={{ x: h1.x - 14, y: h1.y + 12 }} />
        </g>
        <Caption x={COLUMNS[0]} y={236}>1  π bond attacks H⁺</Caption>
      </g>

      {/* Stage 2 */}
      <g opacity={opacities[1]}>
        <EquationRow items={[s2]} y={y} size={SPECIES_SIZE} />
        <Run x={br.x - 8} y={br.y} size={22} weight={700}>Br⁻</Run>
        <g opacity={a2}>
          <CurvedArrow p0={{ x: br.x - 2, y: br.y + 14 }} c={{ x: cation.x + 26, y: y - 46 }} p1={{ x: cation.x + 4, y: y - 18 }} />
        </g>
        <Caption x={COLUMNS[1]} y={236}>{major ? '2  2° carbocation (major)' : '2  1° carbocation (minor)'}</Caption>
      </g>

      {/* Stage 3 */}
      <g opacity={opacities[2]}>
        <EquationRow items={[s3]} y={y} size={SPECIES_SIZE} />
        <Caption x={COLUMNS[2]} y={236}>{major ? '3  Br⁻ adds: 2-bromopropane' : '3  Br⁻ adds: 1-bromopropane'}</Caption>
      </g>

      <ReactionArrow x0={arrowA.x0} x1={arrowA.x1} y={y} />
      <ReactionArrow x0={arrowB.x0} x1={arrowB.x1} y={y} />
    </g>
  )
}

/** The Br• + propene step and the propagation step after it, as two equation rows with fishhooks on the reactant side only. */
function PeroxideDrawing() {
  const y1 = 104
  const y2 = 222
  const row1 = layoutEq(
    [
      { kind: 'sp', pieces: ['Br', '•'] },
      { kind: 'op', text: '+' },
      { kind: 'sp', pieces: ['CH₂', '=', 'CH', '–', 'CH₃'] },
      { kind: 'arrow' },
      { kind: 'sp', pieces: ['BrCH₂', '–', 'ĊH', '–', 'CH₃'] },
    ],
    EQUATION_SIZE,
    450
  )
  const [brR, , alkene] = row1
  const dotR = { x: pieceCentre(brR, 1), y: y1 - 14 }
  const gap1 = { x: (pieceCentre(brR, 0) + pieceCentre(alkene, 0)) / 2 + 4, y: y1 - 38 }
  const piMid = { x: pieceCentre(alkene, 1), y: y1 - 18 }
  const c2 = { x: pieceCentre(alkene, 2), y: y1 - 36 }

  const row2 = layoutEq(
    [
      { kind: 'sp', pieces: ['CH₃', '–', 'ĊH', '–', 'CH₂Br'] },
      { kind: 'op', text: '+' },
      { kind: 'sp', pieces: ['H', '–', 'Br'] },
      { kind: 'arrow' },
      { kind: 'sp', pieces: ['CH₃', '–', 'CH₂', '–', 'CH₂Br'] },
      { kind: 'op', text: '+' },
      { kind: 'sp', pieces: ['Br', '•'] },
    ],
    EQUATION_SIZE,
    450
  )
  const [rad, , hbr, , , , brDot] = row2
  const radDot = { x: pieceCentre(rad, 2), y: y2 - 14 }
  const hGap = { x: (pieceCentre(rad, 2) + pieceCentre(hbr, 0)) / 2 + 4, y: y2 - 38 }
  const hbrBond = { x: pieceCentre(hbr, 1), y: y2 - 18 }
  const brTarget = { x: pieceCentre(brDot, 0), y: y2 - 36 }

  return (
    <g>
      <EquationRow items={row1} y={y1} size={EQUATION_SIZE} />
      <Hook from={dotR} to={gap1} />
      <Hook from={piMid} to={gap1} />
      <Hook from={piMid} to={c2} />

      <EquationRow items={row2} y={y2} size={EQUATION_SIZE} />
      <Hook from={radDot} to={hGap} />
      <Hook from={hbrBond} to={brTarget} />
    </g>
  )
}

/** Each radical step as a real equation, with fishhooks only on the reactant side. */
const RADICAL_FRAME: Record<Exclude<RadicalStep, 'peroxide'>, { cx: number; cy: number; scale: number }> = {
  initiation: { cx: 435, cy: 130, scale: 1.9 },
  propagation: { cx: 360, cy: 138, scale: 1.6 },
  termination: { cx: 245, cy: 146, scale: 1.3 },
}

function RadicalStepDrawing({ step }: { step: Exclude<RadicalStep, 'peroxide'> }) {
  const f = RADICAL_FRAME[step]
  return (
    <g transform={`translate(450 145) scale(${f.scale}) translate(${-f.cx} ${-f.cy})`}>
      {radicalEquation(step)}
    </g>
  )
}

function radicalEquation(step: Exclude<RadicalStep, 'peroxide'>) {
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
  // Termination: two equations, Cl• + •Cl → Cl–Cl and •CH₃ + •CH₃ → CH₃–CH₃, each with a fishhook from each radical.
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

/** Addition of HBr to propene, drawn as ionic steps (Markovnikov) or as radical equations. */
export const AdditionMechanism = forwardRef<SVGGElement, AdditionMechanismProps>(function AdditionMechanism(
  { mode = 'ionic', branch = 'major', step = 'initiation', progress = 1, x = 0, y = 0, ...rest },
  ref
) {
  const p = Math.min(1, Math.max(0, progress))
  let body: React.ReactNode
  if (mode === 'ionic') body = <IonicAddition branch={branch} progress={p} />
  else if (step === 'peroxide') body = <PeroxideDrawing />
  else body = <RadicalStepDrawing step={step} />
  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} {...rest}>
      {body}
    </g>
  )
})
