'use client'

import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { Label, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { fitScale, clearDirection } from './formula'
import { ISOMER_STEP_COUNT, isomerViews, type IsomerView } from './isomer-steps'

export interface AlkaneIsomersProps {
  step: number
  reducedMotion: boolean
}

const CENTRE = { x: 290, y: 180 }
const CLASS_FILL: Record<'1°' | '2°' | '3°' | '4°', string> = {
  '1°': 'var(--spot-1)',
  '2°': 'var(--spot-2)',
  '3°': 'var(--spot-3)',
  '4°': 'var(--spot-4)',
}

/**
 * The alkane-isomers Scrolly: the three C5H12 chain isomers, each carbon labelled with its class in its
 * colour (1° blue, 2° orange, 3° teal, 4° purple). The last Step is a table of the three, with the carbon
 * counts, the hydrogen counts and the Table 9.2 boiling points. All values come from the lib.
 */
export function AlkaneIsomers({ step, reducedMotion }: AlkaneIsomersProps) {
  const index = Math.min(ISOMER_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)
  const views = isomerViews()

  return (
    <svg
      viewBox="0 0 580 440"
      role="img"
      aria-label={index < views.length ? `${views[index].name}, ${views[index].formula}: carbons labelled by class` : 'The three C5H12 isomers compared in a table'}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="isomer-visual"
    >
      <VocabDefs />
      <g opacity={reveal}>{index < views.length ? <IsomerDrawing view={views[index]} /> : <IsomerTable views={views} />}</g>
    </svg>
  )
}

function IsomerDrawing({ view }: { view: IsomerView }) {
  const scale = fitScale(view.graph, 96, 400, 180)
  const frame = drawingFrame(view.graph, scale)
  const carbons = Object.keys(view.degrees).map(Number)

  return (
    <>
      <SkeletalFormula graph={view.graph} scale={scale} x={CENTRE.x} y={CENTRE.y} data-testid="isomer-drawing" />
      {carbons.map((a) => {
        const p = frame.points[a]
        const d = clearDirection(frame.points, frame.adj, a)
        const r = 0.62 * scale
        const cls = (view.degrees[a] === '0°' ? '1°' : view.degrees[a]) as '1°' | '2°' | '3°' | '4°'
        return (
          <Label
            key={a}
            x={CENTRE.x + p.x + d.x * r}
            y={CENTRE.y + p.y + d.y * r}
            fontSize={20}
            fill={CLASS_FILL[cls]}
            data-testid="isomer-class"
            data-atom={a}
            data-class={cls}
          >
            {cls}
          </Label>
        )
      })}
      <Label x={CENTRE.x} y={346} fontSize={26} fill="var(--fg)" data-testid="isomer-name">
        {view.name}
      </Label>
      <Label x={CENTRE.x} y={372} fontSize={19} fill="var(--fg-muted)" data-testid="isomer-counts">
        {`${view.counts['1°']} primary · ${view.counts['2°']} secondary · ${view.counts['3°']} tertiary · ${view.counts['4°']} quaternary carbons`}
      </Label>
      <Label x={CENTRE.x} y={398} fontSize={19} fill="var(--fg-muted)">
        {`boiling point ${view.boilingK} K (Table 9.2)`}
      </Label>
    </>
  )
}

function IsomerTable({ views }: { views: IsomerView[] }) {
  const rowY = [150, 240, 330]
  return (
    <>
      <Label x={28} y={92} fontSize={20} fill="var(--fg-muted)" textAnchor="start">
        Isomer
      </Label>
      <Label x={552} y={92} fontSize={20} fill="var(--fg-muted)" textAnchor="end">
        boiling point
      </Label>
      <Label x={28} y={124} fontSize={18} fill="var(--fg-muted)" textAnchor="start">
        carbons 1°·2°·3°·4° | hydrogens 1°·2°·3°
      </Label>
      {views.map((v, i) => (
        <g key={v.name} data-testid="isomer-row">
          <Label x={28} y={rowY[i]} fontSize={22} fill="var(--fg)" textAnchor="start">
            {v.name}
          </Label>
          <Label x={552} y={rowY[i]} fontSize={22} fill="var(--fg)" textAnchor="end">
            {`${v.boilingK} K`}
          </Label>
          <Label x={28} y={rowY[i] + 30} fontSize={19} fill="var(--fg-muted)" textAnchor="start">
            {`carbons ${v.counts['1°']} · ${v.counts['2°']} · ${v.counts['3°']} · ${v.counts['4°']}     hydrogens ${v.tally.primary} · ${v.tally.secondary} · ${v.tally.tertiary}`}
          </Label>
        </g>
      ))}
      <Label x={290} y={398} fontSize={19} fill="var(--fg-muted)">
        Same formula: the more branched the isomer, the lower it boils.
      </Label>
    </>
  )
}
