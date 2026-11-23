'use client'

import type { ReactNode } from 'react'
import { SkeletalFormula } from '@/components/organic'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  BENZALDEHYDE_SMILES,
  BENZOATE_SMILES,
  BUTANONE_SMILES,
  CANNIZZARO_BEATS,
  CARBONYL_CARBON_INDEX,
  formulaOf,
  METHANAL_EQUATION,
  NITRO_BENZALDEHYDE_SMILES,
  PHENYLMETHANOL_SMILES,
  PROPANONE_SMILES,
  USES_BOARD,
} from './cannizzaro-steps'

export interface CannizzaroScrollyProps {
  /** 0-based Step index from Scrolly. */
  step: number
}

/** One viewBox for every Step, so the panel keeps the same size as the reader scrolls. */
const W = 580
const H = 520
const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const ARROW_HEAD = 10
const ARROW_HALF_WIDTH = 5

const GRAPH: Record<string, MolGraph> = {
  benzaldehyde: parseSmiles(BENZALDEHYDE_SMILES),
  phenylmethanol: parseSmiles(PHENYLMETHANOL_SMILES),
  benzoate: parseSmiles(BENZOATE_SMILES),
  nitro: parseSmiles(NITRO_BENZALDEHYDE_SMILES),
  propanone: parseSmiles(PROPANONE_SMILES),
  butanone: parseSmiles(BUTANONE_SMILES),
}

/** Text in the panel. Sizes are chosen so the rendered label stays at 13 px or more at 560 px wide. */
function Label({
  x,
  y,
  children,
  size = 16,
  weight = 400,
  fill = INK,
}: {
  x: number
  y: number
  children: ReactNode
  size?: number
  weight?: number
  fill?: string
}) {
  return (
    <text x={x} y={y} textAnchor="middle" fontSize={size} fontWeight={weight} fill={fill}>
      {children}
    </text>
  )
}

