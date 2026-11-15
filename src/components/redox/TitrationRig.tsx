import React, { forwardRef, useId } from 'react'
import { clamp01, interpolateRgb } from './geometry'

export const TITRATION_RIG_SIZE = { width: 320, height: 410 } as const

export interface TitrationRigProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Delivered titrant volume in mL. */
  addedMl: number
  /** Maximum burette capacity in mL, default 25. */
  maxMl?: number
  /** End-point volume in mL, default 20.0. */
  endPointMl?: number
  /** Initial analyte flask colour, default 'clear'. */
  startTint?: string
  /** Titrant flask colour at endpoint, default 'var(--sol-pink)'. */
  endTint?: string
  /** Titrant reagent colour in burette, default 'var(--sol-mno4)'. */
  titrantTint?: string
  /** Whether drops are actively falling from burette tip. */
  dropping?: boolean
  /** Whether the end point is reached and highlighted. */
  endPoint?: boolean
  /** Optional bottom sub-caption under white tile. */
  subLabel?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

export const TitrationRig = forwardRef<SVGGElement, TitrationRigProps>(function TitrationRig(
  {
    addedMl,
    maxMl = 25,
    endPointMl = 20.0,
    startTint = 'clear',
    endTint = 'var(--sol-pink)',
    titrantTint = 'var(--sol-mno4)',
    dropping = false,
    endPoint = false,
    subLabel,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const buretteClipId = `tr-bur-clip-${idPrefix}`
  const flaskClipId = `tr-flk-clip-${idPrefix}`

  // Burette coordinates
  const burW = 16
  const burTopY = -170
  const burScaleStartY = -155
  const burScaleEndY = 15
  const burStopcockY = 28
  const burTipY = 62

  // Delivered volume clamped
  const vol = Math.min(maxMl, Math.max(0, addedMl))
  const volFraction = vol / maxMl
  // Liquid level in burette drops down as volume is delivered
  const meniscusY = burScaleStartY + volFraction * (burScaleEndY - burScaleStartY)

  // Flask coordinates (Erlenmeyer)
  const neckTopY = 92
  const neckBottomY = 112
  const neckHalfW = 14
  const baseHalfW = 46
  const flaskBottomY = 170
  const flaskLiquidSurfaceY = 138

  // Flask liquid colour calculation
  const isAtEndPoint = endPoint || vol >= endPointMl
  const endPointProgress = isAtEndPoint
    ? 1
    : Math.max(0, (vol - (endPointMl - 1.5)) / 1.5)
  const flaskColor = interpolateRgb(startTint, endTint, endPointProgress)

  // Retort stand
  const standX = -65
  const standTopY = -175
  const standBottomY = 176

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      aria-label={title ?? `Titration rig at ${vol.toFixed(1)} mL`}
      {...rest}
    >
      <defs>
        {/* Burette interior clip */}
        <clipPath id={buretteClipId}>
          <path
            d={`M ${-burW / 2} ${burTopY} L ${burW / 2} ${burTopY} L ${burW / 2} ${burStopcockY - 4} L 3 ${burStopcockY + 10} L 2 ${burTipY} L -2 ${burTipY} L -3 ${burStopcockY + 10} L ${-burW / 2} ${burStopcockY - 4} Z`}
          />
        </clipPath>

        {/* Flask interior clip */}
        <clipPath id={flaskClipId}>
          <path
            d={`M ${-neckHalfW} ${neckTopY} L ${neckHalfW} ${neckTopY} L ${neckHalfW} ${neckBottomY} L ${baseHalfW - 4} ${flaskBottomY - 4} Q ${baseHalfW} ${flaskBottomY} ${baseHalfW - 8} ${flaskBottomY} L ${-baseHalfW + 8} ${flaskBottomY} Q ${-baseHalfW} ${flaskBottomY} ${-baseHalfW + 4} ${flaskBottomY - 4} L ${-neckHalfW} ${neckBottomY} Z`}
          />
        </clipPath>
      </defs>

      {/* ============================================================== */}
      {/* 1. White Tile (under flask for crisp colour contrast)          */}
      {/* ============================================================== */}
      <g transform="translate(0, 172)">
        <rect
          x={-56}
          y={0}
          width={112}
          height={10}
          rx={3}
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth={1.4}
        />
        {/* Caption under white tile */}
        <text
          x={0}
          y={24}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          {subLabel ?? 'White tile'}
        </text>
      </g>

      {/* ============================================================== */}
      {/* 2. Retort Stand & Clamps                                       */}
      {/* ============================================================== */}
      <g>
        {/* Stand base plate */}
        <rect
          x={standX - 35}
          y={standBottomY - 6}
          width={70}
          height={12}
          rx={3}
          fill="var(--fg-muted)"
          stroke="var(--fg)"
          strokeWidth={1.2}
        />
        {/* Stand vertical rod */}
        <line
          x1={standX}
          y1={standTopY}
          x2={standX}
          y2={standBottomY}
          stroke="var(--fg-muted)"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Upper clamp */}
        <g transform={`translate(${standX}, -110)`}>
          <rect x={0} y={-5} width={standX < 0 ? -standX : standX} height={10} rx={2} fill="var(--fg-muted)" />
          <path d="M 52 -10 L 68 -10 L 68 10 L 52 10" fill="none" stroke="var(--fg)" strokeWidth={2} />
        </g>
        {/* Lower clamp */}
        <g transform={`translate(${standX}, -25)`}>
          <rect x={0} y={-5} width={standX < 0 ? -standX : standX} height={10} rx={2} fill="var(--fg-muted)" />
          <path d="M 52 -10 L 68 -10 L 68 10 L 52 10" fill="none" stroke="var(--fg)" strokeWidth={2} />
        </g>
      </g>

      {/* ============================================================== */}
      {/* 3. Conical Flask (Erlenmeyer) with Analyte Solution            */}
      {/* ============================================================== */}
      <g>
        {/* Solution in Flask */}
        <g clipPath={`url(#${flaskClipId})`}>
          <rect
            x={-baseHalfW - 6}
            y={flaskLiquidSurfaceY}
            width={baseHalfW * 2 + 12}
            height={flaskBottomY - flaskLiquidSurfaceY + 6}
            fill={flaskColor}
          />
          {/* Surface meniscus line */}
          <line
            x1={-baseHalfW}
            y1={flaskLiquidSurfaceY}
            x2={baseHalfW}
            y2={flaskLiquidSurfaceY}
            stroke={isAtEndPoint ? endTint : 'var(--liquid-edge)'}
            strokeWidth={1.6}
            opacity={0.8}
          />
        </g>

        {/* Flask Glass Outline */}
        <path
          d={`M ${-neckHalfW} ${neckTopY} L ${neckHalfW} ${neckTopY} L ${neckHalfW} ${neckBottomY} L ${baseHalfW - 4} ${flaskBottomY - 4} Q ${baseHalfW} ${flaskBottomY} ${baseHalfW - 8} ${flaskBottomY} L ${-baseHalfW + 8} ${flaskBottomY} Q ${-baseHalfW} ${flaskBottomY} ${-baseHalfW + 4} ${flaskBottomY - 4} L ${-neckHalfW} ${neckBottomY} Z`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={1.8}
          strokeLinejoin="round"
        />

        {/* Glass vertical sheen highlight on left wall */}
        <line
          x1={-26}
          y1={130}
          x2={-40}
          y2={164}
          stroke="var(--glass-sheen)"
          strokeWidth={2.4}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />

        {/* End-point highlight callout badge */}
        {isAtEndPoint && (
          <g transform="translate(68, 142)">
            <rect
              x={0}
              y={-12}
              width={90}
              height={24}
              rx={4}
              fill="var(--surface-raised)"
              stroke={endTint}
              strokeWidth={1.5}
            />
            <text
              x={45}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={13}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              fill={endTint}
              style={{ userSelect: 'none' }}
            >
              End point
            </text>
          </g>
        )}
      </g>

      {/* ============================================================== */}
      {/* 4. Burette with Graduated Scale and Liquid Meniscus             */}
      {/* ============================================================== */}
      <g>
        {/* Titrant liquid inside burette */}
        <g clipPath={`url(#${buretteClipId})`}>
          <rect
            x={-burW / 2 - 2}
            y={meniscusY}
            width={burW + 4}
            height={burTipY - meniscusY}
            fill={titrantTint}
            opacity={0.88}
          />
          {/* Meniscus curved line */}
          <ellipse
            cx={0}
            cy={meniscusY}
            rx={burW / 2}
            ry={2.5}
            fill={titrantTint}
          />
        </g>

        {/* Glass walls of burette */}
        <path
          d={`M ${-burW / 2} ${burTopY} L ${-burW / 2} ${burStopcockY - 4} L -3 ${burStopcockY + 10} L -2 ${burTipY} M 2 ${burTipY} L 3 ${burStopcockY + 10} L ${burW / 2} ${burStopcockY - 4} L ${burW / 2} ${burTopY}`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={1.8}
        />

        {/* Burette top lip */}
        <line
          x1={-burW / 2 - 2}
          y1={burTopY}
          x2={burW / 2 + 2}
          y2={burTopY}
          stroke="var(--glass-wall)"
          strokeWidth={1.8}
        />

        {/* Graduation scale marks (0 to 25 mL) */}
        {[0, 5, 10, 15, 20, 25].map((tickMl) => {
          const frac = tickMl / maxMl
          const ty = burScaleStartY + frac * (burScaleEndY - burScaleStartY)
          return (
            <g key={tickMl}>
              {/* Tick line */}
              <line
                x1={burW / 2 - 5}
                y1={ty}
                x2={burW / 2}
                y2={ty}
                stroke="var(--glass-wall)"
                strokeWidth={1.2}
              />
              {/* Label */}
              <text
                x={burW / 2 + 6}
                y={ty}
                dominantBaseline="central"
                fontSize={13}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
                style={{ userSelect: 'none' }}
              >
                {tickMl}
              </text>
            </g>
          )
        })}

        {/* Stopcock valve body & handle */}
        <g transform={`translate(0, ${burStopcockY})`}>
          <circle cx={0} cy={0} r={6} fill="var(--fg-muted)" stroke="var(--glass-wall)" strokeWidth={1.2} />
          {/* Handle: vertical if dropping (open), horizontal if closed */}
          {dropping ? (
            <line x1={0} y1={-12} x2={0} y2={12} stroke="var(--fg)" strokeWidth={3} strokeLinecap="round" />
          ) : (
            <line x1={-12} y1={0} x2={12} y2={0} stroke="var(--fg)" strokeWidth={3} strokeLinecap="round" />
          )}
        </g>

        {/* Falling droplets if dropping */}
        {dropping && (
          <g>
            {/* Droplet 1 at tip */}
            <circle cx={0} cy={burTipY + 8} r={2.8} fill={titrantTint} />
            {/* Droplet 2 in flight */}
            <circle cx={0} cy={burTipY + 22} r={3} fill={titrantTint} />
          </g>
        )}

        {/* Burette volume readout magnifier callout */}
        <g transform={`translate(${burW / 2 + 34}, ${meniscusY})`}>
          <line
            x1={-12}
            y1={0}
            x2={0}
            y2={0}
            stroke="var(--border)"
            strokeWidth={1.2}
            strokeDasharray="2 2"
          />
          <rect
            x={0}
            y={-12}
            width={72}
            height={24}
            rx={4}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <text
            x={36}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {vol.toFixed(1)} <tspan className="sym">mL</tspan>
          </text>
        </g>
      </g>
    </g>
  )
})
