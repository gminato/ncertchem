'use client'

import { useState } from 'react'
import { Button } from '@/components/controls'
import { Tex } from '@/components/animations/unit6/qk/Tex'
import {
  CATALYST_PROCESSES,
  propertyLabel,
  type CatalystProcess,
  type CatalystProcessId,
  type CatalystProperty,
  type ReactorSpecies,
} from '@/lib/chem/industrial-catalyst'
import styles from './industrial-catalyst-explorer.module.css'

const SHORT_NAME: Record<CatalystProcessId, string> = {
  contact: 'Contact',
  haber: 'Haber',
  ziegler: 'Ziegler',
  wacker: 'Wacker',
  hydrogenation: 'Hydrogenation',
}

const PROPERTIES: readonly CatalystProperty[] = ['oxidation-state', 'surface-adsorption']

const VESSEL = { x: 178, y: 24, width: 204, height: 308 }
const BED = { y: 166, height: 50 }
/** Pellet centres in the catalyst bed (two rows). */
const PELLET_XS = [194, 215, 236, 257, 278, 299, 320, 341, 362]
/** Gas-zone spots for feed molecules, in the order they fill. */
const GAS_SPOTS: readonly [number, number][] = [
  [204, 66], [244, 56], [284, 70], [324, 58], [356, 78], [214, 96], [256, 100],
  [298, 92], [340, 106], [206, 120], [246, 124], [290, 120], [330, 126],
]
/** Lower-zone spots for product molecules. */
const LOW_SPOTS: readonly [number, number][] = [
  [214, 254], [252, 272], [296, 250], [334, 272], [232, 300], [276, 306], [318, 300], [352, 252],
]
/** Where molecules sit on the bed surface in an adsorption process. */
const SURFACE_XS = [204, 246, 288, 330]

interface Spot {
  key: string
  x: number
  y: number
  /** Index of the species the molecule belongs to, for its tone. */
  species: number
}

function fillSpots(species: readonly ReactorSpecies[], spots: readonly [number, number][]): Spot[] {
  const out: Spot[] = []
  let n = 0
  species.forEach((s, idx) => {
    if (s.shape !== 'molecule') return
    for (let i = 0; i < s.count; i++) {
      const [x, y] = spots[n % spots.length]!
      out.push({ key: `${idx}-${i}`, x, y, species: idx })
      n++
    }
  })
  return out
}

/** Points of a zigzag polymer or fat chain between x0 and x1. */
function zigzag(x0: number, x1: number, cy: number, step: number, amp: number): string {
  const pts: string[] = []
  let i = 0
  for (let x = x0; x <= x1; x += step, i++) pts.push(`${x},${cy + (i % 2 === 0 ? -amp : amp)}`)
  return pts.join(' ')
}

