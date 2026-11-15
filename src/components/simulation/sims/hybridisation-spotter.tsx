'use client'

import { useMemo, useState } from 'react'
import { Button, Segmented } from '@/components/controls'
import { SkeletalFormula, skeletalBounds, skeletalFrame } from '@/components/organic'
import { Label, VocabDefs } from '@/components/vocab'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  SPOTTER_PRESETS,
  carbonCarbonBondsAt,
  carbonHybrid,
  carbonIndices,
  idealBondAngle,
  sCharacterPercent,
  type CarbonHybrid,
} from '@/lib/chem/carbon-shapes'
import { iupacName } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import styles from './hybridisation-spotter.module.css'

const GUESSES: { value: CarbonHybrid; label: string }[] = [
  { value: 'sp3', label: 'sp³' },
  { value: 'sp2', label: 'sp²' },
  { value: 'sp', label: 'sp' },
]

const HYBRID_SPOT: Record<CarbonHybrid, string> = { sp3: 'var(--spot-1)', sp2: 'var(--spot-2)', sp: 'var(--spot-3)' }
const HYBRID_TEXT: Record<CarbonHybrid, string> = { sp3: 'sp³', sp2: 'sp²', sp: 'sp' }

/** Stage size in SVG units; the drawing is fitted inside it. */
const STAGE = { width: 580, height: 340 }
const BADGE_R = 19

/** The bond-line scale that fits a molecule inside the stage with room for its badges. */
function fitScale(g: MolGraph): number {
  const unit = skeletalBounds(g, 1)
  return Math.min(130, (STAGE.width - 150) / unit.width, (STAGE.height - 110) / unit.height)
}

/**
 * HybridisationSpotter: the Learner picks a molecule, predicts the hybridisation of each carbon,
 * and checks the prediction. The library then labels the carbon and gives its bond angle, its
 * s character and the length of each C–C bond at that carbon.
 */
