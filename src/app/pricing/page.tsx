import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { BRAND, pageTitle } from '@/lib/brand'
import { PricingCta } from './PricingCta'
import styles from './pricing.module.css'

export const metadata: Metadata = {
  title: pageTitle('Pricing'),
}

export default function PricingPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>Pricing</p>
            <h1 className={styles.title}>One straightforward Subscription for all of Class 11 and 12</h1>
            <p className={styles.lede}>
              Explore ~35–40% of {BRAND} through Free Sections first — no Account or payment needed. When you are ready
              for every Paid Section across the full syllabus, unlock all Units for 365 days with a single one-time
              payment.
            </p>
          </header>

          <section className={styles.passCard} aria-labelledby="pass-heading">
            <div className={styles.passHeader}>
              <div className={styles.passTitleGroup}>
                <h2 id="pass-heading" className={styles.passTitle}>
                  365-Day All-Access Subscription
                </h2>
                <p className={styles.passSubtitle}>
                  All published Paid Sections across Class 11 — plus Class 12 Units as they publish — tied to your
                  Account.
                </p>
              </div>
              <div className={styles.priceLockup}>
                <div className={styles.priceRow}>
                  <span className={styles.priceAmount}>₹999</span>
                  <span className={styles.pricePeriod}>/ year</span>
                </div>
                <p className={styles.priceNote}>Single one-time payment for 365 days</p>
              </div>
            </div>

            <div className={styles.nonRecurringStrip}>
              <span className={styles.stripItem}>
                <span className={styles.stripDot} aria-hidden="true" />
                Non-recurring — no auto-debit
              </span>
              <span className={styles.stripItem}>
                <span className={styles.stripDot} aria-hidden="true" />
                No automatic renewal
              </span>
              <span className={styles.stripItem}>
                <span className={styles.stripDot} aria-hidden="true" />
                Zero ads or tracking
              </span>
            </div>

            <ul className={styles.passIncludes}>
              <li>
                Full access to all published Paid Sections across Class 11, plus Class 12 Units as they are published
                during your 365 days.
              </li>
              <li>All Free Sections (~35–40% of Sections across every Unit) remain open even without a Subscription.</li>
              <li>Your Progress stays saved to your Account across phones, tablets, and laptops.</li>
              <li>When 365 days end, your Progress is preserved and nothing is charged automatically.</li>
            </ul>

            <PricingCta />
          </section>

          <section className={styles.section} aria-labelledby="pedagogy-heading">
            <h2 id="pedagogy-heading" className={styles.sectionTitle}>
              What you get inside every Section
            </h2>
            <p className={styles.sectionLead}>
              {BRAND} is built to sit beside your NCERT textbook and make abstract chemistry visible, interactive, and
              calm to study.
            </p>
            <div className={styles.pedagogyGrid}>
              <article className={styles.pedagogyCard}>
                <h3 className={styles.cardTitle}>Scrolly Animations</h3>
                <p className={styles.cardBody}>
                  Visual Animations pinned beside original Prose, advancing Step by Step as you scroll so you see
                  orbitals, bonds, equilibria, and reaction pathways unfold at your own pace.
                </p>
              </article>

              <article className={styles.pedagogyCard}>
                <h3 className={styles.cardTitle}>Interactive Simulations</h3>
                <p className={styles.cardBody}>
                  Hands-on Simulations where you adjust sliders, reagents, temperature, or concentrations and watch the
                  chemical system respond immediately.
                </p>
              </article>

              <article className={styles.pedagogyCard}>
                <h3 className={styles.cardTitle}>Ungraded Checks with Progress sync</h3>
                <p className={styles.cardBody}>
                  Short Checks embedded in every Section let you confirm understanding without pressure. Wrong attempts
                  and revealed solutions are never recorded, and your Progress syncs cleanly across devices.
                </p>
              </article>

              <article className={styles.pedagogyCard}>
                <h3 className={styles.cardTitle}>Key Ideas &amp; NCERT references</h3>
                <p className={styles.cardBody}>
                  Every Section opens with a Hook and closes with concise Key Ideas mapped to NCERT Unit and Section
                  numbers for quick board-exam revision.
                </p>
              </article>

              <article className={`${styles.pedagogyCard} ${styles.pedagogyCardWide}`}>
                <h3 className={styles.cardTitle}>~35–40% Free Sections across every Unit</h3>
                <p className={styles.cardBody}>
                  Foundational Sections and Flagship Simulations across every Unit are Free Sections — open in full with
                  no Account required — so every Learner and family can evaluate {BRAND} thoroughly before deciding to
                  subscribe.
                </p>
              </article>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="payment-methods-heading">
            <h2 id="payment-methods-heading" className={styles.sectionTitle}>
              Accepted payment methods
            </h2>
            <div className={styles.callout}>
              <p className={styles.bodyText}>
                Payments are processed securely through <strong>Razorpay</strong> as a single one-time charge of ₹999:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>UPI QR:</strong> Scan a UPI QR code directly from the Learner&rsquo;s screen using any UPI app
                  — designed so a parent or guardian can complete payment easily on the Learner&rsquo;s Account.
                </li>
                <li>
                  <strong>Debit and credit cards:</strong> Major Indian debit and credit cards are accepted.
                </li>
                <li>
                  <strong>International cards:</strong> Supported via Razorpay for Learners studying outside India.
                </li>
              </ul>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="parental-consent-heading">
            <h2 id="parental-consent-heading" className={styles.sectionTitle}>
              Parental or guardian consent for Learners under 18
            </h2>
            <div className={styles.callout}>
              <p className={styles.calloutEyebrow}>Pre-payment notice</p>
              <p className={styles.bodyText}>
                {BRAND} uses a single Account model — there is no separate parent Account. If the Learner is under 18
                years of age, a parent or legal guardian must review our{' '}
                <Link href="/terms" className={styles.link}>
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className={styles.link}>
                  Privacy Policy
                </Link>{' '}
                and authorize or complete the ₹999 payment (for example, by scanning the UPI QR code on the
                Learner&rsquo;s screen).
              </p>
            </div>
          </section>

          <section className={styles.section} aria-labelledby="refund-heading">
            <h2 id="refund-heading" className={styles.sectionTitle}>
              Non-refundable terms and technical-failure protection
            </h2>
            <div className={styles.callout}>
              <p className={styles.bodyText}>
                Because roughly 35–40% of Sections across every Unit are Free Sections open to try thoroughly before
                paying, a 365-Day All-Access Subscription is <strong>non-refundable once activated</strong>.
              </p>
              <p className={styles.bodyText}>
                This never affects your statutory remedy for technical failures: if you are charged twice in error or
                your payment is deducted without activating your Entitlement, we will activate your Subscription or
                refund the failed or duplicate charge within 7 business days once verified. Full commercial terms and
                Grievance Officer details are published in our{' '}
                <Link href="/terms" className={styles.link}>
                  Terms of Use
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className={styles.link}>
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </section>

          <nav className={styles.footerNav} aria-label="Pricing navigation">
            <Link href="/terms">Terms of Use</Link>
            <span className={styles.sep} aria-hidden="true">
              ·
            </span>
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
      </main>
    </>
  )
}