function Reactor({ process }: { process: CatalystProcess }) {
  const feedY = process.feeds.length === 1 ? [110] : [86, 124]
  const feedChain = process.feeds.some((f) => f.shape === 'chain')
  const productChain = process.products.some((p) => p.shape === 'chain')
  const gasSpots = fillSpots(process.feeds, GAS_SPOTS)
  const productSpots = productChain ? [] : fillSpots(process.products, LOW_SPOTS)
  const catalystLines = process.catalyst.split(' with ')
  const isOxidation = process.property === 'oxidation-state'
  const [oxA, oxB] = process.oxidationStates ?? ['', '']
  const productLabel = process.products.map((p) => p.label).join(' + ')
  const captionLines = process.property === null
    ? ['NCERT does not', 'say how it works']
    : isOxidation ? ['Metal swaps', 'oxidation states'] : ['Surface weakens', 'the bonds']

  return (
    <svg
      className={styles.scene}
      viewBox="0 0 560 360"
      role="img"
      aria-label={`Reactor for the ${process.name}: feed in at the left, catalyst bed in the middle, product out at the right`}
    >
      {process.feeds.map((f, i) => (
        <g key={`feed-${i}`}>
          <line x1={24} y1={feedY[i]} x2={VESSEL.x} y2={feedY[i]} className={styles.pipe} />
          <text x={24} y={feedY[i]! - 10} className={styles.label}>{f.label}</text>
        </g>
      ))}

      <rect x={VESSEL.x} y={VESSEL.y} width={VESSEL.width} height={VESSEL.height} rx={18} className={styles.vessel} />

      {feedChain && (
        <polyline points={zigzag(200, 300, 40, 12, 6)} className={styles.chainFeed} />
      )}
      {gasSpots.map((s) => (
        <circle
          key={`g-${s.key}`}
          cx={s.x}
          cy={s.y}
          r={7}
          className={s.species === 0 ? styles.molecule : styles.moleculeAlt}
        />
      ))}

      {isOxidation && (
        <g>
          <rect x={196} y={142} width={76} height={22} rx={6} className={styles.chip} />
          <text x={234} y={158} textAnchor="middle" className={styles.chipText}>{oxA}</text>
          <rect x={288} y={142} width={76} height={22} rx={6} className={styles.chip} />
          <text x={326} y={158} textAnchor="middle" className={styles.chipText}>{oxB}</text>
          <polygon points="289,147 282,143 282,151" className={styles.arrowHead} />
          <line x1={272} y1={147} x2={284} y2={147} className={styles.arrow} />
          <polygon points="271,157 278,153 278,161" className={styles.arrowHead} />
          <line x1={276} y1={157} x2={288} y2={157} className={styles.arrow} />
        </g>
      )}

      <rect x={VESSEL.x + 1} y={BED.y} width={VESSEL.width - 2} height={BED.height} className={styles.bed} />
      {[0, 1].map((row) =>
        PELLET_XS.map((x, i) => (
          <circle
            key={`p-${row}-${i}`}
            cx={x + (row % 2 === 0 ? 0 : 10)}
            cy={row === 0 ? 180 : 200}
            r={8}
            className={styles.pellet}
          />
        )),
      )}

      {!isOxidation &&
        SURFACE_XS.map((x) => (
          <g key={`s-${x}`}>
            <line x1={x} y1={159} x2={x} y2={170} className={styles.bond} />
            <circle cx={x} cy={152} r={7} className={styles.molecule} />
          </g>
        ))}

      <text x={24} y={196} className={styles.label}>{captionLines[0]}</text>
      <text x={24} y={216} className={styles.label}>{captionLines[1]}</text>

      <text x={394} y={186} className={styles.caption}>Catalyst</text>
      {catalystLines.map((line, i) => (
        <text key={`c-${i}`} x={394} y={206 + i * 20} className={styles.label}>{line}</text>
      ))}

      {productChain && (
        <polyline points={zigzag(206, 352, 286, 12, 8)} className={styles.chainProduct} />
      )}
      {productSpots.map((s) => (
        <circle key={`o-${s.key}`} cx={s.x} cy={s.y} r={7} className={styles.product} />
      ))}

      <line x1={VESSEL.x + VESSEL.width} y1={292} x2={548} y2={292} className={styles.pipe} />
      <text x={394} y={280} className={styles.label}>{productLabel}</text>
    </svg>
  )
}

/** Process picker, reactor drawing, overall equation and the property that matters. */
export function IndustrialCatalystExplorer() {
  const [id, setId] = useState<CatalystProcessId>('contact')
  const current = CATALYST_PROCESSES.find((p) => p.id === id) ?? CATALYST_PROCESSES[0]!

  const plainEquation = current.equation.replace(/ -> /, ' → ')
  const liveSummary = `${current.name} over ${current.catalyst}: ${plainEquation}. Property used: ${propertyLabel(current.property).toLowerCase()}.`

  return (
    <div className={styles.sim}>
      <div className={styles.controls} role="group" aria-label="Choose a process">
        {CATALYST_PROCESSES.map((p) => {
          const on = p.id === current.id
          return (
            <Button
              key={p.id}
              variant={on ? 'primary' : 'secondary'}
              aria-pressed={on}
              className={styles.choice}
              onClick={() => setId(p.id)}
            >
              {SHORT_NAME[p.id]}
            </Button>
          )
        })}
      </div>

      <div className={styles.stage}>
        <Reactor process={current} />
      </div>

      <div className={styles.equation}>
        <Tex tex={`\\ce{${current.equation}}`} display />
        <p className={styles.note}>
          {current.equationKind === 'overall'
            ? `Overall equation (NCERT p. ${current.page})`
            : `Representative equation, ${(current.equationNote ?? '').replace(/ \(representative\)$/, '')}`}
        </p>
      </div>

      <div className={styles.properties}>
        {PROPERTIES.map((prop) => {
          const on = prop === current.property
          return (
            <div key={prop} className={on ? styles.propertyOn : styles.property} aria-current={on ? 'true' : undefined}>
              {propertyLabel(prop)}
            </div>
          )
        })}
      </div>
      <p className={styles.propertyText}>{current.propertyText}</p>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
