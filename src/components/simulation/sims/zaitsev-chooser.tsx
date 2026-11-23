'use client'

import { useState } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { SkeletalFormula, skeletalFrame, type Frame } from '@/components/organic'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { formulaUnicode } from '@/lib/chem/haloalkanes'
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
const SUB_CY = 130
/** Every substrate is scaled to fit this box, so all of them read at a similar size. */
const SUB_BOX_W = 300
const SUB_BOX_H = 142
const SUB_MAX_SCALE = 64
const CARD_Y = 296
const CARD_H = 270
const CARD_W = 250
const PRODUCT_SCALE = 44

interface Point {
  x: number
  y: number
}

/**
 * Label position just outside an atom, in the free direction: the bisector of the
 * largest angular gap between the atom's bonds, so no bond runs through the label.
 */
function freeSpot(frame: Frame, index: number, reach: number): Point {
  const p = frame.points[index]
  const angles = frame.adj[index]
    .map((j) => Math.atan2(frame.points[j].y - p.y, frame.points[j].x - p.x))
    .sort((a, b) => a - b)
  if (angles.length === 0) return { x: p.x, y: p.y - reach }
  let best = -1
  let mid = 0
  angles.forEach((a, i) => {
    const next = i + 1 < angles.length ? angles[i + 1] : angles[0] + 2 * Math.PI
    if (next - a > best) {
      best = next - a
      mid = a + best / 2
    }
  })
  return { x: p.x + Math.cos(mid) * reach, y: p.y + Math.sin(mid) * reach + 5 }
}

/** The largest scale at which a substrate still fits the shared box. */
function fitScale(graph: MolGraph): number {
  const unit = skeletalFrame(graph, 1).bounds
  return Math.min(SUB_MAX_SCALE, SUB_BOX_W / unit.width, SUB_BOX_H / unit.height)
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
        {formulaUnicode(product.formula)}
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
  const scale = fitScale(view.graph)
  const frame = skeletalFrame(view.graph, scale)
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
            scale={scale}
            x={SUB_CX}
            y={SUB_CY}
            highlightAtoms={betaSet}
          />
          {view.betaCarbons.map((beta) => {
            const p = freeSpot(frame, beta.index, 38)
            return (
              <text key={beta.index} x={SUB_CX + p.x} y={SUB_CY + p.y} textAnchor="middle" className={styles.betaLabel}>
                {`β · ${beta.hydrogens} H`}
              </text>
            )
          })}
          <text
            x={SUB_CX + freeSpot(frame, view.alphaIndex, 26).x}
            y={SUB_CY + freeSpot(frame, view.alphaIndex, 26).y}
            textAnchor="middle"
            className={styles.alphaLabel}
          >
            α
          </text>
          <text x={SUB_CX} y={20} textAnchor="middle" className={styles.substrateName}>
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
