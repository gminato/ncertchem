'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { SkeletalFormula, ResonanceSet, resonanceBounds, subscriptDigits, type ResonanceContributor, type ResonanceHybrid } from '@/components/organic'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { molecularFormula, parseSmiles, toCondensed } from '@/lib/chem/molecule-parse'
import { iupacName } from '@/lib/chem/iupac-organic'
import { acidStrengthOrder, alphaCarbon, alphaInductive } from '@/lib/chem/inductive-acids'
import { NCERT_TABLE_8_1_COMMON_NAMES } from '@/lib/chem/ncert-unit8-tables'
import { hybridOf, rankForms, RESONANCE_SPECIES, resonanceSpecies, speciesForms, type ResonanceSpecies } from '@/lib/chem/resonance-species'
import styles from './resonance-lab.module.css'

/** Acids of the inductive tab, from the strongest to the weakest qualitative order is decided by the lib. */
const ACIDS = [
  { id: 'acetic', smiles: 'CC(=O)O' },
  { id: 'chloro', smiles: 'ClCC(=O)O' },
  { id: 'dichloro', smiles: 'ClC(Cl)C(=O)O' },
  { id: 'trichloro', smiles: 'ClC(Cl)(Cl)C(=O)O' },
  { id: 'propanoic', smiles: 'CCC(=O)O' },
] as const

const TAB_OPTIONS = [
  { value: 'resonance', label: 'Resonance' },
  { value: 'inductive', label: 'Inductive effect' },
] as const
type Tab = (typeof TAB_OPTIONS)[number]['value']

const sub = (text: string) => text.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

/** Descriptive note for the -I or +I balance of an acid, from the lib's counts. */
function inductiveNote(withdrawing: number, donating: number): string {
  if (withdrawing > 0) return `${withdrawing} halogen${withdrawing > 1 ? 's' : ''} on the α carbon: −I pulls electrons towards the COOH group.`
  if (donating > 0) return `${donating} alkyl group${donating > 1 ? 's' : ''} on the α carbon: +I pushes electrons towards the COOH group.`
  return 'No halogen or alkyl group on the α carbon: the reference acid.'
}

