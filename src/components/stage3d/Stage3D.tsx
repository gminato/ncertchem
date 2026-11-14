'use client'

import React, { Component, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { usePrefersReducedMotion } from '@/components/section/usePrefersReducedMotion'
import {
  STAGE_FALLBACK,
  StageColorsContext,
  sameStageColors,
  stageColorsFrom,
  type StageColors,
} from './stage-colors'
import styles from './Stage3D.module.css'

export interface Stage3DProps {
  /** Accessible name of the 3D view. */
  label: string
  /** A 2D drawing shown when WebGL is unavailable or the scene fails to start. */
  fallback: ReactNode
  /** The 3D content: meshes, lights and helpers. Read colours with useStageColors(). */
  children?: ReactNode
  /** Starting camera position. The orbit target is always the origin. */
  cameraPosition?: [number, number, number]
  /** Turn the gentle auto-rotation on. It also stops for reduced motion and after the first drag. */
  autoRotate?: boolean
  /** Short hint shown in the corner until the visitor first interacts. */
  hint?: ReactNode
  className?: string
}

let webGLCache: boolean | undefined

/** True when a WebGL context can be created in this browser. Checked once. */
function webGLAvailable(): boolean {
  if (webGLCache === undefined) {
    try {
      const probe = document.createElement('canvas')
      webGLCache = Boolean(probe.getContext('webgl2') ?? probe.getContext('webgl'))
    } catch {
      webGLCache = false
    }
  }
  return webGLCache
}

const noSubscribe = () => () => {}

/** Tracks the theme tokens: follows data-theme on <html> and the OS colour scheme. */
function useThemeTokens(): StageColors {
  const [colors, setColors] = useState<StageColors | null>(null)

  useEffect(() => {
    const update = () => {
      const next = stageColorsFrom(getComputedStyle(document.documentElement))
      setColors((prev) => (prev && sameStageColors(prev, next) ? prev : next))
    }
    update()

    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', update)

    return () => {
      observer.disconnect()
      scheme.removeEventListener('change', update)
    }
  }, [])

  return colors ?? STAGE_FALLBACK
}

/**
 * Keeps the render loop alive only while the view should move. The Canvas uses
 * frameloop="demand", so nothing is drawn unless something invalidates it. While
 * the view is spinning, each frame asks for the next one; when the view is off
 * screen, hidden, or still, the loop stops by itself.
 */
function FrameDriver({ spinning }: { spinning: boolean }) {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    if (spinning) invalidate()
  }, [spinning, invalidate])

  // Browsers stop animation frames in hidden tabs, so restart the loop on return.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden && spinning) invalidate()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [spinning, invalidate])

  useFrame(() => {
    if (spinning) invalidate()
  })

  return null
}

/** Orbit preset: rotate and zoom with limits, damping, and no panning. */
function StageControls({ spinning, onInteract }: { spinning: boolean; onInteract: () => void }) {
  return (
    <OrbitControls
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.7}
      minDistance={3.4}
      maxDistance={10}
      minPolarAngle={0.3}
      maxPolarAngle={Math.PI - 0.3}
      autoRotate={spinning}
      autoRotateSpeed={0.7}
      onStart={onInteract}
    />
  )
}

/** Shows the 2D fallback if the 3D view throws while starting. */
class StageBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children
  }
}

/**
 * A 3D stage: a transparent WebGL canvas on the card's surface, soft studio
 * lighting, orbit controls, and theme-aware colours. It renders only while it is
 * on screen and the tab is visible. Without WebGL it shows `fallback` instead.
 */
export function Stage3D({
  label,
  fallback,
  children,
  cameraPosition = [3.4, 2.4, 6.9],
  autoRotate = true,
  hint = 'Drag to rotate, scroll to zoom',
  className,
}: Stage3DProps) {
  const support = useSyncExternalStore(
    noSubscribe,
    () => (webGLAvailable() ? 'webgl' : 'none'),
    () => 'checking' as const
  )
  // Assume visible until the observer says otherwise, so a browser without
  // IntersectionObserver still animates.
  const [visible, setVisible] = useState(true)
  const [interacted, setInteracted] = useState(false)
  const [rootEl, setRootEl] = useState<HTMLDivElement | null>(null)
  const reducedMotion = usePrefersReducedMotion()
  const colors = useThemeTokens()

  useEffect(() => {
    if (!rootEl || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '64px',
    })
    observer.observe(rootEl)
    return () => observer.disconnect()
  }, [rootEl])

  const spinning = autoRotate && !reducedMotion && !interacted && visible

  return (
    <div
      ref={setRootEl}
      className={[styles.stage, className].filter(Boolean).join(' ')}
      role="group"
      aria-label={label}
      data-testid="stage3d"
      data-support={support}
    >
      {support === 'webgl' ? (
        <StageBoundary fallback={<StageNote>{fallback}</StageNote>}>
          <StageColorsContext.Provider value={colors}>
            <Canvas
              frameloop="demand"
              dpr={[1, 2]}
              camera={{ position: cameraPosition, fov: 34, near: 0.1, far: 50 }}
              gl={{ alpha: true, antialias: true }}
              onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
              className={styles.canvas}
              data-testid="stage3d-canvas"
            >
              <FrameDriver spinning={spinning} />
              <ambientLight intensity={0.6} />
              <directionalLight position={[3.5, 4.5, 5]} intensity={1.1} />
              <directionalLight position={[-4, -2.5, -3]} intensity={0.35} />
              {children}
              <StageControls spinning={spinning} onInteract={() => setInteracted(true)} />
            </Canvas>
          </StageColorsContext.Provider>
        </StageBoundary>
      ) : support === 'none' ? (
        <StageNote>{fallback}</StageNote>
      ) : null}

      {support === 'webgl' && hint && (
        <p className={styles.hint} data-hidden={interacted ? 'true' : 'false'}>
          {hint}
        </p>
      )}
    </div>
  )
}

/** The 2D fallback, with a short line explaining why it is shown. */
function StageNote({ children }: { children: ReactNode }) {
  return (
    <div className={styles.fallback} data-testid="stage3d-fallback">
      <div className={styles.fallbackArt}>{children}</div>
      <p className={styles.fallbackNote}>3D view needs WebGL, so a flat drawing is shown.</p>
    </div>
  )
}
