'use client'

import { OxyDiagram } from './OxyDiagram'
import { clampAlcoholStep, describeAlcoholStep } from './alcohol-classes-steps'

export interface AlcoholClassesProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  /** Each Step cuts cleanly to its target state. */
  reducedMotion: boolean
}

const W = 560
const H = 420

const STEP_HEADERS = [
  'Count the hydroxyl (–OH) groups',
  'Count direct C neighbours of sp³ C–OH',
  'Allylic: sp³ C–OH adjacent to C=C',
  'Benzylic (ring next door) vs –CH₂– spacer',
  'Move –OH onto C=C: sp² vinylic alcohol',
] as const

export function AlcoholClasses({ step }: AlcoholClassesProps) {
  const s = clampAlcoholStep(step)
  const panels = describeAlcoholStep(s)
  const header = STEP_HEADERS[s]
  const aria = `${header}: ${panels.map((p) => `${p.name}, ${p.classLabel}`).join('; ')}`

  // Step 3 uses a 2×2 card grid so three benzylic degrees contrast clearly with the spacer case.
  if (s === 3) {
    const gap = 8
    const padX = 10
    const topY = 44
    const cardW = (W - 2 * padX - gap) / 2
    const cardH = 180

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={aria}
        style={{ display: 'block', height: 'auto' }}
      >
        <text
          x={W / 2}
          y={26}
          textAnchor="middle"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {header}
        </text>
        {panels.map((p, idx) => {
          const col = idx % 2
          const row = Math.floor(idx / 2)
          const x0 = padX + col * (cardW + gap)
          const y0 = topY + row * (cardH + gap)
          const cx = x0 + cardW / 2
          return (
            <g key={p.id}>
              <rect
                x={x0}
                y={y0}
                width={cardW}
                height={cardH}
                rx={10}
                fill="var(--surface-raised)"
                stroke={p.caution ? 'var(--caution)' : 'var(--border)'}
                strokeWidth={p.caution ? 1.8 : 1}
                strokeDasharray={p.caution ? '6 4' : undefined}
              />
              <OxyDiagram
                graph={p.graph}
                classification={p.classification}
                cx={cx}
                cy={y0 + 58}
                maxW={cardW - 30}
                maxH={78}
                minScale={41}
                maxScale={44}
                surfaceFill="var(--surface-raised)"
              />
              <text
                x={cx}
                y={y0 + 136}
                textAnchor="middle"
                fontSize={15}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill={p.caution ? 'var(--caution)' : 'var(--accent)'}
              >
                {p.classLabel}
              </text>
              <text
                x={cx}
                y={y0 + 160}
                textAnchor="middle"
                fontSize={15}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
              >
                {p.name}
              </text>
            </g>
          )
        })}
      </svg>
    )
  }

  // Step 4 uses a 2-column spotlight comparing allylic (sp³) and vinylic (sp²).
  if (s === 4) {
    const gap = 14
    const padX = 14
    const cardW = (W - 2 * padX - gap) / 2
    const cardY = 52
    const cardH = 316

    return (
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        role="img"
        aria-label={aria}
        style={{ display: 'block', height: 'auto' }}
      >
        <text
          x={W / 2}
          y={28}
          textAnchor="middle"
          fontSize={16}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
        >
          {header}
        </text>
        {panels.map((p, i) => {
          const x0 = padX + i * (cardW + gap)
          const cx = x0 + cardW / 2
          const isVinylic = i === 1
          return (
            <g key={p.id}>
              <rect
                x={x0}
                y={cardY}
                width={cardW}
                height={cardH}
                rx={12}
                fill="var(--surface-raised)"
                stroke={isVinylic ? 'var(--ox)' : 'var(--border)'}
                strokeWidth={isVinylic ? 2 : 1}
              />
              <OxyDiagram
                graph={p.graph}
                classification={p.classification}
                cx={cx}
                cy={cardY + 115}
                maxW={cardW - 36}
                maxH={155}
                minScale={48}
                maxScale={68}
                showPlanarAngle={isVinylic}
                surfaceFill="var(--surface-raised)"
              />
              <text
                x={cx}
                y={cardY + 216}
                textAnchor="middle"
                fontSize={16}
                fontWeight={700}
                fontFamily="var(--font-sans)"
                fill={isVinylic ? 'var(--ox)' : 'var(--orbital-neg)'}
              >
                {p.classLabel}
              </text>
              <text
                x={cx}
                y={cardY + 244}
                textAnchor="middle"
                fontSize={16}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                {p.name}
              </text>
              <text
                x={cx}
                y={cardY + 270}
                textAnchor="middle"
                fontSize={15}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
              >
                {p.formula}
              </text>
              <text
                x={cx}
                y={cardY + 296}
                textAnchor="middle"
                fontSize={15}
                fontFamily="var(--font-sans)"
                fill={isVinylic ? 'var(--ox)' : 'var(--orbital-neg)'}
              >
                {isVinylic ? 'sp² planar (120°)' : 'sp³ tetrahedral'}
              </text>
            </g>
          )
        })}
        <text
          x={W / 2}
          y={398}
          textAnchor="middle"
          fontSize={15}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
        >
          No –CH₂– spacer shifts C–OH from sp³ to sp².
        </text>
      </svg>
    )
  }

  // Steps 0, 1, 2: 3 columns side by side
  const count = panels.length
  const padX = 8
  const gap = 8
  const colW = (W - 2 * padX - gap * (count - 1)) / count
  const cardY = 48
  const cardH = 334

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={aria}
      style={{ display: 'block', height: 'auto' }}
    >
      <text
        x={W / 2}
        y={28}
        textAnchor="middle"
        fontSize={16}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {header}
      </text>

      {panels.map((p, i) => {
        const x0 = padX + i * (colW + gap)
        const cx = x0 + colW / 2
        const splitName = p.name === '2-methylbut-3-en-2-ol'
        const splitFormula = p.formula === 'CH₂(OH)CH(OH)CH₂OH'
        return (
          <g key={p.id}>
            <rect
              x={x0}
              y={cardY}
              width={colW}
              height={cardH}
              rx={10}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <OxyDiagram
              graph={p.graph}
              classification={p.classification}
              cx={cx}
              cy={cardY + 92}
              maxW={colW - 26}
              maxH={132}
              minScale={42}
              maxScale={54}
              highlightOh={s === 0}
              numberCarbons={s === 1}
              surfaceFill="var(--surface-raised)"
            />
            <text
              x={cx}
              y={cardY + 196}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={s === 0 ? 'var(--atom-o)' : s === 2 ? 'var(--orbital-neg)' : 'var(--fg-muted)'}
            >
              {s === 2 ? 'sp³ C–OH + C=C' : p.badge}
            </text>
            <text
              x={cx}
              y={cardY + 228}
              textAnchor="middle"
              fontSize={17}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--accent)"
            >
              {p.classLabel}
            </text>
            {splitName ? (
              <>
                <text
                  x={cx}
                  y={cardY + 258}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg)"
                >
                  2-methyl-
                </text>
                <text
                  x={cx}
                  y={cardY + 278}
                  textAnchor="middle"
                  fontSize={15}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg)"
                >
                  but-3-en-2-ol
                </text>
              </>
            ) : (
              <text
                x={cx}
                y={cardY + 264}
                textAnchor="middle"
                fontSize={15}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg)"
              >
                {p.name}
              </text>
            )}
            {splitFormula ? (
              <>
                <text
                  x={cx}
                  y={cardY + 294}
                  textAnchor="middle"
                  fontSize={15}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg-muted)"
                >
                  CH₂(OH)–
                </text>
                <text
                  x={cx}
                  y={cardY + 314}
                  textAnchor="middle"
                  fontSize={15}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg-muted)"
                >
                  CH(OH)CH₂OH
                </text>
              </>
            ) : (
              <text
                x={cx}
                y={cardY + 306}
                textAnchor="middle"
                fontSize={15}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
              >
                {p.formula}
              </text>
            )}
          </g>
        )
      })}

      <text
        x={W / 2}
        y={404}
        textAnchor="middle"
        fontSize={15}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        {s === 0
          ? 'Teal marks C–OH carbon; crimson marks each –OH.'
          : s === 1
            ? 'Teal marks sp³ C–OH; numbers count C neighbours.'
            : 'Four single bonds keep C–OH sp³ next to C=C.'}
      </text>
    </svg>
  )
}
