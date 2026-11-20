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
            </div>
            <p className={styles.updatedDate}>Last updated: November 20, 2026</p>
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
                  <strong>Accounts:</strong> An Account is optional for Free Sections and used to keep your Progress in
                  sync across multiple devices and to hold a Subscription. You sign in with Google. You are responsible
                  for keeping your Google credentials secure.
                </li>
                <li>
                  <strong>Account Deletion:</strong> You can permanently delete your Account and all saved Progress at
                  any time from your{' '}
                  <Link href="/account" className={styles.link}>
                    Account page
                  </Link>
                  . Deleting your Account also ends any active Subscription Entitlement tied to it.
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="subscription-terms-heading">
              <h2 id="subscription-terms-heading" className={styles.sectionTitle}>
                Paid Sections and 365-Day Subscription
              </h2>
              <p className={styles.bodyText}>
                Approximately 30–40% of Sections across {BRAND} are Free Sections and remain open without payment. The
                remaining Paid Sections require an active Subscription linked to your Account. See our{' '}
                <Link href="/pricing" className={styles.link}>
                  Pricing page
                </Link>{' '}
                for full details.
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Price and validity:</strong> A Subscription costs ₹999 for a fixed 365-day Entitlement that
                  unlocks all published Paid Sections across Class 11, as well as Class 12 Units as they are published
                  during your 365-day Entitlement.
                </li>
                <li>
                  <strong>Non-recurring payment:</strong> Each Subscription is a single one-time payment processed
                  through Razorpay. It is non-recurring, with no automatic renewal and no auto-debit.
                </li>
                <li>
                  <strong>Expiry and Progress:</strong> When your 365-day Entitlement expires, Paid Sections return to
                  showing the Paywall, while all Free Sections remain open and your saved Progress stays intact on your
                  Account.
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="parental-payment-heading">
              <h2 id="parental-payment-heading" className={styles.sectionTitle}>
                Parental or Guardian Consent for Payments
              </h2>
              <div className={styles.callout}>
                <p className={styles.bodyText}>
                  {BRAND} operates on a single Account model — we do not create separate parent Accounts. If you are a
                  Learner under 18 years of age, a parent or legal guardian must review these Terms of Use and our{' '}
                  <Link href="/privacy" className={styles.link}>
                    Privacy Policy
                  </Link>{' '}
                  and authorize or complete the Subscription payment on your behalf (for example, by scanning the UPI QR
                  code shown on the Learner&rsquo;s screen or completing card checkout).
                </p>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="refund-policy-heading">
              <h2 id="refund-policy-heading" className={styles.sectionTitle}>
                Refund Policy and Technical Failures
              </h2>
              <p className={styles.bodyText}>
                Because approximately 30–40% of Sections are Free Sections available for thorough evaluation beforehand,
                Subscriptions are <strong>non-refundable once activated</strong>.
              </p>
              <p className={styles.bodyText}>
                <strong>Statutory exception for technical failures:</strong> Nothing in this policy limits your right to
                a remedy for technical or billing failures. If you experience a duplicate charge, or if your payment is
                deducted without activating your Entitlement, email{' '}
                <a href="mailto:support@ncertchem.com" className={styles.link}>
                  support@ncertchem.com
                </a>{' '}
                or our Grievance Officer at{' '}
                <a href="mailto:grievance@ncertchem.com" className={styles.link}>
                  grievance@ncertchem.com
                </a>{' '}
                with your payment reference (such as your Razorpay payment ID or UPI transaction reference). Confirmed
                duplicate charges or undelivered Entitlements will be resolved or refunded within 7 business days.
              </p>
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

            <section className={styles.section} aria-labelledby="grievance-officer-heading">
              <h2 id="grievance-officer-heading" className={styles.sectionTitle}>
                Grievance Officer
              </h2>
              <div className={styles.callout}>
                <p className={styles.bodyText}>
                  In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code)
                  Rules and the Consumer Protection (E-Commerce) Rules, the designated Grievance Officer for {BRAND} is:
                </p>
                <ul className={styles.list}>
                  <li>
                    <strong>Name:</strong> Harshit Gupta
                  </li>
                  <li>
                    <strong>Designation:</strong> Grievance Officer, {BRAND}
                  </li>
                  <li>
                    <strong>Grievance email:</strong>{' '}
                    <a href="mailto:grievance@ncertchem.com" className={styles.link}>
                      grievance@ncertchem.com
                    </a>
                  </li>
                  <li>
                    <strong>General and billing support:</strong>{' '}
                    <a href="mailto:support@ncertchem.com" className={styles.link}>
                      support@ncertchem.com
                    </a>
                  </li>
                  <li>
                    <strong>Location:</strong> Bengaluru, Karnataka, India
                  </li>
                  <li>
                    <strong>Response and resolution timeline:</strong> All grievances and payment complaints will be
                    acknowledged within 48 hours and resolved within 30 days of receipt.
                  </li>
                </ul>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="governing-law-heading">
              <h2 id="governing-law-heading" className={styles.sectionTitle}>
                Governing law
              </h2>
              <p className={styles.bodyText}>
                These Terms of Use are governed by the laws of India. Any disputes arising out of or relating to {BRAND}{' '}
                or these Terms shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka,
                India.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="changes-heading">
              <h2 id="changes-heading" className={styles.sectionTitle}>
                Changes to these terms
              </h2>
              <p className={styles.bodyText}>
                We may revise these Terms of Use as {BRAND} grows and introduces new features. Any updates will be
                published on this page with an updated date. For questions about these terms, email{' '}
                <a href="mailto:support@ncertchem.com" className={styles.link}>
                  support@ncertchem.com
                </a>
                .
              </p>
            </section>

            <nav className={styles.footerNav} aria-label="Legal navigation">
              <Link href="/pricing">Pricing</Link>
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
        </div>
      </main>
    </>
  )
}
