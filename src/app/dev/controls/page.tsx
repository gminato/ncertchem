import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check } from '@/components/check'
import { ControlsDemo } from './ControlsDemo'
import styles from './controls.module.css'

export const metadata: Metadata = {
  title: 'Controls and Checks',
  robots: { index: false, follow: false },
}

/**
 * Development page: every control primitive and both Check modes, in one place,
 * for visual and keyboard review. It is not linked from the site and returns 404
 * in Vercel production deployments.
 */
export default function ControlsPage() {
  if (process.env.VERCEL_ENV === 'production') {
    notFound()
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Development</p>
        <h1 className={styles.title}>Controls and Checks</h1>
        <p className={styles.lead}>
          The primitives used by Simulations and Checks, in their default states.
        </p>
      </header>

      <ControlsDemo />

      <section className={styles.checks} aria-labelledby="demo-checks">
        <h2 id="demo-checks" className={styles.panelTitle}>
          Check
        </h2>
        <Check
          n="dev-choice"
          question="Which particle carries the negative charge in an atom?"
          options={['Proton', 'Neutron', 'Electron', 'Nucleus']}
          answer={2}
          explanation={
            <p>
              Electrons carry a negative charge and occupy the space around the nucleus. Protons
              are positive and neutrons carry no charge.
            </p>
          }
        />
        <Check
          n="dev-numeric"
          numeric
          question="A solution contains 0.40 mol of solute in 1.0 L. What is its molarity?"
          answer={0.4}
          tolerance={0.01}
          unit="M"
          explanation={
            <p>
              Molarity is moles of solute per litre of solution: 0.40 mol ÷ 1.0 L = 0.40 M.
            </p>
          }
        />
      </section>
    </main>
  )
}
