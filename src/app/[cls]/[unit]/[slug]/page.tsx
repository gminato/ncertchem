import type { ComponentType, ReactNode } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import * as runtime from 'react/jsx-runtime'
import { sections } from '#site/content'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Hook, KeyIdeas, Scrolly, Step } from '@/components/section'
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

/** Parses a URL segment such as "class-11" or "unit-2" against its prefix. */
function parseSegment(segment: string, prefix: string): number | null {
  if (!segment.startsWith(prefix)) return null
  const value = Number(segment.slice(prefix.length))
  return Number.isInteger(value) ? value : null
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
          <p className={styles.eyebrow}>
            Class {section.class} · Unit {section.unit} · Section {section.section}
          </p>
          <h1 className={styles.title}>{section.title}</h1>
        </header>

        <div className={styles.body}>
          {renderMdx(section.body, { Hook, Scrolly, Step, KeyIdeas } as MdxComponents)}
        </div>

        <footer className={styles.footer}>
          Follows NCERT Chemistry {ncertReference}
        </footer>
      </article>
    </>
  )
}
