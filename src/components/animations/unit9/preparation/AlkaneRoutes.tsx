'use client'

import { ReactionScheme, reactionSchemeSize } from '@/components/organic/ReactionScheme'
import { Label, LabelSub, LabelSup, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { ROUTE_STEP_COUNT, routeStep, wrapText, type RouteCell } from './alkane-routes-steps'

export interface AlkaneRoutesProps {
  step: number
  reducedMotion: boolean
}

/** The drawing is narrow on purpose: the panel scales it up, so the bonds and labels read large. */
const WIDTH = 420
const SCHEME_WIDTH = 396
const TEXT_LINE = 19
const CHARS = 56

/**
 * The alkane-routes Scrolly: the four preparations of NCERT 9.2.2 as reaction schemes, each species
 * tagged with its carbon count, and Kolbe's electrolysis drawn as a cell with CO₂ at the anode and
 * H₂ at the cathode. The reagents, conditions and products come from the hydrocarbon lib.
 */
export function AlkaneRoutes({ step, reducedMotion }: AlkaneRoutesProps) {
  const index = Math.min(ROUTE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = routeStep(index)
  const reveal = useReveal(index, reducedMotion)

  if (current.kind === 'cell') {
    return <KolbeCell cell={current} reveal={reveal} index={index} />
  }

  const height = reactionSchemeSize(current.sequence, SCHEME_WIDTH).height
  const schemeTop = 48
  const arithmetic = wrapText(current.arithmetic, CHARS)
  const names = current.names ? wrapText(current.names, CHARS) : []
  const conditions = wrapText(`Conditions: ${current.conditions}`, CHARS)
  const textTop = schemeTop + height + 14
  const viewHeight = Math.max(300, textTop + (arithmetic.length + names.length + conditions.length) * TEXT_LINE + 12)

  const namesTop = textTop + arithmetic.length * TEXT_LINE
  const conditionsTop = namesTop + names.length * TEXT_LINE
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${viewHeight}`}
      role="img"
      aria-label={`${current.title}. ${current.arithmetic}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="routes-visual"
    >
      <VocabDefs />
      <Label x={WIDTH / 2} y={34} textAnchor="middle" fontSize={17} fill="var(--fg)" data-testid="routes-title">
        {current.title}
      </Label>
      <ReactionScheme sequence={current.sequence} maxWidth={SCHEME_WIDTH} x={(WIDTH - SCHEME_WIDTH) / 2} y={schemeTop} progress={reveal} />
      {arithmetic.map((line, k) => (
        <Label key={`a${k}`} x={WIDTH / 2} y={textTop + k * TEXT_LINE} textAnchor="middle" fontSize={14} fill="var(--locant)" data-testid={k === 0 ? 'routes-arithmetic' : undefined}>
          {line}
        </Label>
      ))}
      {names.map((line, k) => (
        <Label key={`n${k}`} x={WIDTH / 2} y={namesTop + k * TEXT_LINE} textAnchor="middle" fontSize={14} fill="var(--fg)" data-testid={k === 0 ? 'routes-names' : undefined}>
          {line}
        </Label>
      ))}
      {conditions.map((line, k) => (
        <Label key={`c${k}`} x={WIDTH / 2} y={conditionsTop + k * TEXT_LINE} textAnchor="middle" fontSize={13} fill="var(--fg-muted)" data-testid={k === 0 ? 'routes-conditions' : undefined}>
          {line}
        </Label>
      ))}
    </svg>
  )
}

/**
 * Kolbe's cell. The anode gets the carboxylate ions and gives off CO₂; the cathode gives off H₂.
 * The reactions are written as NCERT shows them, step by step, and the product is named by the lib.
 */
function KolbeCell({ cell, reveal, index }: { cell: RouteCell; reveal: number; index: number }) {
  const beaker = { x: 60, y: 92, w: 300, h: 150 }
  const liquidTop = 150
  const anodeX = 140
  const cathodeX = 280
  const electrodeTop = 60
  const arithmetic = wrapText(`${cell.product}: ${cell.arithmetic}`, CHARS)
  const height = 384 + arithmetic.length * TEXT_LINE + 6

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      role="img"
      aria-label={`${cell.title} cell. CO₂ forms at the anode, H₂ at the cathode. ${cell.arithmetic}.`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="routes-visual"
    >
      <VocabDefs />
      <Label x={WIDTH / 2} y={30} textAnchor="middle" fontSize={17} fill="var(--fg)" data-testid="routes-title">
        {cell.title}
      </Label>
      <g opacity={reveal}>
        <rect x={beaker.x} y={beaker.y} width={beaker.w} height={beaker.h} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
        <path
          d={`M${beaker.x + 2},${liquidTop} H${beaker.x + beaker.w - 2} V${beaker.y + beaker.h - 12} Q${beaker.x + beaker.w - 2},${beaker.y + beaker.h - 2} ${beaker.x + beaker.w - 12},${beaker.y + beaker.h - 2} H${beaker.x + 12} Q${beaker.x + 2},${beaker.y + beaker.h - 2} ${beaker.x + 2},${beaker.y + beaker.h - 12} Z`}
          fill="var(--accent-soft)"
          opacity={0.7}
        />
        <rect x={anodeX - 6} y={electrodeTop} width={12} height={beaker.y + beaker.h - electrodeTop - 14} rx={3} fill="var(--fg-muted)" />
        <rect x={cathodeX - 6} y={electrodeTop} width={12} height={beaker.y + beaker.h - electrodeTop - 14} rx={3} fill="var(--fg-muted)" />
        <Label x={anodeX} y={electrodeTop - 10} textAnchor="middle" fontSize={20} fill="var(--fg)" data-testid="routes-anode-sign">
          +
        </Label>
        <Label x={cathodeX} y={electrodeTop - 10} textAnchor="middle" fontSize={20} fill="var(--fg)" data-testid="routes-cathode-sign">
          −
        </Label>
        <Label x={210} y={liquidTop + 36} textAnchor="middle" fontSize={15} fill="var(--fg)">
          CH<LabelSub>3</LabelSub>COO<LabelSup>−</LabelSup>
        </Label>
        <Label x={210} y={liquidTop + 58} textAnchor="middle" fontSize={15} fill="var(--fg)">
          Na<LabelSup>+</LabelSup>
        </Label>
        <Label x={104} y={beaker.y + 34} textAnchor="middle" fontSize={16} fill="var(--fg)" data-testid="routes-co2">
          CO<LabelSub>2</LabelSub> ↑
        </Label>
        <Label x={316} y={beaker.y + 34} textAnchor="middle" fontSize={16} fill="var(--fg)" data-testid="routes-h2">
          H<LabelSub>2</LabelSub> ↑
        </Label>
      </g>

      <g opacity={reveal}>
        <Label x={28} y={282} textAnchor="start" fontSize={16} fill="var(--fg)" data-testid="routes-anode">
          At the anode (+)
        </Label>
        <Label x={28} y={306} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
          CH<LabelSub>3</LabelSub>COO<LabelSup>−</LabelSup> − e<LabelSup>−</LabelSup> → CH<LabelSub>3</LabelSub>COO•
        </Label>
        <Label x={28} y={326} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
          CH<LabelSub>3</LabelSub>COO• → CH<LabelSub>3</LabelSub>• + CO<LabelSub>2</LabelSub>
        </Label>
        <Label x={28} y={346} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
          CH<LabelSub>3</LabelSub>• + CH<LabelSub>3</LabelSub>• → CH<LabelSub>3</LabelSub>–CH<LabelSub>3</LabelSub>
        </Label>
        <Label x={WIDTH - 28} y={282} textAnchor="end" fontSize={16} fill="var(--fg)" data-testid="routes-cathode">
          At the cathode (−)
        </Label>
        <Label x={WIDTH - 28} y={306} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
          H<LabelSub>2</LabelSub>O + e<LabelSup>−</LabelSup> → OH<LabelSup>−</LabelSup> + H•
        </Label>
        <Label x={WIDTH - 28} y={326} textAnchor="end" fontSize={14} fill="var(--fg-muted)">
          2H• → H<LabelSub>2</LabelSub>
        </Label>
      </g>
      {arithmetic.map((line, k) => (
        <Label
          key={`a${k}`}
          x={WIDTH / 2}
          y={384 + k * TEXT_LINE}
          textAnchor="middle"
          fontSize={14}
          fill="var(--locant)"
          data-testid={k === 0 ? 'routes-arithmetic' : undefined}
        >
          {line}
        </Label>
      ))}
    </svg>
  )
}
