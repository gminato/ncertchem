'use client'

import { Label, SpectrumStrip, VocabDefs, spectrumX } from '@/components/vocab'
import { joulesToEv } from '@/components/vocab/ladder'
import { energyLevel } from '@/lib/chem/bohr'
import { wavelengthToCss } from '@/lib/chem/wavelength-color'
import {
  BALMER_GREEK,
  VISIBLE_RANGE_NM,
  balmerLines,
  clampLineStep,
  lineStepDescription,
  seriesFirstLines,
} from './line-spectra-steps'
import styles from './light.module.css'

export interface LineSpectraProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540

/** The strip used by Steps 0 to 2, from 380 nm to 750 nm. */
const STRIP = { left: 40, width: 560, y: 300, height: 40 }
const stripX = (nm: number) => STRIP.left + spectrumX(nm, STRIP.width, VISIBLE_RANGE_NM)

/** Label columns for the Balmer lines, in the order of the lines from 410 nm to 656 nm. */
const LABEL_X = [70, 170, 300, 458] as const

/** The level ladder of Step 3: n = 1 at the bottom, n = 6 at the top, equally spaced (not to energy scale). */
const LADDER = { rungLeft: 300, rungRight: 400, labelX: 416, bottomY: 440, gap: 62, arrowX: 270 }
const levelY = (n: number) => LADDER.bottomY - (n - 1) * LADDER.gap

/**
 * LineSpectra: white light as a continuous band (Step 0), the four visible lines
 * of hydrogen's emission spectrum (Step 1), the same lines dark in an absorption
 * spectrum (Step 2), and the first line of each named series as transitions on
 * an energy ladder (Step 3). The line positions come from the Rydberg formula in
 * src/lib/chem/bohr.ts.
 */
