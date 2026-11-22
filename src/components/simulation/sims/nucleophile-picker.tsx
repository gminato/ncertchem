'use client'

import { useId, useState, type ReactNode } from 'react'
import { Segmented } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { SkeletalFormula, skeletalFrame } from '@/components/organic'
import { ROLE_TONE } from '@/components/vocab/organic6'
import { classifyHalide, formulaUnicode } from '@/lib/chem/haloalkanes'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import { NCERT_TABLE_6_4 } from '@/lib/chem/ncert-c12-unit6-data'
import {
  PICKER_REAGENTS,
  PICKER_SUBSTRATES,
  findPickerReagent,
  findPickerSubstrate,
  pickerProduct,
  type PickerProduct,
} from '@/lib/chem/nucleophile-picker'
import styles from './nucleophile-picker.module.css'

/** Scale 46 puts the skeletal atom labels at 17 px in the drawing's own units; the molecules fill the panel. */
const SCALE = 46
const VIEW_W = 560
const VIEW_H = 330
const SUB_X = 118
const PROD_X = 432
const MOL_Y = 136
const RING_R = 0.42 * SCALE
const ARROW_X0 = 226
const ARROW_X1 = 312
const ARROW_MID = (ARROW_X0 + ARROW_X1) / 2

const SUBSTRATE_OPTIONS = PICKER_SUBSTRATES.map((s) => ({ value: s.id, label: s.id }))
const REAGENT_OPTIONS = PICKER_REAGENTS.map((r) => ({ id: r.id, label: reagentLabel(r.id) }))

function reagentLabel(id: string): string {
  const r = findPickerReagent(id)
  const row = NCERT_TABLE_6_4[r.row]
  return r.rPrime ? `${row.reagent} (${r.rPrime})` : row.reagent
}

function substrateClass(id: string): string {
  const s = findPickerSubstrate(id)
  const g = parseSmiles(s.smiles)
  const degree = classifyHalide(g, g.atoms.length - 1).degree
  if (degree === '1°') return 'primary (1°) haloalkane'
  if (degree === '2°') return 'secondary (2°) haloalkane'
  return 'haloalkane'
}

/** The product's name when the namer gives one, otherwise its formula (never an invented name). */
function productCaption(p: PickerProduct): string {
  return p.name ?? formulaUnicode(p.formula)
}

function ringAt(points: readonly { x: number; y: number }[], index: number, tone: string, key: string): ReactNode {
  const p = points[index]
  return <circle key={key} cx={p.x} cy={p.y} r={RING_R} fill="none" stroke={tone} strokeWidth={3} />
}

