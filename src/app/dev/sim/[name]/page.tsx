import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Simulation, simulations } from '@/components/simulation'
import styles from '../../../[cls]/[unit]/[slug]/section.module.css'

export const metadata: Metadata = {
  title: 'Simulation preview',
  robots: { index: false, follow: false },
}

/**
 * Development page: one Simulation on its own, at the width of a Section, so a
 * Simulation can be built and screenshot before its Section exists. It is not
 * linked from the site and returns 404 in Vercel production deployments.
 */
export default async function SimPreviewPage({ params }: { params: Promise<{ name: string }> }) {
  if (process.env.VERCEL_ENV === 'production') notFound()
  const { name } = await params
  if (!(name in simulations)) notFound()

  return (
    <article className={styles.article}>
      <div className={styles.body}>
        <Simulation name={name} title={`Preview: ${name}`} />
      </div>
    </article>
  )
}
