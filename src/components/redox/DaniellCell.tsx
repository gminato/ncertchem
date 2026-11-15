import React, { forwardRef, useId } from 'react'
import { clamp01, formatTrueMinus } from './geometry'

export const DANIELL_CELL_SIZE = { width: 560, height: 360 } as const

export interface DaniellCellProps extends Omit<React.SVGAttributes<SVGGElement>, 'children'> {
  /** Circuit switch state: true = closed/active, false = open/inactive. */
  switchOn?: boolean
  /** Animation progress for electron and ion transport (0 to 1). */
  progress?: number
  /** Voltage display string, e.g. "1.10 V". */
  voltage?: string
  /** Mass/thickness factor of Zn electrode from 1 (initial thick) to 0 (thinned). */
  zincMass?: number
  /** Mass/thickness factor of Cu electrode from 0 (initial) to 1 (thickened). */
  copperMass?: number
  /** Solution colour intensity on the copper side from 1 (initial deep blue) to 0 (faded). */
  solutionTint?: number
  /** Salt bridge electrolyte formula, default "KCl". */
  saltBridgeLabel?: string
  /** Custom meter readout slot. */
  meterSlot?: React.ReactNode
  title?: string
  x?: number
  y?: number
}

export const DaniellCell = forwardRef<SVGGElement, DaniellCellProps>(function DaniellCell(
  {
    switchOn = true,
    progress = 0,
    voltage = '1.10 V',
    zincMass = 0.5,
    copperMass = 0.5,
    solutionTint = 0.8,
    saltBridgeLabel = 'KCl',
    meterSlot,
    title,
    x = 0,
    y = 0,
    className,
    ...rest
  },
  ref
) {
  const p = clamp01(progress)
  const znM = clamp01(zincMass)
  const cuM = clamp01(copperMass)
  const solT = clamp01(solutionTint)

  const idPrefix = useId().replace(/[^a-zA-Z0-9]/g, '')
  const znClipId = `dc-zn-clip-${idPrefix}`
  const cuClipId = `dc-cu-clip-${idPrefix}`
  const arrowRightId = `dc-arr-r-${idPrefix}`
  const arrowLeftId = `dc-arr-l-${idPrefix}`

  // Beaker dimensions
  const bw = 150
  const bh = 145
  const bLeft = -bw / 2
  const bRight = bw / 2
  const bTop = 20
  const bBottom = bTop + bh
  const liquidY = 55

  // Beaker Centers
  const znBeakerX = -140
  const cuBeakerX = 140

  // Electrodes
  const znWidth = 18 + 14 * znM // thins as mass decreases
  const cuWidth = 22 + 14 * cuM // thickens as copper deposits
  const rodTopY = -45
  const rodBottomY = 145

  // Overhead wire level
  const wireY = -90

  // Readout voltage text
  const displayVoltage = switchOn ? voltage : '0.00 V'
  const [vNum, vUnit] = displayVoltage.split(' ')

  // Path distance calculations for continuous electron flow
  const znLegLen = rodTopY - wireY // 45
  const wireSpan = cuBeakerX - znBeakerX // 280
  const cuLegLen = rodTopY - wireY // 45
  const totalPathLen = znLegLen + wireSpan + cuLegLen // 370
  const numElectrons = 7

  return (
    <g
      ref={ref}
      transform={`translate(${x}, ${y})`}
      className={className}
      aria-label={title ?? 'Daniell Cell with Zn anode and Cu cathode'}
      {...rest}
    >
      <defs>
        <clipPath id={znClipId}>
          <rect x={bLeft} y={bTop} width={bw} height={bh} rx={10} />
        </clipPath>
        <clipPath id={cuClipId}>
          <rect x={bLeft} y={bTop} width={bw} height={bh} rx={10} />
        </clipPath>

        <marker
          id={arrowRightId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--electron)" />
        </marker>
        <marker
          id={arrowLeftId}
          viewBox="0 0 10 10"
          refX="6"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M 0 1.5 L 8 5 L 0 8.5 Z" fill="var(--fg-muted)" />
        </marker>
      </defs>

      {/* ============================================================== */}
      {/* 1. Zn Anode Compartment (Left)                                  */}
      {/* ============================================================== */}
      <g transform={`translate(${znBeakerX}, 0)`}>
        {/* Solution (colourless ZnSO4: a faint neutral tint so the liquid and the bridge's dip read clearly) */}
        <g clipPath={`url(#${znClipId})`}>
          <rect
            x={bLeft - 5}
            y={liquidY}
            width={bw + 10}
            height={bBottom - liquidY + 5}
            fill="var(--fg-subtle)"
            opacity={0.16}
          />
          <line
            x1={bLeft}
            y1={liquidY}
            x2={bRight}
            y2={liquidY}
            stroke="var(--fg-muted)"
            strokeWidth={1.5}
            opacity={0.7}
          />
        </g>

        {/* Zn Electrode */}
        <rect
          x={-znWidth / 2}
          y={rodTopY}
          width={znWidth}
          height={rodBottomY - rodTopY}
          rx={3}
          fill="var(--metal-zn)"
          stroke="var(--fg-muted)"
          strokeWidth={1.2}
        />

        {/* Beaker Glass Outline */}
        <path
          d={`M ${bLeft - 3} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 3} ${bTop}`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Anode & solution label below beaker in --ox (amber) */}
        <text
          x={0}
          y={bBottom + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--ox)"
          style={{ userSelect: 'none' }}
        >
          Zn anode ({formatTrueMinus('−')})
        </text>
        <text
          x={0}
          y={bBottom + 38}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          1 M ZnSO₄
        </text>
      </g>

      {/* ============================================================== */}
      {/* 2. Cu Cathode Compartment (Right)                               */}
      {/* ============================================================== */}
      <g transform={`translate(${cuBeakerX}, 0)`}>
        {/* Solution (CuSO4 blue - visibly blue in both themes) */}
        <g clipPath={`url(#${cuClipId})`}>
          <rect
            x={bLeft - 5}
            y={liquidY}
            width={bw + 10}
            height={bBottom - liquidY + 5}
            fill="var(--sol-cu)"
            opacity={0.50 + 0.45 * solT}
          />
          <line
            x1={bLeft}
            y1={liquidY}
            x2={bRight}
            y2={liquidY}
            stroke="var(--sol-cu)"
            strokeWidth={2}
            opacity={0.7 + 0.3 * solT}
          />
        </g>

        {/* Cu Electrode */}
        <rect
          x={-cuWidth / 2}
          y={rodTopY}
          width={cuWidth}
          height={rodBottomY - rodTopY}
          rx={3}
          fill="var(--metal-cu)"
          stroke="var(--fg-muted)"
          strokeWidth={1.2}
        />

        {/* Beaker Glass Outline */}
        <path
          d={`M ${bLeft - 3} ${bTop} L ${bLeft} ${bTop + 4} L ${bLeft} ${bBottom - 10} Q ${bLeft} ${bBottom} ${bLeft + 10} ${bBottom} L ${bRight - 10} ${bBottom} Q ${bRight} ${bBottom} ${bRight} ${bBottom - 10} L ${bRight} ${bTop + 4} L ${bRight + 3} ${bTop}`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Cathode & solution label below beaker in --red (indigo) */}
        <text
          x={0}
          y={bBottom + 18}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={15}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--red)"
          style={{ userSelect: 'none' }}
        >
          Cu cathode (+)
        </text>
        <text
          x={0}
          y={bBottom + 38}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          1 M CuSO₄
        </text>
      </g>

      {/* ============================================================== */}
      {/* 3. Salt Bridge (Inverted U-tube dipping deeply below surface)   */}
      {/* ============================================================== */}
      <g>
        {/* Salt bridge body (dips down to y = 95, well below liquidY = 55) */}
        <path
          d="M -112 95 L -112 28 Q -112 8 -92 8 L 92 8 Q 112 8 112 28 L 112 95 L 88 95 L 88 32 Q 88 22 76 22 L -76 22 Q -88 22 -88 32 L -88 95 Z"
          fill="var(--surface-raised)"
          stroke="var(--glass-wall)"
          strokeWidth={1.8}
        />
        {/* Agar gel electrolyte core */}
        <path
          d="M -108 92 L -108 28 Q -108 11 -90 11 L 90 11 Q 108 11 108 28 L 108 92 L 92 92 L 92 31 Q 92 24 78 24 L -78 24 Q -92 24 -92 31 L -92 92 Z"
          fill="var(--surface)"
          opacity={0.8}
        />

        {/* Salt bridge label pill */}
        <g transform="translate(0, 5)">
          <rect
            x={-72}
            y={-14}
            width={144}
            height={28}
            rx={5}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <text
            x={0}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
            style={{ userSelect: 'none' }}
          >
            {saltBridgeLabel} salt bridge
          </text>
        </g>

        {/* Ion migration inside bridge when cell is active */}
        {switchOn && (
          <g>
            {/* Anions (Cl−) migrate toward Zn anode (left) */}
            <g transform={`translate(${-56 - 8 * p}, 48)`}>
              <rect x={-18} y={-11} width={36} height={22} rx={4} fill="var(--surface-raised)" stroke="var(--ox)" strokeWidth={1.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fill="var(--ox)">
                {formatTrueMinus('Cl−')}
              </text>
            </g>

            {/* Cations (K+) migrate toward Cu cathode (right) */}
            <g transform={`translate(${56 + 8 * p}, 48)`}>
              <rect x={-16} y={-11} width={32} height={22} rx={4} fill="var(--surface-raised)" stroke="var(--red)" strokeWidth={1.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={600} fill="var(--red)">
                K⁺
              </text>
            </g>
          </g>
        )}
      </g>

      {/* ============================================================== */}
      {/* 4. Overhead Wire & Switch                                       */}
      {/* ============================================================== */}
      <g>
        {/* Wire from Zn rod top to switch */}
        <path
          d={`M ${znBeakerX} ${rodTopY} L ${znBeakerX} ${wireY} L -85 ${wireY}`}
          fill="none"
          stroke="var(--fg-muted)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />

        {/* Switch */}
        <g>
          {/* Terminals */}
          <circle cx={-85} cy={wireY} r={3.2} fill="var(--fg-muted)" />
          <circle cx={-55} cy={wireY} r={3.2} fill="var(--fg-muted)" />

          {/* Switch blade */}
          {switchOn ? (
            <line
              x1={-85}
              y1={wireY}
              x2={-55}
              y2={wireY}
              stroke="var(--fg)"
              strokeWidth={2.6}
            />
          ) : (
            <line
              x1={-85}
              y1={wireY}
              x2={-65}
              y2={wireY - 20}
              stroke="var(--fg)"
              strokeWidth={2.6}
            />
          )}

          {/* Switch label placed clear of voltmeter badge */}
          <text
            x={-70}
            y={wireY + 18}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={14}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {switchOn ? 'Switch closed' : 'Switch open'}
          </text>
        </g>

        {/* Wire from switch to meter */}
        <path
          d={`M -55 ${wireY} L -28 ${wireY}`}
          fill="none"
          stroke="var(--fg-muted)"
          strokeWidth={2.4}
        />

        {/* Wire from meter to Cu rod top */}
        <path
          d={`M 28 ${wireY} L ${cuBeakerX} ${wireY} L ${cuBeakerX} ${rodTopY}`}
          fill="none"
          stroke="var(--fg-muted)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />

        {/* ============================================================ */}
        {/* 5. Electron dots flowing along wire path from Zn to Cu       */}
        {/* ============================================================ */}
        {switchOn && (
          <g>
            {Array.from({ length: numElectrons }).map((_, i) => {
              const dotDist = ((p + i / numElectrons) % 1) * totalPathLen
              let dotX: number
              let dotY: number

              if (dotDist < znLegLen) {
                // Moving up from Zn rod to wire
                dotX = znBeakerX
                dotY = rodTopY - dotDist
              } else if (dotDist < znLegLen + wireSpan) {
                // Moving across overhead wire towards Cu
                const horizDist = dotDist - znLegLen
                dotX = znBeakerX + horizDist
                dotY = wireY
              } else {
                // Moving down into Cu rod
                const vertDist = dotDist - (znLegLen + wireSpan)
                dotX = cuBeakerX
                dotY = wireY + vertDist
              }

              return (
                <g key={i}>
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r={6.5}
                    fill="var(--electron)"
                    opacity={0.3}
                    style={{ pointerEvents: 'none' }}
                  />
                  <circle
                    cx={dotX}
                    cy={dotY}
                    r={3.8}
                    fill="var(--electron)"
                  />
                </g>
              )
            })}
          </g>
        )}

        {/* ============================================================ */}
        {/* 6. Voltmeter Readout                                         */}
        {/* ============================================================ */}
        <g transform={`translate(0, ${wireY})`}>
          {meterSlot ?? (
            <g>
              <circle
                cx={0}
                cy={0}
                r={28}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={2}
              />
              <circle
                cx={0}
                cy={0}
                r={24}
                fill="var(--surface)"
                opacity={0.8}
              />

              {/* Gauge ticks */}
              <line x1={-15} y1={-9} x2={-11} y2={-6} stroke="var(--fg-muted)" strokeWidth={1.3} />
              <line x1={0} y1={-16} x2={0} y2={-11} stroke="var(--fg-muted)" strokeWidth={1.6} />
              <line x1={15} y1={-9} x2={11} y2={-6} stroke="var(--fg-muted)" strokeWidth={1.3} />

              {/* Needle */}
              {switchOn ? (
                <line
                  x1={0}
                  y1={6}
                  x2={14}
                  y2={-12}
                  stroke="var(--heat)"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              ) : (
                <line
                  x1={0}
                  y1={6}
                  x2={-13}
                  y2={-9}
                  stroke="var(--fg-subtle)"
                  strokeWidth={2.4}
                  strokeLinecap="round"
                />
              )}
              <circle cx={0} cy={6} r={3.2} fill="var(--fg)" />

              {/* Digital Voltage Readout Badge below meter (≥ 18 units) */}
              <g transform="translate(0, 42)">
                <rect
                  x={-52}
                  y={-16}
                  width={104}
                  height={32}
                  rx={6}
                  fill="var(--surface-raised)"
                  stroke="var(--border)"
                  strokeWidth={1.5}
                />
                <text
                  x={0}
                  y={1}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={18}
                  fontWeight={700}
                  fontFamily="var(--font-sans)"
                  fill={switchOn ? 'var(--fg)' : 'var(--fg-muted)'}
                  style={{ userSelect: 'none' }}
                >
                  {vNum} <tspan className="sym">{vUnit ?? 'V'}</tspan>
                </text>
              </g>
            </g>
          )}
        </g>

        {/* ============================================================ */}
        {/* 7. Current and electron direction indicators above wire      */}
        {/* ============================================================ */}
        {switchOn && (
          <g>
            {/* Electron Flow: Zn -> Cu (left to right) */}
            <g transform={`translate(80, ${wireY - 14})`}>
              <line
                x1={-20}
                y1={0}
                x2={16}
                y2={0}
                stroke="var(--electron)"
                strokeWidth={1.6}
                markerEnd={`url(#${arrowRightId})`}
              />
              <text
                x={-2}
                y={-11}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--electron)"
                style={{ userSelect: 'none' }}
              >
                <tspan className="sym">e</tspan>
                <tspan dy="-0.3em" fontSize="0.75em">
                  −
                </tspan>{' '}
                flow
              </text>
            </g>

            {/* Conventional Current Flow: Cu -> Zn (right to left) */}
            <g transform={`translate(-100, ${wireY - 14})`}>
              <line
                x1={20}
                y1={0}
                x2={-16}
                y2={0}
                stroke="var(--fg-muted)"
                strokeWidth={1.6}
                markerEnd={`url(#${arrowLeftId})`}
              />
              <text
                x={2}
                y={-11}
                textAnchor="middle"
                fontSize={14}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
                style={{ userSelect: 'none' }}
              >
                Current (<tspan className="sym">I</tspan>)
              </text>
            </g>
          </g>
        )}
      </g>
    </g>
  )
})
