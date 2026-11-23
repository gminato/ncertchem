'use client'

import { Segmented, Slider, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula } from '@/components/organic'
import {
  acidModel,
  DEFAULT_SPEC,
  maxPosition,
  resolveSpec,
  type AcidSpec,
  type Skeleton,
  type Substituent,
} from '@/lib/chem/acid-namer'
import { useState } from 'react'
import styles from './acid-namer.module.css'

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const subscript = (text: string) => text.replace(/[0-9]/g, (d) => SUB[d])

const SKELETONS: { value: Skeleton; label: string }[] = [
  { value: 'chain', label: 'Chain' },
  { value: 'ring', label: 'Benzene ring' },
]

const SUBSTITUENTS: { value: Substituent; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'CH3', label: 'CH₃' },
  { value: 'Cl', label: 'Cl' },
]

const DRAW_SCALE = 40

export function AcidNamer() {
  const [spec, setSpec] = useState<AcidSpec>(DEFAULT_SPEC)
  const resolved = resolveSpec(spec)
  const model = acidModel(resolved)
  const isRing = resolved.skeleton === 'ring'
  const chainOff = isRing
  const subOff = isRing
  const secondOff = !isRing && resolved.carbons < 2
  const positionOff = isRing || resolved.substituent === 'none'

  const commonLine = model.commonName ? `Common name: ${model.commonName}` : 'Common name: none in Table 8.3'
  const summary = `${model.name}. ${model.commonName ? `Common name: ${model.commonName}.` : 'No common name in Table 8.3.'} Formula ${model.formula}.`

  return (
    <div className={styles.root} data-testid="acid-namer">
      <figure className={styles.stage}>
        <svg viewBox="0 0 560 386" role="img" aria-label={summary} className={styles.drawing}>
          <text x={280} y={44} textAnchor="middle" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
            {model.name}
          </text>
          <SkeletalFormula
            graph={model.graph}
            scale={DRAW_SCALE}
            x={280}
            y={186}
            locants={model.locantAtoms.map((l) => ({ atom: l.atom, label: l.label }))}
            highlightAtoms={[model.carboxylAtom]}
          />
          {model.condensed ? (
            <text x={280} y={314} textAnchor="middle" fontSize={20} fontFamily="var(--font-sans)" fill="var(--fg)">
              {subscript(model.condensed)}
            </text>
          ) : null}
          <text x={280} y={model.condensed ? 342 : 314} textAnchor="middle" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {`Formula ${subscript(model.formula)}`}
          </text>
          <text x={280} y={model.condensed ? 368 : 342} textAnchor="middle" fontSize={18} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
            {commonLine}
          </text>
        </svg>
      </figure>

      <SimulationControls>
        <div className={styles.controls}>
          <Segmented<Skeleton>
            label="Skeleton"
            options={SKELETONS}
            value={resolved.skeleton}
            onChange={(skeleton) => setSpec((s) => ({ ...s, skeleton }))}
          />
          <Slider
            label="Carbons in the chain"
            value={resolved.carbons}
            min={1}
            max={6}
            step={1}
            disabled={chainOff}
            onChange={(carbons) => setSpec((s) => ({ ...s, carbons }))}
          />
          <div inert={subOff || undefined} className={subOff ? styles.dimmed : undefined}>
            <Segmented<Substituent>
              label="Substituent"
              options={SUBSTITUENTS}
              value={resolved.substituent}
              onChange={(substituent) => setSpec((s) => ({ ...s, substituent }))}
            />
          </div>
          <Slider
            label="Substituent on carbon"
            value={resolved.position || 2}
            min={2}
            max={Math.max(2, maxPosition(resolved))}
            step={1}
            disabled={positionOff}
            onChange={(position) => setSpec((s) => ({ ...s, position }))}
          />
          <Toggle
            label="Second COOH group"
            checked={resolved.diacid}
            disabled={secondOff}
            onChange={(diacid) => setSpec((s) => ({ ...s, diacid }))}
          />
        </div>
      </SimulationControls>

      <p className={styles.summary} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
