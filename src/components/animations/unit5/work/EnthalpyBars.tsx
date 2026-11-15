'use client'

import { Label, VocabDefs } from '@/components/vocab'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { ENTHALPY_STEP_COUNT, enthalpyExample, kJ, signed } from './work-steps'
import { Symbolised } from './symbols'

export interface EnthalpyBarsProps {
  step: number
  reducedMotion: boolean
}

const EX = enthalpyExample()
/** SVG units per kJ mol⁻¹. */
const SCALE = 2.2
const ZERO_Y = 84
const GROUP = { ammonia: 170, diamond: 440 }
const BAR_W = 56
const OFFSET = 60

const yOf = (kj: number) => ZERO_Y - kj * SCALE
/** Top edge of a bar: negative values hang below the zero line, positive ones rise above it. */
const topOf = (kj: number) => (kj < 0 ? ZERO_Y : ZERO_Y - kj * SCALE)
/** Label position under a bar: below its far end, and never above the zero line. */
const labelY = (kj: number) => Math.max(yOf(kj), ZERO_Y) + 20

/**
 * ΔH against ΔU. The ammonia bars show a gas reaction: ΔH is ΔU plus the work term pΔV, which is
 * Δn_g RT. The diamond pair shows a solids-only change, where ΔH and ΔU agree. Each Step reveals
 * one more part of the picture.
 */
export function EnthalpyBars({ step, reducedMotion }: EnthalpyBarsProps) {
  const index = Math.min(ENTHALPY_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)
  const showH = index >= 1
  const showGap = index >= 2
  const showDiamond = index >= 3
  const { ammonia, diamond } = EX

  const caption = [
    'Constant volume: the heat is ΔU = q_V.',
    'Constant pressure: the heat is ΔH = q_p.',
    'Gas moles fall, so ΔH lies below ΔU.',
    'No gas moles change: ΔH and ΔU are equal.',
  ][index]

  const bars = (
    cx: number,
    dU: number,
    dH: number | null,
    fade: number,
    gapOn: boolean,
    key: string,
  ) => {
    const showHBar = dH !== null
    const xU = cx - OFFSET
    const xH = cx + OFFSET
    const hU = Math.abs(dU) * SCALE
    const hH = dH === null ? 0 : Math.abs(dH) * SCALE
    return (
      <g key={key} opacity={fade}>
        <rect x={xU - BAR_W / 2} y={topOf(dU)} width={BAR_W} height={hU} rx={3} style={{ fill: 'var(--fg-muted)' }} />
        {showHBar && <rect x={xH - BAR_W / 2} y={topOf(dH ?? 0)} width={BAR_W} height={hH} rx={3} style={{ fill: 'var(--heat)', opacity: 0.55 }} />}
        {showHBar && gapOn && (
          <rect x={xH - BAR_W / 2} y={dU < 0 ? ZERO_Y + hU : ZERO_Y - hU} width={BAR_W} height={Math.max(0, hH - hU)} style={{ fill: 'var(--heat)' }} />
        )}
        <Label x={xU} y={ZERO_Y - 14} fontSize={16} fill="var(--fg)">
          <tspan className="sym">ΔU</tspan>
        </Label>
        {showHBar && (
          <Label x={xH} y={ZERO_Y - 14} fontSize={16} fill="var(--fg)">
            <tspan className="sym">ΔH</tspan>
          </Label>
        )}
        <Label x={xU} y={labelY(dU)} fontSize={15} fill="var(--fg)">
          {signed(dU, 2)}
        </Label>
        {showHBar && (
          <Label x={xH} y={labelY(dH ?? 0)} fontSize={15} fill="var(--fg)">
            {signed(dH, 2)}
          </Label>
        )}
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 580 400"
      role="img"
      aria-label={`Bars for ΔH and ΔU. ${caption}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <VocabDefs />
      <line x1={20} x2={560} y1={ZERO_Y} y2={ZERO_Y} strokeWidth={1.2} style={{ stroke: 'var(--fg-subtle)' }} />

      <g opacity={0.4 + 0.6 * reveal}>
        {bars(GROUP.ammonia, ammonia.deltaU, showH ? ammonia.deltaH : null, 1, showGap, 'nh3')}
      </g>

      {showGap && (
        <Label x={290} y={36} fontSize={16} fill="var(--heat)" data-testid="enthalpy-gap">
          <Symbolised text={`pΔV = Δn_g RT = ${kJ(ammonia.gap)}`} />
        </Label>
      )}

      {showDiamond && (
        <g opacity={reveal}>
          {bars(GROUP.diamond, diamond.deltaU, diamond.deltaH, 1, false, 'diamond')}
        </g>
      )}

      <Label x={GROUP.ammonia} y={334} fontSize={17} fill="var(--fg)">
        N₂ + 3 H₂ → 2 NH₃
      </Label>
      <Label x={GROUP.ammonia} y={354} fontSize={15} fill="var(--fg-muted)">
        <Symbolised text={`Δn_g = ${signed(ammonia.deltaNg, 0)} (4 mol of gas becomes 2)`} />
      </Label>
      <Label x={24} y={ZERO_Y - 14} textAnchor="start" fontSize={14} fill="var(--fg-muted)">
        kJ mol⁻¹
      </Label>
      {showDiamond && (
        <>
          <Label x={GROUP.diamond} y={334} fontSize={17} fill="var(--fg)">
            C(graphite) → C(diamond)
          </Label>
          <Label x={GROUP.diamond} y={354} fontSize={15} fill="var(--fg-muted)">
            <Symbolised text={`Δn_g = ${signed(diamond.deltaNg, 0)}, so ΔH = ΔU`} />
          </Label>
        </>
      )}

      <Label x={290} y={384} fontSize={16} fill="var(--fg-muted)" data-testid="enthalpy-caption">
        <Symbolised text={caption} />
      </Label>
    </svg>
  )
}
