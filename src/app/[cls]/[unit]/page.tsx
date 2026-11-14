import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { sections } from '#site/content'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { findUnit, UNITS, type UnitInfo } from '@/content/units'
import { parseSegment, sectionsForUnit } from '@/lib/unit-nav'
import styles from './unit.module.css'

interface UnitParams {
  cls: string
  unit: string
}

interface ResolvedUnit {
  cls: number
  unit: number
  info: UnitInfo
}

function resolveUnit(params: UnitParams): ResolvedUnit | undefined {
  const cls = parseSegment(params.cls, 'class-')
  const unit = parseSegment(params.unit, 'unit-')
  if (cls === null || unit === null) return undefined
  const info = findUnit(cls, unit)
  return info ? { cls, unit, info } : undefined
}

export function generateStaticParams(): UnitParams[] {
  return UNITS.map((u) => ({ cls: `class-${u.class}`, unit: `unit-${u.unit}` }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<UnitParams>
}): Promise<Metadata> {
  const resolved = resolveUnit(await params)
  if (!resolved) return {}
  return {
    title: `${resolved.info.title} · Chemistry, Revisited`,
    description: `Class ${resolved.cls}, Unit ${resolved.unit}: ${resolved.info.title}.`,
  }
}

export default async function UnitPage({ params }: { params: Promise<UnitParams> }) {
  const resolved = resolveUnit(await params)
  if (!resolved) notFound()

  const { cls, unit, info } = resolved
  const list = sectionsForUnit(sections, cls, unit)

  return (
    <>
      <header className={styles.topbar}>
        <Link href="/" className={styles.siteName}>
          Chemistry, Revisited
        </Link>
        <ThemeToggle />
      </header>

      <main className={styles.page}>
        <header className={styles.head}>
          <p className={styles.eyebrow}>
            Class {cls} · Unit {unit}
          </p>
          <h1 className={styles.title}>{info.title}</h1>
        </header>

        {list.length > 0 ? (
          <ol className={styles.list} aria-label="Sections">
            {list.map((section) => (
              <li key={section.slug}>
                <Link
                  href={`/class-${section.class}/unit-${section.unit}/${section.slug}`}
                  className={styles.row}
                >
                  <span className={styles.number}>{section.section}</span>
                  <span className={styles.text}>
                    <span className={styles.rowTitle}>{section.title}</span>
                    {section.summary && <span className={styles.rowSummary}>{section.summary}</span>}
                  </span>
                  <span className={styles.arrow} aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className={styles.empty}>The Sections of this Unit are being written.</p>
        )}
      </main>
    </>
  )
}
