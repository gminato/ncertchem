'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

/**
 * Open and close state for a button that shows a popover below it. The popover closes on Escape
 * (focus goes back to the button) and on a click or tap outside both of them.
 */
export function usePopover<B extends HTMLElement = HTMLButtonElement>() {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<B>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const popoverId = useId()

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close(true)
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      close()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointer)
    }
  }, [open, close])

  return {
    open,
    toggle: () => setOpen((value) => !value),
    close,
    buttonRef,
    popoverRef,
    buttonProps: { 'aria-expanded': open, 'aria-controls': popoverId },
    popoverId,
  }
}
