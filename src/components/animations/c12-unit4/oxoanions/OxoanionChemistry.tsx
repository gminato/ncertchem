'use client'

import type { ReactNode } from 'react'
import {
  ION_COLOUR_TOKEN,
  Oxoanion,
  SPECTRAL_TOKEN,
  oxoanionBounds,
  type OxoanionKind,
} from '@/components/vocab/dblock'
import {
  OXO_STEP_COUNT,
  eVoltOf,
  electronVisible,
  equationText,
  getOxoStepState,
} from './oxoanion-steps'

export interface OxoanionChemistryProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 480

const TEXT_STYLE = { fill: 'var(--fg)', fontFamily: 'var(--font-sans)' } as const
const MUTED_STYLE = { fill: 'var(--fg-muted)', fontFamily: 'var(--font-sans)' } as const

/** Beaker geometry shared by the three solution scenes. */
const BEAKER = { x: 350, y: 110, width: 190, height: 190 }

/** Place an oxoanion so the middle of its drawing sits at (cx, cy). */
function placeAt(kind: OxoanionKind, cx: number, cy: number): { x: number; y: number } {
  const b = oxoanionBounds(kind)
  return { x: cx - (b.minX + b.maxX) / 2, y: cy - (b.minY + b.maxY) / 2 }
}

function transition(reducedMotion: boolean, props = 'opacity 0.8s ease'): string {
  return reducedMotion ? 'none' : props
}

function Caption({
  x,
  y,
  children,
  muted = false,
  size = 14,
}: {
  x: number
  y: number
  children: ReactNode
  muted?: boolean
  size?: number
}) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={size}
      style={muted ? MUTED_STYLE : TEXT_STYLE}
    >
      {children}
    </text>
  )
}

/** Electron dots, the first `count` of them visible, fading in one after another. */
function Electrons({
  points,
  count,
  reducedMotion,
}: {
  points: Array<[number, number]>
  count: number
  reducedMotion: boolean
}) {
  return (
    <g aria-hidden="true">
      {points.map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={5}
          style={{
            fill: 'var(--fg)',
            opacity: electronVisible(i, count) ? 1 : 0,
            transition: transition(reducedMotion),
            transitionDelay: reducedMotion ? undefined : `${i * 0.15}s`,
          }}
        />
      ))}
    </g>
  )
}

/** Solution beaker whose liquid is the base colour, with an optional overlay colour. */
function Beaker({
  base,
  overlay,
  overlayOn,
  reducedMotion,
  clearOverlay = false,
}: {
  base: string
  overlay?: string
  overlayOn: boolean
  reducedMotion: boolean
  clearOverlay?: boolean
}) {
  const { x, y, width, height } = BEAKER
  return (
    <g aria-hidden="true">
      <rect x={x + 2} y={y + 40} width={width - 4} height={height - 42} rx={12} style={{ fill: base }} />
      {overlay !== undefined && (
        <rect
          x={x + 2}
          y={y + 40}
          width={width - 4}
          height={height - 42}
          rx={12}
          style={{
            fill: clearOverlay ? 'var(--bg)' : overlay,
            opacity: overlayOn ? (clearOverlay ? 0.94 : 1) : 0,
            transition: transition(reducedMotion),
          }}
        />
      )}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={14}
        style={{ fill: 'none', stroke: 'var(--fg-muted)', strokeWidth: 2.5 }}
      />
    </g>
  )
}