/** A reaction arrow: a plain shaft with an open triangular head. Not a curved electron-pushing arrow. */
function ReactionArrow({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const baseX = x2 - ARROW_HEAD * cos
  const baseY = y2 - ARROW_HEAD * sin
  const left = `${baseX - ARROW_HALF_WIDTH * sin},${baseY + ARROW_HALF_WIDTH * cos}`
  const right = `${baseX + ARROW_HALF_WIDTH * sin},${baseY - ARROW_HALF_WIDTH * cos}`
  return (
    <g stroke={MUTED} fill={MUTED} strokeWidth={2}>
      <line x1={x1} y1={y1} x2={baseX} y2={baseY} />
      <polygon points={`${x2},${y2} ${left} ${right}`} stroke="none" />
    </g>
  )
}

/** Step 1: benzaldehyde, no α-hydrogen, in hot concentrated alkali. */
function BenzaldehydeInAlkali() {
  return (
    <g>
      <Label x={W / 2} y={48} size={18}>
        conc. NaOH, heated
      </Label>
      <SkeletalFormula graph={GRAPH.benzaldehyde} scale={96} x={W / 2} y={246} />
      <Label x={W / 2} y={440} size={18}>
        {`${formulaOf(BENZALDEHYDE_SMILES)} (benzaldehyde): no α-hydrogen`}
      </Label>
    </g>
  )
}

/** Step 2: two benzaldehyde molecules; the CHO carbon of each is shaded and leads to a reduced or oxidised product. */
function TwoBenzaldehydes() {
  const leftX = 150
  const rightX = 430
  const y = 200
  return (
    <g>
      <SkeletalFormula graph={GRAPH.benzaldehyde} scale={56} x={leftX} y={y} highlightAtoms={[CARBONYL_CARBON_INDEX]} />
      <SkeletalFormula graph={GRAPH.benzaldehyde} scale={56} x={rightX} y={y} highlightAtoms={[CARBONYL_CARBON_INDEX]} />
      <ReactionArrow x1={leftX} y1={300} x2={leftX} y2={362} />
      <ReactionArrow x1={rightX} y1={300} x2={rightX} y2={362} />
      <Label x={leftX} y={392} weight={600}>
        reduced
      </Label>
      <Label x={leftX} y={416} size={15} fill={MUTED}>
        CHO carbon gains H
      </Label>
      <Label x={rightX} y={392} weight={600}>
        oxidised
      </Label>
      <Label x={rightX} y={416} size={15} fill={MUTED}>
        CHO carbon gains O
      </Label>
    </g>
  )
}

/** Step 3: methanal in concentrated alkali gives methanol and sodium methanoate, with the balanced equation below. */
function MethanalEquation() {
  return (
    <g>
      <Label x={110} y={196} size={26} weight={600}>
        HCHO
      </Label>
      <Label x={110} y={276} size={26} weight={600}>
        HCHO
      </Label>
      <Label x={235} y={112} size={15} fill={MUTED}>
        conc. NaOH, heat
      </Label>
      <ReactionArrow x1={170} y1={186} x2={300} y2={160} />
      <ReactionArrow x1={170} y1={282} x2={300} y2={302} />
      <Label x={420} y={166} size={26} weight={600}>
        CH₃OH
      </Label>
      <Label x={420} y={192} size={15} fill={MUTED}>
        methanol
      </Label>
      <Label x={420} y={282} size={26} weight={600}>
        HCOO⁻Na⁺
      </Label>
      <Label x={420} y={308} size={15} fill={MUTED}>
        sodium methanoate
      </Label>
      <Label x={W / 2} y={400} size={20}>
        {METHANAL_EQUATION}
      </Label>
    </g>
  )
}

/** Step 4: the reduced alcohol and the oxidised carboxylate salt, side by side, with the change of the CHO carbon in words. */
function ProductsSideBySide() {
  const alcoholX = 150
  const saltX = 430
  const y = 218
  return (
    <g>
      <Label x={alcoholX} y={104} size={18} weight={600}>
        reduced
      </Label>
      <Label x={saltX} y={104} size={18} weight={600}>
        oxidised
      </Label>
      <SkeletalFormula graph={GRAPH.phenylmethanol} scale={56} x={alcoholX} y={y} highlightAtoms={[CARBONYL_CARBON_INDEX]} />
      <SkeletalFormula graph={GRAPH.benzoate} scale={56} x={saltX} y={y} highlightAtoms={[CARBONYL_CARBON_INDEX]} showLonePairs />
      <Label x={alcoholX} y={336} size={16}>
        {`${formulaOf(PHENYLMETHANOL_SMILES)} (phenylmethanol)`}
      </Label>
      <Label x={saltX} y={336} size={16}>
        C₆H₅COO⁻Na⁺ (carboxylate salt)
      </Label>
      <Label x={alcoholX} y={420} size={15} fill={MUTED}>
        CHO carbon gained H
      </Label>
      <Label x={saltX} y={420} size={15} fill={MUTED}>
        CHO carbon lost H, gained O
      </Label>
    </g>
  )
}

/** Step 5: benzaldehyde nitrated in the ring; the NO₂ sits at the meta position, named under the product. */
function MetaNitration() {
  return (
    <g>
      <SkeletalFormula graph={GRAPH.benzaldehyde} scale={40} x={105} y={200} />
      <Label x={105} y={300} size={15} fill={MUTED}>
        benzaldehyde
      </Label>
      <Label x={225} y={178} size={15} fill={MUTED}>
        nitration
      </Label>
      <ReactionArrow x1={180} y1={200} x2={272} y2={200} />
      <SkeletalFormula graph={GRAPH.nitro} scale={58} x={410} y={206} />
      <Label x={410} y={356} size={17} weight={600}>
        {unit8Name(NITRO_BENZALDEHYDE_SMILES)}
      </Label>
      <Label x={410} y={382} size={15} fill={MUTED}>
        {formulaOf(NITRO_BENZALDEHYDE_SMILES)}
      </Label>
      <Label x={W / 2} y={448} size={16}>
        meta: one ring carbon between NO₂ and CHO
      </Label>
    </g>
  )
}

/** Step 6: the uses board. Methanal and ethanal are condensed text, so no carbon is hidden. */
function UsesBoard() {
  const tiles = [
    { x: 97, y: 150, draw: 'methanal' as const },
    { x: 282, y: 150, draw: 'ethanal' as const },
    { x: 470, y: 150, draw: 'benzaldehyde' as const },
    { x: 193, y: 364, draw: 'propan-2-one' as const },
    { x: 387, y: 364, draw: 'butan-2-one' as const },
  ]
  return (
    <g>
      <Label x={W / 2} y={44} size={16} fill={MUTED}>
        Uses board
      </Label>
      {USES_BOARD.map((entry, i) => {
        const tile = tiles[i]
        return (
          <g key={entry.key}>
            {tile.draw === 'methanal' && (
              <Label x={tile.x} y={tile.y + 10} size={26} weight={600}>
                HCHO
              </Label>
            )}
            {tile.draw === 'ethanal' && (
              <Label x={tile.x} y={tile.y + 10} size={26} weight={600}>
                CH₃CHO
              </Label>
            )}
            {tile.draw === 'benzaldehyde' && <SkeletalFormula graph={GRAPH.benzaldehyde} scale={40} x={tile.x} y={tile.y} />}
            {tile.draw === 'propan-2-one' && <SkeletalFormula graph={GRAPH.propanone} scale={40} x={tile.x} y={tile.y} />}
            {tile.draw === 'butan-2-one' && <SkeletalFormula graph={GRAPH.butanone} scale={40} x={tile.x} y={tile.y} />}
            <Label x={tile.x} y={tile.y + 62} size={16} weight={600}>
              {unit8Name(entry.smiles)}
            </Label>
            <Label x={tile.x} y={tile.y + 88} size={15} fill={MUTED}>
              {entry.tag}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

const VIEWS: Record<(typeof CANNIZZARO_BEATS)[number], () => ReactNode> = {
  'benzaldehyde-alkali': BenzaldehydeInAlkali,
  'two-benzaldehyde-reduced-oxidised': TwoBenzaldehydes,
  'methanal-equation': MethanalEquation,
  'products-side-by-side': ProductsSideBySide,
  'meta-nitration': MetaNitration,
  'uses-board': UsesBoard,
}

export function CannizzaroScrolly({ step }: CannizzaroScrollyProps) {
  const index = Math.min(CANNIZZARO_BEATS.length - 1, Math.max(0, Math.round(step)))
  const View = VIEWS[CANNIZZARO_BEATS[index]]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Cannizzaro reaction, ring substitution and uses, Step ${index + 1} of ${CANNIZZARO_BEATS.length}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <View />
    </svg>
  )
}
