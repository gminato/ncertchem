'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { Button, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { Molecule3D, Molecule3DFallback, cameraForMolecule } from '@/components/molecule'
import { Stage3DLazy } from '@/components/stage3d'
import { TorsionalEnergyPlot, TORSIONAL_PLOT_SIZE } from '@/components/organic'
import { NewmanDrawing, SAWHORSE_VIEW, SawhorseDrawing } from '@/components/animations/unit9/conformations/conformation-drawings'
import { ethaneModel } from '@/lib/chem/ethane-3d'
import {
  ROTOR_BARRIER_KJ,
  ROTOR_TEMPERATURE_RANGE,
  dihedralFromPointer,
  rotorReadout,
  snapToNearestSixty,
  staggeredPercent,
  wrapTurn,
} from '@/lib/chem/newman-rotor'
import styles from './newman-rotor.module.css'

/** Degrees per second when the back carbon turns by itself. */
const TURN_SPEED = 30
const KEY_STEP = 5
const KEY_PAGE = 30
const DEFAULT_TEMPERATURE = 298
/** The Newman drawing's viewBox: the rear circle is 140 units across and the labels fit inside 150. */
const NEWMAN_VIEW = 300
const SAWHORSE_VIEW_BOX = `${SAWHORSE_VIEW.x} ${SAWHORSE_VIEW.y} ${SAWHORSE_VIEW.width} ${SAWHORSE_VIEW.height}`

/** Camera for the 3D model: fixed, so the model turns about its own C–C axis on screen. */
const MODEL_CAMERA = cameraForMolecule(ethaneModel(60), 1)

/** The Newman projection as a slider. Pointer and keyboard turn the back carbon; the lib names the result. */
function NewmanDial({ dihedral, onTurn, onSet }: { dihedral: number; onTurn: (delta: number) => void; onSet: (d: number) => void }) {
  const svg = useRef<SVGSVGElement>(null)
  const dragging = useRef(false)
  const readout = rotorReadout(dihedral)
  const aim = (e: PointerEvent<SVGSVGElement>) => {
    const box = svg.current?.getBoundingClientRect()
    if (!box) return
    const angle = (Math.atan2(e.clientY - (box.top + box.height / 2), e.clientX - (box.left + box.width / 2)) * 180) / Math.PI
    onSet(dihedralFromPointer(angle))
  }
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    const moves: Record<string, () => void> = {
      ArrowRight: () => onTurn(KEY_STEP),
      ArrowUp: () => onTurn(KEY_STEP),
      ArrowLeft: () => onTurn(-KEY_STEP),
      ArrowDown: () => onTurn(-KEY_STEP),
      PageUp: () => onTurn(KEY_PAGE),
      PageDown: () => onTurn(-KEY_PAGE),
      Home: () => onSet(0),
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    move()
  }
  return (
    <svg
      ref={svg}
      viewBox={`${-NEWMAN_VIEW / 2} ${-NEWMAN_VIEW / 2} ${NEWMAN_VIEW} ${NEWMAN_VIEW}`}
      role="slider"
      tabIndex={0}
      aria-label="Back carbon of ethane, Newman projection"
      aria-valuemin={0}
      aria-valuemax={359}
      aria-valuenow={readout.dihedral}
      aria-valuetext={`${readout.dihedral} degrees, ${readout.name}`}
      className={styles.dial}
      data-testid="newman-dial"
      onPointerDown={(e) => {
        dragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
        aim(e)
      }}
      onPointerMove={(e) => {
        if (dragging.current) aim(e)
      }}
      onPointerUp={() => {
        dragging.current = false
      }}
      onPointerCancel={() => {
        dragging.current = false
      }}
      onKeyDown={onKey}
    >
      <NewmanDrawing dihedral={dihedral} />
    </svg>
  )
}

/**
 * The Newman rotor: drag or key the back carbon of ethane in a Newman projection. The sawhorse, the 3D model and
 * the energy curve follow the same angle. The conformer name and the energy come from the lib. The temperature
 * control shows the lib's two-level illustration of the staggered fraction, labelled as a model.
 */
