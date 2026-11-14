'use client'

import {
  ELECTRON_MASS_KG,
  ELEMENTARY_CHARGE_C,
  NEUTRON_MASS_KG,
  PROTON_MASS_KG,
} from '@/lib/chem/constants'
import { clampIndex, sci } from './notation'
import styles from './subatomic.module.css'

export interface ParticleTableProps {
  step: number
  reducedMotion: boolean
}

/** Number of Steps in the ParticleTable animation: one per fundamental particle. */
export const PARTICLE_STEP_COUNT = 3

interface ParticleRow {
  name: string
  symbol: string
  charge: number
  mass: number
  caption: string
}

/** The three fundamental particles, all values from the library constants. */
export const PARTICLES: readonly ParticleRow[] = [
  {
    name: 'Electron',
    symbol: 'e',
    charge: -ELEMENTARY_CHARGE_C,
    mass: ELECTRON_MASS_KG,
    caption:
      'Electron: the particle in cathode rays. Thomson measured its charge-to-mass ratio in 1897, and Millikan found the charge.',
  },
  {
    name: 'Proton',
    symbol: 'p',
    charge: ELEMENTARY_CHARGE_C,
    mass: PROTON_MASS_KG,
    caption:
      'Proton: the lightest positive ion, obtained from hydrogen gas. It was characterised in 1919.',
  },
  {
    name: 'Neutron',
    symbol: 'n',
    charge: 0,
    mass: NEUTRON_MASS_KG,
    caption:
      'Neutron: no charge, and a mass a little above the proton’s. Chadwick found it in 1932.',
  },
]

/** Charge divided by mass (C kg⁻¹). Zero for the neutron. */
export function chargeToMass(row: ParticleRow): number {
  return row.charge / row.mass
}

/** Signed charge with a relative value in brackets, e.g. "−1.602 × 10⁻¹⁹ (−1)". */
function chargeLabel(charge: number): string {
  if (charge === 0) return '0 (0)'
  const relative = charge > 0 ? '+1' : '−1'
  return `${charge > 0 ? '+' : '−'}${sci(Math.abs(charge), 4).replace(/^−/, '')} (${relative})`
}

/**
 * ParticleTable: Table 2.1 of the chapter, drawn from the library constants.
 * Each Step highlights one particle and says how it was found.
 */
export function ParticleTable({ step }: ParticleTableProps) {
  const active = clampIndex(step, PARTICLE_STEP_COUNT)
  return (
    <div className={styles.wrapper} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 10px' }}>
      <table className={styles.table} data-testid="particle-table" data-step={active}>
        <thead>
          <tr>
            <th scope="col">Particle</th>
            <th scope="col">Charge / C</th>
            <th scope="col">Mass / kg</th>
            <th scope="col">Charge / mass / C kg⁻¹</th>
          </tr>
        </thead>
        <tbody>
          {PARTICLES.map((row, i) => {
            const ratio = chargeToMass(row)
            const isActive = i === active
            return (
              <tr
                key={row.symbol}
                className={`${styles.row} ${isActive ? styles.rowActive : styles.rowDim}`}
                data-active={isActive ? 'true' : 'false'}
              >
                <td>
                  <span style={{ fontStyle: 'italic' }}>{row.symbol}</span> · {row.name}
                </td>
                <td className={styles.num}>{chargeLabel(row.charge)}</td>
                <td className={styles.num}>{sci(row.mass, 5)}</td>
                <td className={styles.num}>{ratio === 0 ? '0' : sci(ratio, 4)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className={styles.tableCaption} aria-live="polite">
        {PARTICLES[active].caption}
      </p>
      <p className={styles.tableFoot}>
        The electron mass here is the rounded 9.1094 × 10⁻³¹ kg used in NCERT equation 2.2. Table 2.1 gives
        9.109382 × 10⁻³¹ kg. The ratio for the electron matches Thomson’s value.
      </p>
    </div>
  )
}
