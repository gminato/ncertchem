'use client'

import { useEffect, useRef, useState } from 'react'
import { Segmented, Slider } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import type { SimulationProps } from '@/components/simulation/registry'
import { useIsActive } from '@/components/simulation/useIsActive'
import { celsiusToKelvin, waterPhaseFractions, waterStateAt, type WaterState } from '@/lib/chem/states'
import {
  POOL,
  mulberry32,
  createParticles,
  settleParticles,
  stepParticles,
  type Particle,
} from './states-particles'
import styles from './StatesOfMatter.module.css'

const T_MIN = -50
const T_MAX = 150
const T_DEFAULT = 25

/** Logical canvas size; the canvas scales to its container and keeps this aspect. */
const CANVAS_W = 560
const CANVAS_H = 340
/** Inset of the glass box inside the canvas, in logical pixels. */
const BOX_INSET = 10
const BOX_RADIUS = 14

/** Water molecule drawn at logical scale: O radius, H radius, O–H bond length. */
const O_RADIUS = 5
const H_RADIUS = 2.8
const OH_BOND = 8.5
/** Half of the H–O–H angle (104.5°), in radians. */
const HALF_ANGLE = (104.5 / 2) * (Math.PI / 180)

type PresetId = 'ice' | 'water' | 'steam'

const PRESETS: readonly { value: PresetId; label: string; tC: number }[] = [
  { value: 'ice', label: 'Ice', tC: -10 },
  { value: 'water', label: 'Water', tC: 25 },
  { value: 'steam', label: 'Steam', tC: 120 },
]

/** Which preset the current temperature falls in, for the Segmented control. */
function presetFor(tC: number): PresetId {
  if (tC < 0) return 'ice'
  if (tC <= 100) return 'water'
  return 'steam'
}

const STATE_NAME: Record<WaterState, string> = {
  solid: 'Solid (ice)',
  melting: 'Melting: ice and water',
  liquid: 'Liquid (water)',
  boiling: 'Boiling: water and water vapour',
  gas: 'Gas (water vapour)',
}

/** One sentence per state, for the screen-reader summary. */
const STATE_SENTENCE: Record<WaterState, string> = {
  solid: 'Water is solid ice. Particles are locked in a lattice and only vibrate about their places.',
  melting: 'Water is melting: ice and liquid water are both present.',
  liquid: 'Water is a liquid. Particles are close together and slide past one another.',
  boiling: 'Water is boiling: liquid water and water vapour are both present.',
  gas: 'Water is a gas, water vapour. Particles are far apart, move fast, and bounce off the walls.',
}

/** Formats a Celsius temperature with a true minus sign, for example −10 °C. */
function formatCelsius(tC: number): string {
  return `${tC < 0 ? '−' : ''}${Math.abs(tC)} °C`
}

function formatKelvin(tC: number): string {
  return `${celsiusToKelvin(tC).toFixed(2)} K`
}

interface Palette {
  oxygen: string
  hydrogen: string
  rim: string
  glassFill: string
  glassWall: string
  liquid: string
  highlight: string
}

/** Reads the colour tokens from the canvas's computed style, so both themes work. */
function readPalette(el: HTMLElement): Palette {
  const style = getComputedStyle(el)
  const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    oxygen: get('--el-O', '#D8473F'),
    hydrogen: get('--el-H', '#F2F0EC'),
    rim: get('--atom-rim', 'rgba(31, 32, 35, 0.28)'),
    glassFill: get('--glass-fill', 'rgba(255, 255, 255, 0.45)'),
    glassWall: get('--glass-wall', 'rgba(31, 32, 35, 0.3)'),
    liquid: get('--liquid', 'rgba(47, 111, 235, 0.2)'),
    highlight: get('--glass-sheen', 'rgba(255, 255, 255, 0.95)'),
  }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Draws one frame: the glass box, the condensed liquid tint, and every water molecule. */
