'use client'

import { useEffect, useState } from 'react'
import gsap from 'gsap'
import { Label, Vessel } from '@/components/vocab'
import {
  VESSEL_CAPACITY_L,
  VOLUME_CASES_L,
  clampConcentrationStep,
  concentrationSnapshotForStep,
  heatedMolarity,
  heatedVolume,
  molarityForVolume,
  solutionMolality,
  solventVolume25,
  stepDescription,
  type ConcentrationSnapshot,
} from './concentration-steps'
import styles from './ConcentrationVessels.module.css'

export interface ConcentrationVesselsProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 360, content centred in the Scrolly panel)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 360
const VIEW_TOP = -6

const VESSEL = { width: 110, height: 180, y: 180 }
/** Vessel centres: three for the volume examples, one for the solvent and the heated solution. */
const VOLUME_X = [110, 320, 530] as const
const SINGLE_X = 320

const TITLE_Y = 26
const ABOVE_Y = 62
const BELOW_Y = 300
const BELOW_2_Y = 324

/**
 * ConcentrationVessels: the same amount of solute in different volumes (molarity),
 * then solute per kilogram of solvent (molality), then the same solution heated,
 * which expands it. Molarity changes with temperature; molality does not.
 */
export function ConcentrationVessels({ step, reducedMotion }: ConcentrationVesselsProps) {
  const activeStep = clampConcentrationStep(step)

  // The live state is a mutable object that GSAP tweens; `view` is a React copy.
  const [state] = useState<ConcentrationSnapshot>(() => concentrationSnapshotForStep(activeStep))
  const [view, setView] = useState<ConcentrationSnapshot>(() => ({ ...state }))

  useEffect(() => {
    if (reducedMotion) {
      Object.assign(state, concentrationSnapshotForStep(activeStep))
      const redraw = gsap.delayedCall(0, () => setView({ ...state }))
      return () => {
        redraw.kill()
      }
    }
    const tween = gsap.to(state, {
      ...concentrationSnapshotForStep(activeStep),
      duration: 0.8,
      ease: 'power2.inOut',
      onUpdate: () => setView({ ...state }),
    })
    return () => {
      tween.kill()
    }
    // `state` is stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  const heatedLevel = heatedVolume(view.celsius) / VESSEL_CAPACITY_L
  const solventLevel = solventVolume25() / VESSEL_CAPACITY_L
  const shownCelsius = Math.round(view.celsius)
  const molalityText = solutionMolality().toFixed(3)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 ${VIEW_TOP} ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Vessels showing 0.500 mol of NaCl in 1.00 L, 0.500 L and 0.250 L, then in 1 kg of water, then heated from 25 °C to 80 °C, where the solution expands"
        data-testid="concentration-vessels"
        data-step={activeStep}
      >
        {/* Group 1: the same solute in three volumes (molarity) */}
        <g opacity={view.volumes}>
          <Label x={320} y={TITLE_Y} fontSize={16} fill="var(--fg-muted)">
            The same 0.500 mol NaCl in each vessel
          </Label>
          {VOLUME_CASES_L.map((litres, i) => (
            <g key={`case-${litres}`}>
              <Vessel
                variant="beaker"
                width={VESSEL.width}
                height={VESSEL.height}
                x={VOLUME_X[i]}
                y={VESSEL.y}
                level={litres / VESSEL_CAPACITY_L}
              />
              <Label x={VOLUME_X[i]} y={ABOVE_Y} fontSize={16}>
                V = {litres.toFixed(litres < 1 ? 3 : 2)} L
              </Label>
              <Label x={VOLUME_X[i]} y={BELOW_Y} fontSize={16} fill="var(--orbit-active)">
                {molarityForVolume(litres).toFixed(2)} M
              </Label>
            </g>
          ))}
        </g>

        {/* Group 2: solute per kilogram of solvent (molality) */}
        <g opacity={view.solvent}>
          <Label x={SINGLE_X} y={TITLE_Y} fontSize={16} fill="var(--fg-muted)">
            0.500 mol NaCl in 1.000 kg of water
          </Label>
          <Vessel
            variant="beaker"
            width={VESSEL.width}
            height={VESSEL.height}
            x={SINGLE_X}
            y={VESSEL.y}
            level={solventLevel}
          />
          <Label x={SINGLE_X} y={ABOVE_Y} fontSize={16}>
            V = {solventVolume25().toFixed(3)} L
          </Label>
          <Label x={SINGLE_X} y={BELOW_Y} fontSize={16} fill="var(--orbit-active)">
            m = 0.500 mol kg⁻¹
          </Label>
        </g>

        {/* Group 3: the same solution heated; the liquid expands */}
        <g opacity={view.heated}>
          <Label x={SINGLE_X} y={TITLE_Y} fontSize={16} fill="var(--fg-muted)">
            Solution at {shownCelsius} °C
          </Label>
          <Vessel
            variant="beaker"
            width={VESSEL.width}
            height={VESSEL.height}
            x={SINGLE_X}
            y={VESSEL.y}
            level={heatedLevel}
          />
          <Label x={SINGLE_X} y={ABOVE_Y} fontSize={16}>
            V = {heatedVolume(view.celsius).toFixed(3)} L
          </Label>
          <Label x={SINGLE_X} y={BELOW_Y} fontSize={16} fill="var(--orbit-active)">
            M = {heatedMolarity(view.celsius).toFixed(3)} mol L⁻¹
          </Label>
          <Label x={SINGLE_X} y={BELOW_2_Y} fontSize={16} fill="var(--fg-muted)">
            m = {molalityText} mol kg⁻¹ (unchanged)
          </Label>
        </g>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {stepDescription(activeStep)}
      </p>
    </div>
  )
}
