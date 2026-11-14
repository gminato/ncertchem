'use client'

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { usePrefersReducedMotion } from '@/components/section/usePrefersReducedMotion'
import { simulations } from './registry'
import styles from './Simulation.module.css'

export interface SimulationShellProps {
  /** Key of the entry in the simulation registry. */
  name: string
  title: string
  /** Optional extra content for the controls row, such as a caption or a reset button. */
  children?: ReactNode
}

/** The controls row element, or null until the shell has mounted. */
const ControlsSlot = createContext<HTMLDivElement | null>(null)

/**
 * A full-width Simulation card: a title bar, a stage where the registered
 * simulation renders, and a controls row. Sections use it through MDX.
 */
export function Simulation({ name, title, children }: SimulationShellProps) {
  const reducedMotion = usePrefersReducedMotion()
  const titleId = useId()
  const [controlsNode, setControlsNode] = useState<HTMLDivElement | null>(null)
  const Sim = simulations[name]

  return (
    <section className={styles.frame} aria-labelledby={titleId} data-simulation={name}>
      <header className={styles.titleBar}>
        <span className={styles.eyebrow}>Simulation</span>
        <h3 id={titleId} className={styles.title}>
          {title}
        </h3>
      </header>

      <div className={styles.stage}>
        <ControlsSlot.Provider value={controlsNode}>
          {Sim ? (
            <Sim reducedMotion={reducedMotion} />
          ) : (
            <p className={styles.placeholder}>This simulation is being prepared.</p>
          )}
        </ControlsSlot.Provider>
      </div>

      <div ref={setControlsNode} className={styles.controls}>
        {children}
      </div>
    </section>
  )
}

/**
 * Wraps a simulation's controls. Inside a Simulation they move to the controls
 * row; rendered anywhere else they stay where they are.
 */
export function SimulationControls({ children }: { children: ReactNode }) {
  const node = useContext(ControlsSlot)
  if (node) return createPortal(children, node)
  return <div className={styles.controlsInline}>{children}</div>
}