function drawFrame(canvas: HTMLCanvasElement, particles: Particle[], tC: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const dpr = window.devicePixelRatio || 1
  const cssW = canvas.clientWidth || CANVAS_W
  const cssH = canvas.clientHeight || CANVAS_H
  const pxW = Math.round(cssW * dpr)
  const pxH = Math.round(cssH * dpr)
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW
    canvas.height = pxH
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, cssW, cssH)

  const palette = readPalette(canvas)
  const k = cssW / CANVAS_W
  const bx = BOX_INSET * k
  const by = BOX_INSET * k
  const bw = cssW - 2 * bx
  const bh = cssH - 2 * by
  const shares = waterPhaseFractions(tC)

  // Glass box
  roundedRect(ctx, bx, by, bw, bh, BOX_RADIUS * k)
  ctx.fillStyle = palette.glassFill
  ctx.fill()

  // Condensed liquid: a tint that fades as the liquid turns to vapour
  const condensed = shares.solid + shares.liquid
  if (condensed > 0.01) {
    ctx.save()
    roundedRect(ctx, bx, by, bw, bh, BOX_RADIUS * k)
    ctx.clip()
    ctx.globalAlpha = Math.min(1, condensed) * 0.9
    ctx.fillStyle = palette.liquid
    const top = by + (POOL.top - 0.04) * bh
    ctx.fillRect(bx, top, bw, by + bh - top)
    ctx.restore()
  }

  ctx.strokeStyle = palette.glassWall
  ctx.lineWidth = 1.5
  roundedRect(ctx, bx, by, bw, bh, BOX_RADIUS * k)
  ctx.stroke()

  // Molecules: H atoms first, then the O atom on top
  for (const p of particles) {
    const ox = bx + p.x * bw
    const oy = by + p.y * bh
    const hDist = OH_BOND * k
    const h1a = p.angle + HALF_ANGLE
    const h2a = p.angle - HALF_ANGLE
    const h1x = ox + hDist * Math.cos(h1a)
    const h1y = oy + hDist * Math.sin(h1a)
    const h2x = ox + hDist * Math.cos(h2a)
    const h2y = oy + hDist * Math.sin(h2a)

    for (const [hx, hy] of [
      [h1x, h1y],
      [h2x, h2y],
    ] as const) {
      ctx.beginPath()
      ctx.arc(hx, hy, H_RADIUS * k, 0, Math.PI * 2)
      ctx.fillStyle = palette.hydrogen
      ctx.fill()
      ctx.strokeStyle = palette.rim
      ctx.lineWidth = 0.8
      ctx.stroke()
    }

    ctx.beginPath()
    ctx.arc(ox, oy, O_RADIUS * k, 0, Math.PI * 2)
    ctx.fillStyle = palette.oxygen
    ctx.fill()
    ctx.strokeStyle = palette.rim
    ctx.lineWidth = 0.8
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(ox - 1.6 * k, oy - 1.6 * k, 1.6 * k, 0, Math.PI * 2)
    ctx.fillStyle = palette.highlight
    ctx.globalAlpha = 0.5
    ctx.fill()
    ctx.globalAlpha = 1
  }
}

/**
 * Water in a glass box at 1 atm. A slider sets the temperature from −50 °C to
 * 150 °C. Each particle keeps its phase rank, so the solid, liquid and gas
 * shares change smoothly through the melting and boiling bands. Speeds scale
 * with √T (kelvin), and the readout gives the state and the temperature.
 */
export function StatesOfMatter({ reducedMotion }: SimulationProps) {
  const [tC, setTC] = useState(T_DEFAULT)
  const [particles] = useState<Particle[]>(() => createParticles())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const active = useIsActive(canvasRef)

  // Drawing and motion. Under reduced motion the particles are placed at once.
  // Otherwise a requestAnimationFrame loop runs while the canvas is on screen.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (reducedMotion || !active) {
      if (reducedMotion) settleParticles(particles, tC)
      drawFrame(canvas, particles, tC)
      return
    }

    const random = mulberry32(2024)
    let last = performance.now()
    let frame = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      stepParticles(particles, tC, dt, random)
      drawFrame(canvas, particles, tC)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, reducedMotion, particles, tC])

  const state = waterStateAt(tC)
  const kelvinText = formatKelvin(tC)
  const celsiusText = formatCelsius(tC)
  const summary = `At ${celsiusText}, or ${kelvinText}. ${STATE_SENTENCE[state]}`

  return (
    <div className={styles.wrap}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        role="img"
        aria-label={`Particle box of water at ${celsiusText}: ${STATE_NAME[state]}`}
        data-testid="states-canvas"
        data-state={state}
      />

      <div className={styles.readout} aria-hidden="true">
        <p className={styles.stateName} data-testid="states-state">
          {STATE_NAME[state]}
        </p>
        <p className={styles.temps}>
          <span data-testid="states-celsius">{celsiusText}</span>
          <span className={styles.sep}>·</span>
          <span data-testid="states-kelvin">{kelvinText}</span>
        </p>
      </div>

      <p className={styles.srOnly} aria-live="polite" data-testid="states-summary">
        {summary}
      </p>

      <SimulationControls>
        <Slider
          label="Temperature"
          value={tC}
          min={T_MIN}
          max={T_MAX}
          step={1}
          format={formatCelsius}
          onChange={setTC}
        />
        <Segmented
          label="Preset"
          options={PRESETS.map((preset) => ({ value: preset.value, label: preset.label }))}
          value={presetFor(tC)}
          onChange={(value) => {
            const preset = PRESETS.find((p) => p.value === value)
            if (preset) setTC(preset.tC)
          }}
        />
      </SimulationControls>
    </div>
  )
}
