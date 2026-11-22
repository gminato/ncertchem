import React, { forwardRef } from 'react'
import { PERIODIC_TABLE, type ElementRecord } from '@/lib/chem/periodic-data'
import { SERIES_TONE, type Series } from './tones'

/** Group columns 3 to 12, in order. */
export const D_GROUPS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const

const PERIOD_SERIES: Readonly<Record<number, Series>> = { 4: '3d', 5: '4d', 6: '5d', 7: '6d' }
const TILE_W = 35
const TILE_H = 38
const PITCH_X = 39
const PITCH_Y = 44
const X0 = 26
const Y0 = 28
const F_GAP = 12

export interface DBlockStripProps extends Omit<React.SVGAttributes<SVGGElement>, 'children' | 'onSelect' | 'values'> {
  x?: number
  y?: number
  /** Symbols to emphasise, such as the 3d series or one element. */
  highlight?: readonly string[]
  /** Symbols to fade. */
  dim?: readonly string[]
  /** Adds the two f-block rows: lanthanoids (Ce–Lu) and actinoids (Th–Lr). */
  showF?: boolean
  /** Makes every tile a button. Keyboard operable (Enter or Space). */
  onSelect?: (symbol: string) => void
  /** A short value under each symbol. Keep it to three characters or so. */
  values?: Readonly<Record<string, string>>
}

/** The element tiles to draw in the strip: groups 3 to 12 of periods 4 to 7, plus the f-rows when asked. */
export function dBlockCells(showF: boolean): { main: ElementRecord[]; lanthanoids: ElementRecord[]; actinoids: ElementRecord[] } {
  const main = PERIODIC_TABLE.filter(
    (e) => e.group !== null && (D_GROUPS as readonly number[]).includes(e.group) && e.period >= 4 && e.period <= 7 && e.fBlockRow === null
  )
  const lanthanoids = showF ? PERIODIC_TABLE.filter((e) => e.fBlockRow === 'lanthanoid').sort((a, b) => a.Z - b.Z) : []
  const actinoids = showF ? PERIODIC_TABLE.filter((e) => e.fBlockRow === 'actinoid').sort((a, b) => a.Z - b.Z) : []
  return { main, lanthanoids, actinoids }
}

/** Tone of an element tile: the series of its period, or the f-row. */
export function seriesOf(e: ElementRecord): Series | null {
  if (e.fBlockRow === 'lanthanoid') return 'ln'
  if (e.fBlockRow === 'actinoid') return 'an'
  return PERIOD_SERIES[e.period] ?? null
}

