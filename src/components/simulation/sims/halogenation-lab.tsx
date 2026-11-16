'use client'

import { useId, useMemo, useState, type ReactNode } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { SkeletalFormula, skeletalFrame } from '@/components/organic'
import {
  LAB_ALKANES,
  labAlkane,
  labAlkaneName,
  labCombustion,
  labHalogenation,
  oxygenPerMole,
  productsByReactivity,
  statisticalShares,
  type LabHalogen,
  type ProductShare,
} from '@/lib/chem/halogenation-lab'
import { molecularFormula } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import type { Reaction } from '@/lib/chem/hydrocarbon-reactions'
import styles from './halogenation-lab.module.css'

type Tab = 'halogenation' | 'combustion'
type Order = 'statistical' | 'reactivity'

const TAB_OPTIONS: { value: Tab; label: string }[] = [
  { value: 'halogenation', label: 'Monohalogenation' },
  { value: 'combustion', label: 'Combustion' },
]
const HALOGEN_OPTIONS: { value: LabHalogen; label: ReactNode }[] = [
  { value: 'Cl', label: <>Cl<sub>2</sub></> },
  { value: 'Br', label: <>Br<sub>2</sub></> },
]
const ORDER_OPTIONS: { value: Order; label: string }[] = [
  { value: 'statistical', label: 'Statistical only' },
  { value: 'reactivity', label: 'With 3° > 2° > 1°' },
]

const DEFAULT_ALKANE = 'propane'
const DEFAULT_N = 5
const MAX_N = 12
/** Bond lengths in the drawings, in pixels: long enough for the labels to read. */
const SOURCE_BOND_PX = 46
const PRODUCT_BOND_PX = 38

const SUBSCRIPT: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** A formula with real subscript digits, e.g. C5H12 becomes C₅H₁₂. */
function subscripted(formula: string): string {
  return formula.replace(/[0-9]/g, (d) => SUBSCRIPT[d])
}

/** Renders an mhchem string as KaTeX. The equations are always the lib's, never typed here. */
function ce(equation: string): string {
  return katex.renderToString(`\\ce{${equation}}`, { throwOnError: false })
}

/** A skeletal drawing at a fixed bond length, with its viewBox fitted to the drawing. */
function Drawing({ graph, bond, label }: { graph: MolGraph; bond: number; label: string }) {
  const b = skeletalFrame(graph, bond).bounds
  return (
    <svg viewBox={`${b.x} ${b.y} ${b.width} ${b.height}`} className={styles.drawing} role="img" aria-label={label}>
      <SkeletalFormula graph={graph} scale={bond} />
    </svg>
  )
}

/** The line under a product: its statistical share, or the qualitative place in the NCERT order. */
function shareLine(share: ProductShare, order: Order): string {
  const degree = share.product.degree
  if (order === 'statistical') return `${share.percent}% of the substitutions, counting hydrogens only`
  if (degree === '3°') return 'Most favoured: the 3° > 2° > 1° order puts it first'
  if (degree === '2°') return 'Favoured over the 1° product, behind the 3° one'
  if (degree === '1°') return 'Last in the order: a 1° hydrogen is the least reactive here'
  return 'Only one kind of C–H bond'
}

function HalogenationPanel({ alkaneId, halogen, order }: { alkaneId: string; halogen: LabHalogen; order: Order }) {
  const reaction: Reaction = useMemo(() => labHalogenation(alkaneId, halogen), [alkaneId, halogen])
  const graph = labAlkane(alkaneId)
  const name = labAlkaneName(alkaneId)
  const haloName = halogen === 'Cl' ? 'chlorine' : 'bromine'
  const shares = statisticalShares(reaction)
  const listed = order === 'reactivity' ? productsByReactivity(reaction).map((p) => shares[reaction.products.indexOf(p)]) : shares

  let readout: string
  if (reaction.products.length === 1) {
    readout = `${name} with ${haloName} gives one monohalogenated product, ${reaction.products[0].name}, because all ${shares[0].hydrogens} of its hydrogens are equivalent.`
  } else if (order === 'statistical') {
    readout = `${name} with ${haloName} gives ${reaction.products.length} monohalogenated products. Counting hydrogens alone: ${shares
      .map((s) => `${s.percent}% ${s.product.name}`)
      .join(', ')}. This is the statistical split only.`
  } else {
    readout = `${name} with ${haloName}: the order 3° > 2° > 1° favours ${listed[0].product.name} most. NCERT gives the order but no ratio, so this mode prints no percentages.`
  }

  return (
    <div className={styles.halogenation} data-testid="halogen-panel" data-alkane={alkaneId} data-halogen={halogen}>
      <div className={styles.source}>
        <Drawing graph={graph} bond={SOURCE_BOND_PX} label={`${name}, skeletal formula`} />
        <p className={styles.sourceName}>
          {name} <span className={styles.formula}>{subscripted(molecularFormula(graph))}</span>
        </p>
      </div>
      <ul className={styles.products} data-testid="halogen-products">
        {listed.map((share) => {
          const p = share.product
          const i = reaction.products.indexOf(p)
          return (
            <li key={`${p.name}-${i}`} className={styles.product} data-degree={p.degree}>
              <Drawing graph={p.graph} bond={PRODUCT_BOND_PX} label={`${p.name}, skeletal formula`} />
              <div className={styles.productText}>
                <p className={styles.productName}>{p.name}</p>
                <p className={styles.productMeta}>
                  {share.hydrogens} equivalent H on a {p.degree} carbon
                </p>
                {order === 'statistical' ? (
                  <div className={styles.bar} aria-hidden="true">
                    <span className={styles.barFill} style={{ width: `${share.percent}%` }} />
                  </div>
                ) : null}
                <p className={styles.productShare}>{shareLine(share, order)}</p>
                <p className={styles.productEq} dangerouslySetInnerHTML={{ __html: ce(reaction.equations[i]) }} />
              </div>
            </li>
          )
        })}
      </ul>
      <p className={styles.sourceEq} dangerouslySetInnerHTML={{ __html: ce(reaction.equation) }} />
      <p className={styles.conditions}>
        Conditions: {reaction.conditions}. {reaction.why}
      </p>
      <p className={styles.readout} aria-live="polite" data-testid="halogen-readout">
        {readout}
      </p>
    </div>
  )
}

