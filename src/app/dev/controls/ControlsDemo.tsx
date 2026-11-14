'use client'

import { useState } from 'react'
import { Button, NumberField, Segmented, Slider, Toggle } from '@/components/controls'
import styles from './controls.module.css'

type Phase = 'solid' | 'liquid' | 'gas'
type Scale = 'mini' | 'small' | 'medium' | 'large'

/** Every control primitive, wired to local state, for visual and keyboard checks. */
export function ControlsDemo() {
  const [temperature, setTemperature] = useState(300)
  const [concentration, setConcentration] = useState(0.4)
  const [phase, setPhase] = useState<Phase>('liquid')
  const [scale, setScale] = useState<Scale>('small')
  const [particles, setParticles] = useState(true)
  const [moles, setMoles] = useState(0.25)
  const [molar, setMolar] = useState(58.44)
  const [presses, setPresses] = useState(0)

  return (
    <div className={styles.grid}>
      <section className={styles.panel} aria-labelledby="demo-sliders">
        <h2 id="demo-sliders" className={styles.panelTitle}>
          Slider
        </h2>
        <div className={styles.stack}>
          <Slider
            label="Temperature"
            value={temperature}
            min={200}
            max={400}
            step={1}
            unit="K"
            onChange={setTemperature}
          />
          <Slider
            label="Concentration"
            value={concentration}
            min={0}
            max={1}
            step={0.05}
            unit="M"
            onChange={setConcentration}
          />
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="demo-segmented">
        <h2 id="demo-segmented" className={styles.panelTitle}>
          Segmented
        </h2>
        <div className={styles.stack}>
          <Segmented<Phase>
            label="Phase"
            value={phase}
            onChange={setPhase}
            options={[
              { value: 'solid', label: 'Solid' },
              { value: 'liquid', label: 'Liquid' },
              { value: 'gas', label: 'Gas' },
            ]}
          />
          <Segmented<Scale>
            label="Scale"
            value={scale}
            onChange={setScale}
            options={[
              { value: 'mini', label: 'Mini' },
              { value: 'small', label: 'Small' },
              { value: 'medium', label: 'Medium' },
              { value: 'large', label: 'Large' },
            ]}
          />
          <p className={styles.note}>
            Current: {phase}, {scale}
          </p>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="demo-toggle">
        <h2 id="demo-toggle" className={styles.panelTitle}>
          Toggle and Button
        </h2>
        <div className={styles.stack}>
          <Toggle label="Show particles" checked={particles} onChange={setParticles} />
          <Toggle label="Disabled switch" checked={false} onChange={() => {}} disabled />
          <div className={styles.row}>
            <Button variant="primary" onClick={() => setPresses((p) => p + 1)}>
              Run ({presses})
            </Button>
            <Button variant="secondary" onClick={() => setPresses(0)}>
              Reset
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="demo-number">
        <h2 id="demo-number" className={styles.panelTitle}>
          NumberField
        </h2>
        <div className={styles.stack}>
          <NumberField
            label="Amount"
            value={moles}
            min={0}
            max={10}
            step={0.01}
            unit="mol"
            onChange={setMoles}
          />
          <NumberField
            label="Molar mass"
            value={molar}
            min={1}
            max={300}
            unit="g mol⁻¹"
            precision={2}
            onChange={setMolar}
          />
          <p className={styles.note}>
            Amount {moles} mol, molar mass {molar} g mol⁻¹
          </p>
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="demo-readouts">
        <h2 id="demo-readouts" className={styles.panelTitle}>
          Live readouts
        </h2>
        <p className={styles.note}>
          Temperature {temperature} K, concentration {concentration.toFixed(2)} M, particles{' '}
          {particles ? 'shown' : 'hidden'}.
        </p>
      </section>
    </div>
  )
}
