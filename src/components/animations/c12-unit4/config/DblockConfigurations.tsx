'use client'

import {
  ConfigurationBoxes,
  DBlockStrip,
  DBLOCK_STRIP_WIDTH,
  SERIES_TONE,
  configurationLayout,
  dBlockStripHeight,
  fillSubshell,
} from '@/components/vocab/dblock'
import { dBlockCells } from '@/components/vocab/dblock/DBlockStrip'
import { OrbitalBox, orbitalBoxWidth } from '@/components/vocab/OrbitalBox'
import { configDisplay } from '@/lib/chem/ncert-c12-unit4-tables'
import {
  dBlockSeries,
  dElectronCount,
  ionConfig,
  ionSymbol,
  isTransitionElement,
  outerConfig,
} from '@/lib/chem/dblock'
import {
  CLOSING_SYMBOLS,
  EXCEPTIONS,
  FILL_ROWS,
  ION_TESTS,
  SERIES_LEGEND,
  boxesFor,
  getConfigStep,
  outerElectrons,
  plainOrder,
} from './dblock-configurations-steps'

export interface DblockConfigurationsProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 460
const STRIP_Y = 44
const DBLOCK_SYMBOLS = [...dBlockSeries('3d'), ...dBlockSeries('4d'), ...dBlockSeries('5d'), ...dBlockSeries('6d')]
const F_SYMBOLS = [...dBlockCells(true).lanthanoids, ...dBlockCells(true).actinoids].map((e) => e.symbol)

/** Strip with the d- and f-blocks lit (Step 1) or only the series tints (Step 2). */
function StripView({ lit }: { lit: boolean }) {
  const h = dBlockStripHeight(true)
  return (
    <g>
      <DBlockStrip
        x={(W - DBLOCK_STRIP_WIDTH) / 2}
        y={STRIP_Y}
        showF
        highlight={lit ? [...DBLOCK_SYMBOLS, ...F_SYMBOLS] : []}
      />
      {lit ? (
        <>
          <text x={W / 2} y={22} textAnchor="middle" fontSize={16} fill="currentColor">
            The d-block: groups 3 to 12
          </text>
          <text x={W / 2} y={STRIP_Y + h + 26} textAnchor="middle" fontSize={16} fill="currentColor">
            The f-block: lanthanoids and actinoids
          </text>
        </>
      ) : (
        <g>
          {SERIES_LEGEND.map((item, i) => {
            const col = i % 2
            const row = Math.floor(i / 2)
            const x = 36 + col * 270
            const y = STRIP_Y + h + 40 + row * 30
            return (
              <g key={item.series}>
                <rect x={x} y={y - 13} width={16} height={16} rx={3} fill={SERIES_TONE[item.series]} />
                <text x={x + 26} y={y} fontSize={16} fill="currentColor">
                  {item.text}
                </text>
              </g>
            )
          })}
        </g>
      )}
    </g>
  )
}

/** The 3d row, one cell per element: boxes in NCERT order, configuration under each. */
function FillView() {
  const cellW = 110
  const x0 = (W - 5 * cellW) / 2
  const size = 14
  const gap = 3
  return (
    <g>
      {FILL_ROWS.map((row, r) => {
        const y0 = 30 + r * 218
        return row.map((symbol, i) => {
          const cx = x0 + i * cellW + cellW / 2
          const terms = boxesFor(symbol)
          const d = terms.find((t) => t.subshell.endsWith('d'))
          const s = terms.find((t) => t.subshell.endsWith('s'))
          if (!d || !s) return null
          const dW = orbitalBoxWidth(5, { size, gap, hasLabel: false })
          const sW = size
          const left = cx - (dW + 6 + sW) / 2
          const exception = EXCEPTIONS.includes(symbol)
          const plain = plainOrder(terms)
          return (
            <g key={symbol}>
              {exception && (
                <rect
                  x={cx - cellW / 2 + 4}
                  y={y0 - 2}
                  width={cellW - 8}
                  height={136}
                  rx={10}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.6}
                />
              )}
              <text x={cx} y={y0 + 22} textAnchor="middle" fontSize={20} fontWeight={600} fill="currentColor">
                {symbol}
              </text>
              <OrbitalBox
                x={left}
                y={y0 + 34}
                size={size}
                gap={gap}
                orbitals={fillSubshell(d.electrons, 5)}
              />
              <OrbitalBox
                x={left + dW + 6}
                y={y0 + 34}
                size={size}
                gap={gap}
                orbitals={fillSubshell(s.electrons, 1)}
              />
              <text x={left + dW / 2} y={y0 + 34 + size + 18} textAnchor="middle" fontSize={14} fill="currentColor">
                {d.subshell}
              </text>
              <text x={left + dW + 6 + sW / 2} y={y0 + 34 + size + 18} textAnchor="middle" fontSize={14} fill="currentColor">
                {s.subshell}
              </text>
              <text x={cx} y={y0 + 94} textAnchor="middle" fontSize={15} fill="currentColor">
                {outerConfig(symbol).display}
              </text>
              {exception && (
                <text x={cx} y={y0 + 120} textAnchor="middle" fontSize={14} fill="currentColor" opacity={0.8}>
                  {`not ${configDisplay({ terms: plain }, false)}`}
                </text>
              )}
            </g>
          )
        })
      })}
    </g>
  )
}