/** Compact periodic-table excerpt for the d- and f-blocks, with tiles tinted by series. */
export const DBlockStrip = forwardRef<SVGGElement, DBlockStripProps>(function DBlockStrip(
  { x = 0, y = 0, highlight = [], dim = [], showF = false, onSelect, values, ...rest },
  ref
) {
  const { main, lanthanoids, actinoids } = dBlockCells(showF)
  const lanthRowY = Y0 + 4 * PITCH_Y + F_GAP
  const actRowY = lanthRowY + PITCH_Y

  const tile = (e: ElementRecord, cx: number, cy: number, key: string) => {
    const series = seriesOf(e)
    const tone = series ? SERIES_TONE[series] : 'var(--fg-subtle)'
    const isHi = highlight.includes(e.symbol)
    const isDim = dim.includes(e.symbol)
    const inner = (
      <>
        <rect
          x={cx}
          y={cy}
          width={TILE_W}
          height={TILE_H}
          rx={6}
          style={{ fill: tone, fillOpacity: isHi ? 0.5 : 0.18, stroke: tone, strokeWidth: isHi ? 2.4 : 1.2 }}
        />
        <text
          x={cx + TILE_W / 2}
          y={cy + (values?.[e.symbol] ? 16 : 23)}
          textAnchor="middle"
          fontSize={15}
          fontWeight={600}
          style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)' }}
        >
          {e.symbol}
        </text>
        {values?.[e.symbol] && (
          <text
            x={cx + TILE_W / 2}
            y={cy + 31}
            textAnchor="middle"
            fontSize={13}
            style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}
          >
            {values[e.symbol]}
          </text>
        )}
      </>
    )
    const label = `${e.name}, atomic number ${e.Z}`
    return (
      <g
        key={key}
        opacity={isDim ? 0.3 : 1}
        {...(onSelect
          ? {
              role: 'button',
              tabIndex: 0,
              'aria-label': label,
              onClick: () => onSelect(e.symbol),
              onKeyDown: (ev: React.KeyboardEvent<SVGGElement>) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault()
                  onSelect(e.symbol)
                }
              },
              style: { cursor: 'pointer' },
            }
          : {})}
        data-symbol={e.symbol}
      >
        {inner}
      </g>
    )
  }

  return (
    <g ref={ref} transform={`translate(${x}, ${y})`} aria-hidden={onSelect ? undefined : true} {...rest}>
      {D_GROUPS.map((g, i) => (
        <text key={`gh-${g}`} x={X0 + i * PITCH_X + TILE_W / 2} y={Y0 - 10} textAnchor="middle" fontSize={14} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
          {g}
        </text>
      ))}
      {[4, 5, 6, 7].map((p, row) => (
        <text key={`ph-${p}`} x={X0 - 8} y={Y0 + row * PITCH_Y + TILE_H / 2 + 5} textAnchor="end" fontSize={14} style={{ fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' }}>
          {p}
        </text>
      ))}
      {main.map((e) => {
        const col = D_GROUPS.indexOf(e.group as (typeof D_GROUPS)[number])
        const row = e.period - 4
        return tile(e, X0 + col * PITCH_X, Y0 + row * PITCH_Y, e.symbol)
      })}
      {lanthanoids.map((e, k) => tile(e, X0 + k * PITCH_X, lanthRowY, e.symbol))}
      {actinoids.map((e, k) => tile(e, X0 + k * PITCH_X, actRowY, e.symbol))}
      {showF && (
        <g style={{ fontFamily: 'var(--font-sans)' }}>
          <text x={X0 - 8} y={lanthRowY + TILE_H / 2 + 5} textAnchor="end" fontSize={13} style={{ fill: 'var(--fg-muted)' }}>
            4f
          </text>
          <text x={X0 - 8} y={actRowY + TILE_H / 2 + 5} textAnchor="end" fontSize={13} style={{ fill: 'var(--fg-muted)' }}>
            5f
          </text>
        </g>
      )}
      <g style={{ fontFamily: 'var(--font-sans)' }}>
        {(['3d', '4d', '5d', '6d'] as const).map((s, i) => (
          <g key={`lg-${s}`} transform={`translate(${X0 + 10 * PITCH_X + 14}, ${Y0 + i * 28})`}>
            <rect x={0} y={-11} width={14} height={14} rx={3} style={{ fill: SERIES_TONE[s], fillOpacity: 0.5, stroke: SERIES_TONE[s], strokeWidth: 1.2 }} />
            <text x={22} y={1} fontSize={14} style={{ fill: 'var(--fg)' }}>
              {s} series
            </text>
          </g>
        ))}
        {showF &&
          (['ln', 'an'] as const).map((s, i) => (
            <g key={`lgf-${s}`} transform={`translate(${X0 + 10 * PITCH_X + 14}, ${Y0 + (4 + i) * 28})`}>
              <rect x={0} y={-11} width={14} height={14} rx={3} style={{ fill: SERIES_TONE[s], fillOpacity: 0.5, stroke: SERIES_TONE[s], strokeWidth: 1.2 }} />
              <text x={22} y={1} fontSize={14} style={{ fill: 'var(--fg)' }}>
                {s === 'ln' ? 'lanthanoids' : 'actinoids'}
              </text>
            </g>
          ))}
      </g>
    </g>
  )
})

/** Viewbox width the strip is drawn for (tiles, period column and legend). */
export const DBLOCK_STRIP_WIDTH = 572
/** Viewbox height for the strip: the four period rows, plus the two f-rows when asked. */
export function dBlockStripHeight(showF: boolean): number {
  return showF ? Y0 + 5 * PITCH_Y + F_GAP + TILE_H : Y0 + 3 * PITCH_Y + TILE_H
}
