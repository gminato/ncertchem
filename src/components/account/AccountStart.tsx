'use client'

import { useEffect } from 'react'
import { startAccount } from '@/lib/account/account'

/** Starts following the Learner's sign-in state. Mounted once, in the root layout. Renders nothing. */
export function AccountStart() {
  useEffect(() => {
    startAccount()
  }, [])
  return null
}
