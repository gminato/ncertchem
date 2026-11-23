'use client'

import { useState } from 'react'
import { CarbonylDiagram } from '@/components/animations/c12-unit5/carbonyls/CarbonylDiagram'
import { PI_TONE, SIGMA_TONE } from '@/components/animations/c12-unit5/carbonyls/carbonyl-geometry'
import {
  CARBONYL_OPTIONS,
  DEFAULT_CARBONYL_FORMULA,
  buildCarbonylReadout,
} from './carbonyl-explorer-model'
import styles from './carbonyl-explorer.module.css'

const SVG_W = 600
const SVG_H = 340

export function CarbonylExplorer() {
  const [formula, setFormula] = useState<string>(DEFAULT_CARBONYL_FORMULA)
  const [showSigma, setShowSigma] = useState<boolean>(true)
  const [showPi, setShowPi] = useState<boolean>(true)

  const readout = buildCarbonylReadout({ formula, showSigma, showPi })
  const { carbonyl } = readout
  const diagramScale = carbonyl.metalCount === 2 ? 1.0 : 1.15

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.selectorGroup} role="group" aria-label="Choose a metal carbonyl">
          {CARBONYL_OPTIONS.map((item) => {
            const active = item.formula === carbonyl.formula
            return (
              <button
                key={item.formula}
                type="button"
                className={active ? `${styles.pickBtn} ${styles.pickBtnActive}` : styles.pickBtn}
                aria-pressed={active}
                onClick={() => setFormula(item.formula)}
              >
                {item.formula}
              </button>
            )
          })}
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showSigma}
              onChange={(e) => setShowSigma(e.target.checked)}
            />
            <span className={styles.swatch} style={{ background: SIGMA_TONE }} aria-hidden="true" />
            <span>Show sigma donation</span>
          </label>

          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={showPi}
              onChange={(e) => setShowPi(e.target.checked)}
            />
            <span className={styles.swatch} style={{ background: PI_TONE }} aria-hidden="true" />
            <span>Show pi back donation</span>
          </label>
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.statusBar}>
          <span
            className={
              readout.isSynergic ? `${styles.statusBadge} ${styles.statusSynergic}` : styles.statusBadge
            }
          >
            {readout.bondStatusLabel}
          </span>
        </div>

        <svg
          className={styles.scene}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          role="img"
          aria-label={`Skeletal structure of ${carbonyl.formula} (${carbonyl.name}), ${carbonyl.geometry}. ${readout.bondStatusLabel}.`}
        >
          <CarbonylDiagram
            formula={carbonyl.formula}
            cx={SVG_W / 2}
            cy={SVG_H / 2 - 6}
            scale={diagramScale}
            showSigma={showSigma}
            showPi={showPi}
            showGuides={carbonyl.metalCount === 1}
            highlightBridges={carbonyl.bridgingCO > 0}
            fontSize={16}
            markerPrefix="sim-carb"
          />

          {/* Compact arrow legend at bottom of SVG */}
          <g fontSize={15}>
            <line
              x1={88}
              y1={318}
              x2={122}
              y2={318}
              stroke={SIGMA_TONE}
              strokeWidth={3}
              opacity={showSigma ? 1 : 0.3}
            />
            <text x={130} y={323} fill={showSigma ? 'var(--fg)' : 'var(--fg-muted)'}>
              sigma (C to M)
            </text>

            <line
              x1={328}
              y1={318}
              x2={362}
              y2={318}
              stroke={PI_TONE}
              strokeWidth={3}
              opacity={showPi ? 1 : 0.3}
            />
            <text x={370} y={323} fill={showPi ? 'var(--fg)' : 'var(--fg-muted)'}>
              pi back donation (M to C)
            </text>
          </g>
        </svg>
      </div>

      <div className={styles.cards}>
        <article className={styles.card}>
          <h4 className={styles.cardTitle}>{`${carbonyl.formula}: ${carbonyl.name}`}</h4>
          <dl className={styles.facts}>
            <dt>Shape</dt>
            <dd>{carbonyl.geometry}</dd>
            <dt>Oxidation state</dt>
            <dd>{`${carbonyl.metal}(${carbonyl.metalOxidationState})`}</dd>
            <dt>Total CO</dt>
            <dd>{String(carbonyl.totalCO)}</dd>
            <dt>Terminal CO</dt>
            <dd>{String(carbonyl.terminalCO)}</dd>
            <dt>Bridging CO</dt>
            <dd>{String(carbonyl.bridgingCO)}</dd>
            <dt>Metal-metal bond</dt>
            <dd>{carbonyl.hasMetalMetalBond ? `${carbonyl.metal}-${carbonyl.metal} bond` : 'None'}</dd>
          </dl>
        </article>

        <article className={styles.card}>
          <h4 className={styles.cardTitle}>Metal-CO bonding</h4>
          {readout.activeBondNotes.length > 0 ? (
            <ul className={styles.bondList}>
              {readout.activeBondNotes.map((note) => (
                <li key={note.kind} className={styles.bondItem}>
                  <span
                    className={styles.bondTag}
                    style={{
                      borderColor: note.kind === 'sigma' ? SIGMA_TONE : PI_TONE,
                      color: note.kind === 'sigma' ? SIGMA_TONE : PI_TONE,
                    }}
                  >
                    {note.label}
                  </span>
                  <span className={styles.bondDetail}>{note.detail}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.note}>
              Turn on sigma donation or pi back donation above to display electron-flow arrows on the M-CO bonds.
            </p>
          )}
          {readout.isSynergic && (
            <p className={styles.synergicNote}>
              Both donations reinforce each other: sigma donation increases electron density on the metal, enhancing pi back donation into CO.
            </p>
          )}
        </article>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {readout.liveSummary}
      </p>
    </div>
  )
}
