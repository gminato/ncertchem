'use client'

import { OxyDiagram } from './OxyDiagram'
import { clampPhenolEtherStep, describePhenolEtherStep } from './phenol-ether-classes-steps'

export interface PhenolEtherClassesProps {
  /** 0-based Step index from the Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 560
const H = 420

const STEP_HEADERS = [
  'Monohydric phenols: one –OH on the benzene ring',
  'Dihydric and trihydric phenols: 2 or 3 ring –OH',
  'Simple (symmetrical) ether: identical groups on O',
  'Mixed (unsymmetrical) ethers: unequal groups on O',
] as const

export function PhenolEtherClasses({ step }: PhenolEtherClassesProps) {
  const s = clampPhenolEtherStep(step)
  const panels = describePhenolEtherStep(s)
  const header = STEP_HEADERS[s]
  const aria = `${header}: ${panels.map((p) => `${p.name}, ${p.classLabel}`).join('; ')}`
  const count = panels.length

  const padX = count === 1 ? 48 : 14
  const gap = 14
  const cardW = (W - 2 * padX - gap * (count - 1)) / count
  const cardY = 52
  const cardH = 320

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
        y={30}
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
        const isEther = p.classification.family === 'ether'
        return (
          <g key={p.id}>
            <rect
              x={x0}
              y={cardY}
              width={cardW}
              height={cardH}
              rx={12}
              fill="var(--surface-raised)"
              stroke="var(--border)"
              strokeWidth={1}
            />
            <OxyDiagram
              graph={p.graph}
              classification={p.classification}
              cx={cx}
              cy={cardY + 106}
              maxW={cardW - 36}
              maxH={154}
              minScale={44}
              maxScale={count === 1 ? 74 : 56}
              highlightOh={!isEther}
              labelRingAlkyl={s === 0}
              showLonePairs={isEther}
              etherOverlay={
                isEther && p.armLeft && p.armRight
                  ? {
                      leftLabel: p.armLeft,
                      rightLabel: p.armRight,
                      symmetrical: Boolean(p.symmetrical),
                    }
                  : undefined
              }
              surfaceFill="var(--surface-raised)"
            />
            <text
              x={cx}
              y={cardY + 216}
              textAnchor="middle"
              fontSize={15}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={isEther ? (p.symmetrical ? 'var(--orbital-neg)' : 'var(--ox)') : 'var(--atom-o)'}
            >
              {p.badge}
            </text>
            <text
              x={cx}
              y={cardY + 246}
              textAnchor="middle"
              fontSize={17}
              fontWeight={700}
              fontFamily="var(--font-sans)"
              fill="var(--accent)"
            >
              {p.classLabel}
            </text>
            <text
              x={cx}
              y={cardY + 276}
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
              y={cardY + 302}
              textAnchor="middle"
              fontSize={15}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              {p.formula}
            </text>
          </g>
        )
      })}

      <text
        x={W / 2}
        y={402}
        textAnchor="middle"
        fontSize={15}
        fontFamily="var(--font-sans)"
        fill="var(--fg-muted)"
      >
        {s === 0
          ? 'Amber marks sp² ring C–OH; –CH₃ is not a hydroxyl.'
          : s === 1
            ? 'Two ring –OH give dihydric; three give trihydric.'
            : s === 2
              ? 'Dashed plane shows equal arms (C₂H₅ = C₂H₅) on O.'
              : 'Unequal arms across –O– (R₁ ≠ R₂) give mixed ethers.'}
      </text>
    </svg>
  )
}