function CombustionPanel({ n, setN }: { n: number; setN: (n: number) => void }) {
  const reaction = useMemo(() => labCombustion(n), [n])
  const formulaHtml = katex.renderToString(`C_{${n}}H_{${2 * n + 2}}`, { throwOnError: false })
  return (
    <div className={styles.combustion} data-testid="combustion-panel" data-n={n}>
      <div className={styles.slider}>
        <Slider label="Carbon atoms, n" value={n} min={1} max={MAX_N} step={1} onChange={setN} />
      </div>
      <p className={styles.formulaBig} dangerouslySetInnerHTML={{ __html: formulaHtml }} />
      <p className={styles.sourceEq} dangerouslySetInnerHTML={{ __html: ce(reaction.equation) }} />
      <p className={styles.readout} aria-live="polite" data-testid="combustion-readout">
        {`One mole of C${n}H${2 * n + 2} needs (3n + 1)/2 = ${oxygenPerMole(n)} mol of O₂, and gives ${n} mol of CO₂ and ${n + 1} mol of H₂O. The equation shown is the lib's whole-number form.`}
      </p>
      <p className={styles.conditions}>{reaction.why}</p>
    </div>
  )
}

/**
 * The halogenation lab. Monohalogenation: pick an alkane and Cl₂ or Br₂; every monohalogenated product
 * is listed with its equivalent hydrogens and its statistical share. The reactivity mode shows the order
 * 3° > 2° > 1° and names the favoured product, with no numbers the libs do not hold. Combustion: the
 * balanced equation for CₙH₂ₙ₊₂ + O₂ for any n. Every name, product and equation is from the lib.
 */
export function HalogenationLab(_: SimulationProps) {
  const [tab, setTab] = useState<Tab>('halogenation')
  const [alkaneId, setAlkaneId] = useState(DEFAULT_ALKANE)
  const [halogen, setHalogen] = useState<LabHalogen>('Cl')
  const [order, setOrder] = useState<Order>('statistical')
  const [n, setN] = useState(DEFAULT_N)
  const selectId = useId()

  return (
    <div className={styles.lab} data-testid="halogenation-lab">
      <div className={styles.controls}>
        <Segmented label="Tab" options={TAB_OPTIONS} value={tab} onChange={setTab} />
        {tab === 'halogenation' ? (
          <>
            <label className={styles.field} htmlFor={selectId}>
              <span>Alkane</span>
              <select id={selectId} className={styles.select} value={alkaneId} onChange={(e) => setAlkaneId(e.target.value)}>
                {LAB_ALKANES.map((a) => (
                  <option key={a.id} value={a.id}>
                    {labAlkaneName(a.id)}
                  </option>
                ))}
              </select>
            </label>
            <Segmented label="Halogen" options={HALOGEN_OPTIONS} value={halogen} onChange={setHalogen} />
            <Segmented label="Product order" options={ORDER_OPTIONS} value={order} onChange={setOrder} />
          </>
        ) : null}
      </div>
      {tab === 'halogenation' ? (
        <HalogenationPanel alkaneId={alkaneId} halogen={halogen} order={order} />
      ) : (
        <CombustionPanel n={n} setN={setN} />
      )}
    </div>
  )
}
