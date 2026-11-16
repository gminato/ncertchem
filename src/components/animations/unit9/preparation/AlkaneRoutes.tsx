'use client'

import { ReactionScheme } from '@/components/organic/ReactionScheme'
import { Label, LabelSub, LabelSup, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { ROUTE_STEP_COUNT, routeStep, wrapText, type RouteCell } from './alkane-routes-steps'
import { fitScheme } from './scheme-fit'

export interface AlkaneRoutesProps {
  step: number
  reducedMotion: boolean
}

/** Drawing width in viewBox units: the panel is about 570 px, so the text reads at 14 px or more. */
const WIDTH = 600
const SCHEME_WIDTH = 580
const TEXT_LINE = 21
const CHARS = 66
/** The viewBox is at least this tall, so a short step is centred in the panel rather than sitting at its top. */
const MIN_HEIGHT = 480

/**
 * The alkane-routes Scrolly: the four preparations of NCERT 9.2.2 as reaction schemes on one row,
 * each species tagged with its carbon count, and Kolbe's electrolysis drawn as a cell with CO₂ at the
 * anode and H₂ at the cathode. The reagents, conditions and products come from the hydrocarbon lib.
 */
export function AlkaneRoutes({ step, reducedMotion }: AlkaneRoutesProps) {
  const index = Math.min(ROUTE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = routeStep(index)
  const reveal = useReveal(index, reducedMotion)

  if (current.kind === 'cell') {
    return <KolbeCell cell={current} reveal={reveal} index={index} />
  }

  const fit = fitScheme(current.sequence, SCHEME_WIDTH)
  const arithmetic = wrapText(current.arithmetic, CHARS)
  const names = current.names ? wrapText(current.names, CHARS) : []
  const conditions = wrapText(`Conditions: ${current.conditions}`, CHARS)
  const contentHeight = fit.height + 36 + (arithmetic.length + names.length + conditions.length) * TEXT_LINE
  const viewHeight = Math.max(MIN_HEIGHT, contentHeight + 60)
  const shift = (viewHeight - contentHeight) / 2
  const schemeTop = shift + 64
  const textTop = schemeTop + fit.height + 36
  const namesTop = textTop + arithmetic.length * TEXT_LINE
  const conditionsTop = namesTop + names.length * TEXT_LINE
  const schemeX = (WIDTH - fit.width) / 2

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
      <Label x={WIDTH / 2} y={shift + 36} textAnchor="middle" fontSize={19} fill="var(--fg)" data-testid="routes-title">
        {current.title}
      </Label>
      <g transform={`translate(${schemeX}, ${schemeTop}) scale(${fit.scale})`}>
        <ReactionScheme sequence={current.sequence} maxWidth={fit.layoutWidth} progress={reveal} />
      </g>
      {arithmetic.map((line, k) => (
        <Label key={`a${k}`} x={WIDTH / 2} y={textTop + k * TEXT_LINE} textAnchor="middle" fontSize={15} fill="var(--locant)" data-testid={k === 0 ? 'routes-arithmetic' : undefined}>
          {line}
        </Label>
      ))}
      {names.map((line, k) => (
        <Label key={`n${k}`} x={WIDTH / 2} y={namesTop + k * TEXT_LINE} textAnchor="middle" fontSize={15} fill="var(--fg)" data-testid={k === 0 ? 'routes-names' : undefined}>
          {line}
        </Label>
      ))}
      {conditions.map((line, k) => (
        <Label key={`c${k}`} x={WIDTH / 2} y={conditionsTop + k * TEXT_LINE} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" data-testid={k === 0 ? 'routes-conditions' : undefined}>
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
  const beaker = { x: 110, y: 96, w: 380, h: 170 }
  const liquidTop = 170
  const anodeX = 205
  const cathodeX = 395
  const electrodeTop = 66
  const arithmetic = wrapText(`${cell.product}: ${cell.arithmetic}`, CHARS)
  const columnsTop = 316
  const arithmeticTop = columnsTop + 130
  const height = arithmeticTop + arithmetic.length * TEXT_LINE + 12

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
      <Label x={WIDTH / 2} y={36} textAnchor="middle" fontSize={19} fill="var(--fg)" data-testid="routes-title">
        {cell.title}
      </Label>
      <g opacity={reveal}>
        <rect x={beaker.x} y={beaker.y} width={beaker.w} height={beaker.h} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
        <path
          d={`M${beaker.x + 2},${liquidTop} H${beaker.x + beaker.w - 2} V${beaker.y + beaker.h - 12} Q${beaker.x + beaker.w - 2},${beaker.y + beaker.h - 2} ${beaker.x + beaker.w - 12},${beaker.y + beaker.h - 2} H${beaker.x + 12} Q${beaker.x + 2},${beaker.y + beaker.h - 2} ${beaker.x + 2},${beaker.y + beaker.h - 12} Z`}
          fill="var(--accent-soft)"
          opacity={0.7}
        />
        <rect x={anodeX - 7} y={electrodeTop} width={14} height={beaker.y + beaker.h - electrodeTop - 16} rx={3} fill="var(--fg-muted)" />
        <rect x={cathodeX - 7} y={electrodeTop} width={14} height={beaker.y + beaker.h - electrodeTop - 16} rx={3} fill="var(--fg-muted)" />
        <Label x={anodeX} y={electrodeTop - 12} textAnchor="middle" fontSize={22} fill="var(--fg)" data-testid="routes-anode-sign">
          +
        </Label>
        <Label x={cathodeX} y={electrodeTop - 12} textAnchor="middle" fontSize={22} fill="var(--fg)" data-testid="routes-cathode-sign">
          −
        </Label>
        <Label x={300} y={liquidTop + 40} textAnchor="middle" fontSize={16} fill="var(--fg)">
          CH<LabelSub>3</LabelSub>COO<LabelSup>−</LabelSup>
        </Label>
        <Label x={300} y={liquidTop + 64} textAnchor="middle" fontSize={16} fill="var(--fg)">
          Na<LabelSup>+</LabelSup>
        </Label>
        <Label x={156} y={beaker.y + 40} textAnchor="middle" fontSize={17} fill="var(--fg)" data-testid="routes-co2">
          CO<LabelSub>2</LabelSub> ↑
        </Label>
        <Label x={444} y={beaker.y + 40} textAnchor="middle" fontSize={17} fill="var(--fg)" data-testid="routes-h2">
          H<LabelSub>2</LabelSub> ↑
        </Label>
      </g>

      <g opacity={reveal}>
        <Label x={36} y={columnsTop} textAnchor="start" fontSize={17} fill="var(--fg)" data-testid="routes-anode">
          At the anode (+)
        </Label>
        <Label x={36} y={columnsTop + 26} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
          CH<LabelSub>3</LabelSub>COO<LabelSup>−</LabelSup> − e<LabelSup>−</LabelSup> → CH<LabelSub>3</LabelSub>COO•
        </Label>
        <Label x={36} y={columnsTop + 50} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
          CH<LabelSub>3</LabelSub>COO• → CH<LabelSub>3</LabelSub>• + CO<LabelSub>2</LabelSub>
        </Label>
        <Label x={36} y={columnsTop + 74} textAnchor="start" fontSize={15} fill="var(--fg-muted)">
          CH<LabelSub>3</LabelSub>• + CH<LabelSub>3</LabelSub>• → CH<LabelSub>3</LabelSub>–CH<LabelSub>3</LabelSub>
        </Label>
        <Label x={WIDTH - 36} y={columnsTop} textAnchor="end" fontSize={17} fill="var(--fg)" data-testid="routes-cathode">
          At the cathode (−)
        </Label>
        <Label x={WIDTH - 36} y={columnsTop + 26} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
          H<LabelSub>2</LabelSub>O + e<LabelSup>−</LabelSup> → OH<LabelSup>−</LabelSup> + H•
        </Label>
        <Label x={WIDTH - 36} y={columnsTop + 50} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
          2H• → H<LabelSub>2</LabelSub>
        </Label>
      </g>
      {arithmetic.map((line, k) => (
        <Label key={`a${k}`} x={WIDTH / 2} y={arithmeticTop + k * TEXT_LINE} textAnchor="middle" fontSize={15} fill="var(--locant)" data-testid={k === 0 ? 'routes-arithmetic' : undefined}>
          {line}
        </Label>
      ))}
    </svg>
  )
}
