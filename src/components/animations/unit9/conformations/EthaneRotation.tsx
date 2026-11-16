'use client'

import React from 'react'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { Molecule3DFallback, Molecule3D, cameraForMolecule } from '@/components/molecule'
import { Stage3DLazy } from '@/components/stage3d'
import { TorsionalEnergyPlot } from '@/components/organic'
import { ethaneModel, type EthaneModel } from '@/lib/chem/ethane-3d'
import { conformationName } from '@/lib/chem/conformations'
import { NewmanDrawing, SawhorseDrawing, sawhorseTransform } from './conformation-drawings'
import { ethaneStep, ETHANE_STEP_COUNT } from './conformations-steps'
import styles from './EthaneRotation.module.css'

export interface EthaneRotationProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
const FONT = 'var(--font-sans)'
/** Centre of the main drawing, in the 580 × 440 view. */
const CENTRE = { x: VIEW_WIDTH / 2, y: 222 }
/** Scale of the sawhorse and Newman drawings: bonds and labels stay legible at the panel's width. */
const SAWHORSE_SCALE = 1
const NEWMAN_SCALE = 1
/** The energy plot is 610 units wide natively; this scale fits it in the view with its labels. */
const PLOT_SCALE = 0.85

/** The camera for the 3D model, fixed so that only the back carbon moves on screen. */
const MODEL_CAMERA = cameraForMolecule(ethaneModel(60), 1.1)

/** Title and caption of each Step, in the order of the Steps. */
const TEXT = [
  {
    title: 'Ethane in 3D: staggered',
    caption: ['Each carbon carries three hydrogens.', 'Drag the model to turn it; the molecule is the same from every side.'],
  },
  {
    title: 'Ethane in 3D: the back carbon turns',
    caption: ['Only the back carbon turns about the C–C bond.', 'The front carbon does not move.'],
  },
  {
    title: 'Sawhorse projection of the eclipsed form',
    caption: ['Front carbon at the bottom, back carbon at the top.', 'Each H on the back carbon sits directly behind an H in front.'],
  },
  {
    title: 'Newman projection: looking down the C–C bond',
    caption: ['The front carbon is the dot; the back carbon is the circle.', 'At 60° the back H sit between the front H: staggered.'],
  },
  {
    title: 'Energy against the dihedral angle',
    caption: [
      'Maxima are the eclipsed forms (0°, 120°); minima are staggered (60°).',
      'The barrier between them is 12.5 kJ mol⁻¹. The marker is the current angle.',
    ],
  },
] as const

/** The energy curve is in the same plot for every Step; the marker rides it as the angle tweens. */
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/** A 3D ethane model, drawn with the Step's rotatable view or the flat fallback. */
function ModelPanel({ model, index, angle, reducedMotion }: { model: EthaneModel; index: number; angle: number; reducedMotion: boolean }) {
  const name = conformationName(Math.round(angle))
  return (
    <div className={`${styles.panel} ${enter(reducedMotion) ?? ''}`} data-testid="ethane-model" data-step={index}>
      <p className={styles.title}>{TEXT[index].title}</p>
      <p className={styles.readout} data-testid="ethane-readout">
        <span className="sym">θ</span>
        {` = ${Math.round(angle)}°, ${name}`}
      </p>
      <div className={styles.model}>
        <Stage3DLazy
          label={`${TEXT[index].title}. Ethane model with the back carbon at ${Math.round(angle)} degrees, ${name}. Drag to turn.`}
          fallback={<Molecule3DFallback atoms={model.atoms} bonds={model.bonds} />}
          cameraPosition={MODEL_CAMERA}
          hint="Drag to turn"
          className={styles.stage3d}
        >
          <Molecule3D atoms={model.atoms} bonds={model.bonds} />
        </Stage3DLazy>
      </div>
      <p className={styles.caption}>{TEXT[index].caption.join(' ')}</p>
    </div>
  )
}

/**
 * The ethane-rotation Scrolly visual (Section 9.2.4). Step 1 shows staggered ethane in 3D; Step 2 turns its back
 * carbon to the eclipsed form; Step 3 draws that form as a sawhorse; Step 4 turns the Newman projection back to
 * staggered; Step 5 rides the energy curve over the barrier. The angle tweens from Step to Step, and the name
 * and the energy come from the lib.
 */
export function EthaneRotation({ step, reducedMotion }: EthaneRotationProps) {
  const index = Math.min(ETHANE_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const current = ethaneStep(index)
  const angle = useTweenedNumber(current.dihedral, reducedMotion, 1.4)
  const model = ethaneModel(angle)

  if (current.kind === 'model') {
    return <ModelPanel model={model} index={index} angle={angle} reducedMotion={reducedMotion} />
  }

  const name = conformationName(Math.round(angle))
  const text = TEXT[index]
  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={`${text.title}. Back carbon at ${Math.round(angle)} degrees, ${name}. ${text.caption.join(' ')}`}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="ethane-rotation"
      data-step={index}
    >
      <text x={VIEW_WIDTH / 2} y={36} textAnchor="middle" fontSize={22} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        {text.title}
      </text>
      <text x={VIEW_WIDTH / 2} y={64} textAnchor="middle" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)" data-testid="ethane-readout">
        <tspan className="sym">θ</tspan>
        {` = ${Math.round(angle)}°, ${name}`}
      </text>
      <g key={`step-${index}`} className={enter(reducedMotion)}>
        {current.kind === 'sawhorse' ? (
          <g transform={sawhorseTransform(CENTRE.x, CENTRE.y + 8, SAWHORSE_SCALE)}>
            <SawhorseDrawing dihedral={angle} />
          </g>
        ) : null}
        {current.kind === 'newman' ? (
          <g transform={`translate(${CENTRE.x} ${CENTRE.y}) scale(${NEWMAN_SCALE})`}>
            <NewmanDrawing dihedral={angle} />
          </g>
        ) : null}
        {current.kind === 'energy' ? (
          <g transform={`translate(${(VIEW_WIDTH - 610 * PLOT_SCALE) / 2} 62) scale(${PLOT_SCALE})`}>
            <TorsionalEnergyPlot dihedral={angle} />
          </g>
        ) : null}
      </g>
      {text.caption.map((line, i) => (
        <text key={line} x={VIEW_WIDTH / 2} y={404 + i * 24} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </svg>
  )
}
