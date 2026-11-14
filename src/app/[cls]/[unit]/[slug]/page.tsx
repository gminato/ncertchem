import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as runtime from 'react/jsx-runtime'
import { sections } from '#site/content'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Hook, KeyIdeas, Scrolly, Step } from '@/components/section'
import { Check } from '@/components/check'
import { Simulation } from '@/components/simulation'
import { findUnit } from '@/content/units'
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

export function generateStaticParams(): SectionParams[] {
  return sections.map((entry) => ({
    cls: `class-${entry.class}`,
    unit: `unit-${entry.unit}`,
    slug: entry.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<SectionParams>
}): Promise<Metadata> {
  const section = findSection(await params)
  if (!section) return {}
  return {
    title: `${section.title} · Chemistry, Revisited`,
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
      <header className={styles.topbar}>
        <Link href="/" className={styles.siteName}>
          Chemistry, Revisited
        </Link>
        <ThemeToggle />
      </header>

      <article className={styles.article}>
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

        <div className={styles.body}>
          {renderMdx(section.body, {
            Hook,
            Scrolly,
            Step,
            KeyIdeas,
            Check,
            Simulation,
          } as MdxComponents)}
        </div>

        {(previous || next) && (
          <nav aria-label="Sections in this Unit" className={styles.pager}>
            {previous ? (
              <Link href={hrefFor(previous)} className={styles.pagerLink}>
                <span className={styles.pagerKicker}>← Previous</span>
                <span className={styles.pagerTitle}>
                  {previous.section} {previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link href={hrefFor(next)} className={`${styles.pagerLink} ${styles.pagerNext}`}>
                <span className={styles.pagerKicker}>Next →</span>
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
