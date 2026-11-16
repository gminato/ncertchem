'use client'

import React from 'react'
import { EASMechanism, ReactionScheme, ResonanceSet, reactionSchemeSize } from '@/components/organic'
import { easViews, type EasView } from './eas-steps'

export interface EasScrollyProps {
  step: number
  reducedMotion: boolean
}

/** The pinned panel: 900 × 420 units, scaled by the wide Scrolly layout to the panel's width. */
const VIEW_W = 900
const VIEW_H = 420
/** Room for the title at the top and the two caption lines at the bottom; the body sits between. */
const BODY_TOP = 62
const BODY_H = 290
/** Characters per caption line at 18 units, so the caption fits 900 units with its margins. */
const CAPTION_CHARS = 74

const VIEWS = easViews()

/** Splits a caption into lines of at most `max` characters at word boundaries. */
export function wrapCaption(text: string, max = CAPTION_CHARS): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > max && line) {
      lines.push(line)
      line = w
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

function Body({ view }: { view: EasView }) {
  if (view.kind === 'scheme') {
    // The scheme is laid out at its own width and drawn at `zoom`, so the text and structures fill the panel.
    const width = 860 / view.zoom
    const size = reactionSchemeSize(view.path, width)
    const w = size.width * view.zoom
    const h = size.height * view.zoom
    return (
      <g transform={`translate(${(VIEW_W - w) / 2}, ${BODY_TOP + (BODY_H - h) / 2}) scale(${view.zoom})`}>
        <ReactionScheme sequence={view.path} maxWidth={width} x={0} y={0} />
      </g>
    )
  }
  if (view.kind === 'strip') {
    return <EASMechanism progress={view.progress} x={0} y={BODY_TOP} />
  }
  return <ResonanceSet contributors={view.contributors.map((graph) => ({ graph }))} x={VIEW_W / 2} y={BODY_TOP + BODY_H / 2} scale={44} arrowGap={112} />
}

/**
 * The electrophilic substitution Scrolly (Section 9.5.5): nitration in four Steps (the electrophile,
 * the π attack, the σ-complex's contributors, the restored ring) and Friedel–Crafts in two. Each Step
 * shows its own drawing from the lib's graphs; the drawing is static, so reduced motion needs no change.
 */
export function EasScrolly({ step }: EasScrollyProps) {
  const index = Math.min(VIEWS.length - 1, Math.max(0, Math.round(step)))
  const view = VIEWS[index]
  const caption = wrapCaption(view.caption)
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={`${view.title}. ${view.caption}`}
      data-step={index}
      style={{ display: 'block', width: '100%', height: 'auto' }}
    >
      <text x={VIEW_W / 2} y={36} textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {view.title}
      </text>
      <Body view={view} />
      {caption.map((line, i) => (
        <text
          key={i}
          x={VIEW_W / 2}
          y={VIEW_H - 46 + i * 24}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={18}
          fontWeight={500}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          {line}
        </text>
      ))}
    </svg>
  )
}