export function NucleophilePicker(_: SimulationProps) {
  const [substrateId, setSubstrateId] = useState(PICKER_SUBSTRATES[0].id)
  const [reagentId, setReagentId] = useState(PICKER_REAGENTS[0].id)
  const selectId = useId()

  const substrate = findPickerSubstrate(substrateId)
  const reagent = findPickerReagent(reagentId)
  const reagentRow = NCERT_TABLE_6_4[reagent.row]
  const product = pickerProduct(substrateId, reagentId)
  const subGraph = parseSmiles(substrate.smiles)
  const subHalogen = subGraph.atoms.length - 1
  const subFrame = skeletalFrame(subGraph, SCALE)
  const prodFrame = skeletalFrame(product.graph, SCALE)
  const prodBond = product.graph.bonds.findIndex(
    (b) =>
      (b.a === product.carbonIndex && b.b === product.attackIndex) ||
      (b.b === product.carbonIndex && b.a === product.attackIndex)
  )
  const subBond = subGraph.bonds.findIndex((b) => b.a === subHalogen || b.b === subHalogen)

  const attackText =
    reagent.attackAtom === null
      ? 'H⁻ replaces Br'
      : `through ${reagent.attackAtom}`
  const readoutAttack =
    reagent.attackAtom === null ? 'replaces Br with H⁻' : `attacks through ${reagent.attackAtom}`
  const partner = reagent.partner ? findPickerReagent(reagent.partner) : null
  const partnerProduct = partner ? pickerProduct(substrateId, partner.id) : null

  return (
    <div className={styles.picker} data-testid="nucleophile-picker">
      <div className={styles.controls}>
        <Segmented label="Haloalkane" options={SUBSTRATE_OPTIONS} value={substrateId} onChange={setSubstrateId} />
        <label className={styles.field} htmlFor={selectId}>
          <span>Reagent (Table 6.4)</span>
          <select id={selectId} className={styles.select} value={reagentId} onChange={(e) => setReagentId(e.target.value)}>
            {REAGENT_OPTIONS.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <svg
        className={styles.svg}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        role="img"
        aria-label={`${substrate.id} reacting with ${reagentRow.reagent}`}
      >
        <g className={styles.molecule}>
          <SkeletalFormula
            graph={subGraph}
            scale={SCALE}
            x={SUB_X}
            y={MOL_Y}
            highlightBonds={subBond >= 0 ? [subBond] : []}
            overlay={
              <>
                {ringAt(subFrame.points, product.carbonIndex, ROLE_TONE.electrophilicCarbon, 'c')}
                {ringAt(subFrame.points, subHalogen, ROLE_TONE.leavingGroup, 'x')}
              </>
            }
          />
          <text className={styles.caption} x={SUB_X} y={MOL_Y + 116} textAnchor="middle">
            {substrate.id}
          </text>
          <text className={styles.subcaption} x={SUB_X} y={MOL_Y + 140} textAnchor="middle">
            {substrateClass(substrateId)}
          </text>
        </g>

        <g className={styles.arrow}>
          <line x1={ARROW_X0} y1={MOL_Y} x2={ARROW_X1} y2={MOL_Y} stroke="var(--bond)" strokeWidth={3} />
          <path d={`M ${ARROW_X1 - 12} ${MOL_Y - 8} L ${ARROW_X1} ${MOL_Y} L ${ARROW_X1 - 12} ${MOL_Y + 8}`} fill="none" stroke="var(--bond)" strokeWidth={3} />
          <text className={styles.reagent} x={ARROW_MID} y={MOL_Y - 20} textAnchor="middle">
            {reagentRow.reagent}
          </text>
          <text className={styles.subcaption} x={ARROW_MID} y={MOL_Y + 26} textAnchor="middle">
            {attackText}
          </text>
        </g>

        <g className={styles.molecule}>
          <SkeletalFormula
            graph={product.graph}
            scale={SCALE}
            x={PROD_X}
            y={MOL_Y}
            highlightBonds={prodBond >= 0 ? [prodBond] : []}
            overlay={
              product.attackIndex === null ? null : ringAt(prodFrame.points, product.attackIndex, ROLE_TONE.nucleophile, 'n')
            }
          />
          <text className={styles.caption} x={PROD_X} y={MOL_Y + 116} textAnchor="middle">
            {productCaption(product)}
          </text>
          <text className={styles.subcaption} x={PROD_X} y={MOL_Y + 140} textAnchor="middle">
            {product.productClass}
          </text>
        </g>
      </svg>

      <ul className={styles.legend} aria-label="Colour key">
        <li>
          <span className={styles.dot} style={{ background: ROLE_TONE.electrophilicCarbon }} /> carbon bearing the halogen
        </li>
        <li>
          <span className={styles.dot} style={{ background: ROLE_TONE.leavingGroup }} /> leaving halogen
        </li>
        <li>
          <span className={styles.dot} style={{ background: ROLE_TONE.nucleophile }} /> attacking atom
        </li>
      </ul>

      <div className={styles.readout} aria-live="polite" data-testid="picker-readout">
        <p>
          {substrate.id} with {reagentLabel(reagent.id)} {readoutAttack}. Product: {productCaption(product)}
          {product.name === null ? ' (no IUPAC rule is applied to this group)' : ''}.
          Class: {product.productClass.toLowerCase()}.
        </p>
        {partner && partnerProduct ? (
          <p>
            Its partner {reagentLabel(partner.id)} attacks through {partner.attackAtom} instead and gives{' '}
            {productCaption(partnerProduct)}.{partnerProduct.name === null ? ' (no IUPAC rule is applied to this group)' : ''}
          </p>
        ) : null}
      </div>

      <p className={styles.note}>
        Only the substitution product is drawn. A base can also remove HX from the same haloalkane to form an alkene, which
        is covered later in this unit.
      </p>
    </div>
  )
}
