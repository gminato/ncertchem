'use client'

import { useId, useState } from 'react'
import { ColourWheel, ConfigurationBoxes, SolutionColour, configurationLayout } from '@/components/vocab/dblock'
import { NCERT_AQUA_COLOURS } from '@/lib/chem/ncert-c12-unit4-tables'
import { aquaIonColour, complementaryColour, dElectronCount, ionConfig, isColourlessByConfig, type SpectralKey } from '@/lib/chem/dblock'
import { colourWheelSector } from '@/lib/chem/dblock-series-data'
import styles from './aqua-ion-colour-lab.module.css'

const SUPERSCRIPT_DIGITS: Record<string, number> = { '⁰': 0, '¹': 1, '²': 2, '³': 3, '⁴': 4, '⁵': 5, '⁶': 6, '⁷': 7, '⁸': 8, '⁹': 9 }

/** Splits a Table 4.8 ion name such as "Cu²⁺" into its element symbol and charge. */
function parseIon(ion: string): { symbol: string; charge: number } {
  const symbol = /^[A-Z][a-z]?/.exec(ion)?.[0] ?? ion
  const digits = [...ion.slice(symbol.length)].filter((ch) => ch in SUPERSCRIPT_DIGITS)
  return { symbol, charge: digits.length === 0 ? 1 : Number(digits.map((ch) => SUPERSCRIPT_DIGITS[ch]).join('')) }
}

/** Ions the lab offers: every Table 4.8 row the vocab colours, in table order. */
const IONS = NCERT_AQUA_COLOURS.map((row) => row.ion).filter((ion) => aquaIonColour(ion) !== null)

const WHEEL_CX = 220
const WHEEL_CY = 320
const WHEEL_R = 70
const CONFIG_X = 24
const CONFIG_Y = 470
const CONFIG_W = 392
const CONFIG_MAX = 28

const COLOUR_WORD: Record<string, string> = { purple: 'purple', pink: 'pink' }

export function AquaIonColourLab() {
  const selectId = useId()
  const [ion, setIon] = useState<string>('Cu²⁺')
  const info = aquaIonColour(ion)!
  const { symbol, charge } = parseIon(info.ion)
  const dCount = dElectronCount(symbol, charge)
  const colourless = isColourlessByConfig(dCount)
  const config = ionConfig(symbol, charge)

  const wheel = colourless ? null : colourWheelSector(info.colour)
  const seen: SpectralKey | undefined = wheel?.sector
  const absorbed: SpectralKey | undefined = seen ? complementaryColour(seen) : undefined
  const nearest = wheel?.nearest ?? false
  const colourName = COLOUR_WORD[info.colour] ?? info.colour

  const boxes = [{ subshell: '3d', electrons: dCount }]
  const layout = configurationLayout(boxes, CONFIG_W, CONFIG_MAX)
  const viewHeight = CONFIG_Y + layout.height + 12

  const reason = colourless
    ? dCount === 0
      ? `${info.ion}(aq) has no d electrons (${config.display}), so no d–d jump can absorb light: the solution is colourless.`
      : `${info.ion}(aq) has a full 3d set (${config.display}), so no electron can jump to a higher d level: the solution is colourless.`
    : `${info.ion}(aq) is ${colourName}. It absorbs ${absorbed} light and transmits ${seen}${nearest ? ' (nearest sector on the wheel)' : ''}.`

  const liveSummary = colourless
    ? `${info.ion}(aq) is colourless. Every colour passes through. It has ${dCount} d electrons.`
    : `${info.ion}(aq) is ${colourName}. It absorbs ${absorbed} and transmits ${seen}${nearest ? ', the nearest sector' : ''}. It has ${dCount} d electrons.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <label htmlFor={selectId} className={styles.label}>
          Aqua ion (Table 4.8)
        </label>
        <select id={selectId} className={styles.select} value={ion} onChange={(e) => setIon(e.target.value)}>
          {IONS.map((name) => (
            <option key={name} value={name}>
              {name}(aq)
            </option>
          ))}
        </select>
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 440 ${viewHeight}`}
          role="img"
          aria-label={`${info.ion} in water: ${colourless ? 'colourless' : `${colourName}, absorbs ${absorbed}`}, with ${dCount} d electrons`}
        >
          <SolutionColour x={135} y={20} width={170} ion={info.key} light label={`${info.ion}(aq)`} />
          {colourless ? null : (
            <g>
              <ColourWheel cx={WHEEL_CX} cy={WHEEL_CY} radius={WHEEL_R} absorbed={absorbed} seen={seen} />
            </g>
          )}
          {colourless ? (
            <text x={WHEEL_CX} y={WHEEL_CY} textAnchor="middle" className={styles.caption}>
              No d–d jump: no light absorbed
            </text>
          ) : null}
          <text x={CONFIG_X} y={CONFIG_Y - 14} className={styles.caption}>
            {`Configuration: ${config.display}`}
          </text>
          <ConfigurationBoxes config={boxes} x={CONFIG_X} y={CONFIG_Y} width={CONFIG_W} maxSize={CONFIG_MAX} fontSize={14} />
        </svg>
      </div>

      <p className={styles.reason}>{reason}</p>
      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
