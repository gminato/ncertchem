'use client'

import { useMemo, useState } from 'react'
import { Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { alkyneIsomers, ALKYNE_MAX_N, ALKYNE_MIN_N, type AlkyneIsomer } from '@/lib/chem/alkyne-isomers'
import { isomerRelation } from '@/lib/chem/isomers'
import { relationPhrase } from '@/lib/chem/isomer-families'
import styles from './alkyne-isomers.module.css'

const CARD_W = 210
const CARD_H = 150
const MAX_BOND_SCALE = 52
const SUBSCRIPT_DIGITS: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }

/** A formula with real subscript digits, e.g. C5H8 becomes C₅H₈. */
function subscriptFormula(formula: string): string {
  return formula.replace(/[0-9]/g, (d) => SUBSCRIPT_DIGITS[d])
}

/** Bond length in pixels that fits one isomer in its card. */
function fitScale(isomer: AlkyneIsomer): number {
  const f = drawingFrame(isomer.graph, 1)
  return Math.min(MAX_BOND_SCALE, (CARD_W - 40) / f.bounds.width, (CARD_H - 44) / f.bounds.height)
}

/**
 * The alkyne isomer sorter (Section 9.4.1). Choose n for CnH(2n-2), then pick two isomers: the
 * lib names each one and says whether the pair differs in position or in chain. Every name,
 * formula and relation comes from the lib.
 */
export function AlkyneIsomers({ reducedMotion }: SimulationProps) {
  const [n, setN] = useState(5)
  const [picked, setPicked] = useState<number[]>([])

  const isomers = useMemo(() => alkyneIsomers(n), [n])
  const chosen = picked.filter((i) => i < isomers.length).map((i) => isomers[i])

  const toggle = (index: number) => {
    setPicked((prev) => {
      if (prev.includes(index)) return prev.filter((i) => i !== index)
      return [...prev.slice(-1), index]
    })
  }

  const readout =
    chosen.length === 2
      ? `${chosen[0].name} and ${chosen[1].name}: ${relationPhrase(isomerRelation(chosen[0].graph, chosen[1].graph))}.`
      : chosen.length === 1
        ? `${chosen[0].name} is selected. Pick one more isomer to compare.`
        : `C${n}H${2 * n - 2} has ${isomers.length} isomer${isomers.length === 1 ? '' : 's'} with one triple bond. Pick two to compare them.`

  return (
    <div className={styles.lab} data-isomers={isomers.length} data-n={n} data-reduced={reducedMotion ? 'true' : 'false'}>
      <div className={styles.controls}>
        <Slider
          id="alkyne-n"
          label="Carbon atoms, n"
          value={n}
          min={ALKYNE_MIN_N}
          max={ALKYNE_MAX_N}
          step={1}
          onChange={(v) => {
            setN(v)
            setPicked([])
          }}
          format={(v) => subscriptFormula(`C${v}H${2 * v - 2}`)}
        />
      </div>

      <div className={styles.grid} role="group" aria-label={`Isomers of C${n}H${2 * n - 2}`}>
        {isomers.map((isomer, i) => {
          const selected = picked.includes(i)
          return (
            <button
              key={isomer.name}
              type="button"
              className={styles.card}
              aria-pressed={selected}
              data-selected={selected ? 'true' : 'false'}
              data-name={isomer.name}
              onClick={() => toggle(i)}
            >
              <svg viewBox={`0 0 ${CARD_W} ${CARD_H}`} className={styles.drawing} aria-hidden="true">
                <SkeletalFormula graph={isomer.graph} scale={fitScale(isomer)} x={CARD_W / 2} y={(CARD_H - 30) / 2} />
              </svg>
              <span className={styles.name}>{isomer.name}</span>
              <span className={styles.formula}>{subscriptFormula(isomer.formula)}</span>
            </button>
          )
        })}
      </div>

      <p className={styles.readout} aria-live="polite" data-testid="alkyne-readout">
        {readout}
      </p>
    </div>
  )
}
