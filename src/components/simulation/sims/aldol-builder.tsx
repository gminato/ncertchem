'use client'

import { useMemo, useState } from 'react'
import { Segmented } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula } from '@/components/organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { unit8Name } from '@/lib/chem/ncert-c12-unit8-data'
import {
  FIRST_PARTNERS,
  SECOND_PARTNERS,
  aldolGrid,
  canAldol,
  gridCells,
  partner,
  type PartnerId,
} from '@/lib/chem/aldol-model'
import styles from './aldol-builder.module.css'

const LABEL: Readonly<Record<PartnerId, string>> = {
  ethanal: 'Ethanal',
  propanal: 'Propanal',
  methylpropanal: '2-Methylpropanal',
  acetone: 'Acetone',
  benzaldehyde: 'Benzaldehyde',
}

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d])

/** One drawing scale and one card size for every molecule, so labels stay at 14 px or more. */
const SCALE = 44
const CARD_W = 300
const CARD_H = 240

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many)
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

function Molecule({ smiles, alphaAtoms, caption, name }: { smiles: string; alphaAtoms?: readonly number[]; caption: string; name: string }) {
  const graph = useMemo(() => parseSmiles(smiles), [smiles])
  const formula = molecularFormula(graph)
  return (
    <figure className={styles.card}>
      <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} role="img" aria-label={`${name}, ${formula}. ${caption}`} className={styles.drawing}>
        <SkeletalFormula graph={graph} scale={SCALE} x={CARD_W / 2} y={CARD_H / 2} highlightAtoms={alphaAtoms ?? []} />
      </svg>
      <figcaption className={styles.caption}>
        <span className={styles.name}>{name}</span>
        <span className={styles.formula}>{subscript(formula)}</span>
        <span className={styles.note}>{caption}</span>
      </figcaption>
    </figure>
  )
}

export function AldolBuilder() {
  const [first, setFirst] = useState<PartnerId>('propanal')
  const [second, setSecond] = useState<PartnerId | null>(null)

  const validSecond = SECOND_PARTNERS[first] ?? []
  // A second partner that the new first partner does not support is dropped, not shown.
  const activeSecond = second && validSecond.includes(second) ? second : null
  const grid = useMemo(() => aldolGrid(first, activeSecond), [first, activeSecond])
  const cells = useMemo(() => gridCells(grid), [grid])
  const condensing = cells.filter((c) => c.cell.condensed)

  const firstName = unit8Name(partner(first).smiles)
  const secondName = activeSecond ? unit8Name(partner(activeSecond).smiles) : ''
  const firstH = partner(first).alphaHydrogens
  const aldolWord = plural(cells.length, 'product forms', 'products form')
  const summary = activeSecond
    ? grid.inert.length
      ? `${cap(secondName)} has no α-hydrogen, so it cannot form a carbanion. ${cells.length} aldol ${aldolWord}, and ${condensing.length} ${plural(condensing.length, 'loses', 'lose')} water on heating.`
      : `${cells.length} aldol products form, and ${condensing.length} ${plural(condensing.length, 'loses', 'lose')} water on heating.`
    : condensing.length
      ? `${cap(firstName)} has ${firstH} ${plural(firstH, 'α-hydrogen', 'α-hydrogens')} and forms an aldol. On heating it loses water.`
      : `${cap(firstName)} has ${firstH} ${plural(firstH, 'α-hydrogen', 'α-hydrogens')} and forms an aldol, which cannot lose water on heating.`

  return (
    <div className={styles.root} data-testid="aldol-builder">
      <SimulationControls>
        <Segmented
          label="First carbonyl compound"
          value={first}
          onChange={(v) => {
            setFirst(v)
            setSecond(null)
          }}
          options={FIRST_PARTNERS.map((id) => ({ value: id, label: LABEL[id] }))}
        />
        <Segmented
          label="Second carbonyl compound"
          value={activeSecond ?? 'none'}
          onChange={(v) => setSecond(v === 'none' ? null : (v as PartnerId))}
          options={[{ value: 'none', label: 'None' }, ...validSecond.map((id) => ({ value: id, label: LABEL[id] }))]}
        />
      </SimulationControls>

      <p className={styles.summary} aria-live="polite">
        {summary}
      </p>

      <h3 className={styles.heading}>Carbonyl compounds on the bench</h3>
      <div className={styles.grid}>
        <Molecule
          smiles={partner(first).smiles}
          alphaAtoms={partner(first).alphaAtoms}
          name={firstName}
          caption={`α-hydrogens: ${partner(first).alphaHydrogens}`}
        />
        {activeSecond ? (
          <Molecule
            smiles={partner(activeSecond).smiles}
            alphaAtoms={partner(activeSecond).alphaAtoms}
            name={secondName}
            caption={canAldol(activeSecond) ? `α-hydrogens: ${partner(activeSecond).alphaHydrogens}` : 'no α-hydrogen'}
          />
        ) : null}
      </div>

      <h3 className={styles.heading}>Aldol products</h3>
      <div className={styles.grid}>
        {cells.map(({ donor, acceptor, cell }) => (
          <Molecule
            key={`${donor}>${acceptor}`}
            smiles={cell.aldol}
            name={unit8Name(cell.aldol)}
            caption={donor === acceptor ? 'Self-aldol' : `${unit8Name(partner(donor).smiles)} adds to ${unit8Name(partner(acceptor).smiles)}`}
          />
        ))}
      </div>
      {grid.inert.length ? (
        <p className={styles.note}>
          {secondName} has no α-hydrogen, so it never gives a carbanion. It only takes part as the compound that is attacked.
        </p>
      ) : null}

      <h3 className={styles.heading}>After heating: loss of water</h3>
      {condensing.length ? (
        <div className={styles.grid}>
          {condensing.map(({ donor, acceptor, cell }) => (
            <Molecule
              key={`c-${donor}>${acceptor}`}
              smiles={cell.condensed as string}
              name={unit8Name(cell.condensed as string)}
              caption="α,β-unsaturated carbonyl"
            />
          ))}
        </div>
      ) : (
        <p className={styles.note}>No aldol here has a hydrogen left on its new α-carbon, so heating gives no unsaturated product.</p>
      )}
    </div>
  )
}
