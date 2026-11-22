'use client'

import { useId } from 'react'
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
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
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
  fillRevealOpacity,
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
/** Strip tiles of the main table end at x 420 (strip coordinates); its built-in legend sits to the right of that. */
const STRIP_TILES_WIDTH = 420
/** Strip y (strip coordinates) between the main table and the 4f row, where the legend clip stops. */
const STRIP_F_ROW_TOP = 206
const DBLOCK_SYMBOLS = [...dBlockSeries('3d'), ...dBlockSeries('4d'), ...dBlockSeries('5d'), ...dBlockSeries('6d')]
const F_SYMBOLS = [...dBlockCells(true).lanthanoids, ...dBlockCells(true).actinoids].map((e) => e.symbol)

/** Strip with the d- and f-blocks lit (Step 1) or only the series tints (Step 2). */
function StripView({ lit }: { lit: boolean }) {
  const h = dBlockStripHeight(true)
  const stripX = (W - DBLOCK_STRIP_WIDTH) / 2
  const clipId = `dblock-tiles-${useId().replace(/:/g, '')}`
  return (
    <g>
      {!lit && (
        <clipPath id={clipId}>
          <rect x={0} y={0} width={stripX + STRIP_TILES_WIDTH} height={STRIP_Y + STRIP_F_ROW_TOP} />
          <rect x={0} y={STRIP_Y + STRIP_F_ROW_TOP} width={W} height={H} />
        </clipPath>
      )}
      <g clipPath={lit ? undefined : `url(#${clipId})`}>
        <DBlockStrip
          x={stripX}
          y={STRIP_Y}
          showF
          highlight={lit ? [...DBLOCK_SYMBOLS, ...F_SYMBOLS] : []}
        />
      </g>
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

/** The 3d row, one cell per element: boxes in NCERT order, configuration under them, cells fading in one by one. */
function FillView({ progress }: { progress: number }) {
  const cellW = 116
  const rowY = [40, 255]
  const size = 19
  const gap = 2
  const ghostSize = 12
  const dW = orbitalBoxWidth(5, { size, gap, hasLabel: false })
  const ghostDW = orbitalBoxWidth(5, { size: ghostSize, gap: 2, hasLabel: false })
  return (
    <g>
      {FILL_ROWS.map((row, r) =>
        row.map((symbol, i) => {
          const index = r * 5 + i
          const y0 = rowY[r]
          const cx = i * cellW + cellW / 2
          const terms = boxesFor(symbol)
          const d = terms.find((t) => t.subshell.endsWith('d'))
          const s = terms.find((t) => t.subshell.endsWith('s'))
          if (!d || !s) return null
          const exception = EXCEPTIONS.includes(symbol)
          const plain = plainOrder(terms)
          const plainD = plain.find((t) => t.subshell.endsWith('d'))
          const plainS = plain.find((t) => t.subshell.endsWith('s'))
          return (
            <g key={symbol} opacity={fillRevealOpacity(index, progress)}>
              {exception && (
                <rect x={cx - 55} y={y0 - 6} width={110} height={172} rx={10} fill="none" stroke="currentColor" strokeWidth={1.6} />
              )}
              <text x={cx} y={y0 + 20} textAnchor="middle" fontSize={20} fontWeight={600} fill="currentColor">
                {symbol}
              </text>
              <OrbitalBox x={cx - dW / 2} y={y0 + 28} size={size} gap={gap} orbitals={fillSubshell(d.electrons, 5)} />
              <text x={cx} y={y0 + 62} textAnchor="middle" fontSize={14} fill="currentColor">
                {d.subshell}
              </text>
              <OrbitalBox x={cx - 24} y={y0 + 72} size={size} gap={gap} orbitals={fillSubshell(s.electrons, 1)} />
              <text x={cx + 2} y={y0 + 86} fontSize={14} fill="currentColor">
                {s.subshell}
              </text>
              <text x={cx} y={y0 + 116} textAnchor="middle" fontSize={15} fill="currentColor">
                {outerConfig(symbol).display}
              </text>
              {exception && plainD && plainS && (
                <g opacity={0.35}>
                  <OrbitalBox
                    x={cx - ghostDW / 2}
                    y={y0 + 130}
                    size={ghostSize}
                    gap={2}
                    orbitals={fillSubshell(plainD.electrons, 5)}
                  />
                  <OrbitalBox
                    x={cx - ghostDW / 2 + ghostDW + 6}
                    y={y0 + 130}
                    size={ghostSize}
                    gap={2}
                    orbitals={fillSubshell(plainS.electrons, 1)}
                  />
                </g>
              )}
              {exception && (
                <text x={cx} y={y0 + 160} textAnchor="middle" fontSize={14} fill="currentColor" opacity={0.8}>
                  {`not ${configDisplay({ terms: plain }, false)}`}
                </text>
              )}
            </g>
          )
        })
      )}
    </g>
  )
}

/** Sc and Zn verdicts in cards, then the ion tests Ti³⁺, Cu²⁺ and Zn²⁺ along the bottom. */
function VerdictView() {
  const pw = 220
  const panels = ['Sc', 'Zn'] as const
  const panelH = Math.max(...panels.map((symbol) => configurationLayout(boxesFor(symbol), pw, 40).height))
  const ions = ION_TESTS.map((test) => {
    const boxes = ionConfig(test.symbol, test.charge).terms.map((t) => ({ subshell: t.subshell, electrons: t.electrons }))
    return { test, boxes, layout: configurationLayout(boxes, 160, 28), n: dElectronCount(test.symbol, test.charge) }
  })
  const ionH = Math.max(...ions.map((ion) => ion.layout.height)) + 84
  const ionY = H - 16 - ionH
  const cardTop = 16
  const cardH = ionY - 40 - cardTop
  // Verdict content (symbol, boxes, verdict line) centred vertically in each card.
  const contentH = 34 + panelH + 36
  const contentY = cardTop + (cardH - contentH) / 2
  return (
    <g>
      {panels.map((symbol, i) => {
        const x = 20 + i * 300
        const terms = boxesFor(symbol)
        const verdict = isTransitionElement(symbol).verdict
        return (
          <g key={symbol}>
            <rect x={x} y={cardTop} width={pw + 40} height={cardH} rx={12} fill="none" stroke="currentColor" strokeOpacity={0.35} />
            <text x={x + (pw + 40) / 2} y={contentY + 20} textAnchor="middle" fontSize={22} fontWeight={600} fill="currentColor">
              {symbol}
            </text>
            <ConfigurationBoxes config={terms} x={x + 20} y={contentY + 34} width={pw} maxSize={40} />
            <text x={x + (pw + 40) / 2} y={contentY + 34 + panelH + 26} textAnchor="middle" fontSize={16} fill="currentColor">
              {verdict ? 'Transition element' : 'Not a transition element'}
            </text>
          </g>
        )
      })}
      <text x={20} y={ionY - 14} fontSize={16} fill="currentColor">
        Ion test: the ion counts if it keeps 1 to 9 d electrons
      </text>
      {ions.map((ion, i) => {
        const x = 8 + i * 192
        const y = ionY
        const counts = ion.n >= 1 && ion.n <= 9
        return (
          <g key={`${ion.test.symbol}${ion.test.charge}`}>
            <rect x={x} y={y} width={176} height={ionH} rx={10} fill="none" stroke="currentColor" strokeOpacity={0.35} />
            <text x={x + 88} y={y + 28} textAnchor="middle" fontSize={18} fontWeight={600} fill="currentColor">
              {ionSymbol(ion.test.symbol, ion.test.charge)}
            </text>
            <ConfigurationBoxes config={ion.boxes} x={x + 8} y={y + 42} width={160} maxSize={28} />
            <text x={x + 88} y={y + ionH - 16} textAnchor="middle" fontSize={16} fill="currentColor">
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

export function DblockConfigurations({ step, reducedMotion }: DblockConfigurationsProps) {
  const view = getConfigStep(step)
  // The 3d cells fade in one after another over the Step; reduced motion shows all ten at once.
  const progress = useTweenedNumber(view === 'fill' ? 1 : 0, reducedMotion, 2)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Position and configurations of the d- and f-block"
      className="dblock-config"
      style={{ width: '100%', height: 'auto', display: 'block' }}
    >
      {/* The strip's 4f and 5f row labels are 13 units in the shared vocab; 14 keeps them at 13 px or more on screen. */}
      <style>{'.dblock-config text[font-size="13"] { font-size: 14px; }'}</style>
      {view === 'table' && <StripView lit />}
      {view === 'series' && <StripView lit={false} />}
      {view === 'fill' && <FillView progress={progress} />}
      {view === 'verdict' && <VerdictView />}
      {view === 'closed' && <ClosedView />}
    </svg>
  )
}