export function NewmanRotor({ reducedMotion }: SimulationProps) {
  const ref = useRef<HTMLDivElement>(null)
  const active = useIsActive(ref)
  const [dihedral, setDihedral] = useState(60)
  const [playing, setPlaying] = useState(false)
  const [temperature, setTemperature] = useState(DEFAULT_TEMPERATURE)

  // The turning loop: runs only while the simulation is on screen, the tab is visible and motion is allowed.
  useEffect(() => {
    if (!playing || !active || reducedMotion) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      setDihedral((d) => wrapTurn(d + TURN_SPEED * dt))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, active, reducedMotion])

  const readout = rotorReadout(dihedral)
  const model = ethaneModel(dihedral)
  const percent = staggeredPercent(temperature)
  const turn = (delta: number) => setDihedral((d) => wrapTurn(Math.round(d) + delta))
  const set = (d: number) => setDihedral(wrapTurn(d))

  return (
    <div ref={ref} className={styles.wrap} data-testid="newman-rotor">
      <div className={styles.grid}>
        <figure className={styles.card}>
          <figcaption className={styles.cardTitle}>Newman projection</figcaption>
          <NewmanDial dihedral={dihedral} onTurn={turn} onSet={set} />
          <p className={styles.hint}>Drag the back carbon, or use the arrow keys.</p>
        </figure>
        <figure className={styles.card}>
          <figcaption className={styles.cardTitle}>Sawhorse projection</figcaption>
          <svg viewBox={SAWHORSE_VIEW_BOX} role="img" aria-label={`Sawhorse projection, ${readout.name}`} className={styles.sawhorse} data-testid="sawhorse">
            <SawhorseDrawing dihedral={dihedral} />
          </svg>
        </figure>
        <figure className={styles.card}>
          <figcaption className={styles.cardTitle}>3D model</figcaption>
          <div className={styles.model}>
            <Stage3DLazy
              label={`Ethane model with the back carbon at ${readout.dihedral} degrees, ${readout.name}. Drag to turn the model.`}
              fallback={<Molecule3DFallback atoms={model.atoms} bonds={model.bonds} />}
              cameraPosition={MODEL_CAMERA}
              hint={<span className={styles.hintText}>Drag to turn</span>}
              className={styles.stage3d}
            >
              <Molecule3D atoms={model.atoms} bonds={model.bonds} />
            </Stage3DLazy>
          </div>
        </figure>
      </div>

      <div className={styles.plot}>
        <svg
          viewBox={`0 0 ${TORSIONAL_PLOT_SIZE.width} ${TORSIONAL_PLOT_SIZE.height}`}
          role="img"
          aria-label={`Energy against dihedral angle. The marker is at ${readout.dihedral} degrees.`}
          className={styles.plotSvg}
        >
          <TorsionalEnergyPlot dihedral={dihedral} />
        </svg>
      </div>

      <div className={styles.readouts}>
        <p className={styles.live} role="status" aria-live="polite" data-testid="rotor-readout">
          {`θ = ${readout.dihedral}°, ${readout.name}. Energy ${readout.energy.toFixed(2)} kJ mol⁻¹ above the staggered form.`}
        </p>
        <p className={styles.temperature} data-testid="rotor-temperature">
          {`Two-level model at ${temperature} K: ${percent.toFixed(1)} % of molecules in the staggered level (illustration, not a measurement). Barrier ${ROTOR_BARRIER_KJ} kJ mol⁻¹.`}
        </p>
      </div>

      <SimulationControls>
          <Button variant="secondary" onClick={() => setPlaying((p) => !p)} disabled={reducedMotion} aria-pressed={playing} data-testid="rotor-play">
            {playing ? 'Pause' : 'Turn slowly'}
          </Button>
          <Button variant="secondary" onClick={() => setDihedral(snapToNearestSixty(dihedral))} data-testid="rotor-snap">
            Snap to nearest conformer
          </Button>
          <Slider label="Dihedral angle θ" value={readout.dihedral} min={0} max={359} step={1} unit="°" onChange={(v) => set(v)} />
          <Slider
            label="Temperature"
            value={temperature}
            min={ROTOR_TEMPERATURE_RANGE.min}
            max={ROTOR_TEMPERATURE_RANGE.max}
            step={10}
            unit="K"
            onChange={(v) => setTemperature(v)}
          />
      </SimulationControls>
    </div>
  )
}
