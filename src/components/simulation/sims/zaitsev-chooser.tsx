'use client'

import { useState } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { SkeletalFormula, skeletalFrame } from '@/components/organic'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import {
  CHOOSER_SUBSTRATES,
  chooserSummary,
  chooserView,
  type ChooserProduct,
  type ChooserSubstrate,
} from '@/lib/chem/zaitsev-chooser'
import styles from './zaitsev-chooser.module.css'

const SUBSTRATE_OPTIONS = CHOOSER_SUBSTRATES.map((smiles) => ({
  value: smiles as ChooserSubstrate,
  label: iupacNameFromSmiles(smiles),
}))

const VB_W = 560
const VB_H = 580
const SUB_CX = 280
const SUB_CY = 128
const SUB_SCALE = 50
const CARD_Y = 296
const CARD_H = 270
const CARD_W = 250
const PRODUCT_SCALE = 44

interface Point {
  x: number
  y: number
}

/** Label position just outside an atom, pushed away from the centre of the drawing. */
function outside(points: readonly Point[], index: number, reach: number): Point {
  const centre = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 },
  )
  const p = points[index]
  const dx = p.x - centre.x
  const dy = p.y - centre.y
  const length = Math.hypot(dx, dy)
  const ux = length < 1e-6 ? 0 : dx / length
  const uy = length < 1e-6 ? -1 : dy / length
  return { x: p.x + ux * reach, y: p.y + uy * reach + 5 }
}

/** Label position just outside an atom, pushed directly away from one of its neighbours. */
function awayFrom(points: readonly Point[], index: number, neighbour: number, reach: number): Point {
  const p = points[index]
  const q = points[neighbour]
  const dx = p.x - q.x
  const dy = p.y - q.y
  const length = Math.hypot(dx, dy) || 1
  return { x: p.x + (dx / length) * reach, y: p.y + (dy / length) * reach + 5 }
}

function cardX(count: number, i: number): number {
  if (count === 1) return (VB_W - CARD_W) / 2
  return i === 0 ? 20 : VB_W - CARD_W - 20
}

function alkylWord(n: number): string {
  return `${n} alkyl group${n === 1 ? '' : 's'} on the C=C`
}

function ProductCard({ product, x, flag, count }: { product: ChooserProduct; x: number; flag: boolean; count: number }) {
  const y = CARD_Y
  const isZaitsev = product.zaitsev
  const tag = count === 1 ? 'Only product' : isZaitsev ? 'Zaitsev product' : 'Less substituted'
  const showTag = count === 1 || flag
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={CARD_W}
        height={CARD_H}
        rx={14}
        className={flag && isZaitsev ? styles.cardZaitsev : styles.card}
      />
      {showTag ? (
        <text x={x + 16} y={y + 30} className={isZaitsev || count === 1 ? styles.tagAccent : styles.tag}>
          {tag}
        </text>
      ) : null}
      <SkeletalFormula graph={product.graph} scale={PRODUCT_SCALE} x={x + CARD_W / 2} y={y + 92} />
      <text x={x + CARD_W / 2} y={y + 160} textAnchor="middle" className={styles.productName}>
        {product.name}
      </text>
      <text x={x + CARD_W / 2} y={y + 184} textAnchor="middle" className={styles.productFormula}>
        {product.formula}
      </text>
      <text x={x + CARD_W / 2} y={y + 204} textAnchor="middle" className={styles.productFormula}>
        {alkylWord(product.alkylGroups)}
      </text>
      {product.percent !== null ? (
        <g>
          <rect x={x + 20} y={y + 218} width={CARD_W - 40} height={12} rx={6} className={styles.barTrack} />
          <rect
            x={x + 20}
            y={y + 218}
            width={((CARD_W - 40) * product.percent) / 100}
            height={12}
            rx={6}
            className={styles.barFill}
          />
          <text x={x + CARD_W / 2} y={y + 248} textAnchor="middle" className={styles.productFormula}>
            {`${product.percent} % of the mix (NCERT)`}
          </text>
        </g>
      ) : null}
    </g>
  )
}

export function ZaitsevChooser() {
  const [substrate, setSubstrate] = useState<ChooserSubstrate>(CHOOSER_SUBSTRATES[0])
  const [flag, setFlag] = useState(true)

  const view = chooserView(substrate)
  const frame = skeletalFrame(view.graph, SUB_SCALE)
  const count = view.products.length
  const betaSet = view.betaCarbons.map((beta) => beta.index)

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented label="Haloalkane" options={SUBSTRATE_OPTIONS} value={substrate} onChange={setSubstrate} />
        <Toggle label="Flag the Zaitsev product" checked={flag} onChange={setFlag} />
      </div>

      <div className={styles.stage}>
        <svg
          className={styles.scene}
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          role="img"
          aria-label={`${view.name} with its β-carbons shaded, and the alkenes that elimination can give`}
        >
          <SkeletalFormula
            graph={view.graph}
            scale={SUB_SCALE}
            x={SUB_CX}
            y={SUB_CY}
            highlightAtoms={betaSet}
          />
          {view.betaCarbons.map((beta) => {
            const p = outside(frame.points, beta.index, 44)
            return (
              <text key={beta.index} x={SUB_CX + p.x} y={SUB_CY + p.y} textAnchor="middle" className={styles.betaLabel}>
                {`β · ${beta.hydrogens} H`}
              </text>
            )
          })}
          <text
            x={SUB_CX + awayFrom(frame.points, view.alphaIndex, view.halogenIndex, 30).x}
            y={SUB_CY + awayFrom(frame.points, view.alphaIndex, view.halogenIndex, 30).y}
            textAnchor="middle"
            className={styles.alphaLabel}
          >
            α
          </text>
          <text x={SUB_CX} y={34} textAnchor="middle" className={styles.substrateName}>
            {`${view.name}, ${view.formula}`}
          </text>

          <line x1={200} y1={262} x2={346} y2={262} className={styles.arrow} />
          <polygon points="346,256 358,262 346,268" className={styles.arrowHead} />
          <text x={SUB_CX} y={246} textAnchor="middle" className={styles.reagent}>
            alcoholic KOH, Δ
          </text>
          <text x={SUB_CX} y={286} textAnchor="middle" className={styles.reagent}>
            {count === 0 ? '' : 'KBr + H₂O'}
          </text>

          {view.products.map((product, i) => (
            <ProductCard
              key={product.smiles}
              product={product}
              x={cardX(count, i)}
              flag={flag}
              count={count}
            />
          ))}
        </svg>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {chooserSummary(view, flag)}
      </p>
    </div>
  )
}
