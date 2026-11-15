import React, { forwardRef, useId } from 'react'

export const TITRATION_RIG_SIZE = { width: 360, height: 480 } as const

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

  // Burette coordinates (taller & wider)
  const burW = 20
  const burTopY = -205
  const burScaleStartY = -180
  const burScaleEndY = 30
  const burStopcockY = 46
  const burTipY = 80

  // Delivered volume clamped
  const vol = Math.min(maxMl, Math.max(0, addedMl))
  const volFraction = vol / maxMl
  // Liquid level in burette drops down as volume is delivered
  const meniscusY = burScaleStartY + volFraction * (burScaleEndY - burScaleStartY)

  // Flask coordinates (Enlarged Erlenmeyer for projected visuals)
  const neckTopY = 108
  const neckBottomY = 132
  const neckHalfW = 18
  const baseHalfW = 66
  const flaskBottomY = 208
  const flaskLiquidSurfaceY = 162

  // Clear vs pink colour change:
  // Before endpoint: analyte solution is colorless clear Fe2+
  // At/after endpoint: solution turns visibly pink from first unreduced drop of MnO4-
  const isAtEndPoint = endPoint || vol >= endPointMl

  // Retort stand
  const standX = -85
  const standTopY = -212
  const standBottomY = 210

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
            d={`M ${-burW / 2} ${burTopY} L ${burW / 2} ${burTopY} L ${burW / 2} ${burStopcockY - 4} L 3.5 ${burStopcockY + 10} L 2.5 ${burTipY} L -2.5 ${burTipY} L -3.5 ${burStopcockY + 10} L ${-burW / 2} ${burStopcockY - 4} Z`}
          />
        </clipPath>

        {/* Flask interior clip */}
        <clipPath id={flaskClipId}>
          <path
            d={`M ${-neckHalfW} ${neckTopY} L ${neckHalfW} ${neckTopY} L ${neckHalfW} ${neckBottomY} L ${baseHalfW - 5} ${flaskBottomY - 5} Q ${baseHalfW} ${flaskBottomY} ${baseHalfW - 10} ${flaskBottomY} L ${-baseHalfW + 10} ${flaskBottomY} Q ${-baseHalfW} ${flaskBottomY} ${-baseHalfW + 5} ${flaskBottomY - 5} L ${-neckHalfW} ${neckBottomY} Z`}
          />
        </clipPath>
      </defs>

      {/* ============================================================== */}
      {/* 1. White Tile (under flask for crisp colour contrast)          */}
      {/* ============================================================== */}
      <g transform="translate(0, 210)">
        <rect
          x={-75}
          y={0}
          width={150}
          height={12}
          rx={3}
          fill="var(--surface)"
          stroke="var(--border)"
          strokeWidth={1.4}
        />
        {/* Caption under white tile */}
        <text
          x={0}
          y={26}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg)"
          fontWeight={500}
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
          x={standX - 45}
          y={standBottomY - 8}
          width={90}
          height={14}
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
          strokeWidth={5}
          strokeLinecap="round"
        />

        {/* Upper clamp */}
        <g transform={`translate(${standX}, -120)`}>
          <rect x={0} y={-6} width={-standX} height={12} rx={2} fill="var(--fg-muted)" />
          <path d="M 68 -12 L 85 -12 L 85 12 L 68 12" fill="none" stroke="var(--fg)" strokeWidth={2} />
        </g>
        {/* Lower clamp */}
        <g transform={`translate(${standX}, 15)`}>
          <rect x={0} y={-6} width={-standX} height={12} rx={2} fill="var(--fg-muted)" />
          <path d="M 68 -12 L 85 -12 L 85 12 L 68 12" fill="none" stroke="var(--fg)" strokeWidth={2} />
        </g>
      </g>

      {/* ============================================================== */}
      {/* 3. Conical Flask (Erlenmeyer) with Analyte Solution            */}
      {/* ============================================================== */}
      <g>
        {/* Solution in Flask */}
        <g clipPath={`url(#${flaskClipId})`}>
          <rect
            x={-baseHalfW - 8}
            y={flaskLiquidSurfaceY}
            width={baseHalfW * 2 + 16}
            height={flaskBottomY - flaskLiquidSurfaceY + 8}
            fill={isAtEndPoint ? endTint : startTint === 'clear' ? 'var(--glass-fill)' : startTint}
            opacity={isAtEndPoint || startTint !== 'clear' ? 0.85 : 0.45}
          />
          {/* Surface meniscus line */}
          <line
            x1={-baseHalfW}
            y1={flaskLiquidSurfaceY}
            x2={baseHalfW}
            y2={flaskLiquidSurfaceY}
            stroke={isAtEndPoint ? endTint : startTint === 'clear' ? 'var(--liquid-edge)' : startTint}
            strokeWidth={2}
            opacity={0.9}
          />
        </g>

        {/* Flask Glass Outline */}
        <path
          d={`M ${-neckHalfW} ${neckTopY} L ${neckHalfW} ${neckTopY} L ${neckHalfW} ${neckBottomY} L ${baseHalfW - 5} ${flaskBottomY - 5} Q ${baseHalfW} ${flaskBottomY} ${baseHalfW - 10} ${flaskBottomY} L ${-baseHalfW + 10} ${flaskBottomY} Q ${-baseHalfW} ${flaskBottomY} ${-baseHalfW + 5} ${flaskBottomY - 5} L ${-neckHalfW} ${neckBottomY} Z`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={2}
          strokeLinejoin="round"
        />

        {/* Glass vertical sheen highlight on left wall */}
        <line
          x1={-36}
          y1={145}
          x2={-56}
          y2={195}
          stroke="var(--glass-sheen)"
          strokeWidth={2.8}
          strokeLinecap="round"
          style={{ pointerEvents: 'none' }}
        />

        {/* End-point highlight callout badge */}
        {isAtEndPoint && (
          <g transform={`translate(${baseHalfW + 10}, 162)`}>
            <rect
              x={0}
              y={-14}
              width={96}
              height={28}
              rx={5}
              fill="var(--surface-raised)"
              stroke={endTint}
              strokeWidth={1.5}
            />
            <text
              x={48}
              y={0.5}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={14}
              fontWeight={700}
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
            opacity={0.9}
          />
          {/* Meniscus curved line */}
          <ellipse
            cx={0}
            cy={meniscusY}
            rx={burW / 2}
            ry={2.8}
            fill={titrantTint}
          />
        </g>

        {/* Glass walls of burette */}
        <path
          d={`M ${-burW / 2} ${burTopY} L ${-burW / 2} ${burStopcockY - 4} L -3.5 ${burStopcockY + 10} L -2.5 ${burTipY} M 2.5 ${burTipY} L 3.5 ${burStopcockY + 10} L ${burW / 2} ${burStopcockY - 4} L ${burW / 2} ${burTopY}`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={2}
        />

        {/* Burette top lip */}
        <line
          x1={-burW / 2 - 3}
          y1={burTopY}
          x2={burW / 2 + 3}
          y2={burTopY}
          stroke="var(--glass-wall)"
          strokeWidth={2}
        />

        {/* Graduation scale marks (0 to 25 mL) - labels ≥ 13 units */}
        {[0, 5, 10, 15, 20, 25].map((tickMl) => {
          const frac = tickMl / maxMl
          const ty = burScaleStartY + frac * (burScaleEndY - burScaleStartY)
          return (
            <g key={tickMl}>
              {/* Tick line */}
              <line
                x1={burW / 2 - 6}
                y1={ty}
                x2={burW / 2}
                y2={ty}
                stroke="var(--glass-wall)"
                strokeWidth={1.4}
              />
              {/* Scale label ≥ 13 units */}
              <text
                x={burW / 2 + 8}
                y={ty}
                dominantBaseline="central"
                fontSize={14}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
                fontWeight={500}
                style={{ userSelect: 'none' }}
              >
                {tickMl}
              </text>
            </g>
          )
        })}

        {/* Stopcock valve body & handle */}
        <g transform={`translate(0, ${burStopcockY})`}>
          <circle cx={0} cy={0} r={7} fill="var(--fg-muted)" stroke="var(--glass-wall)" strokeWidth={1.4} />
          {/* Handle: vertical if dropping (open), horizontal if closed */}
          {dropping ? (
            <line x1={0} y1={-14} x2={0} y2={14} stroke="var(--fg)" strokeWidth={3.2} strokeLinecap="round" />
          ) : (
            <line x1={-14} y1={0} x2={14} y2={0} stroke="var(--fg)" strokeWidth={3.2} strokeLinecap="round" />
          )}
        </g>

        {/* Falling droplets if dropping */}
        {dropping && (
          <g>
            {/* Droplet 1 at tip */}
            <circle cx={0} cy={burTipY + 9} r={3.2} fill={titrantTint} />
            {/* Droplet 2 in flight */}
            <circle cx={0} cy={burTipY + 24} r={3.5} fill={titrantTint} />
          </g>
        )}

        {/* Burette volume readout magnifier callout (reading ≥ 16 units) */}
        <g transform={`translate(${burW / 2 + 28}, ${meniscusY})`}>
          <line
            x1={-14}
            y1={0}
            x2={0}
            y2={0}
            stroke="var(--border)"
            strokeWidth={1.4}
            strokeDasharray="2 2"
          />
          <rect
            x={0}
            y={-14}
            width={86}
            height={28}
            rx={5}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.4}
          />
          <text
            x={43}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={16}
            fontWeight={700}
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
