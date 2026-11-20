'use client'

import { useEffect, useRef, useState } from 'react'
import { signInWithGoogle } from '@/lib/account/account'
import styles from './GoogleSignInButton.module.css'

/**
 * Google's own "Continue with Google" button. Google renders it, and only Google's button can
 * open its sign-in popup. The ID token it returns goes to Supabase with the raw nonce; Google is
 * given only the nonce's SHA-256, so a stolen token cannot be replayed.
 */

interface GoogleCredential {
  credential: string
}

interface GoogleIdApi {
  initialize(options: Record<string, unknown>): void
  renderButton(parent: HTMLElement, options: Record<string, unknown>): void
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleIdApi } }
  }
}

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ''
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

let scriptLoading: Promise<GoogleIdApi> | null = null

function loadGoogle(): Promise<GoogleIdApi> {
  if (scriptLoading) return scriptLoading
  scriptLoading = new Promise<GoogleIdApi>((resolve, reject) => {
    const ready = () => {
      const api = window.google?.accounts?.id
      if (api) resolve(api)
      else reject(new Error('Google sign-in did not load'))
    }
    if (window.google?.accounts?.id) return ready()
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = ready
    script.onerror = () => reject(new Error('Google sign-in did not load'))
    document.head.appendChild(script)
  }).catch((error: unknown) => {
    scriptLoading = null
    throw error
  })
  return scriptLoading
}

function randomNonce(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Google keeps one configuration per page, so every button on the page shares it. The callback
// reports to whichever button is mounted.
type Outcome = 'working' | 'failed'
const outcomeListeners = new Set<(outcome: Outcome) => void>()
let configured: Promise<GoogleIdApi> | null = null

function configure(): Promise<GoogleIdApi> {
  if (configured) return configured
  configured = (async () => {
    const api = await loadGoogle()
    const nonce = randomNonce()
    api.initialize({
      client_id: CLIENT_ID,
      nonce: await sha256Hex(nonce),
      ux_mode: 'popup',
      auto_select: false,
      itp_support: true,
      use_fedcm_for_button: true,
      callback: async ({ credential }: GoogleCredential) => {
        for (const listener of outcomeListeners) listener('working')
        const { ok } = await signInWithGoogle(credential, nonce)
        // A nonce is good for one sign-in. After a failure the next try gets a new one.
        configured = null
        if (!ok) for (const listener of outcomeListeners) listener('failed')
      },
    })
    return api
  })().catch((error: unknown) => {
    configured = null
    throw error
  })
  return configured
}

function siteTheme(): 'dark' | 'light' {
  const chosen = document.documentElement.getAttribute('data-theme')
  if (chosen === 'dark' || chosen === 'light') return chosen
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export interface GoogleSignInButtonProps {
  /** The button's width in CSS pixels. Google allows 200 to 400. */
  width?: number
}

export function GoogleSignInButton({ width = 280 }: GoogleSignInButtonProps) {
  const holder = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'working' | 'failed' | 'unavailable'>('loading')
  // Each failed sign-in renders the button again, under a fresh nonce.
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let alive = true
    const listener = (outcome: Outcome) => {
      if (!alive) return
      setStatus(outcome)
      if (outcome === 'failed') setAttempt((n) => n + 1)
    }
    outcomeListeners.add(listener)
    configure()
      .then((api) => {
        if (!alive || !holder.current) return
        holder.current.replaceChildren()
        api.renderButton(holder.current, {
          type: 'standard',
          theme: siteTheme() === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: Math.max(200, Math.min(400, width)),
        })
        setStatus((current) => (current === 'loading' ? 'ready' : current))
      })
      .catch(() => {
        if (alive) setStatus('unavailable')
      })
    return () => {
      alive = false
      outcomeListeners.delete(listener)
    }
  }, [width, attempt])

  return (
    <div className={styles.wrap} data-testid="google-sign-in" data-status={status}>
      <div ref={holder} className={styles.holder} style={{ width, minHeight: 44 }} aria-busy={status === 'loading'} />
      <p role="status" aria-live="polite" className={styles.message}>
        {status === 'working' && 'Signing you in…'}
        {status === 'failed' && 'Sign-in did not finish. Please try again.'}
        {status === 'unavailable' &&
          'Google sign-in could not load. If you opened this page inside another app, open it in Chrome instead.'}
      </p>
    </div>
  )
}
