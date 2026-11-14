'use client'

import { useEffect, useMemo, useState } from 'react'
import gsap from 'gsap'
import { Label, OrbitalBox, VocabDefs, type OrbitalSpin } from '@/components/vocab'
import {
  BUILD_ORDER,
  BUILD_STEP_COUNT,
  buildDescription,
  buildTargetForStep,
  clampStep,
  type BuildSnapshot,
} from './filling-steps'
import {
  configurationText,
  countsOf,
  elementInfo,
  stateAfter,
  type BuilderState,
} from '@/lib/chem/orbital-builder'
import styles from './filling.module.css'

export interface BuildUpAtomsProps {
  step: number
  reducedMotion: boolean
}

// ---------------------------------------------------------------------------
// Geometry (SVG viewBox 640 x 540)
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 640
const VIEW_HEIGHT = 540
/** Subshells shown, in Aufbau order: everything up to 3d and 4s, so chromium fits. */
const ROWS = ['1s', '2s', '2p', '3s', '3p', '4s', '3d'] as const
const ROW_TOP = 74
const ROW_GAP = 58
const BOX = 42
const BOX_GAP = 10
const ROW_X = 200
const LABEL_X = ROW_X - 16

function rowY(index: number): number {
  return ROW_TOP + index * ROW_GAP
}

/** Electron count after which each row is first started, from the build order. */
const ROW_START = new Map<string, number>()
for (const label of ROWS) {
  const first = BUILD_ORDER.findIndex((p) => p.label === label)
  ROW_START.set(label, first)
}

function toBoxes(spins: BuilderState[number]['orbitals']): OrbitalSpin[] {
  return spins.map((orbital) => ({
    up: orbital.includes('up'),
    down: orbital.includes('down'),
  }))
}

/** A short note beside a row, explaining the rule that the current electron follows. */
function annotation(placed: number): { row: string; text: string } | null {
  if (placed >= 2 && placed <= 4) return { row: '1s', text: 'a pair: opposite spins' }
  if (placed >= 5 && placed <= 7) return { row: '2p', text: 'one each, parallel spins' }
  if (placed === 8) return { row: '2p', text: 'the first pair forms' }
  if (placed >= 20 && placed <= 23) return { row: '3d', text: 'five parallel' }
  if (placed === 24) return { row: '3d', text: 'half filled' }
  return null
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * BuildUpAtoms: electrons are added one at a time in OrbitalBox notation. Nitrogen
 * shows the Pauli pair and the Hund's rule row of three parallel electrons, oxygen
 * shows the first pair in 2p, and chromium shows the half-filled 3d subshell.
 */
export function BuildUpAtoms({ step, reducedMotion }: BuildUpAtomsProps) {
  const activeStep = clampStep(step, BUILD_STEP_COUNT)

  const [state] = useState<BuildSnapshot>(() => ({ placed: 0 }))
  const [view, setView] = useState<BuildSnapshot>(() => ({ ...state }))
  const render = () => setView({ ...state })

  useEffect(() => {
    const target = buildTargetForStep(activeStep)

    if (reducedMotion) {
      Object.assign(state, target)
      const redraw = gsap.delayedCall(0, render)
      return () => {
        redraw.kill()
      }
    }

    const distance = Math.abs(target.placed - state.placed)
    const tl = gsap.timeline({ onUpdate: render })
    tl.to(state, { placed: target.placed, duration: Math.min(3, 0.2 + 0.13 * distance), ease: 'none' }, 0)
    return () => {
      tl.kill()
    }
    // `render` and `state` are stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep, reducedMotion])

  const placed = Math.round(view.placed)
  const built: BuilderState = useMemo(() => stateAfter(BUILD_ORDER, placed), [placed])
  const counts = countsOf(built)
  const last = placed > 0 ? BUILD_ORDER[placed - 1] : null
  const note = annotation(placed)
  const header = placed > 0 ? elementInfo(placed) : null
  const configuration = configurationText(counts)

  return (
    <div className={styles.wrapper}>
      <svg
        viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
        className={styles.svg}
        role="img"
        aria-label="Orbital boxes for the electrons of nitrogen, oxygen and chromium, built one electron at a time, with arrows for spin"
        data-testid="build-up-atoms"
        data-step={activeStep}
        data-placed={placed}
      >
        <VocabDefs idPrefix="build" />

        <Label x={VIEW_WIDTH / 2} y={34} fontSize={20} fill="var(--fg)">
          {header ? `${header.name} (${header.symbol}), Z = ${placed}` : 'An atom with no electrons yet'}
        </Label>

        {ROWS.map((label, index) => {
          const y = rowY(index)
          const started = placed > (ROW_START.get(label) ?? Infinity)
          const subshell = built.find((s) => s.label === label)
          const orbitals = subshell?.orbitals ?? []
          const highlight =
            last && last.label === label ? [last.orbital] : []
          const boxes = toBoxes(orbitals)
          const rowWidth = boxes.length * BOX + (boxes.length - 1) * BOX_GAP
          return (
            <g
              key={label}
              className={styles.row}
              style={{ opacity: started ? 1 : 0 }}
              data-subshell={label}
              data-started={started ? 'true' : 'false'}
            >
              <Label x={LABEL_X} y={y + BOX / 2} textAnchor="end" fontSize={18} fill="var(--fg-muted)">
                {label}
              </Label>
              <OrbitalBox
                orbitals={boxes}
                x={ROW_X}
                y={y}
                size={BOX}
                gap={BOX_GAP}
                highlight={highlight}
              />
              {note && note.row === label && started && (
                <Label
                  x={ROW_X + rowWidth + 22}
                  y={y + BOX / 2}
                  textAnchor="start"
                  fontSize={16}
                  halo
                  fill="var(--accent)"
                >
                  {note.text}
                </Label>
              )}
            </g>
          )
        })}

        <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 54} fontSize={18} fill="var(--fg)">
          {placed > 0 ? `Built so far: ${configuration}` : 'Built so far: nothing yet'}
        </Label>
        <Label x={VIEW_WIDTH / 2} y={VIEW_HEIGHT - 26} fontSize={14} fill="var(--fg-subtle)">
          {`${placed} electron${placed === 1 ? '' : 's'} placed. Up arrow = spin +½, down arrow = spin −½.`}
        </Label>
      </svg>

      <p className={styles.srOnly} aria-live="polite">
        {buildDescription(activeStep)}
      </p>
    </div>
  )
}
