'use client'

import { useState } from 'react'
import { ConfigurationBoxes, configurationLayout, SERIES_TONE } from '@/components/vocab/dblock'
import { PlotFrame, usePlotScale } from '@/components/vocab/kinetics'
import {
  DEFAULT_PICKS,
  contractionSeries,
  lanthanoidEntries,
  lanthanoidEntry,
  reactionOptions,
  type LanthanoidEntry,
} from '@/lib/chem/lanthanoid-explorer'
import styles from './lanthanoid-explorer.module.css'

const ENTRIES = lanthanoidEntries()
const BY_SYMBOL = new Map(ENTRIES.map((e) => [e.symbol, e]))
const REACTIONS = reactionOptions()
const SERIES = contractionSeries()

/** Configuration drawing: width of the drawing and the size of one orbital box. */
const CFG_W = 600
const CFG_BOX = 26
/** Left and right inset of the configuration rows, so glyphs stay inside the drawing. */
const INSET = 8
const HEAD = 30
const ROW_LABEL = 26
const ROW_GAP = 26
const BLOCK_GAP = 16

/** Height of one picker's block (header, atom row, Ln³⁺ row). Taken as the largest over all entries so the drawing never jumps. */
function blockHeight(e: LanthanoidEntry): number {
  const atom = configurationLayout(e.atomTerms, CFG_W - 2 * INSET, CFG_BOX).height
  const ion = configurationLayout(e.ion3Terms, CFG_W - 2 * INSET, CFG_BOX).height
  return HEAD + ROW_LABEL + atom + ROW_GAP + ROW_LABEL + ion + BLOCK_GAP
}
const BLOCK_H = Math.max(...ENTRIES.map(blockHeight))
const CFG_H = BLOCK_H * 2

/** Plot window: atomic number on x (La = 57 to Lu = 71), Ln³⁺ radius in pm on y. */
const PLOT = { x: 64, y: 16, width: 510, height: 236 }
const PLOT_DOMAIN = { xMin: 56.5, xMax: 71.5, yMin: 80, yMax: 110 }
const Z_TICKS = Array.from({ length: 15 }, (_, i) => 57 + i)
const SYMBOL_BY_Z = new Map(ENTRIES.map((e) => [e.Z, e.symbol]))

function ConfigBlock({ entry, index }: { entry: LanthanoidEntry; index: number }) {
  const top = index * BLOCK_H
  const atomY = top + HEAD + ROW_LABEL
  const atomH = configurationLayout(entry.atomTerms, CFG_W - 2 * INSET, CFG_BOX).height
  const ionLabelY = atomY + atomH + ROW_GAP + ROW_LABEL - 8
  return (
    <g>
      <text x={INSET} y={top + 22} fontSize={17} fontWeight={600} fill="var(--fg)">
        {`${entry.symbol} · ${entry.name}`}
      </text>
      <text x={INSET} y={top + HEAD + ROW_LABEL - 8} fontSize={15} fill="var(--fg-muted)">
        {`Atom  ${entry.atomDisplay}`}
      </text>
      <ConfigurationBoxes config={entry.atomTerms} x={INSET} y={atomY} width={CFG_W - 2 * INSET} maxSize={CFG_BOX} fontSize={14} />
      <text x={INSET} y={ionLabelY} fontSize={15} fill="var(--fg-muted)">
        {`${entry.ion3}  ${entry.ion3Display}`}
      </text>
      <ConfigurationBoxes
        config={entry.ion3Terms}
        x={INSET}
        y={ionLabelY + ROW_LABEL - 8}
        width={CFG_W - 2 * INSET}
        maxSize={CFG_BOX}
        fontSize={14}
      />
    </g>
  )
}

