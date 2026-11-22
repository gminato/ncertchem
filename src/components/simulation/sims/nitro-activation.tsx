'use client'

import { useMemo, useState } from 'react'
import { Button, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { iupacNameFromSmiles } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  carbanionContributors,
  nitroSubstrateSmiles,
  nitroVerdict,
  printedHydrolysisCase,
} from '@/lib/chem/nitro-activation'
import styles from './nitro-activation.module.css'

type Pattern = readonly number[]

const PRESETS: readonly { id: string; label: string; positions: Pattern }[] = [
  { id: 'none', label: 'Chlorobenzene', positions: [] },
  { id: 'p', label: '4-nitro', positions: [4] },
  { id: 'm', label: '3-nitro', positions: [3] },
  { id: 'o-p', label: '2,4-dinitro', positions: [2, 4] },
  { id: 'trio', label: '2,4,6-trinitro', positions: [2, 4, 6] },
]

const SAME = (a: Pattern, b: Pattern) => a.length === b.length && a.every((p, i) => p === b[i])

/** Subscript digits in a formula, e.g. C6H4ClNO2. */
const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (f: string) => f.replace(/[0-9]/g, (d) => SUB[d])

/** One drawing scale for every structure in this view, so the contributors match the substrate. */
const DRAW_SCALE = 28
const SUBSTRATE_SCALE = 24

/** Index of the atom that carries the negative charge (the ring carbon that holds it). */
function chargedAtom(g: MolGraph): number {
  return g.atoms.findIndex((a) => (a.charge ?? 0) < 0)
}

function verdictSentence(positions: Pattern): string {
  const v = nitroVerdict(positions)
  if (positions.length === 0) return 'No nitro group: nothing stabilises the carbanion, so the reaction needs the harsh conditions.'
  if (v.activated) {
    const sites = v.reachingSites.map((c) => `C${c}`).join(' and ')
    return `Activated: the negative charge reaches ${sites}, and a nitro group sits on it, so resonance spreads the charge onto NO₂.`
  }
  const meta = v.metaPositions.map((p) => `C${p}`).join(' and ')
  return `Not activated: the charge reaches only C2, C4 and C6, and no nitro group is there. The nitro group at ${meta} never takes the charge.`
}

function conditionSentence(positions: Pattern): string {
  const entry = printedHydrolysisCase(positions)
  if (!entry) return 'No temperature is shown: NCERT prints conditions only for 4-nitro, 2,4-dinitro and 2,4,6-trinitro.'
  return `NCERT conditions for this case: ${entry.conditions.replace(/ {2}/g, ' ')}.`
}

export function NitroActivation() {
  const [positions, setPositions] = useState<Pattern>([4])

  const substrateSmiles = useMemo(() => nitroSubstrateSmiles(positions), [positions])
  const substrate = useMemo(() => parseSmiles(substrateSmiles), [substrateSmiles])
  const substrateName = iupacNameFromSmiles(substrateSmiles)
  const formula = molecularFormula(substrate)
  const contributors = useMemo(() => carbanionContributors(positions), [positions])
  const graphs = useMemo(() => contributors.map((c) => parseSmiles(c.smiles)), [contributors])
  const verdict = nitroVerdict(positions)
  const sentence = verdictSentence(positions)
  const conditions = conditionSentence(positions)
  const verdictLine = verdict.activated ? 'Activated' : 'Not activated'
  const summary = `${substrateName}. ${sentence} ${conditions}`
  const cellX = [95, 280, 465]

  return (
    <div className={styles.root} data-testid="nitro-activation">
      <div className={styles.layout}>
        <figure className={styles.stage}>
          <svg viewBox="0 0 560 566" role="img" aria-label={`${substrateName}. ${sentence}`} className={styles.drawing} data-testid="nitro-drawing">
            <SkeletalFormula graph={substrate} scale={SUBSTRATE_SCALE} x={110} y={118} highlightAtoms={[1]} />
            <text x={200} y={92} fontSize={18} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
              {substrateName}
            </text>
            <text x={200} y={122} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              Attack at C1 (shaded): OH⁻
            </text>
            <text x={200} y={150} fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              takes the place of Cl⁻
            </text>
            {contributors.map((c, i) => {
              const g = graphs[i]
              return (
                <g key={c.chargeAt}>
                  <SkeletalFormula graph={g} scale={DRAW_SCALE} x={cellX[i]} y={372} highlightAtoms={[chargedAtom(g)]} />
                  <text x={cellX[i]} y={502} textAnchor="middle" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
                    {`Charge on C${c.chargeAt}`}
                  </text>
                  <text x={cellX[i]} y={524} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill={c.reachesNitro ? 'var(--fg)' : 'var(--fg-muted)'}>
                    {c.reachesNitro ? 'carbon bears NO₂' : 'no NO₂ here'}
                  </text>
                </g>
              )
            })}
            <text x={188} y={372} textAnchor="middle" fontSize={28} fill="var(--fg-muted)">↔</text>
            <text x={372} y={372} textAnchor="middle" fontSize={28} fill="var(--fg-muted)">↔</text>
            <text x={280} y={246} textAnchor="middle" fontSize={16} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
              Carbanion contributors (the negative charge moves)
            </text>
            <text x={280} y={554} textAnchor="middle" fontSize={20} fontWeight={700} fontFamily="var(--font-sans)" fill="var(--fg)">
              {verdictLine}
            </text>
          </svg>
          <figcaption className={styles.caption}>
            {substrateName}, {subscript(formula)}.
          </figcaption>
        </figure>

        <div className={styles.panel}>
          <p className={styles.heading} data-testid="nitro-heading">
            {substrateName}
          </p>
          <p className={styles.verdict} data-testid="nitro-verdict">{verdictLine}</p>
          <p className={styles.summary}>{sentence}</p>
          <p className={styles.condition}>{conditions}</p>
          <p className={styles.srOnly} aria-live="polite" data-testid="nitro-live">
            {summary}
          </p>
        </div>
      </div>

      <SimulationControls>
        <div className={styles.controls}>
          <div className={styles.group} role="group" aria-label="Preset arrangements">
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                variant="secondary"
                aria-pressed={SAME(p.positions, positions)}
                className={SAME(p.positions, positions) ? styles.pressed : undefined}
                onClick={() => setPositions(p.positions)}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <div className={styles.group} role="group" aria-label="Nitro groups">
            {[2, 3, 4, 5, 6].map((pos) => (
                <Toggle
                  key={pos}
                  label={`NO₂ at C${pos}`}
                  checked={positions.includes(pos)}
                  onChange={(on) => setPositions((cur) => (on ? [...cur, pos] : cur.filter((p) => p !== pos)).sort((a, b) => a - b))}
                />
              ))}
          </div>
        </div>
      </SimulationControls>
    </div>
  )
}