export function HybridisationSpotter(_props: SimulationProps) {
  const presetNames = useMemo(() => SPOTTER_PRESETS.map((p) => iupacName(parseSmiles(p.smiles))), [])
  const [presetId, setPresetId] = useState(SPOTTER_PRESETS[0].id)
  const preset = SPOTTER_PRESETS.find((p) => p.id === presetId) ?? SPOTTER_PRESETS[0]
  const graph = useMemo(() => parseSmiles(preset.smiles), [preset])
  const name = useMemo(() => iupacName(graph), [graph])
  const formula = useMemo(() => molecularFormula(graph), [graph])
  const carbons = useMemo(() => carbonIndices(graph), [graph])
  const scale = useMemo(() => fitScale(graph), [graph])
  const frame = useMemo(() => skeletalFrame(graph, scale), [graph, scale])

  const [selected, setSelected] = useState(0)
  const [guesses, setGuesses] = useState<Record<number, CarbonHybrid>>({})
  const [revealed, setRevealed] = useState<Record<number, boolean>>({})

  const chosen = Math.min(selected, carbons.length - 1)
  const atom = carbons[chosen]
  const hybrid = carbonHybrid(graph, atom)
  const guess = guesses[chosen]
  const isRevealed = revealed[chosen] === true
  const bonds = carbonCarbonBondsAt(graph, atom)

  const choosePreset = (id: string) => {
    setPresetId(id)
    setSelected(0)
    setGuesses({})
    setRevealed({})
  }

  const check = () => setRevealed((r) => ({ ...r, [chosen]: true }))
  const revealAll = () => setRevealed(Object.fromEntries(carbons.map((_, k) => [k, true])))

  const carbonName = (k: number) => `C${k + 1}`
  const angle = idealBondAngle(hybrid)
  const bondText = bonds.length
    ? bonds.map((b) => `${b.order === 1 ? 'C–C single' : b.order === 2 ? 'C=C double' : 'C≡C triple'} ${b.lengthPm} pm`).join(', ')
    : 'no C–C bond'

  let readout: string
  if (!isRevealed) {
    readout = guess
      ? `${carbonName(chosen)}: you chose ${HYBRID_TEXT[guess]}. Press Check to see the answer.`
      : `${carbonName(chosen)}: predict its hybridisation first. Count the groups bonded to it and any π bonds.`
  } else if (guess === hybrid) {
    readout = `${carbonName(chosen)} is ${HYBRID_TEXT[hybrid]}, as you predicted. Its ideal bond angle is ${angle}°.`
  } else {
    readout = `${carbonName(chosen)} is ${HYBRID_TEXT[hybrid]}${guess ? `, not ${HYBRID_TEXT[guess]}` : ''}. Its ideal bond angle is ${angle}°.`
  }

  return (
    <div className={styles.sim} data-testid="hybridisation-spotter" data-preset={preset.id} data-carbons={carbons.length}>
      <svg viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} role="img" aria-label={`${name}, ${formula}, drawn as a bond-line formula with its carbons numbered`} className={styles.stage}>
        <VocabDefs />
        <SkeletalFormula
          graph={graph}
          scale={scale}
          x={STAGE.width / 2}
          y={STAGE.height / 2}
          showLonePairs
          overlay={
            <g>
              {carbons.map((i, k) => {
                const p = frame.points[i]
                const cx = p.x
                const cy = p.y
                const dist = Math.hypot(cx, cy) || 1
                const tx = cx + (cx / dist) * 40
                const ty = cy + (cy / dist) * 40
                const done = revealed[k] === true
                const on = k === chosen
                const h = carbonHybrid(graph, i)
                return (
                  <g
                    key={i}
                    className={styles.badge}
                    role="button"
                    tabIndex={0}
                    aria-label={`Carbon ${k + 1}${done ? `, ${HYBRID_TEXT[h]}` : ', hybridisation not checked'}`}
                    aria-pressed={on}
                    data-carbon={k + 1}
                    onClick={() => setSelected(k)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        setSelected(k)
                      }
                    }}
                  >
                    <circle cx={cx} cy={cy} r={BADGE_R} strokeWidth={on ? 3 : 1.5} style={{ fill: done ? HYBRID_SPOT[h] : 'var(--surface)', stroke: on ? 'var(--accent)' : 'var(--fg-muted)' }} />
                    <Label x={cx} y={cy + 1} fontSize={14} fill={done ? 'var(--surface)' : 'var(--fg)'} fontWeight={600}>
                      {k + 1}
                    </Label>
                    {done && (
                      <Label x={tx} y={ty} fontSize={16} fill="var(--fg)" fontWeight={600} data-testid="badge-hybrid">
                        {HYBRID_TEXT[h]}
                      </Label>
                    )}
                  </g>
                )
              })}
            </g>
          }
        />
      </svg>

      <p className={styles.readout} aria-live="polite" data-testid="spotter-readout">
        {readout}
      </p>

      <dl className={styles.facts} data-testid="spotter-facts">
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Carbon</dt>
          <dd className={styles.factValue} data-testid="fact-carbon">{carbonName(chosen)}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Hybridisation</dt>
          <dd className={styles.factValue} data-testid="fact-hybrid">{isRevealed ? HYBRID_TEXT[hybrid] : 'not yet checked'}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>Bond angle (ideal)</dt>
          <dd className={styles.factValue} data-testid="fact-angle">{isRevealed ? `${angle}°` : '–'}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>s character</dt>
          <dd className={styles.factValue} data-testid="fact-s">{isRevealed ? `${sCharacterPercent(hybrid).toFixed(hybrid === 'sp2' ? 1 : 0)}%` : '–'}</dd>
        </div>
        <div className={styles.fact}>
          <dt className={styles.factLabel}>C–C bonds at this carbon</dt>
          <dd className={styles.factValue} data-testid="fact-bonds">{isRevealed ? bondText : '–'}</dd>
        </div>
      </dl>

      <SimulationControls>
        <div className={styles.controls}>
          <label className={styles.selectLabel}>
            Molecule
            <select className={styles.select} value={preset.id} onChange={(e) => choosePreset(e.target.value)} data-testid="spotter-select">
              {SPOTTER_PRESETS.map((p, k) => (
                <option key={p.id} value={p.id}>
                  {presetNames[k]}
                </option>
              ))}
            </select>
          </label>
          <Segmented
            label="Carbon"
            options={carbons.map((_, k) => ({ value: String(k), label: carbonName(k) }))}
            value={String(chosen)}
            onChange={(v) => setSelected(Number(v))}
          />
          <div className={styles.guessGroup} role="group" aria-label="Your prediction">
            <span className={styles.groupLabel}>My guess:</span>
            {GUESSES.map((g) => (
              <Button
                key={g.value}
                variant="secondary"
                aria-pressed={guess === g.value}
                onClick={() => setGuesses((prev) => ({ ...prev, [chosen]: g.value }))}
              >
                {g.label}
              </Button>
            ))}
          </div>
          <Button variant="secondary" onClick={check} disabled={!guess || isRevealed}>
            Check
          </Button>
          <Button variant="secondary" onClick={revealAll}>
            Reveal all
          </Button>
        </div>
      </SimulationControls>
      <p className={styles.note}>
        Hybridisation is set by the number of σ groups and π bonds at the carbon. The angles are the ideal values for that hybrid.
      </p>
    </div>
  )
}
