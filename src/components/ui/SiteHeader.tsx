import type { ReactNode } from 'react'
import Link from 'next/link'
import { BRAND_PARTS } from '@/lib/brand'
import { ThemeToggle } from './ThemeToggle'
import styles from './SiteHeader.module.css'

export interface SiteHeaderProps {
  /** Links for this page, shown between the wordmark and the theme toggle. */
  children?: ReactNode
}

/** The brand mark: a small tile in the manner of a periodic-table cell. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true" focusable="false">
      <rect width="28" height="28" rx="7" fill="var(--accent)" />
      <text
        x="14"
        y="19.2"
        textAnchor="middle"
        fontFamily="var(--font-sans)"
        fontSize="14"
        fontWeight="700"
        letterSpacing="-0.4"
        fill="var(--accent-fg)"
      >
        Nc
      </text>
    </svg>
  )
}

/** The product name in two tones, so the long word reads as its two halves. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={`${styles.wordmark} ${className ?? ''}`}>
      {BRAND_PARTS[0]}
      <span className={styles.wordmarkAccent}>{BRAND_PARTS[1]}</span>
    </span>
  )
}

/** The bar at the top of every page: the wordmark links home, and the theme toggle sits on the right. */
export function SiteHeader({ children }: SiteHeaderProps) {
  return (
    <header className={styles.topbar}>
      <Link href="/" className={styles.brand}>
        <BrandMark className={styles.mark} />
        <Wordmark />
      </Link>
      {children && (
        <nav aria-label="On this page" className={styles.nav}>
          {children}
        </nav>
      )}
      <ThemeToggle />
    </header>
  )
}
