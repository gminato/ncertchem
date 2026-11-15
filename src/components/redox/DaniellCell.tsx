import React, { forwardRef, useId } from 'react'
import { clamp01, formatTrueMinus } from './geometry'

export const DANIELL_CELL_SIZE = { width: 560, height: 350 } as const

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
  const bTop = 15
  const bBottom = bTop + bh
  const liquidY = 48

  // Beaker Centers
  const znBeakerX = -140
  const cuBeakerX = 140

  // Electrodes
  const znWidth = 16 + 14 * znM // thins as mass decreases
  const cuWidth = 20 + 14 * cuM // thickens as copper deposits
  const rodTopY = -55
  const rodBottomY = 135

  // Wire level
  const wireY = -105

  // Readout voltage text
  const displayVoltage = switchOn ? voltage : '0.00 V'
  const [vNum, vUnit] = displayVoltage.split(' ')

  const numElectrons = 5

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
        {/* Solution (clear ZnSO4) */}
        <g clipPath={`url(#${znClipId})`}>
          <rect
            x={bLeft - 5}
            y={liquidY}
            width={bw + 10}
            height={bBottom - liquidY + 5}
            fill="var(--glass-fill)"
            opacity={0.6}
          />
          <line
            x1={bLeft}
            y1={liquidY}
            x2={bRight}
            y2={liquidY}
            stroke="var(--glass-wall)"
            strokeWidth={1.5}
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
          y={bBottom + 16}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13.5}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--ox)"
          style={{ userSelect: 'none' }}
        >
          Zn anode ({formatTrueMinus('−')})
        </text>
        <text
          x={0}
          y={bBottom + 34}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
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
        {/* Solution (CuSO4 blue) */}
        <g clipPath={`url(#${cuClipId})`}>
          <rect
            x={bLeft - 5}
            y={liquidY}
            width={bw + 10}
            height={bBottom - liquidY + 5}
            fill="var(--sol-cu)"
            opacity={0.15 + 0.65 * solT}
          />
          <line
            x1={bLeft}
            y1={liquidY}
            x2={bRight}
            y2={liquidY}
            stroke="var(--sol-cu)"
            strokeWidth={1.6}
            opacity={0.4 + 0.6 * solT}
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
          y={bBottom + 16}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13.5}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill="var(--red)"
          style={{ userSelect: 'none' }}
        >
          Cu cathode (+)
        </text>
        <text
          x={0}
          y={bBottom + 34}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={13}
          fontFamily="var(--font-sans)"
          fill="var(--fg-muted)"
          style={{ userSelect: 'none' }}
        >
          1 M CuSO₄
        </text>
      </g>

      {/* ============================================================== */}
      {/* 3. Salt Bridge (Inverted U-tube)                                */}
      {/* ============================================================== */}
      <g>
        {/* Salt bridge body */}
        <path
          d="M -78 100 L -78 28 Q -78 6 -58 6 L 58 6 Q 78 6 78 28 L 78 100 L 62 100 L 62 30 Q 62 18 52 18 L -52 18 Q -62 18 -62 30 L -62 100 Z"
          fill="var(--surface-raised)"
          stroke="var(--glass-wall)"
          strokeWidth={1.8}
        />
        {/* Agar gel electrolyte core */}
        <path
          d="M -75 96 L -75 28 Q -75 8 -56 8 L 56 8 Q 75 8 75 28 L 75 96 L 65 96 L 65 29 Q 65 17 53 17 L -53 17 Q -65 17 -65 29 L -65 96 Z"
          fill="var(--surface)"
          opacity={0.8}
        />

        {/* Salt bridge label pill */}
        <g transform="translate(0, -6)">
          <rect
            x={-60}
            y={-12}
            width={120}
            height={22}
            rx={4}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.2}
          />
          <text
            x={0}
            y={0.5}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
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
            <g transform={`translate(${-46 - 8 * p}, 42)`}>
              <rect x={-15} y={-9} width={30} height={18} rx={4} fill="var(--surface-raised)" stroke="var(--ox)" strokeWidth={1.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill="var(--ox)">
                {formatTrueMinus('Cl−')}
              </text>
            </g>

            {/* Cations (K+) migrate toward Cu cathode (right) */}
            <g transform={`translate(${46 + 8 * p}, 42)`}>
              <rect x={-13} y={-9} width={26} height={18} rx={4} fill="var(--surface-raised)" stroke="var(--red)" strokeWidth={1.2} />
              <text x={0} y={1} textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fill="var(--red)">
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
        {/* Wire from Zn electrode up and over */}
        <path
          d={`M ${znBeakerX} ${rodTopY} L ${znBeakerX} ${wireY} L -70 ${wireY}`}
          fill="none"
          stroke="var(--fg-muted)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Switch */}
        <g transform="translate(-60, 0)">
          {/* Terminals */}
          <circle cx={-10} cy={wireY} r={3} fill="var(--fg-muted)" />
          <circle cx={14} cy={wireY} r={3} fill="var(--fg-muted)" />

          {/* Switch blade */}
          {switchOn ? (
            <line
              x1={-10}
              y1={wireY}
              x2={14}
              y2={wireY}
              stroke="var(--fg)"
              strokeWidth={2.5}
            />
          ) : (
            <line
              x1={-10}
              y1={wireY}
              x2={8}
              y2={wireY - 16}
              stroke="var(--fg)"
              strokeWidth={2.5}
            />
          )}

          {/* Switch label */}
          <text
            x={2}
            y={wireY + 16}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={13}
            fontFamily="var(--font-sans)"
            fill="var(--fg-muted)"
            style={{ userSelect: 'none' }}
          >
            {switchOn ? 'Switch closed' : 'Switch open'}
          </text>
        </g>

        {/* Wire into meter and over to Cu */}
        <path
          d={`M -46 ${wireY} L -26 ${wireY}`}
          fill="none"
          stroke="var(--fg-muted)"
          strokeWidth={2}
        />
        <path
          d={`M 26 ${wireY} L ${cuBeakerX} ${wireY} L ${cuBeakerX} ${rodTopY}`}
          fill="none"
          stroke="var(--fg-muted)"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* ============================================================ */}
        {/* 5. Voltmeter Readout                                         */}
        {/* ============================================================ */}
        <g transform={`translate(0, ${wireY})`}>
          {meterSlot ?? (
            <g>
              <circle
                cx={0}
                cy={0}
                r={26}
                fill="var(--surface)"
                stroke="var(--border)"
                strokeWidth={2}
              />
              <circle
                cx={0}
                cy={0}
                r={23}
                fill="var(--surface)"
                opacity={0.7}
              />

              {/* Gauge ticks */}
              <line x1={-14} y1={-8} x2={-10} y2={-5} stroke="var(--fg-muted)" strokeWidth={1.2} />
              <line x1={0} y1={-15} x2={0} y2={-10} stroke="var(--fg-muted)" strokeWidth={1.5} />
              <line x1={14} y1={-8} x2={10} y2={-5} stroke="var(--fg-muted)" strokeWidth={1.2} />

              {/* Needle */}
              {switchOn ? (
                <line
                  x1={0}
                  y1={6}
                  x2={13}
                  y2={-11}
                  stroke="var(--heat)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              ) : (
                <line
                  x1={0}
                  y1={6}
                  x2={-12}
                  y2={-8}
                  stroke="var(--fg-subtle)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )}
              <circle cx={0} cy={6} r={3} fill="var(--fg)" />

              {/* Digital Voltage Readout Badge below meter */}
              <g transform="translate(0, 36)">
                <rect
                  x={-42}
                  y={-12}
                  width={84}
                  height={24}
                  rx={4}
                  fill="var(--surface-raised)"
                  stroke="var(--border)"
                  strokeWidth={1.4}
                />
                <text
                  x={0}
                  y={0.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={14}
                  fontWeight={600}
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
        {/* 6. Electron dots & Current arrow along wire                  */}
        {/* ============================================================ */}
        {switchOn && (
          <g>
            {/* Electron Flow: Zn -> Cu (left to right) */}
            <g transform={`translate(${cuBeakerX - 45}, ${wireY - 14})`}>
              <line
                x1={-25}
                y1={0}
                x2={10}
                y2={0}
                stroke="var(--electron)"
                strokeWidth={1.5}
                markerEnd={`url(#${arrowRightId})`}
              />
              <text
                x={-7}
                y={-10}
                textAnchor="middle"
                fontSize={13}
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
            <g transform={`translate(${znBeakerX + 45}, ${wireY - 14})`}>
              <line
                x1={25}
                y1={0}
                x2={-10}
                y2={0}
                stroke="var(--fg-muted)"
                strokeWidth={1.5}
                markerEnd={`url(#${arrowLeftId})`}
              />
              <text
                x={8}
                y={-10}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                fill="var(--fg-muted)"
                style={{ userSelect: 'none' }}
              >
                Current (<tspan className="sym">I</tspan>)
              </text>
            </g>

            {/* Electron dot pulses */}
            {Array.from({ length: numElectrons }).map((_, i) => {
              const dotProgress = (p + i / numElectrons) % 1
              let dotX = -130 + dotProgress * 260
              if (dotX > -26 && dotX < 26) dotX += 52
              if (dotX > 135) return null

              return (
                <circle
                  key={i}
                  cx={dotX}
                  cy={wireY}
                  r={3.2}
                  fill="var(--electron)"
                />
              )
            })}
          </g>
        )}
      </g>
    </g>
  )
})
