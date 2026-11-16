'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { Segmented } from '@/components/controls/Segmented'
import styles from './SimulationShowcase.module.css'

/** One Simulation offered on the home page. */
export interface ShowcaseItem {
  /** Key in the Simulation registry. */
  name: string
  /** Short label for the picker. */
  tab: string
  /** The Simulation's title, as its Section shows it. */
  title: string
  /** One line saying what to try first. */
  prompt: string
  /** The Section the Simulation belongs to, e.g. "Section 2.4: Bohr's Model for Hydrogen Atom". */
  sectionLabel: string
  sectionHref: string
}

export interface SimulationShowcaseProps {
  items: readonly ShowcaseItem[]
}

function Loading() {
  return (
    <div className={styles.placeholder} role="status">
      Loading the Simulation…
    </div>
  )
}

// The Simulations are large, so their code is fetched only when the Learner scrolls near them.
const Simulation = dynamic(
  () => import('@/components/simulation/Simulation').then((mod) => mod.Simulation),
  { ssr: false, loading: Loading }
)

/**
 * A picker over a few real Simulations, each the same component its Section uses.
 * Nothing is loaded until the showcase is close to the screen.
 */
export function SimulationShowcase({ items }: SimulationShowcaseProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [near, setNear] = useState(false)
  const [name, setName] = useState(items[0].name)
  const item = items.find((entry) => entry.name === name) ?? items[0]

  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true)
          observer.disconnect()
        }
      },
      { rootMargin: '600px 0px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={rootRef} className={styles.showcase} data-testid="simulation-showcase">
      <div className={styles.picker}>
        <Segmented
          label="Simulation to try"
          options={items.map((entry) => ({ value: entry.name, label: entry.tab }))}
          value={item.name}
          onChange={setName}
        />
        <p className={styles.prompt}>{item.prompt}</p>
      </div>

      <div className={styles.frame}>
        {near ? <Simulation key={item.name} name={item.name} title={item.title} /> : <Loading />}
      </div>

      <p className={styles.source}>
        This Simulation is part of{' '}
        <Link href={item.sectionHref} className={styles.sourceLink}>
          {item.sectionLabel}
          <span aria-hidden="true"> →</span>
        </Link>
      </p>
    </div>
  )
}