function Scene({
  step,
  reducedMotion,
}: {
  step: number
  reducedMotion: boolean
}) {
  const state = getOxoStepState(step)
  const { scene, electrons, done } = state

  if (scene === 'ph') {
    const chromate = placeAt('cro4', 130, 200)
    const dichromate = placeAt('cr2o7', 450, 200)
    return (
      <>
        <Caption x={290} y={34}>{equationText('chromate-dichromate-acid')}</Caption>
        <Caption x={290} y={58} muted>{equationText('dichromate-chromate-base')}</Caption>
        <Oxoanion kind="cro4" x={chromate.x} y={chromate.y} tint="cro4" />
        <Oxoanion kind="cr2o7" x={dichromate.x} y={dichromate.y} tint="cr2o7" />
        <text x={290} y={212} textAnchor="middle" fontSize={30} style={TEXT_STYLE}>⇌</text>
        <Caption x={290} y={176} muted>acid (H⁺)</Caption>
        <Caption x={290} y={250} muted>alkali (OH⁻)</Caption>
        <Caption x={130} y={390}>chromate: yellow</Caption>
        <Caption x={450} y={390}>dichromate: orange</Caption>
        <Caption x={290} y={430} muted>Two tetrahedra share one oxygen (the bridge).</Caption>
        <Caption x={290} y={454} muted>Chromium is +6 in both forms.</Caption>
      </>
    )
  }

  if (scene === 'dichromate') {
    const d = placeAt('cr2o7', 150, 172)
    const dots: Array<[number, number]> = [
      [262, 150], [290, 150], [318, 150], [262, 176], [290, 176], [318, 176],
    ]
    const hPoints = Array.from({ length: 14 }, (_, i) => [40 + (i % 7) * 44, i < 7 ? 318 : 358] as const)
    const fePoints = Array.from({ length: 6 }, (_, i) => 60 + i * 88)
    return (
      <>
        <Caption x={290} y={34}>{equationText('dichromate-acid-half')}</Caption>
        <Caption x={290} y={58} muted>{`E° = +${eVoltOf('dichromate-acid-half').toFixed(2)} V`}</Caption>
        <Oxoanion kind="cr2o7" x={d.x} y={d.y} tint="cr2o7" />
        <Electrons points={dots} count={electrons} reducedMotion={reducedMotion} />
        <Caption x={290} y={206} muted>6e⁻ in</Caption>
        <Beaker base={ION_COLOUR_TOKEN.cr2o7} overlay={SPECTRAL_TOKEN.green} overlayOn={done} reducedMotion={reducedMotion} />
        <Caption x={445} y={326}>orange → green</Caption>
        <Caption x={445} y={350} muted>chromium(III) species form</Caption>
        <Caption x={445} y={372} muted>{done ? 'Cr +6 → +3 in each ion' : 'Cr +6'}</Caption>
        <Caption x={190} y={296} muted>14H⁺</Caption>
        {hPoints.map(([x, y], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={13} style={{ fill: 'var(--surface-2, var(--bg))', stroke: 'var(--fg-muted)' }} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={14} style={TEXT_STYLE}>H⁺</text>
          </g>
        ))}
        <Caption x={290} y={410} muted>{equationText('dichromate-iron-half')}</Caption>
        {fePoints.map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={440} r={14} style={{ fill: ION_COLOUR_TOKEN.fe2, stroke: 'var(--fg-muted)' }} />
            <text x={x} y={468} textAnchor="middle" fontSize={14} style={TEXT_STYLE}>Fe²⁺</text>
          </g>
        ))}
      </>
    )
  }

  if (scene === 'permanganate') {
    const m = placeAt('mno4', 150, 180)
    const dots: Array<[number, number]> = [[262, 150], [290, 150], [318, 150], [276, 176], [304, 176]]
    return (
      <>
        <Caption x={290} y={34}>{equationText('permanganate-to-mn2plus-half')}</Caption>
        <Caption x={290} y={58} muted>{`E° = +${eVoltOf('permanganate-to-mn2plus-half').toFixed(2)} V`}</Caption>
        <Oxoanion kind="mno4" x={m.x} y={m.y} tint="mno4" />
        <Electrons points={dots} count={electrons} reducedMotion={reducedMotion} />
        <Caption x={290} y={206} muted>5e⁻ in</Caption>
        <Beaker base={ION_COLOUR_TOKEN.mno4} overlay={ION_COLOUR_TOKEN.mn2} overlayOn={done} reducedMotion={reducedMotion} />
        <Caption x={445} y={326}>purple → pale pink</Caption>
        <Caption x={445} y={350} muted>Mn +7 → Mn²⁺ (+2)</Caption>
        <Caption x={290} y={430} muted>Mn goes from +7 to +2: five electrons per MnO₄⁻.</Caption>
      </>
    )
  }

  if (scene === 'neutral') {
    const m = placeAt('mno4', 150, 180)
    const dots: Array<[number, number]> = [[262, 150], [290, 150], [318, 150]]
    return (
      <>
        <Caption x={290} y={34}>{equationText('permanganate-iodide-neutral')}</Caption>
        <Caption x={290} y={58} muted>Neutral solution: Mn +7 → +4, three electrons per MnO₄⁻</Caption>
        <Oxoanion kind="mno4" x={m.x} y={m.y} tint="mno4" />
        <Electrons points={dots} count={electrons} reducedMotion={reducedMotion} />
        <Caption x={290} y={206} muted>3e⁻ in</Caption>
        <Beaker
          base={ION_COLOUR_TOKEN.mno4}
          overlay={ION_COLOUR_TOKEN.mno4}
          overlayOn={done}
          reducedMotion={reducedMotion}
          clearOverlay
        />
        <rect
          x={BEAKER.x + 4}
          y={BEAKER.y + BEAKER.height - 46}
          width={BEAKER.width - 8}
          height={40}
          rx={10}
          style={{ fill: ION_COLOUR_TOKEN.mno2, opacity: done ? 1 : 0, transition: transition(reducedMotion) }}
        />
        <Caption x={445} y={326}>brown MnO₂ settles</Caption>
        <Caption x={445} y={350} muted>MnO₂ (solid)</Caption>
        <Caption x={290} y={414} muted>Iodide and thiosulphate both give this brown solid:</Caption>
        <Caption x={290} y={438} muted>{equationText('permanganate-thiosulphate-neutral')}</Caption>
      </>
    )
  }

  // 'pair': manganate and permanganate side by side.
  const green = placeAt('mno4-2', 150, 190)
  const purple = placeAt('mno4', 430, 190)
  return (
    <>
      <Caption x={290} y={34}>Manganate and permanganate</Caption>
      <Oxoanion kind="mno4-2" x={green.x} y={green.y} tint="mno4-2" />
      <Oxoanion kind="mno4" x={purple.x} y={purple.y} tint="mno4" />
      <Caption x={150} y={370}>green, one unpaired e⁻</Caption>
      <Caption x={150} y={394} muted>drawn slightly into a field</Caption>
      <Caption x={430} y={370}>purple, no unpaired e⁻</Caption>
      <Caption x={430} y={394} muted>pushed out of a field</Caption>
      <Caption x={290} y={444} muted>The purple of MnO₄⁻ is not a d–d colour.</Caption>
    </>
  )
}

/** Oxoanion Scrolly: chromate and dichromate, the dichromate half-equation, permanganate in acid and in neutral solution, manganate versus permanganate. */
export function OxoanionChemistry({ step, reducedMotion }: OxoanionChemistryProps) {
  const index = Math.min(Math.max(Math.round(step), 0), OXO_STEP_COUNT - 1)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Chromate, dichromate and permanganate drawings for this Step"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
    >
      <Scene step={index} reducedMotion={reducedMotion} />
    </svg>
  )
}

