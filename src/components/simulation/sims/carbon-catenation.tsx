'use client'

import { useMemo, useState } from 'react'
import { Slider } from '@/components/controls'
import { SkeletalFormula, skeletalBounds } from '@/components/organic'
import { Label, VocabDefs } from '@/components/vocab'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { subscriptDigits } from '@/lib/chem/carbon-shapes'
import { alkaneIsomers } from '@/lib/chem/isomers'
import { iupacName } from '@/lib/chem/iupac-organic'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import styles from './carbon-catenation.module.css'

const STAGE = { width: 580, height: 440 }
const CHAIN_BAND = 130

/** Bond-line scale that fits a drawing inside a box of the given size, with a cap on the scale. */
function fit(g: MolGraph, maxW: number, maxH: number, cap: number): number {
  const unit = skeletalBounds(g, 1)
  return Math.max(6, Math.min(cap, maxW / unit.width, maxH / unit.height))
}

/**
 * CatenationChains: the Learner chooses how many carbons the chain has. The straight chain is drawn
 * above, and every structural isomer of CnH(2n+2) is drawn below, with its IUPAC name. The count,
 * the names and the formula all come from the isomer library.
 */
export function CatenationChains(_props: SimulationProps) {
  const [n, setN] = useState(4)
  const isomers = useMemo(() => alkaneIsomers(n), [n])
  const chain = useMemo(() => parseSmiles('C'.repeat(n)), [n])
  const chainName = useMemo(() => iupacName(chain), [chain])
  const formula = useMemo(() => subscriptDigits(molecularFormula(chain)), [chain])
  const count = isomers.length
  const cols = Math.min(3, count)
  const rows = Math.ceil(count / cols)
  const cellW = STAGE.width / cols
  const gridTop = CHAIN_BAND + 26
  const cellH = (STAGE.height - gridTop) / rows
  const chainScale = fit(chain, STAGE.width - 120, CHAIN_BAND - 10, 60)

  const readout = `${chainName} (${formula}) is the straight chain of ${n} carbons, with ${n - 1} C–C ${n - 1 === 1 ? 'bond' : 'bonds'}. ${formula} has ${count} structural ${count === 1 ? 'isomer' : 'isomers'}.`

  return (
    <div className={styles.sim} data-testid="carbon-catenation" data-n={n} data-isomers={count}>
      <svg viewBox={`0 0 ${STAGE.width} ${STAGE.height}`} role="img" aria-label={`${count} structural isomers of ${formula}, drawn with their names`} className={styles.stage}>
        <VocabDefs />
        <SkeletalFormula graph={chain} scale={chainScale} x={STAGE.width / 2} y={CHAIN_BAND / 2 + 6} />
        <Label x={STAGE.width / 2} y={CHAIN_BAND + 14} fontSize={18} fill="var(--fg)" data-testid="chain-name">
          {`${chainName}: ${n} carbon${n === 1 ? '' : 's'} in a row`}
        </Label>
        <line x1={40} x2={STAGE.width - 40} y1={CHAIN_BAND + 26} y2={CHAIN_BAND + 26} strokeWidth={1} style={{ stroke: 'var(--border)' }} />
        {isomers.map((iso, k) => {
          const col = k % cols
          const row = Math.floor(k / cols)
          const cx = cellW * (col + 0.5)
          const top = gridTop + row * cellH
          const cy = top + (cellH - 30) / 2
          const scale = fit(iso.graph, cellW - 40, cellH - 36, 60)
          return (
            <g key={iso.name} data-isomer={iso.name}>
              <SkeletalFormula graph={iso.graph} scale={scale} x={cx} y={cy} showLonePairs />
              <Label x={cx} y={top + cellH - 8} fontSize={16} fill="var(--fg)">
                {iso.name}
              </Label>
            </g>
          )
        })}
      </svg>

      <p className={styles.readout} aria-live="polite" data-testid="catenation-readout">
        {readout}
      </p>

      <SimulationControls>
        <Slider label="Carbon atoms in the chain, n" value={n} min={1} max={7} step={1} onChange={(v) => setN(Math.round(v))} format={(v) => `${Math.round(v)}`} />
      </SimulationControls>
      <p className={styles.note}>
        Every isomer here is an open chain in which each carbon forms four bonds. Branching, not length alone, creates the extra isomers. The count is taken from the isomer library.
      </p>
    </div>
  )
}