/** The one lanthanoid series: Ln³⁺ radius against Z, joined as a single line, with one tone. */
function ContractionSeries({ picks }: { picks: LanthanoidEntry[] }) {
  const scale = usePlotScale()
  const d = SERIES.map((p, i) => `${i === 0 ? 'M' : 'L'}${scale.x(p.Z).toFixed(2)} ${scale.y(p.radiusPm).toFixed(2)}`).join(' ')
  return (
    <g>
      <path d={d} fill="none" stroke={SERIES_TONE.ln} strokeWidth={2.4} strokeLinejoin="round" />
      {SERIES.map((p) => (
        <circle key={p.symbol} cx={scale.x(p.Z)} cy={scale.y(p.radiusPm)} r={4.5} fill={SERIES_TONE.ln} />
      ))}
      {picks.map((p) => {
        if (p.radiusPm === null) return null
        const cx = scale.x(p.Z)
        const cy = scale.y(p.radiusPm)
        return (
          <g key={p.symbol}>
            <circle cx={cx} cy={cy} r={9} fill="none" stroke="var(--fg)" strokeWidth={2} />
            <text
              x={cx}
              y={cy + 26}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth={4}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {p.ion3}
            </text>
            <text
              x={cx}
              y={cy + 42}
              textAnchor="middle"
              fontSize={15}
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth={4}
              strokeLinejoin="round"
              paintOrder="stroke"
            >
              {`${p.radiusPm} pm`}
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function LanthanoidExplorer() {
  const [pickA, setPickA] = useState<string>(DEFAULT_PICKS[0])
  const [pickB, setPickB] = useState<string>(DEFAULT_PICKS[1])
  const [reagentId, setReagentId] = useState<string>(REACTIONS[0].id)

  const picks = [BY_SYMBOL.get(pickA) ?? lanthanoidEntry(DEFAULT_PICKS[0]), BY_SYMBOL.get(pickB) ?? lanthanoidEntry(DEFAULT_PICKS[1])]
  const reaction = REACTIONS.find((r) => r.id === reagentId) ?? REACTIONS[0]

  const radiusText = (p: LanthanoidEntry) => (p.radiusPm === null ? 'not printed in Table 4.9' : `${p.radiusPm} pm`)
  const liveSummary =
    `${picks[0].symbol}: ${picks[0].ion3} radius ${picks[0].radiusPm === null ? 'not printed' : `${picks[0].radiusPm} pm`}. ` +
    `${picks[1].symbol}: ${picks[1].ion3} radius ${picks[1].radiusPm === null ? 'not printed' : `${picks[1].radiusPm} pm`}. ` +
    `Reagent ${reaction.reagent}, ${reaction.condition}: products ${reaction.products.join(', ')}.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>First lanthanoid</span>
          <select className={styles.select} value={pickA} onChange={(e) => setPickA(e.target.value)}>
            {ENTRIES.map((e) => (
              <option key={e.symbol} value={e.symbol}>{`${e.symbol} · ${e.name}`}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Second lanthanoid</span>
          <select className={styles.select} value={pickB} onChange={(e) => setPickB(e.target.value)}>
            {ENTRIES.map((e) => (
              <option key={e.symbol} value={e.symbol}>{`${e.symbol} · ${e.name}`}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Reagent</span>
          <select className={styles.select} value={reagentId} onChange={(e) => setReagentId(e.target.value)}>
            {REACTIONS.map((r) => (
              <option key={r.id} value={r.id}>{`${r.reagent} (${r.condition})`}</option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${CFG_W} ${CFG_H}`}
          role="img"
          aria-label={`Electron configurations of ${picks[0].symbol} and ${picks[1].symbol}, as atoms and as Ln³⁺ ions, with the 4f boxes filled by Hund's rule`}
        >
          <ConfigBlock entry={picks[0]} index={0} />
          <ConfigBlock entry={picks[1]} index={1} />
        </svg>
        <svg
          className={styles.scene}
          viewBox="0 0 600 310"
          role="img"
          aria-label={`Ln³⁺ radius falling from La to Yb, with ${picks[0].symbol} and ${picks[1].symbol} marked`}
        >
          <PlotFrame
            x={PLOT.x}
            y={PLOT.y}
            width={PLOT.width}
            height={PLOT.height}
            domain={PLOT_DOMAIN}
            xTicks={Z_TICKS}
            yTicks={[80, 90, 100, 110]}
            xTickFormat={(z) => SYMBOL_BY_Z.get(z) ?? ''}
            yTickFormat={(v) => String(v)}
            xTitle="lanthanoid, in order of atomic number"
            yTitle="Ln³⁺ radius / pm"
          >
            <ContractionSeries picks={picks} />
            <text x={PLOT.x + PLOT.width - 10} y={PLOT.y + 24} textAnchor="end" fontSize={15} fill="var(--fg-muted)">
              Lu: no radius printed
            </text>
          </PlotFrame>
        </svg>
      </div>

      <div className={styles.cards}>
        {picks.map((p, i) => (
          <article key={`${i}-${p.symbol}`} className={styles.card}>
            <h3 className={styles.cardTitle}>{`${p.symbol} · ${p.name}`}</h3>
            <dl className={styles.facts}>
              <dt>Atom</dt>
              <dd>{p.atomDisplay}</dd>
              <dt>{`${p.ion3} radius`}</dt>
              <dd>{radiusText(p)}</dd>
            </dl>
            <p className={styles.sectionLabel}>Oxidation states</p>
            <ul className={styles.states}>
              {p.states.map((s) => (
                <li key={s.ion} className={styles.state}>
                  <span className={styles.stateIon}>{s.ion}</span>
                  <span className={styles.stateF}>{s.fLabel}</span>
                  <span className={styles.stateReason}>{s.characteristic ? 'characteristic state' : s.reason}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
        <article className={styles.card}>
          <h3 className={styles.cardTitle}>Reaction with Ln</h3>
          <p className={styles.sectionLabel}>{`Reagent: ${reaction.reagent}, ${reaction.condition}`}</p>
          <ul className={styles.products}>
            {reaction.products.map((product) => (
              <li key={product} className={styles.product}>
                {product}
              </li>
            ))}
          </ul>
          <p className={styles.note}>
            Ln stands for any lanthanoid. These are the generic products NCERT gives in its figure; NCERT gives no formula for the hydride.
          </p>
        </article>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
