'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { findUnit } from '@/content/units'
import { parseSegment } from '@/lib/unit-nav'
import styles from './NotFoundUnitHint.module.css'

/**
 * On the 404 page: when the address sits inside a real Unit (for example, a Section whose slug
 * was renamed), says which Unit it was in and links to it. Renders nothing otherwise.
 */
export function NotFoundUnitHint() {
  const pathname = usePathname() ?? ''
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length < 3) return null

  const cls = parseSegment(parts[0], 'class-')
  const unit = parseSegment(parts[1], 'unit-')
  if (cls === null || unit === null) return null

  const info = findUnit(cls, unit)
  if (!info) return null

  return (
    <div className={styles.hint} data-testid="not-found-unit-hint">
      <p className={styles.text}>
        This address is inside Class {info.class}, Unit {info.unit}: {info.title}. The Section may have been
        renamed.
      </p>
      <Link href={`/class-${info.class}/unit-${info.unit}`} className={styles.link}>
        Open Unit {info.unit}
      </Link>
    </div>
  )
}
