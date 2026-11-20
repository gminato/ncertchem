import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as runtime from 'react/jsx-runtime'
import { sections } from '#site/content'
import { SiteHeader } from '@/components/ui/SiteHeader'
import { Hook, KeyIdeas, Scrolly, Step } from '@/components/section'
import { Check } from '@/components/check'
import { ConfigBuilder } from '@/components/check/ConfigBuilder'
import { SignInNudge } from '@/components/account/SignInNudge'
import { Paywall } from '@/components/paywall/Paywall'
import { RecordOpened } from '@/components/progress/RecordOpened'
import { SectionStatus } from '@/components/progress/SectionStatus'
import { Simulation } from '@/components/simulation'
import { findUnit } from '@/content/units'
import { getServerEntitlement } from '@/lib/account/server'
import { pageTitle } from '@/lib/brand'
import { parseSegment, prevNext, sectionsForUnit } from '@/lib/unit-nav'
import styles from './section.module.css'

type SectionEntry = (typeof sections)[number]

interface SectionParams {
  cls: string
  unit: string
  slug: string
}

type MdxComponents = Record<string, ComponentType<never>>
type MdxModule = {
  default: (props: { components?: MdxComponents }) => ReactNode
}

/**
 * Renders Velite's compiled MDX body (a function-body string). This follows
 * Velite's recommended pattern: run the code with the JSX runtime, then call
 * the default export with the component map.
 */
function renderMdx(code: string, components: MdxComponents): ReactNode {
  const fn = new Function(code)
  const mod = fn({ ...runtime }) as MdxModule
  return mod.default({ components })
}

function findSection(params: SectionParams): SectionEntry | undefined {
  const cls = parseSegment(params.cls, 'class-')
  const unit = parseSegment(params.unit, 'unit-')
  if (cls === null || unit === null) return undefined
  return sections.find(
    (entry) => entry.class === cls && entry.unit === unit && entry.slug === params.slug
  )
}

/**
 * Paid Sections verify Account cookies on every request, so this route must render
 * dynamically rather than using static/ISR fallback generation (which throws
 * DYNAMIC_SERVER_USAGE when `cookies()` is called on non-prerendered slugs).
 */
export const dynamic = 'force-dynamic'

function PagerAccessBadge({ access }: { access: SectionEntry['access'] }) {
  if (access === 'paid') {
    return (
      <svg
        className={styles.pagerLock}
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        role="img"
        aria-label="Paid Section"
        data-access="paid"
      >
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
    )
  }

  return (
    <span className={styles.pagerFree} data-access="free">
      Free
    </span>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SectionParams>
}): Promise<Metadata> {
  const section = findSection(await params)
  if (!section) return {}
  return {
    title: pageTitle(section.title),
    description: `Class ${section.class}, Unit ${section.unit}, Section ${section.section}: ${section.title}.`,
  }
}

export default async function SectionPage({
  params,
}: {
  params: Promise<SectionParams>
}) {
  const section = findSection(await params)
  if (!section) notFound()

  const isPaid = section.access === 'paid'
  const entitlement = isPaid ? await getServerEntitlement() : null
  const showPaywall = isPaid && !entitlement?.entitled

  const ncertReference =
    section.ncert ??
    `Class ${section.class}, Unit ${section.unit}, Section ${section.section}`

  const unitInfo = findUnit(section.class, section.unit)
  const unitHref = `/class-${section.class}/unit-${section.unit}`
  const { previous, next } = prevNext(
    sectionsForUnit(sections, section.class, section.unit),
    section.slug
  )
  const hrefFor = (entry: SectionEntry) =>
    `/class-${entry.class}/unit-${entry.unit}/${entry.slug}`

  return (
    <>
      <SiteHeader />

      <article className={styles.article}>
        {!showPaywall && <RecordOpened slug={section.slug} />}
        <header className={styles.head}>
          <nav aria-label="Breadcrumb" className={styles.eyebrow}>
            <Link href={unitHref} className={styles.crumb}>
              Class {section.class} · Unit {section.unit}
              {unitInfo ? `: ${unitInfo.title}` : ''}
            </Link>
            <span className={styles.crumbSep} aria-hidden="true">
              /
            </span>
            <span>Section {section.section}</span>
          </nav>
          <h1 className={styles.title}>{section.title}</h1>
        </header>

        {showPaywall ? (
          <>
            {section.hookBody && (
              <div className={styles.body}>
                {renderMdx(section.hookBody, { Hook } as MdxComponents)}
              </div>
            )}
            <Paywall sectionTitle={section.title} />
          </>
        ) : (
          <>
            <div className={styles.body}>
              {renderMdx(section.body, {
                Hook,
                Scrolly,
                Step,
                KeyIdeas,
                Check,
                Simulation,
                ConfigBuilder,
              } as MdxComponents)}
            </div>

            <SectionStatus slug={section.slug} checkNumbers={section.checkNumbers} />
            <SignInNudge slug={section.slug} checkNumbers={section.checkNumbers} />
          </>
        )}

        {(previous || next) && (
          <nav aria-label="Sections in this Unit" className={styles.pager}>
            {previous ? (
              <Link href={hrefFor(previous)} className={styles.pagerLink}>
                <span className={styles.pagerMeta}>
                  <span className={styles.pagerKicker}>← Previous</span>
                  <PagerAccessBadge access={previous.access} />
                </span>
                <span className={styles.pagerTitle}>
                  {previous.section} {previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={hrefFor(next)} className={`${styles.pagerLink} ${styles.pagerNext}`}>
                <span className={`${styles.pagerMeta} ${styles.pagerMetaNext}`}>
                  <PagerAccessBadge access={next.access} />
                  <span className={styles.pagerKicker}>Next →</span>
                </span>
                <span className={styles.pagerTitle}>
                  {next.section} {next.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}

        <footer className={styles.footer}>
          Follows NCERT Chemistry {ncertReference}
        </footer>
      </article>
    </>
  )
}
