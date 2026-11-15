'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { SkeletalFormula, drawingFrame, subscriptDigits } from '@/components/organic'
import { freeAngle } from '@/components/organic/layout'
import { ResonanceFigure, figureSize } from '@/components/animations/unit8/effects/ResonanceFigure'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import { acidFormula, acidStrengthOrder, alphaCarbon, alphaWords } from '@/lib/chem/inductive-acids'
import { iupacName } from '@/lib/chem/iupac-organic'
import { NCERT_TABLE_8_1_COMMON_NAMES } from '@/lib/chem/ncert-unit8-tables'
import { hybridOf, rankForms, RESONANCE_SPECIES, resonanceSpecies, speciesForms, type ResonanceSpecies } from '@/lib/chem/resonance-species'
import styles from './resonance-lab.module.css'

/** The acids of the inductive tab, in the order they are listed (the lib sorts them by strength). */
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
const SCALE = 44
const GAP = 60

/** The lib's tiers as words: form 1, then forms 2 and 3 (tied). */
function tierWords(tiers: number[][]): string {
  return tiers
    .map((tier) => {
      const names = tier.map((i) => String(i + 1))
      if (names.length === 1) return `form ${names[0]}`
      return `forms ${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} (tied)`
    })
    .join(', then ')
}

/** The resonance tab: pick a species, draw its forms with the arrows that give them, then read the ranking and the hybrid. */
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

  const size = figureSize(speciesId, drawn, SCALE, GAP, complete)
  const width = Math.max(size.width + 40, 200)
  const height = size.height + 40

  const readout = !complete
    ? showArrows
      ? `The arrows give form ${drawn + 1} from form 1. Draw the new form to see it.`
      : `Form ${drawn} of ${total} is drawn. Show the arrows that give the next form.`
    : `All ${total} forms drawn. Ranked by the rules in NCERT 8.7.6: ${tierWords(ranking.tiers)}. The real ion is the hybrid.`

  return (
    <>
      <SimulationControls>
        <div role="group" aria-label="Species" className={styles.row}>
          {RESONANCE_SPECIES.map((sp) => (
            <Button key={sp.id} variant={sp.id === speciesId ? 'primary' : 'secondary'} aria-pressed={sp.id === speciesId} onClick={() => choose(sp.id)}>
              {sp.name}
            </Button>
          ))}
        </div>
        <div role="group" aria-label="Steps" className={styles.row}>
          <Button variant="secondary" onClick={() => setPending(true)} disabled={complete || pending}>
            Show the arrows
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawn((d) => Math.min(total, d + 1))
              setPending(false)
            }}
            disabled={complete || !pending}
          >
            Draw the new form
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawn(total)
              setPending(false)
            }}
            disabled={complete}
          >
            Draw all forms
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawn(1)
              setPending(false)
            }}
            disabled={drawn === 1 && !pending}
          >
            Start again
          </Button>
        </div>
      </SimulationControls>

      <p className={styles.readout} aria-live="polite" data-testid="resonance-readout">
        {readout}
      </p>

      <div className={styles.stage} data-testid="resonance-stage">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${s.name}: ${drawn} of ${total} forms`} className={styles.drawing}>
          {drawn === 1 && !showArrows ? (
            <g transform={`translate(${width / 2}, ${height / 2})`}>
              <SkeletalFormula graph={graphs[0]} scale={SCALE} showLonePairs />
            </g>
          ) : (
            <ResonanceFigure
              speciesId={speciesId}
              count={drawn}
              scale={SCALE}
              gap={GAP}
              arrows={showArrows ? s.pushes[drawn - 1] : undefined}
              showHybrid={complete}
              centreY={height / 2}
              centreX={width / 2}
            />
          )}
        </svg>
      </div>

      <p className={styles.formula} data-testid="resonance-formula">
        {`${s.name}: ${sub(molecularFormula(graphs[0]))}, the same formula in every form.`}
      </p>
      {s.positions && complete ? <p className={styles.formula}>{s.positions}</p> : null}

      {complete ? (
        <table className={styles.table} data-testid="resonance-rank">
          <caption>Ranked by the rules in NCERT 8.7.6</caption>
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

/**
 * Position of the δ+ label on the α carbon: the widest free direction around that carbon, so the
 * label sits clear of the Cl–C and C–C bonds.
 */
function alphaLabel(g: ReturnType<typeof parseSmiles>, scale: number): { x: number; y: number } {
  const frame = drawingFrame(g, scale)
  const a = alphaCarbon(g)
  const p = frame.points[a]
  const th = freeAngle(frame.points, frame.adj, a)
  return { x: p.x + Math.cos(th) * 0.5 * scale, y: p.y + Math.sin(th) * 0.5 * scale }
}

/** The inductive tab: the acids ordered by the α-carbon groups, one drawn with its δ+ on the α carbon. */
function InductiveTab() {
  const [chosen, setChosen] = useState<(typeof ACIDS)[number]['id']>('trichloro')
  const graphs = useMemo(() => ACIDS.map((a) => parseSmiles(a.smiles)), [])
  const order = useMemo(() => acidStrengthOrder(graphs), [graphs])
  const index = ACIDS.findIndex((a) => a.id === chosen)
  const g = graphs[index]
  const nameOf = (graph: ReturnType<typeof parseSmiles>) => {
    const common = NCERT_TABLE_8_1_COMMON_NAMES.rows.find((r) => r.compound === 'CH3COOH')
    const name = iupacName(graph)
    return common && name === 'ethanoic acid' ? `${name} (${common.commonName.toLowerCase()})` : name
  }
  const frame = drawingFrame(g, SCALE)
  const lab = alphaLabel(g, SCALE)
  const vb = frame.bounds
  const pad = 30
  const bx = Math.min(vb.x, lab.x - 22) - pad
  const by = Math.min(vb.y, lab.y - 22) - pad
  const bw = Math.max(vb.x + vb.width, lab.x + 22) + pad - bx
  const bh = Math.max(vb.y + vb.height, lab.y + 22) + pad - by

  return (
    <>
      <SimulationControls>
        <div role="group" aria-label="Acid" className={styles.row}>
          {ACIDS.map((a, i) => (
            <Button key={a.id} variant={a.id === chosen ? 'primary' : 'secondary'} aria-pressed={a.id === chosen} onClick={() => setChosen(a.id)}>
              {sub(acidFormula(graphs[i]))}
            </Button>
          ))}
        </div>
      </SimulationControls>

      <p className={styles.readout} aria-live="polite" data-testid="inductive-readout">
        {`${nameOf(g)}: ${alphaWords(g)}.`}
      </p>

      <div className={styles.stage}>
        <svg viewBox={`${bx} ${by} ${bw} ${bh}`} role="img" aria-label={`${sub(acidFormula(g))} with δ+ on the α carbon`} className={styles.drawing}>
          <SkeletalFormula
            graph={g}
            scale={SCALE}
            overlay={
              <text x={lab.x} y={lab.y} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--delta-plus)">
                δ+
              </text>
            }
          />
        </svg>
      </div>

      <ol className={styles.ladder} data-testid="inductive-ladder" aria-label="Acids from the strongest to the weakest">
        {order.map((i) => (
          <li key={ACIDS[i].id} data-current={ACIDS[i].id === chosen ? 'true' : 'false'}>
            {nameOf(graphs[i])}
            <span className={styles.note}>{` (${alphaWords(graphs[i])})`}</span>
          </li>
        ))}
      </ol>
      <p className={styles.formula}>The order is qualitative: more −I groups on the α carbon give a stronger acid. No numbers are implied.</p>
    </>
  )
}

/**
 * Resonance and inductive lab (Section 8.7.4 to 8.7.7). The resonance tab draws each form of a
 * species with the arrows that give it, then ranks the forms and shows the hybrid. The inductive
 * tab orders acids by the −I and +I groups on the α carbon.
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
