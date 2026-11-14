'use client'

import { useState } from 'react'
import { Button } from '@/components/controls/Button'
import { NumberField } from '@/components/controls/NumberField'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { iupacBreakdown, type IupacBreakdown } from '@/lib/chem/iupac-builder'
import styles from './iupac-namer.module.css'

const MIN_Z = 100
const MAX_Z = 999
const PRESETS = [101, 109, 120, 137, 999]

/**
 * IupacNamer: type an atomic number from 100 to 999 and watch the systematic name assemble. Each
 * digit maps to a root (NCERT Table 3.4), the roots are joined and "ium" is added, and an elision
 * drops the "i" of "ium" after a root that ends in "i". The name and symbol come from periodicity.ts.
 */
export function IupacNamer(_props: SimulationProps) {
  const [Z, setZ] = useState(120)
  const b = iupacBreakdown(Z)

  return (
    <div className={styles.namer}>
      <SimulationControls>
        <NumberField
          label="Atomic number Z"
          value={Z}
          min={MIN_Z}
          max={MAX_Z}
          step={1}
          precision={0}
          onChange={(v) => setZ(Math.round(v))}
        />
        <div className={styles.presets} role="group" aria-label="Preset atomic numbers">
          {PRESETS.map((p) => (
            <Button key={p} variant="secondary" onClick={() => setZ(p)} aria-pressed={p === Z}>
              {p}
            </Button>
          ))}
        </div>
      </SimulationControls>

      <Assembly key={Z} b={b} />

      <p className={styles.summary} role="status" aria-live="polite">
        {`Z ${b.Z}: digits ${b.segments.map((s) => s.digit).join(', ')} give ${b.segments
          .map((s) => s.root)
          .join(' + ')}, so the name is ${b.name} and the symbol is ${b.symbol}.`}
      </p>
    </div>
  )
}

/** The assembly: digits, roots, the joined string with its elision, then the name and symbol. */
function Assembly({ b }: { b: IupacBreakdown }) {
  const { elision, raw } = b
  const before = elision ? raw.slice(0, elision.index) : raw
  const struck = elision ? raw.slice(elision.index, elision.index + 1) : ''
  const after = elision ? raw.slice(elision.index + 1) : ''
  return (
    <div className={styles.stage}>
      <div className={styles.row} aria-label="Digits and roots">
        {b.segments.map((s, i) => (
          <div key={i} className={styles.segment} style={{ animationDelay: `${i * 0.08}s` }}>
            <span className={styles.digit}>{s.digit}</span>
            <span className={styles.arrow} aria-hidden="true">→</span>
            <span className={styles.root}>{s.root}</span>
            <span className={styles.abbr}>
              <span className="sym">{s.abbreviation}</span>
            </span>
          </div>
        ))}
      </div>

      <div className={styles.block}>
        <span className={styles.label}>Roots joined, then “ium” added</span>
        <p className={styles.raw}>
          <span>{before}</span>
          {elision && (
            <span className={styles.struck} data-testid="elided">
              {struck}
            </span>
          )}
          <span>{after}</span>
        </p>
        {elision ? (
          <p className={styles.note}>
            The root <span className="sym">{b.segments[b.segments.length - 1].abbreviation}</span> ends in{' '}
            <span className={styles.letter}>i</span>, so the <span className={styles.letter}>i</span> of “ium”
            is elided.
          </p>
        ) : (
          <p className={styles.note}>No elision: the last root does not end in i.</p>
        )}
      </div>

      <div className={styles.result}>
        <div>
          <span className={styles.label}>Name</span>
          <p className={styles.name} data-testid="iupac-name">{b.name}</p>
        </div>
        <div>
          <span className={styles.label}>Symbol</span>
          <p className={styles.symbol} data-testid="iupac-symbol">{b.symbol}</p>
        </div>
      </div>
    </div>
  )
}
