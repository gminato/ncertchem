import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { BRAND, pageTitle } from '@/lib/brand'
import styles from '@/app/legal.module.css'

export const metadata: Metadata = {
  title: pageTitle('Privacy Policy'),
}

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <div className={styles.column}>
          <header className={styles.head}>
            <p className={styles.eyebrow}>Privacy</p>
            <div className={styles.titleRow}>
              <h1 className={styles.title}>Privacy Policy</h1>
              <span className={styles.draftBadge}>Draft, pending legal review</span>
            </div>
            <p className={styles.lede}>
              {BRAND} is an interactive learning site for Class 11 and 12 chemistry. We keep your learning private,
              collect only what is needed to sync your Progress across devices, and never track you across the web.
            </p>
          </header>

          <div className={styles.content}>
            <section className={styles.section} aria-labelledby="overview-heading">
              <h2 id="overview-heading" className={styles.sectionTitle}>
                Our approach to privacy
              </h2>
              <p className={styles.bodyText}>
                We believe learning should be private. You do not need an Account to use {BRAND}; every Free Section
                is open to explore without signing in. If you do choose to sign in, we collect only the minimum
                information required to carry your Progress from one device to another.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="stored-heading">
              <h2 id="stored-heading" className={styles.sectionTitle}>
                What is stored
              </h2>
              <p className={styles.bodyText}>
                When you use an Account with {BRAND}, we store exactly four pieces of information:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Your email address:</strong> Received from Google when you sign in, used solely to identify
                  your Account.
                </li>
                <li>
                  <strong>Your name:</strong> Your full name and first name received from Google, used to welcome you
                  and label your Account.
                </li>
                <li>
                  <strong>Answered Checks:</strong> A record of each Check you have answered correctly, along with the
                  date and time you answered it.
                </li>
                <li>
                  <strong>Last Section opened:</strong> The Section you opened most recently, along with the timestamp,
                  so that the &ldquo;Continue&rdquo; button can take you right back to where you left off.
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="not-stored-heading">
              <h2 id="not-stored-heading" className={styles.sectionTitle}>
                What is never stored
              </h2>
              <ul className={styles.list}>
                <li>
                  <strong>Wrong answers or attempts:</strong> We never record mistakes, incorrect guesses, or retries.
                </li>
                <li>
                  <strong>Revealed solutions:</strong> Viewing a solution or hint is never recorded in your Progress.
                </li>
                <li>
                  <strong>Grades or scores:</strong> We do not score, rank, or grade Learners. Checks exist solely to
                  confirm your own understanding.
                </li>
                <li>
                  <strong>Teacher or classroom surveillance:</strong> There is no Teacher view or admin dashboard.
                  Your Progress is private to you and cannot be viewed by other Learners or teachers.
                </li>
                <li>
                  <strong>Advertising or third-party tracking:</strong> We do not sell your personal data, run
                  third-party advertisements, or track your browsing activity across other sites.
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="storage-heading">
              <h2 id="storage-heading" className={styles.sectionTitle}>
                Where your data lives
              </h2>
              <p className={styles.bodyText}>
                If you are not signed in, your Progress stays in your browser on this device. It is never transmitted
                to our servers or shared anywhere else.
              </p>
              <p className={styles.bodyText}>
                When you sign in with Google, your Progress is saved to a secure cloud database so it stays in sync
                across your devices. Strict account isolation and access controls ensure that your Account can only ever
                access its own records. A copy is also kept in your browser so you can continue learning seamlessly
                even if your internet connection drops.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="delete-heading">
              <h2 id="delete-heading" className={styles.sectionTitle}>
                How to delete your information
              </h2>
              <p className={styles.bodyText}>
                You have full, immediate control over your data directly on the site:
              </p>
              <ul className={styles.list}>
                <li>
                  <strong>Delete Account:</strong> Visit your{' '}
                  <Link href="/account" className={styles.link}>
                    Account page
                  </Link>
                  , scroll to <em>Delete Account</em>, and type DELETE to confirm. Your Account, along with all its
                  stored Progress (answered Checks and last-opened Section), is deleted immediately and permanently
                  from the database and cleared from your browser.
                </li>
                <li>
                  <strong>Reset Progress:</strong> If you wish to clear your answered Checks and start fresh without
                  deleting your Account, click <em>Reset Progress</em> on your{' '}
                  <Link href="/account" className={styles.link}>
                    Account page
                  </Link>
                  .
                </li>
                <li>
                  <strong>Sign out:</strong> Signing out clears your Progress from the current browser, ensuring your
                  data stays safe if you are using a shared or school computer.
                </li>
              </ul>
            </section>

            <section className={styles.section} aria-labelledby="under-18-heading">
              <h2 id="under-18-heading" className={styles.sectionTitle}>
                Learners under 18
              </h2>
              <div className={styles.callout}>
                <p className={styles.calloutTitle}>Notice for minors and guardians</p>
                <p className={styles.bodyText}>
                  {BRAND} is designed for Class 11 and 12 students, many of whom are under the age of 18. If you are
                  under 18, please ask a parent or legal guardian for guidance and consent before creating an Account
                  or signing in.
                </p>
                <p className={styles.bodyText}>
                  Parental or guardian consent is being sought for underage Learners. We do not claim that parental
                  consent has been verified. We adhere to the principle of data minimization and do not engage in
                  behavioral monitoring, targeted advertising, or profiling of children.
                </p>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="ncert-heading">
              <h2 id="ncert-heading" className={styles.sectionTitle}>
                Independent project notice
              </h2>
              <p className={styles.bodyText}>
                {BRAND} is an independent project. It is not affiliated with, authorized by, or endorsed by the
                National Council of Educational Research and Training (NCERT). We cite NCERT textbook Units and
                Sections so that Learners can easily reference their syllabus, but all Prose, visual animations,
                and interactive simulations are our own original work.
              </p>
            </section>

            <section className={styles.section} aria-labelledby="contact-heading">
              <h2 id="contact-heading" className={styles.sectionTitle}>
                Questions and legal review
              </h2>
              <p className={styles.bodyText}>
                This Privacy Policy is a draft pending final legal review prior to commercial launch. If you have any
                questions about this policy or your personal data, you may reach out to the project maintainers.
              </p>
            </section>

            <nav className={styles.footerNav} aria-label="Legal navigation">
              <Link href="/terms">Terms of Use</Link>
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
