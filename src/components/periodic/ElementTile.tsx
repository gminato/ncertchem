import React from 'react'
import type { ElementRecord } from './types'
import styles from './ElementTile.module.css'

export interface ElementTileProps {
  /** The element to show. Null shows an empty slot. */
  element: ElementRecord | null
  /**
   * Predicted variant, for Mendeleev's eka-elements. Values show "?" and a
   * caption says the element was predicted, not observed.
   */
  predicted?: boolean
  /** Ground-state electron configuration, for example "[Ne] 3s1". */
  configuration?: string
  showMass?: boolean
  className?: string
}

const UNKNOWN = '?'

function fmt(value: number | null, digits: number, unit: string): string {
  if (value === null) return 'Not available'
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ''}`
}

/** A large element card for hooks and detail panels. */
export function ElementTile({
  element,
  predicted = false,
  configuration,
  showMass = true,
  className,
}: ElementTileProps) {
  if (!element) {
    return (
      <div className={`${styles.tile} ${styles.empty} ${className ?? ''}`} aria-label="No element selected">
        <span className={styles.emptyText}>Select an element</span>
      </div>
    )
  }

  const unknown = predicted
  const props: { label: string; value: string }[] = [
    {
      label: 'Electronegativity',
      value: unknown ? UNKNOWN : fmt(element.electronegativity, 2, ''),
    },
    {
      label: 'First ionisation energy',
      value: unknown ? UNKNOWN : fmt(element.firstIonizationEnergyEv, 2, 'eV'),
    },
    {
      label: 'Electron affinity',
      value: unknown ? UNKNOWN : fmt(element.electronAffinity, 2, 'eV'),
    },
    {
      label: 'Atomic radius',
      value: unknown ? UNKNOWN : fmt(element.atomicRadius, 0, 'pm'),
    },
  ]

  return (
    <article
      className={`${styles.tile} ${predicted ? styles.predicted : ''} ${className ?? ''}`}
      aria-label={`${element.name}, Z ${unknown ? UNKNOWN : element.Z}`}
    >
      <header className={styles.head}>
        <span className={styles.z}>{unknown ? UNKNOWN : element.Z}</span>
        {showMass && (
          <span className={styles.mass}>
            {unknown ? UNKNOWN : element.atomicMass.toFixed(element.atomicMass < 100 ? 3 : 1)}
          </span>
        )}
      </header>
      <div className={styles.symbol}>{element.symbol}</div>
      <div className={styles.name}>{element.name}</div>
      <div className={styles.chips}>
        <span className={styles.chip}>{element.category}</span>
        <span className={styles.chip}>{element.block}-block</span>
      </div>
      <dl className={styles.grid}>
        {props.map((p) => (
          <div key={p.label} className={styles.prop}>
            <dt>{p.label}</dt>
            <dd>{p.value}</dd>
          </div>
        ))}
      </dl>
      {configuration && (
        <p className={styles.config}>
          <span className={styles.configLabel}>Configuration</span>
          <code>{unknown ? UNKNOWN : configuration}</code>
        </p>
      )}
      {predicted && <p className={styles.caption}>Predicted by Mendeleev, not yet observed.</p>}
    </article>
  )
}
