'use client'

import React, { Component, createContext, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Vector3 } from 'three'
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
  /**
   * Starting camera position. The orbit target is always the origin. The default is slightly
   * elevated, so that a ring reads as a ring, and far enough out that axis letters at the
   * default StageAxes length stay inside the frame.
   */
  cameraPosition?: [number, number, number]
  /**
   * A controlled camera position. Unlike `cameraPosition` (used once, when the canvas starts), the
   * camera eases to this position whenever it changes, and the orbit target stays at the origin.
   * Leave it unset for a free camera.
   */
  cameraTo?: [number, number, number]
  /** Turn the gentle auto-rotation on (opt-in). It also stops for reduced motion and after the first drag. */
  autoRotate?: boolean
  /** Short hint shown in the corner until the visitor first interacts. */
  hint?: ReactNode
  className?: string
}

/** Default camera: elevated, with all axis letters inside the frame. */
export const DEFAULT_CAMERA: [number, number, number] = [4.4, 2.4, 5.2]

/**
 * The page element that holds the stage. 3D labels (drei Html) attach here, so that they are drawn
 * over the canvas. Without it, drei appends them to the canvas element, where they never show.
 */
export const StagePortalContext = createContext<RefObject<HTMLElement | null> | null>(null)

/** The stage's portal, for Html labels inside it. Null outside a Stage3D. */
export function useStagePortal(): RefObject<HTMLElement> | null {
  return useContext(StagePortalContext) as RefObject<HTMLElement> | null
}

/** Eases the camera towards `position` whenever it changes, and aims it at the origin. */
function CameraEase({ position }: { position: [number, number, number] }) {
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)
  const goal = useMemo(() => new Vector3(...position), [position])
  const moving = useRef(true)

  useEffect(() => {
    goal.set(position[0], position[1], position[2])
    moving.current = true
    invalidate()
  }, [goal, position, invalidate])

  useFrame(() => {
    if (!moving.current) return
    camera.position.lerp(goal, 0.14)
    camera.lookAt(0, 0, 0)
    if (camera.position.distanceTo(goal) < 0.002) {
      camera.position.copy(goal)
      camera.lookAt(0, 0, 0)
      moving.current = false
    } else {
      invalidate()
    }
  })
  return null
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
  cameraPosition = DEFAULT_CAMERA,
  cameraTo,
  autoRotate = false,
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
  const portalRef = useMemo(() => ({ current: rootEl }), [rootEl])

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
           <StagePortalContext.Provider value={portalRef}>
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
              {cameraTo && <CameraEase position={cameraTo} />}
              <ambientLight intensity={0.6} />
              <directionalLight position={[3.5, 4.5, 5]} intensity={1.1} />
              <directionalLight position={[-4, -2.5, -3]} intensity={0.35} />
              {children}
              <StageControls spinning={spinning} onInteract={() => setInteracted(true)} />
            </Canvas>
           </StagePortalContext.Provider>
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
