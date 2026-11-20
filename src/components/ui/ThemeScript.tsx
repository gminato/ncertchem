'use client'

import { useLayoutEffect, useRef } from 'react'
import { useServerInsertedHTML } from 'next/navigation'

const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`

/**
 * Injects the pre-paint theme script via `useServerInsertedHTML` rather than as a
 * hydrated `<head><script>` child. Browser extensions (such as popup/ad blockers)
 * commonly prepend `<script src="chrome-extension://...">` into `<head>` before
 * hydration; keeping the theme script outside React's hydrated `<head>` tree avoids
 * hydration mismatches while still setting `data-theme` synchronously before first paint.
 */
export function ThemeScript() {
  const inserted = useRef(false)

  useServerInsertedHTML(() => {
    if (inserted.current) return null
    inserted.current = true
    return <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
  })

  // Re-apply stored theme in case React Strict Mode clears attributes on dev remount.
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem('theme')
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved)
      }
    } catch {
      // Ignore when localStorage is unavailable.
    }
  }, [])

  return null
}
