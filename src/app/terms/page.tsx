import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { BRAND, pageTitle } from '@/lib/brand'
import styles from '@/app/legal.module.css'

export const metadata: Metadata = {
  title: pageTitle('Terms of Use'),
}

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>Terms</p>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Terms of Use</h1>
              <span className={styles.draftBadge}>Draft, pending legal review</span>
            </div>
            <p className={styles.lede}>
              Welcome to {BRAND}. These terms describe how you may use our site, our visual learning materials, and
              optional Accounts.
            </p>
          </header>

          <div className={styles.content}>
            <section className={styles.section} aria-labelledby="purpose-heading">
              <h2 id="purpose-heading" className={styles.sectionTitle}>
                What {BRAND} is
              </h2>
              <p className={styles.bodyText}>
                {BRAND} is an interactive, visual-first learning resource for Class 11 and Class 12 chemistry. It is
                designed to sit beside your textbook, helping you explore chemistry concepts through animations and
                simulations.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="access-heading">
              <h2 id="access-heading" className={styles.sectionTitle}>
                Access and Accounts
              </h2>
              <ul className={styles.list}>
                <li>
                  <strong>Free Sections:</strong> Every Free Section is open to every Learner without requiring an
                  Account or payment.
                </li>
                <li>
                  <strong>Accounts:</strong> An Account is optional and used solely to keep your Progress in sync
                  across multiple devices. You sign in with Google. You are responsible for keeping your Google
                  credentials secure.
                </li>
                <li>
                  <strong>Account Deletion:</strong> You can permanently delete your Account and all saved Progress at
                  any time from your{' '}
                  <Link href="/account" className={styles.link}>
                    Account page
                  </Link>
                  .
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="content-heading">
              <h2 id="content-heading" className={styles.sectionTitle}>
                Original content and intellectual property
              </h2>
              <p className={styles.bodyText}>
                All explanatory Prose, visual Animations, interactive Simulations, user interface designs, and code on
                this site are original works belonging to {BRAND}.
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Permitted use:</strong> You are encouraged to use {BRAND} for personal study and revision.
                  Teachers are welcome to project our Animations and Simulations in classrooms.
                </li>
                <li>
                  <strong>Restrictions:</strong> You may not scrape, reproduce, mirror, or commercially redistribute
                  any content or code from this site without prior written permission.
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="ncert-affiliation-heading">
              <h2 id="ncert-affiliation-heading" className={styles.sectionTitle}>
                Independent project notice
              </h2>
              <p className={styles.bodyText}>
                {BRAND} is completely independent of NCERT (National Council of Educational Research and Training). We
                cite NCERT curriculum Units and Section numbers to help you navigate alongside your textbook, but we
                do not reproduce NCERT textbook text or diagrams, and we are not affiliated with or endorsed by NCERT.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="disclaimer-heading">
              <h2 id="disclaimer-heading" className={styles.sectionTitle}>
                Educational disclaimer
              </h2>
              <p className={styles.bodyText}>
                {BRAND} is provided as an educational aid. While we work diligently to ensure scientific accuracy and
                pedagogical quality, the site is provided on an &ldquo;as is&rdquo; basis. We make no guarantees
                regarding examination scores, board results, or competitive exam outcomes.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="under-18-terms-heading">
              <h2 id="under-18-terms-heading" className={styles.sectionTitle}>
                Minors and guardians
              </h2>
              <div className={styles.callout}>
                <p className={styles.bodyText}>
                  If you are under 18 years of age, you should review these terms and our Privacy Policy with a parent
                  or legal guardian before signing in or creating an Account.
                </p>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="changes-heading">
              <h2 id="changes-heading" className={styles.sectionTitle}>
                Changes and legal status
              </h2>
              <p className={styles.bodyText}>
                These Terms of Use are a draft pending legal review. We may revise these terms as {BRAND} grows and
                introduces new features. Any updates will be published on this page.
              </p>
            </section>

            <nav className={styles.footerNav} aria-label="Legal navigation">
              <Link href="/privacy">Privacy Policy</Link>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <Link href="/account">Your Account</Link>
              <span className={styles.sep} aria-hidden="true">
                ·
              </span>
              <Link href="/">Home</Link>
            </nav>
          </div>
        </div>
      </main>
    </>
  )
}