/** Sc and Zn verdicts, then the ion tests Ti³⁺, Cu²⁺ and Zn²⁺. */
function VerdictView() {
  const panels = ['Sc', 'Zn'] as const
  const pw = 230
  return (
    <g>
      {panels.map((symbol, i) => {
        const x = 30 + i * 290
        const terms = boxesFor(symbol)
        const layout = configurationLayout(terms, pw, 30)
        const verdict = isTransitionElement(symbol).verdict
        return (
          <g key={symbol}>
            <text x={x + pw / 2} y={36} textAnchor="middle" fontSize={22} fontWeight={600} fill="currentColor">
              {symbol}
            </text>
            <ConfigurationBoxes config={terms} x={x} y={56} width={pw} maxSize={30} />
            <text x={x + pw / 2} y={56 + layout.height + 30} textAnchor="middle" fontSize={16} fill="currentColor">
              {verdict ? 'Transition element' : 'Not a transition element'}
            </text>
          </g>
        )
      })}
      <text x={20} y={282} fontSize={16} fill="currentColor">
        Ion test: the ion counts if it keeps 1 to 9 d electrons
      </text>
      {ION_TESTS.map((test, i) => {
        const x = 8 + i * 192
        const y = 300
        const cfg = ionConfig(test.symbol, test.charge)
        const boxes = cfg.terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons }))
        const layout = configurationLayout(boxes, 160, 20)
        const n = dElectronCount(test.symbol, test.charge)
        const counts = n >= 1 && n <= 9
        return (
          <g key={`${test.symbol}${test.charge}`}>
            <rect x={x} y={y} width={176} height={layout.height + 84} rx={10} fill="none" stroke="currentColor" strokeOpacity={0.35} />
            <text x={x + 88} y={y + 28} textAnchor="middle" fontSize={18} fontWeight={600} fill="currentColor">
              {ionSymbol(test.symbol, test.charge)}
            </text>
            <ConfigurationBoxes config={boxes} x={x + 8} y={y + 42} width={160} maxSize={20} />
            <text x={x + 88} y={y + 42 + layout.height + 28} textAnchor="middle" fontSize={16} fill="currentColor">
              {counts ? 'counts' : 'does not count'}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/** Zn, Cd and Hg: full (n−1)d¹⁰ sets in dashed frames, with the group sum under each. */
function ClosedView() {
  return (
    <g>
      {CLOSING_SYMBOLS.map((symbol, i) => {
        const y = 22 + i * 140
        const terms = boxesFor(symbol)
        const layout = configurationLayout(terms, 330, 26)
        const sum = outerElectrons(terms)
        const dCount = terms.find((t) => t.subshell.endsWith('d'))?.electrons ?? 0
        const sCount = terms.find((t) => t.subshell.endsWith('s'))?.electrons ?? 0
        return (
          <g key={symbol}>
            <rect x={12} y={y} width={556} height={124} rx={12} fill="none" stroke="currentColor" strokeWidth={1.4} strokeDasharray="6 5" strokeOpacity={0.6} />
            <text x={34} y={y + 40} fontSize={22} fontWeight={600} fill="currentColor">
              {symbol}
            </text>
            <ConfigurationBoxes config={terms} x={96} y={y + 18} width={330} maxSize={26} />
            <text x={96} y={y + 18 + layout.height + 26} fontSize={16} fill="currentColor">
              {`${dCount} + ${sCount} = ${sum}: group ${sum}`}
            </text>
            <text x={96} y={y + 18 + layout.height + 50} fontSize={16} fill="currentColor">
              {isTransitionElement(symbol).verdict ? 'transition element' : 'not a transition element'}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function DblockConfigurations({ step }: DblockConfigurationsProps) {
  const view = getConfigStep(step)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Position and configurations of the d- and f-block" style={{ width: '100%', height: 'auto', display: 'block' }}>
      {view === 'table' && <StripView lit />}
      {view === 'series' && <StripView lit={false} />}
      {view === 'fill' && <FillView />}
      {view === 'verdict' && <VerdictView />}
      {view === 'closed' && <ClosedView />}
    </svg>
  )
}
