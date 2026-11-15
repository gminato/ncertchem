'use client'

import React, { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'
import { formatSignedNumber } from '@/components/redox/geometry'
import {
  classifyTerm,
  parseEquation,
  roleOf,
  type EquationRow,
  type EquationTerm,
  type SpeciesRoles,
} from './balance-equation'
import styles from './balance-equation.module.css'

const ceCache = new Map<string, string>()

/** Renders one mhchem fragment (no surrounding $) with KaTeX, cached per string. */
export function renderCe(ce: string): string {
  const cached = ceCache.get(ce)
  if (cached !== undefined) return cached
  const html = katex.renderToString(`\\ce{${ce}}`, { throwOnError: false })
  if (ceCache.size > 800) ceCache.clear()
  ceCache.set(ce, html)
  return html
}

/** A single chemical formula or equation fragment rendered with KaTeX + mhchem. */
export function Ce({ ce, className }: { ce: string; className?: string }) {
  const html = useMemo(() => renderCe(ce), [ce])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}

export type EquationSize = 'hero' | 'card' | 'compact'

export interface EquationViewProps {
  /** Lib equation string (composite half-reaction strings are split into labelled rows). */
  equation: string
  /** The previous step's equation, used to mark new terms and changed coefficients. */
  previous?: string
  roles?: SpeciesRoles
  size: EquationSize
  /** Changing this value re-mounts the rows so their entrance animations replay. */
  animKey: string | number
  reducedMotion?: boolean
  className?: string
  'data-testid'?: string
}

function TermView({
  term,
  role,
  change,
  reducedMotion,
}: {
  term: EquationTerm
  role: 'ox' | 'red' | null
  change: 'new' | 'coefficient' | 'same'
  reducedMotion: boolean
}) {
  const cls = [
    styles.term,
    role === 'ox' ? styles.termOx : '',
    role === 'red' ? styles.termRed : '',
    term.isElectron ? styles.termElectron : '',
    !reducedMotion && change === 'new' ? styles.isNew : '',
    !reducedMotion && change === 'coefficient' ? styles.isCoeff : '',
  ]
    .filter(Boolean)
    .join(' ')
  return <span className={cls} data-role={role ?? 'none'} data-change={change} dangerouslySetInnerHTML={{ __html: renderCe(term.raw) }} />
}

function SideView({
  terms,
  side,
  prevRow,
  roles,
  reducedMotion,
  arrow = false,
}: {
  terms: EquationTerm[]
  side: 'reactants' | 'products'
  prevRow: EquationRow | undefined
  roles: SpeciesRoles | undefined
  reducedMotion: boolean
  /** Renders the reaction arrow inside the first group, so it never wraps alone. */
  arrow?: boolean
}) {
  return (
    <>
      {terms.map((t, i) => (
        <span key={`${side}-${t.formula}-${i}`} className={styles.group}>
          {arrow && i === 0 && <span className={styles.arrow} aria-hidden="true">→</span>}
          {i > 0 && <span className={styles.op}>+</span>}
          <TermView
            term={t}
            role={roleOf(t.formula, roles)}
            change={classifyTerm(t, side, prevRow)}
            reducedMotion={reducedMotion}
          />
        </span>
      ))}
    </>
  )
}

/**
 * The equation hero: each term is its own KaTeX fragment, so oxidised species
 * (--ox) and reduced species (--red) can be coloured and new or re-weighted
 * terms can animate in when the step changes.
 */
export function EquationView({
  equation,
  previous,
  roles,
  size,
  animKey,
  reducedMotion = false,
  className,
  'data-testid': testId,
}: EquationViewProps) {
  const rows = useMemo(() => parseEquation(equation), [equation])
  const prevRows = useMemo(() => (previous ? parseEquation(previous) : undefined), [previous])

  return (
    <div className={`${styles.eq} ${styles[size]} ${className ?? ''}`} data-testid={testId}>
      {rows.map((row, ri) => {
        const prevRow = prevRows?.[ri]
        return (
          <div key={`${animKey}-${ri}`} className={styles.row}>
            {row.label && <span className={styles.rowLabel}>{row.label}</span>}
            <div className={styles.terms}>
              <SideView
                terms={row.reactants}
                side="reactants"
                prevRow={prevRow}
                roles={roles}
                reducedMotion={reducedMotion}
              />
              <SideView
                terms={row.products}
                side="products"
                prevRow={prevRow}
                roles={roles}
                reducedMotion={reducedMotion}
                arrow
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export interface TallyChip {
  item: string
  left: number
  right: number
  balanced: boolean
}

function chipValue(item: string, n: number): string {
  return item === 'Charge' ? formatSignedNumber(n) : `${n}`
}

/** Compact atom and charge tally: each chip turns green once its two sides agree. */
export function TallyStrip({ items, label = 'Atom and charge tally' }: { items: readonly TallyChip[]; label?: string }) {
  const allBalanced = items.length > 0 && items.every((i) => i.balanced)
  return (
    <div className={styles.tally} role="list" aria-label={label}>
      {items.map((t) => (
        <span
          key={t.item}
          role="listitem"
          className={`${styles.chip} ${t.balanced ? styles.chipOk : styles.chipOpen} ${
            t.item === 'Charge' ? styles.chipCharge : ''
          }`}
          data-balanced={t.balanced ? 'true' : 'false'}
        >
          <span className={styles.chipItem}>{t.item === 'Charge' ? 'Charge' : <Ce ce={t.item} />}</span>
          <span className={styles.chipNums}>
            {chipValue(t.item, t.left)} {t.balanced ? '=' : '≠'} {chipValue(t.item, t.right)}
          </span>
          {t.balanced && <span className={styles.chipTick} aria-hidden="true">✓</span>}
        </span>
      ))}
      {allBalanced && <span className={styles.allOk}>Balanced</span>}
    </div>
  )
}

export interface HalfCardProps {
  tone: 'ox' | 'red'
  title: string
  subtitle: string
  equation: string
  previous?: string
  electrons?: number
  multiplier?: number
  tally: readonly TallyChip[]
  animKey: string | number
  reducedMotion?: boolean
  dimmed?: boolean
}

/** One half-reaction card: tone badge, multiplier and electron chips, the equation and its tally. */
export function HalfCard({
  tone,
  title,
  subtitle,
  equation,
  previous,
  electrons,
  multiplier,
  tally,
  animKey,
  reducedMotion,
  dimmed,
}: HalfCardProps) {
  return (
    <section
      className={`${styles.halfCard} ${tone === 'ox' ? styles.halfOx : styles.halfRed} ${
        dimmed ? styles.halfDimmed : ''
      }`}
      aria-label={title}
      data-testid={`half-card-${tone}`}
    >
      <header className={styles.halfHead}>
        <span className={styles.halfTitle}>{title}</span>
        <span className={styles.halfSub}>{subtitle}</span>
        <span className={styles.halfChips}>
          {multiplier !== undefined && multiplier !== 1 && (
            <span className={styles.multChip}>× {multiplier}</span>
          )}
          {electrons !== undefined && electrons > 0 && (
            <span className={styles.electronChip}>
              {tone === 'ox' ? 'loses' : 'gains'} {electrons} e⁻
            </span>
          )}
        </span>
      </header>
      <EquationView
        equation={equation}
        previous={previous}
        size="card"
        animKey={animKey}
        reducedMotion={reducedMotion}
        className={styles.halfEq}
      />
      <TallyStrip items={tally} label={`${title} tally`} />
    </section>
  )
}

