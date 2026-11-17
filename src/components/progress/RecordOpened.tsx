'use client'

import { useEffect } from 'react'
import { recordOpened } from '@/lib/progress/browser-store'

export interface RecordOpenedProps {
  /** The slug of the Section being opened. */
  slug: string
}

/** Notes in the Learner's Progress which Section was opened most recently. Renders nothing. */
export function RecordOpened({ slug }: RecordOpenedProps) {
  useEffect(() => {
    recordOpened(slug)
  }, [slug])
  return null
}
