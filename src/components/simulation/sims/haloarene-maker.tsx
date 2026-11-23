'use client'

import { useState } from 'react'
import { BenzeneRing } from '@/components/organic'
import { Segmented } from '@/components/controls'
import { haloareneOutcome, startSpecies, type HaloOutcome, type HaloProduct, type RouteId, type StartId } from '@/lib/chem/haloarene-maker'
import styles from './haloarene-maker.module.css'

const START_OPTIONS = [
  { value: 'benzene', label: 'Benzene' },
  { value: 'toluene', label: 'Toluene' },
  { value: 'aniline', label: 'Aniline' },
  { value: 'p-toluidine', label: 'p-Toluidine' },
] as const

const ROUTE_OPTIONS = [
  { value: 'cl2', label: 'Cl₂ + Fe' },
  { value: 'br2', label: 'Br₂ + Fe' },
  { value: 'i2', label: 'I₂ + HNO₃' },
  { value: 'f2', label: 'F₂' },
  { value: 'cu-cl', label: 'Cu₂Cl₂' },
  { value: 'cu-br', label: 'Cu₂Br₂' },
  { value: 'ki', label: 'KI' },
] as const

const ROLE_WORD: Record<HaloProduct['role'], string> = { single: '', ortho: 'ortho: ', para: 'para: ' }

/** Drawing layout, in the viewBox units of the SVG below. */
const VB = { width: 640, height: 560 }
const START_X = 120
const MID_Y = 280
const PRODUCT_X = 480
const FORK_Y = { top: 150, bottom: 410 }
const ARROW_FROM = 200
const ARROW_TO = 400
const TEXT_X = 300
const VERDICT_X = 320
const VERDICT_Y = 420

/** Breaks a sentence into lines of at most `width` characters, for the verdict text. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > width && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function Arrow({ x1, y1, x2, y2, dashed = false }: { x1: number; y1: number; x2: number; y2: number; dashed?: boolean }) {
  const angle = Math.atan2(y2 - y1, x2 - x1)
  const head = 14
  const spread = 0.42
  const hx = (a: number) => x2 - head * Math.cos(angle + a)
  const hy = (a: number) => y2 - head * Math.sin(angle + a)
  return (
    <g className={styles.arrow}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={3} strokeDasharray={dashed ? '7 6' : undefined} />
      <polygon points={`${x2},${y2} ${hx(-spread)},${hy(-spread)} ${hx(spread)},${hy(spread)}`} stroke="none" />
    </g>
  )
}

function Diazonium({ x, y }: { x: number; y: number }) {
  return (
    <text x={x} y={y} textAnchor="middle" className={styles.note}>
      via diazonium salt
    </text>
  )
}

export function HaloareneMaker() {
  const [start, setStart] = useState<StartId>('toluene')
  const [route, setRoute] = useState<RouteId>('cl2')

  const outcome: HaloOutcome = haloareneOutcome(start, route)
  const startSp = startSpecies(start)
  const isSandmeyer = route === 'cu-cl' || route === 'cu-br' || route === 'ki'

  const liveSummary =
    outcome.kind === 'verdict'
      ? outcome.message
      : `${outcome.reagent}, ${outcome.condition}. Product${outcome.products.length > 1 ? 's' : ''}: ${outcome.products
          .map((p) => `${ROLE_WORD[p.role]}${p.name}, ${p.formula}`)
          .join('; ')}. ${outcome.note}`

  const dual = outcome.kind === 'products' && outcome.products.length === 2
  const products = outcome.kind === 'products' ? outcome.products : []

  return (
    <div className={styles.sim} data-route={route}>
      <div className={styles.controls}>
        <Segmented label="Starting material" options={START_OPTIONS} value={start} onChange={setStart} />
        <Segmented label="Route" options={ROUTE_OPTIONS} value={route} onChange={setRoute} />
      </div>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox={`0 0 ${VB.width} ${VB.height}`} role="img" aria-label={`${startSp.name} with the ${ROUTE_OPTIONS.find((r) => r.value === route)?.label} route`}>
          <BenzeneRing x={START_X} y={MID_Y} substituents={startSp.labels} />

          {outcome.kind === 'verdict' && (
            <g>
              <Arrow x1={ARROW_FROM} y1={MID_Y} x2={ARROW_TO} y2={MID_Y} dashed />
              {route === 'f2' && (
                <g className={styles.cross}>
                  <line x1={TEXT_X - 26} y1={MID_Y - 26} x2={TEXT_X + 26} y2={MID_Y + 26} />
                  <line x1={TEXT_X + 26} y1={MID_Y - 26} x2={TEXT_X - 26} y2={MID_Y + 26} />
                </g>
              )}
              <text x={VERDICT_X} y={VERDICT_Y} textAnchor="middle" className={styles.verdict}>
                {wrap(outcome.message, 34).map((line, i) => (
                  <tspan key={line} x={VERDICT_X} dy={i === 0 ? 0 : 26}>
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          )}

          {outcome.kind === 'products' && (
            <g>
              {dual ? (
                <g>
                  <line x1={ARROW_FROM + 30} y1={MID_Y} x2={ARROW_FROM + 30} y2={FORK_Y.top} strokeWidth={3} />
                  <line x1={ARROW_FROM + 30} y1={MID_Y} x2={ARROW_FROM + 30} y2={FORK_Y.bottom} strokeWidth={3} />
                  <Arrow x1={ARROW_FROM + 30} y1={FORK_Y.top} x2={ARROW_TO} y2={FORK_Y.top} />
                  <Arrow x1={ARROW_FROM + 30} y1={FORK_Y.bottom} x2={ARROW_TO} y2={FORK_Y.bottom} />
                  <line x1={ARROW_FROM} y1={MID_Y} x2={ARROW_FROM + 30} y2={MID_Y} strokeWidth={3} />
                </g>
              ) : (
                <Arrow x1={ARROW_FROM} y1={MID_Y} x2={ARROW_TO} y2={MID_Y} />
              )}
              <text x={TEXT_X} y={MID_Y - 22} textAnchor="middle" className={styles.reagent}>
                {outcome.reagent}
              </text>
              <text x={TEXT_X} y={MID_Y + 36} textAnchor="middle" className={styles.condition}>
                {outcome.condition}
              </text>
              {isSandmeyer && <Diazonium x={TEXT_X} y={MID_Y + 70} />}
              {products.map((p, i) => {
                const cy = dual ? (i === 0 ? FORK_Y.top : FORK_Y.bottom) : MID_Y
                return (
                  <g key={p.smiles}>
                    <BenzeneRing x={PRODUCT_X} y={cy} substituents={p.labels} />
                    {dual && (
                      <text x={(ARROW_FROM + 30 + ARROW_TO) / 2} y={cy - 14} textAnchor="middle" className={styles.caption}>
                        {p.role}
                      </text>
                    )}
                  </g>
                )
              })}
            </g>
          )}
        </svg>
      </div>

      <div className={styles.readout}>
        {outcome.kind === 'verdict' ? (
          <p className={styles.verdictText}>{outcome.message}</p>
        ) : (
          <>
            <ul className={styles.products}>
              {products.map((p) => (
                <li key={p.smiles}>
                  <span className={styles.role}>{p.role === 'single' ? 'Product' : p.role}</span>
                  <span className={styles.name}>{p.name}</span>
                  <span className={styles.formula}>{p.formula}</span>
                </li>
              ))}
            </ul>
            <p className={styles.note}>{outcome.note}</p>
          </>
        )}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
