import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { NotFoundUnitHint } from '@/components/ui/NotFoundUnitHint'
import { pageTitle } from '@/lib/brand'
import styles from './not-found.module.css'

export const metadata: Metadata = {
  title: pageTitle('Page not found'),
}

/** Shown for any address the site does not serve. It stays a real 404 and does not redirect. */
export default function NotFound() {
  return (
    <>
      <SiteHeader />

      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>404</p>
            <h1 className={styles.title}>This page does not exist</h1>
            <p className={styles.lede}>The address may be mistyped, or the page may have moved.</p>
            <NotFoundUnitHint />
          </header>

          <div className={styles.ctaRow}>
            <Link href="/" className={`${styles.cta} ${styles.ctaPrimary}`}>
              Go to home
            </Link>
            <Link href="/#syllabus" className={`${styles.cta} ${styles.ctaSecondary}`}>
              See the Syllabus Map
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