export function LineSpectra({ step, reducedMotion }: LineSpectraProps) {
  const active = clampLineStep(step)
  const enter = reducedMotion ? undefined : styles.enter
  const lines = balmerLines()

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label={lineStepDescription(active)}
        data-testid="line-spectra"
        data-step={active}
      >
        <VocabDefs idPrefix="line" />

        {active === 0 && (
          <g className={enter}>
            <polygon
              points="200,110 262,226 138,226"
              style={{ fill: 'var(--surface)', stroke: 'var(--fg-subtle)' }}
              strokeWidth={2}
            />
            <line x1={40} x2={150} y1={200} y2={200} strokeWidth={4} strokeLinecap="round" style={{ stroke: 'var(--fg)' }} />
            <Label x={320} y={130} fontSize={16} fill="var(--fg)">
              White light
            </Label>
            <Label x={320} y={160} fontSize={15} fill="var(--fg-muted)">
              splits into colours in a prism
            </Label>
            <SpectrumStrip
              x={STRIP.left}
              y={STRIP.y}
              width={STRIP.width}
              height={STRIP.height}
              rangeNm={VISIBLE_RANGE_NM}
              mode="continuous"
              tickFontSize={16}
              idPrefix="line-cont"
            />
            <Label x={320} y={420} fontSize={16}>
              A continuous spectrum: every wavelength from red to violet, with no gaps.
            </Label>
          </g>
        )}

        {(active === 1 || active === 2) && (
          <g className={enter}>
            {active === 1 ? (
              <g>
                <rect
                  x={230}
                  y={92}
                  width={180}
                  height={44}
                  rx={22}
                  style={{ fill: wavelengthToCss(656.5), opacity: 0.55 }}
                />
                <rect x={230} y={92} width={180} height={44} rx={22} fill="none" style={{ stroke: 'var(--border)' }} />
                <Label x={320} y={70} fontSize={16}>
                  Hydrogen discharge tube
                </Label>
              </g>
            ) : (
              <g>
                <Label x={320} y={70} fontSize={16}>
                  White light passed through a gas
                </Label>
                <Label x={320} y={100} fontSize={15} fill="var(--fg-muted)">
                  the gas removes those wavelengths, leaving dark lines
                </Label>
              </g>
            )}

            <SpectrumStrip
              x={STRIP.left}
              y={STRIP.y}
              width={STRIP.width}
              height={STRIP.height}
              rangeNm={VISIBLE_RANGE_NM}
              mode={active === 1 ? 'emission' : 'absorption'}
              lines={lines.map((l) => ({ nm: l.nm }))}
              tickFontSize={16}
              idPrefix={active === 1 ? 'line-emit' : 'line-abs'}
            />

            {[...lines]
              .sort((a, b) => a.nm - b.nm)
              .map((line, i) => {
              const labelX = LABEL_X[i]
              const lineX = stripX(line.nm)
              const labelY = 196
              return (
                <g key={`line-${line.upper}`}>
                  <line
                    x1={labelX}
                    x2={lineX}
                    y1={labelY + 30}
                    y2={STRIP.y - 10}
                    strokeWidth={1}
                    style={{ stroke: 'var(--fg-subtle)' }}
                  />
                  <Label x={labelX} y={labelY} fontSize={18} fill="var(--fg)">
                    H<Label.Sub>{BALMER_GREEK[line.upper]}</Label.Sub>
                  </Label>
                  <Label x={labelX} y={labelY + 22} fontSize={15} fill="var(--fg-muted)">
                    {line.nm.toFixed(1)} nm
                  </Label>
                </g>
              )
            })}

            {active === 1 ? (
              <g>
                <Label x={320} y={412} fontSize={16}>
                  Bright lines: the first four lines of the Balmer series.
                </Label>
                <Label x={320} y={436} fontSize={16}>
                  Further lines crowd in towards 365 nm, in the ultraviolet.
                </Label>
              </g>
            ) : (
              <g>
                <Label x={320} y={412} fontSize={16}>
                  Dark lines mark the wavelengths the gas absorbs.
                </Label>
                <Label x={320} y={436} fontSize={16}>
                  This is the negative of the emission spectrum.
                </Label>
              </g>
            )}
          </g>
        )}

        {active === 3 && (
          <g className={enter}>
            {[1, 2, 3, 4, 5, 6].map((n) => {
              const ev = joulesToEv(energyLevel(n))
              return (
                <g key={`level-${n}`}>
                  <line
                    x1={LADDER.rungLeft}
                    x2={LADDER.rungRight}
                    y1={levelY(n)}
                    y2={levelY(n)}
                    className={styles.rung}
                  />
                  <Label x={LADDER.labelX} y={levelY(n)} textAnchor="start" fontSize={16} fill="var(--fg)">
                    <tspan className="sym">n</tspan> = {n} ({'−'}
                    {Math.abs(ev).toFixed(2)} eV)
                  </Label>
                </g>
              )
            })}
            {seriesFirstLines().map((line) => {
              const yUpper = levelY(line.upper)
              const yLower = levelY(line.lower)
              const mid = (yUpper + yLower) / 2
              return (
                <g key={line.series}>
                  <line x1={LADDER.arrowX} x2={LADDER.arrowX} y1={yUpper + 4} y2={yLower - 12} className={styles.arrow} />
                  <path
                    d={`M${LADDER.arrowX},${yLower - 2} L${LADDER.arrowX - 6},${yLower - 12} L${LADDER.arrowX + 6},${yLower - 12} Z`}
                    className={styles.arrow}
                  />
                  <Label x={LADDER.arrowX - 12} y={mid} textAnchor="end" fontSize={16} fill="var(--fg)">
                    {line.series} ({line.region === 'visible' ? 'visible' : line.region === 'ultraviolet' ? 'UV' : 'IR'})
                  </Label>
                </g>
              )
            })}
            <Label x={320} y={486} fontSize={15} fill="var(--fg-muted)">
              Each arrow is the first line of one series.
            </Label>
            <Label x={320} y={508} fontSize={15} fill="var(--fg-muted)">
              The rungs are evenly spaced, not to energy scale.
            </Label>
          </g>
        )}
      </svg>
    </div>
  )
}
