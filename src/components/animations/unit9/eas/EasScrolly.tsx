'use client'

import React from 'react'
import { formulaText } from '@/lib/chem/eas-mechanism'
import { Row, type RowItem } from './row'
import { BENZENE_HEX_WIDTH, BenzeneHexagon, NITRONIUM_WIDTH, Nitronium, sigmaItem, skeletalNode } from './parts'
import { alkylationSpecies, easStepTexts, methylSpecies, nitrationSpecies, nitrobenzeneGraph, tolueneProduct } from './eas-steps'

export interface EasScrollyProps {
  step: number
  reducedMotion: boolean
}

/**
 * The viewBox is 900 × 340, the shape of the pinned panel, so that it is never shrunk to fit. At a 1440 px
 * desktop the panel is about 1.16 px per unit: labels of 20 units come out near 23 px, and the rows are
 * scaled so that the labels never drop below 18 px.
 */
const VIEW_W = 900
const VIEW_H = 340
const TITLE_Y = 30
const BODY_CY = 160
/** A row fills about 90% of the width (the widest, the three contributors, is about 90% of the panel). */
const TARGET = 830
/** Bond length of the skeletal structures (drawing units). */
const SCALE = 46
const SPECIES = 26
const CAPTION = 18
const CAPTION_CHARS = 78
const CAPTION_Y = [290, 314]

const toluene = tolueneProduct()
const TEXTS = easStepTexts(toluene.name)

/** The rows of each Step, from the lib's species and products. */
function rowFor(step: number): RowItem[] {
  const n = nitrationSpecies()
  const a = alkylationSpecies()
  const m = methylSpecies()
  const text = (t: string, size = SPECIES): RowItem => ({ kind: 'text', text: t, size })
  const arrow = (equilibrium = false): RowItem => ({ kind: 'arrow', width: 84, equilibrium })
  const nitrobenzene = nitrobenzeneGraph()
  switch (step) {
    case 0:
      return [
        text(formulaText(n.reactants[0])),
        text('+'),
        text(formulaText(n.reactants[1])),
        arrow(true),
        { kind: 'node', width: NITRONIUM_WIDTH, render: () => <Nitronium /> },
        text('+ ' + formulaText(n.products[1])),
        text('+ ' + formulaText(n.products[2])),
      ]
    case 1:
      return [
        { kind: 'node', width: BENZENE_HEX_WIDTH, render: () => <BenzeneHexagon /> },
        text('+'),
        { kind: 'node', width: NITRONIUM_WIDTH, render: () => <Nitronium /> },
        arrow(),
        sigmaItem('NO2'),
      ]
    case 2:
      return [sigmaItem('NO2', { contributors: true })]
    case 3:
      return [
        sigmaItem('NO2'),
        text('+ ' + formulaText(n.products[2].replace(/^2/, ''))),
        arrow(),
        skeletalNode(nitrobenzene, SCALE),
      ]
    case 4:
      return [text(m.chloromethane, 34), text('+'), text(formulaText(a.reactants[1]), 34), arrow(), text(m.methylCation, 34), text('+'), text(formulaText(a.products[1]), 34)]
    default:
      return [
        sigmaItem('CH₃'),
        text('+'),
        text('AlCl₄⁻'),
        arrow(),
        skeletalNode(toluene.graph, SCALE),
        text('+ HCl + AlCl₃'),
      ]
  }
}

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

/**
 * The electrophilic substitution Scrolly (Section 9.5.5): nitration in four Steps (the nitronium ion, the π
 * attack, the three contributors of the σ-complex, the restored ring) and Friedel–Crafts in two. Every Step is one
 * row of structures and formulas that fills most of the panel width.
 */
export function EasScrolly({ step }: EasScrollyProps) {
  const index = Math.min(TEXTS.length - 1, Math.max(0, Math.round(step)))
  const text = TEXTS[index]
  const caption = wrapCaption(text.caption)
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} role="img" aria-label={`${text.title}. ${text.caption}`} data-step={index} style={{ display: 'block', width: '100%', height: 'auto' }}>
      <text x={VIEW_W / 2} y={TITLE_Y} textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">
        {text.title}
      </text>
      <Row items={rowFor(index)} cx={VIEW_W / 2} cy={BODY_CY} targetWidth={TARGET} />
      {caption.map((line, i) => (
        <text key={i} data-caption="true" x={VIEW_W / 2} y={CAPTION_Y[i] ?? CAPTION_Y[CAPTION_Y.length - 1]} textAnchor="middle" dominantBaseline="central" fontSize={CAPTION} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </svg>
  )
}
