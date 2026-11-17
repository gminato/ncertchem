'use client'

import Link from 'next/link'
import { continueTarget, type SectionChecks } from '@/lib/progress/rules'
import { useProgress } from '@/lib/progress/useProgress'

/** A Section as the hero needs it: its Checks, where it lives, and its name. */
export interface ContinueSection extends SectionChecks {
  href: string
  section: string
  title: string
}

export interface ContinueLinkProps {
  /** Every Section of the site, in book order. */
  sections: readonly ContinueSection[]
  /** The button classes of the hero's primary button. */
  className?: string
}

const START_HREF = '/class-11/unit-1'

/**
 * The hero's primary button. It opens the Section the Learner was in last, or Unit 1 when there is
 * no Progress to continue from.
 */
export function ContinueLink({ sections, className }: ContinueLinkProps) {
  const progress = useProgress()
  const target = continueTarget(progress, sections)

  if (!target) {
    return (
      <Link href={START_HREF} className={className} data-testid="hero-cta">
        Start with Unit 1
        <span aria-hidden="true">→</span>
      </Link>
    )
  }

  return (
    <Link
      href={target.href}
      className={className}
      data-testid="hero-cta"
      aria-label={`Continue with Section ${target.section}: ${target.title}`}
    >
      Continue with Section {target.section}
      <span aria-hidden="true">→</span>
    </Link>
  )
}
