'use client'

import React, { useSyncExternalStore } from 'react'
import styles from './ThemeToggle.module.css'

export interface ThemeToggleProps {
  className?: string
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') {
    return () => {}
  }

  const observer = new MutationObserver(() => callback())
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  })

  const mql = window.matchMedia('(prefers-color-scheme: dark)')
  mql.addEventListener('change', callback)

  return () => {
    observer.disconnect()
    mql.removeEventListener('change', callback)
  }
}

function getSnapshot(): 'light' | 'dark' {
  if (typeof document === 'undefined') return 'light'
  const explicit = document.documentElement.getAttribute('data-theme')
  if (explicit === 'dark' || explicit === 'light') {
    return explicit
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getServerSnapshot(): 'light' | 'dark' {
  return 'light'
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', nextTheme)
    try {
      localStorage.setItem('theme', nextTheme)
    } catch {
      // Ignore errors when localStorage is unavailable
    }
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${styles.toggleButton} ${className ?? ''}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      {isDark ? (
        <>
          {/* Sun icon */}
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4.5" />
            <line x1="12" y1="1.5" x2="12" y2="3.5" />
            <line x1="12" y1="20.5" x2="12" y2="22.5" />
            <line x1="4.5" y1="4.5" x2="6" y2="6" />
            <line x1="18" y1="18" x2="19.5" y2="19.5" />
            <line x1="1.5" y1="12" x2="3.5" y2="12" />
            <line x1="20.5" y1="12" x2="22.5" y2="12" />
            <line x1="4.5" y1="19.5" x2="6" y2="18" />
            <line x1="18" y1="6" x2="19.5" y2="4.5" />
          </svg>
          <span className={styles.label}>Light</span>
        </>
      ) : (
        <>
          {/* Moon icon */}
          <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span className={styles.label}>Dark</span>
        </>
      )}
    </button>
  )
}