/** The resonance tab: pick a species, draw its forms one by one, then read the ranking and the hybrid. */
function ResonanceTab() {
  const [speciesId, setSpeciesId] = useState<ResonanceSpecies['id']>(RESONANCE_SPECIES[0].id)
  const [drawn, setDrawn] = useState(1)
  const [pending, setPending] = useState(false)
  const s = resonanceSpecies(speciesId)
  const graphs = useMemo(() => speciesForms(s), [s])
  const total = graphs.length
  const ranking = useMemo(() => rankForms(graphs), [graphs])
  const hybrid = useMemo(() => hybridOf(s), [s])
  const complete = drawn === total
  const showArrows = pending && drawn < total

  const choose = (id: ResonanceSpecies['id']) => {
    setSpeciesId(id)
    setDrawn(1)
    setPending(false)
  }

  const shown = graphs.slice(0, drawn)
  const contributors: ResonanceContributor[] = shown.map((graph, i) => ({
    graph,
    arrows: i === 0 && showArrows ? s.pushes[drawn - 1] : undefined,
  }))
  const hybridSpec: ResonanceHybrid = {
    graph: hybrid.graph,
    partialBonds: hybrid.partialBonds,
    innerCircles: s.innerCircles,
    partialCharges: hybrid.charges.map((c) => ({ atom: c.atom, label: c.label })),
  }

  const tierText = ranking.tiers
    .map((tier) => (tier.length === 1 ? `form ${tier[0] + 1}` : `forms ${tier.map((i) => i + 1).join(' and ')}`))
    .join(', then ')
  const readout = !complete
    ? pending
      ? `Arrows from form 1 push electrons to give form ${drawn + 1}. Draw it to see the result.`
      : `Form ${drawn} of ${total} is drawn. Show the arrows that give the next form.`
    : `All ${total} forms drawn. The lib ranks them ${tierText}${ranking.tiers.length === 1 ? ': all equal in energy' : ''}. The real ion is the hybrid below.`

  return (
    <>
      <SimulationControls>
        <div role="group" aria-label="Species" className={styles.row}>
          {RESONANCE_SPECIES.map((sp) => (
            <Button
              key={sp.id}
              variant={sp.id === speciesId ? 'primary' : 'secondary'}
              aria-pressed={sp.id === speciesId}
              onClick={() => choose(sp.id)}
            >
              {sp.name}
            </Button>
          ))}
        </div>
        <div role="group" aria-label="Steps" className={styles.row}>
          <Button variant="secondary" onClick={() => setPending(true)} disabled={complete || pending}>
            Show the arrows
          </Button>
          <Button variant="secondary" onClick={() => { setDrawn((d) => Math.min(total, d + 1)); setPending(false) }} disabled={complete || !pending}>
            Draw the new form
          </Button>
          <Button variant="secondary" onClick={() => { setDrawn(total); setPending(false) }} disabled={complete}>
            Draw all forms
          </Button>
          <Button variant="secondary" onClick={() => { setDrawn(1); setPending(false) }} disabled={drawn === 1 && !pending}>
            Start again
          </Button>
        </div>
      </SimulationControls>

      <p className={styles.readout} aria-live="polite" data-testid="resonance-readout">
        {readout}
      </p>

      <div className={styles.stage} data-testid="resonance-stage">
        {drawn === 1 && !showArrows ? (
          <svg viewBox={viewBoxFor(graphs[0], 64)} role="img" aria-label={`${s.name}, form 1`} className={styles.drawing}>
            <SkeletalFormula graph={graphs[0]} scale={64} showLonePairs />
          </svg>
        ) : (
          <svg viewBox={viewBoxForRow(contributors, hybridSpec, complete)} role="img" aria-label={`${s.name}: ${drawn} forms${showArrows ? ' with arrows' : ''}`} className={styles.drawing}>
            <ResonanceSet contributors={contributors} hybrid={complete ? hybridSpec : undefined} scale={56} arrowGap={70} />
          </svg>
        )}
      </div>

      <p className={styles.formula} data-testid="resonance-formula">
        {`${s.name}: ${sub(molecularFormula(graphs[0]))}, the same formula in every form.`}
      </p>

      {complete ? (
        <table className={styles.table} data-testid="resonance-rank">
          <caption>Ranking by NCERT 8.7.6 (from the lib)</caption>
          <thead>
            <tr>
              <th scope="col">Form</th>
              <th scope="col">Covalent bonds</th>
              <th scope="col">Charge separation</th>
              <th scope="col">Negative charge on C</th>
            </tr>
          </thead>
          <tbody>
            {ranking.order.map((i) => {
              const sc = ranking.scores[i]
              return (
                <tr key={i}>
                  <td>{`Form ${i + 1}`}</td>
                  <td>{sc.covalentBonds}</td>
                  <td>{sc.chargeSeparation}</td>
                  <td>{sc.carbanionCharges}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : null}
    </>
  )
}

function viewBoxFor(g: ReturnType<typeof parseSmiles>, scale: number): string {
  const b = resonanceBounds([{ graph: g }], undefined, scale, 0)
  return `${b.x - 16} ${b.y - 16} ${b.width + 32} ${b.height + 32}`
}

function viewBoxForRow(contributors: ResonanceContributor[], hybrid: ResonanceHybrid, withHybrid: boolean): string {
  const b = resonanceBounds(contributors, withHybrid ? hybrid : undefined, 56, 70)
  return `${b.x - 16} ${b.y - 16} ${b.width + 32} ${b.height + 32}`
}

/** The inductive tab: the acids ordered by the lib, the α-carbon counts shown for one chosen acid. */
function InductiveTab() {
  const [chosen, setChosen] = useState<(typeof ACIDS)[number]['id']>('chloro')
  const graphs = useMemo(() => ACIDS.map((a) => parseSmiles(a.smiles)), [])
  const order = useMemo(() => acidStrengthOrder(graphs), [graphs])
  const index = ACIDS.findIndex((a) => a.id === chosen)
  const g = graphs[index]
  const counts = alphaInductive(g)
  const nameOf = (graph: ReturnType<typeof parseSmiles>) => {
    const common = NCERT_TABLE_8_1_COMMON_NAMES.rows.find((r) => r.compound === 'CH3COOH')
    const name = iupacName(graph)
    return common && name === 'ethanoic acid' ? `${name} (${common.commonName.toLowerCase()})` : name
  }

  return (
    <>
      <SimulationControls>
        <div role="group" aria-label="Acid" className={styles.row}>
          {ACIDS.map((a) => (
            <Button key={a.id} variant={a.id === chosen ? 'primary' : 'secondary'} aria-pressed={a.id === chosen} onClick={() => setChosen(a.id)}>
              {sub(toCondensed(parseSmiles(a.smiles)))}
            </Button>
          ))}
        </div>
      </SimulationControls>

      <p className={styles.readout} aria-live="polite" data-testid="inductive-readout">
        {`${nameOf(g)}: ${inductiveNote(counts.withdrawing, counts.donating)}`}
      </p>

      <div className={styles.stage}>
        <svg viewBox={viewBoxFor(g, 44)} role="img" aria-label={`${sub(toCondensed(g))} with the α carbon marked δ+`} className={styles.drawing}>
          <SkeletalFormula graph={g} scale={44} partialCharges={[{ atom: alphaCarbon(g), label: 'δ+' }]} />
        </svg>
      </div>

      <ol className={styles.ladder} data-testid="inductive-ladder" aria-label="Acids from the strongest to the weakest, qualitative">
        {order.map((i) => (
          <li key={ACIDS[i].id} data-current={ACIDS[i].id === chosen ? 'true' : 'false'}>
            {nameOf(graphs[i])}
            <span className={styles.note}>{` balance ${alphaInductive(graphs[i]).balance > 0 ? '+' : ''}${alphaInductive(graphs[i]).balance}`}</span>
          </li>
        ))}
      </ol>
      <p className={styles.formula}>Order is qualitative: more −I groups on the α carbon give a stronger acid; no numbers are implied.</p>
    </>
  )
}

/**
 * Resonance and inductive lab (Section 8.7.4 to 8.7.7). The resonance tab draws each form of a
 * species one at a time, with the arrows that give it, then ranks the forms and shows the hybrid.
 * The inductive tab orders acids by the -I and +I groups on the α carbon.
 */
export function ResonanceLab(_props: SimulationProps) {
  const [tab, setTab] = useState<Tab>('resonance')
  return (
    <div className={styles.sim} data-testid="resonance-lab">
      <Segmented label="Lab tab" options={TAB_OPTIONS} value={tab} onChange={setTab} />
      {tab === 'resonance' ? <ResonanceTab /> : <InductiveTab />}
    </div>
  )
}
