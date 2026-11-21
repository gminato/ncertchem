'use client'

import { useState } from 'react'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Segmented, Slider } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import { VocabDefs } from '@/components/vocab'
import {
  ISOTONIC_SALINE_MASS_PERCENT,
  barToKiloPascals,
  compareTonicity,
  flowDirection,
  osmoticPressureBar,
} from '@/lib/chem/osmosis'
import styles from './osmosis-pressure-lab.module.css'

type LabMode = 'ro' | 'tonicity'

const MODE_OPTIONS = [
  { value: 'ro', label: 'Osmosis & Reverse Osmosis' },
  { value: 'tonicity', label: 'Red Blood Cell Tonicity' },
] as const

const MAX_PRESSURE_BAR = 20
const PORE_YS = [174, 202, 230, 258, 286] as const

const SOLUTE_POSITIONS = [
  { x: 320, y: 244, ph: 0.4 },
  { x: 364, y: 266, ph: 1.5 },
  { x: 416, y: 248, ph: 2.3 },
  { x: 466, y: 262, ph: 3.1 },
  { x: 342, y: 290, ph: 4.0 },
  { x: 396, y: 292, ph: 5.1 },
  { x: 448, y: 288, ph: 1.9 },
  { x: 336, y: 222, ph: 2.8 },
  { x: 386, y: 226, ph: 3.7 },
  { x: 438, y: 224, ph: 0.9 },
  { x: 474, y: 238, ph: 4.6 },
  { x: 368, y: 244, ph: 5.5 },
  { x: 422, y: 272, ph: 1.1 },
  { x: 316, y: 274, ph: 2.5 },
] as const

const BATH_ION_POSITIONS = [
  { x: 74, y: 74, ph: 0.3 },
  { x: 118, y: 92, ph: 1.4 },
  { x: 162, y: 72, ph: 2.2 },
  { x: 418, y: 74, ph: 3.1 },
  { x: 468, y: 92, ph: 4.0 },
  { x: 506, y: 72, ph: 4.9 },
  { x: 80, y: 144, ph: 0.8 },
  { x: 132, y: 162, ph: 1.7 },
  { x: 448, y: 158, ph: 2.6 },
  { x: 502, y: 146, ph: 3.5 },
  { x: 76, y: 218, ph: 4.4 },
  { x: 126, y: 236, ph: 5.3 },
  { x: 184, y: 242, ph: 0.6 },
  { x: 396, y: 240, ph: 1.9 },
  { x: 454, y: 234, ph: 2.9 },
  { x: 506, y: 216, ph: 3.8 },
  { x: 102, y: 118, ph: 4.7 },
  { x: 478, y: 120, ph: 5.6 },
  { x: 104, y: 192, ph: 1.2 },
  { x: 478, y: 192, ph: 2.1 },
  { x: 212, y: 68, ph: 3.3 },
  { x: 368, y: 68, ph: 4.2 },
  { x: 224, y: 246, ph: 5.1 },
  { x: 356, y: 246, ph: 0.5 },
  { x: 152, y: 126, ph: 1.6 },
  { x: 426, y: 126, ph: 2.7 },
  { x: 154, y: 204, ph: 3.9 },
  { x: 426, y: 204, ph: 4.8 },
] as const

function buildCrenatedCellPath(
  cx: number,
  cy: number,
  baseR: number,
  amplitude: number,
  lobes = 14,
): string {
  const parts: string[] = []
  const samples = lobes * 4
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * Math.PI * 2
    const r = baseR + Math.sin(theta * lobes) * amplitude
    const x = cx + Math.cos(theta) * r
    const y = cy + Math.sin(theta) * r
    parts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return `${parts.join(' ')} Z`
}

function meniscusPath(x1: number, x2: number, y: number): string {
  const mid = (x1 + x2) / 2
  return `M ${x1} ${y - 1.5} Q ${mid} ${y + 3} ${x2} ${y - 1.5}`
}

export function OsmosisPressureLab({ reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<LabMode>('ro')
  const [molarity, setMolarity] = useState<number>(0.2)
  const [tempK, setTempK] = useState<number>(298)
  const [appliedPressureBar, setAppliedPressureBar] = useState<number>(2.0)
  const [salinePercent, setSalinePercent] = useState<number>(0.9)

  const t = useAmbientTime(reducedMotion)

  // Osmosis & Reverse Osmosis physics
  const piBar = osmoticPressureBar({ molarity, tempK })
  const piKpa = barToKiloPascals(piBar)
  const regime = flowDirection({
    appliedPressureBar,
    osmoticPressureBar: piBar,
    toleranceBar: 0.15,
  })
  const netPressureBar = appliedPressureBar - piBar

  // Gauge coordinates (track x = 36..544, width 508 for 0..20 bar)
  const gaugeLeft = 36
  const gaugeWidth = 508
  const pExtFrac = Math.min(1, Math.max(0, appliedPressureBar / MAX_PRESSURE_BAR))
  const piFrac = Math.min(1, Math.max(0, piBar / MAX_PRESSURE_BAR))
  const piMarkerX = gaugeLeft + piFrac * gaugeWidth
  const piLabelX = Math.max(96, Math.min(484, piMarkerX))

  // Liquid column shifts based on net driving pressure
  const clampedDelta = Math.max(-1, Math.min(1, netPressureBar / 6))
  // Positive netPressureBar (reverse osmosis) pushes right down (+y) and left up (-y)
  const leftLiquidTop = 192 - clampedDelta * 26
  const rightLiquidTop = 192 + clampedDelta * 26
  const vesselBottom = 310
  const visibleSolutes = Math.max(
    2,
    Math.min(SOLUTE_POSITIONS.length, Math.round((molarity / 0.6) * SOLUTE_POSITIONS.length)),
  )

  // Tonicity physics
  const tonicityResult = compareTonicity(salinePercent, 0.025)
  const visibleBathIons = Math.max(
    2,
    Math.min(
      BATH_ION_POSITIONS.length,
      Math.round(((salinePercent - 0.05) / 2.45) * BATH_ION_POSITIONS.length),
    ),
  )

  // Cell shape parameters for tonicity SVG
  const hypoFactor = Math.max(0, Math.min(1, (ISOTONIC_SALINE_MASS_PERCENT - salinePercent) / 0.8))
  const hyperFactor = Math.max(0, Math.min(1, (salinePercent - ISOTONIC_SALINE_MASS_PERCENT) / 1.6))
  const cellCx = 290
  const cellCy = 158
  const arrowPulse = reducedMotion ? 0 : Math.sin(t * 3.1) * 4
  const cellBreath = reducedMotion ? 0 : Math.sin(t * 2.2) * 1.8
  const crenatedPath = buildCrenatedCellPath(
    cellCx,
    cellCy,
    44 - hyperFactor * 16 - cellBreath * 0.4,
    2.5 + hyperFactor * 5.2,
  )

  // Tonicity scale bar x = 56..524 for 0.1%..2.5%
  const scaleLeft = 56
  const scaleWidth = 468
  const isoX = scaleLeft + ((ISOTONIC_SALINE_MASS_PERCENT - 0.1) / 2.4) * scaleWidth
  const currSalineX = scaleLeft + ((salinePercent - 0.1) / 2.4) * scaleWidth

  const regimeLabel =
    regime === 'forward-osmosis'
      ? 'Forward osmosis'
      : regime === 'equilibrium'
        ? 'Osmotic equilibrium'
        : 'Reverse osmosis desalination'

  const regimeNote =
    regime === 'forward-osmosis'
      ? 'Applied pressure is below Π, so pure water spontaneously crosses into the solution.'
      : regime === 'equilibrium'
        ? 'Applied pressure matches Π = C R T; opposing water fluxes cancel with zero net flow.'
        : 'Applied pressure exceeds Π, squeezing pure freshwater out of the concentrated solution.'

  const tonicityLabel =
    tonicityResult.tonicity === 'hypotonic'
      ? 'Hypotonic — cell swells'
      : tonicityResult.tonicity === 'isotonic'
        ? 'Isotonic — steady shape'
        : 'Hypertonic — cell shrinks (crenates)'

  const tonicityNote =
    tonicityResult.tonicity === 'hypotonic'
      ? 'Below 0.9% (w/v) NaCl, water rushes into the blood cell; excessive swelling can rupture it.'
      : tonicityResult.tonicity === 'isotonic'
        ? 'At 0.9% (w/v) NaCl (normal saline), osmotic pressures match — safe for intravenous drips.'
        : 'Above 0.9% (w/v) NaCl, water exits the blood cell and it shrivels — just like pickled mangoes.'

  const liveSummary =
    mode === 'ro'
      ? `Osmotic pressure is ${piBar.toFixed(2)} bar (${piKpa.toFixed(0)} kPa). Applied pressure is ${appliedPressureBar.toFixed(1)} bar. Regime: ${regimeLabel}.`
      : `External saline is ${salinePercent.toFixed(2)} percent weight by volume NaCl. Solution is ${tonicityResult.tonicity}; blood cell ${tonicityResult.cellResponse}.`

  const transitionStyle = reducedMotion ? undefined : { transition: 'all 180ms ease-out' }

  // Dynamic speed factor for crossing water dots proportional to |netPressureBar|
  const streamSpeed = Math.min(1.15, 0.45 + Math.abs(netPressureBar) * 0.08)

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <Segmented
          label="Experiment mode"
          options={MODE_OPTIONS}
          value={mode}
          onChange={setMode}
        />

        {mode === 'ro' ? (
          <div className={styles.sliderGrid}>
            <Slider
              label="Solute concentration C"
              value={molarity}
              min={0.02}
              max={0.6}
              step={0.01}
              unit="mol L⁻¹"
              format={(v) => v.toFixed(2)}
              onChange={setMolarity}
            />
            <Slider
              label="Temperature T"
              value={tempK}
              min={280}
              max={330}
              step={1}
              unit="K"
              format={(v) => v.toFixed(0)}
              onChange={setTempK}
            />
            <Slider
              label="Applied external pressure"
              value={appliedPressureBar}
              min={0}
              max={MAX_PRESSURE_BAR}
              step={0.1}
              unit="bar"
              format={(v) => v.toFixed(1)}
              onChange={setAppliedPressureBar}
            />
          </div>
        ) : (
          <Slider
            label="External NaCl concentration"
            value={salinePercent}
            min={0.1}
            max={2.5}
            step={0.05}
            unit="% (w/v)"
            format={(v) => v.toFixed(2)}
            onChange={setSalinePercent}
          />
        )}
      </div>

      <div className={styles.stage}>
        {mode === 'ro' ? (
          <svg
            viewBox="0 0 580 364"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label={`Osmosis and reverse osmosis apparatus. Osmotic pressure ${piBar.toFixed(2)} bar, applied pressure ${appliedPressureBar.toFixed(1)} bar, currently in ${regimeLabel}.`}
          >
            <VocabDefs idPrefix="osmlab" />
            <defs>
              <marker
                id="lab-arrow-fwd"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--fwd)" />
              </marker>
              <marker
                id="lab-arrow-rev"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--rev)" />
              </marker>
              <marker
                id="lab-arrow-eq"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--success)" />
              </marker>
              <marker
                id="lab-arrow-accent"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--accent)" />
              </marker>
            </defs>

            {/* Pressure comparison gauge */}
            <text
              x={gaugeLeft}
              y={22}
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={600}
              fill="var(--fg)"
            >
              Applied P<Sub>ext</Sub> ({appliedPressureBar.toFixed(1)} bar) vs Π ({piBar.toFixed(2)} bar)
            </text>
            <rect
              x={gaugeLeft}
              y={32}
              width={gaugeWidth}
              height={14}
              rx={7}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.2}
            />
            <rect
              x={gaugeLeft}
              y={32}
              width={Math.max(4, pExtFrac * gaugeWidth)}
              height={14}
              rx={7}
              fill={
                regime === 'forward-osmosis'
                  ? 'var(--fwd)'
                  : regime === 'equilibrium'
                    ? 'var(--success)'
                    : 'var(--rev)'
              }
              style={transitionStyle}
            />
            {/* Π threshold marker */}
            <line
              x1={piMarkerX}
              y1={27}
              x2={piMarkerX}
              y2={52}
              stroke="var(--fg)"
              strokeWidth={2.2}
              style={transitionStyle}
            />
            <text
              x={piLabelX}
              y={68}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={700}
              fill="var(--fg)"
            >
              Π = {piBar.toFixed(2)} bar
            </text>

            {/* Freshwater outlet spout when reverse osmosis is active */}
            {regime === 'reverse-osmosis' && (
              <g>
                <path
                  d="M 76 176 L 44 176 Q 34 176 34 188 L 34 214"
                  fill="none"
                  stroke="var(--glass-wall)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                <path
                  d="M 76 176 L 44 176 Q 34 176 34 188 L 34 212"
                  fill="none"
                  stroke="var(--liquid-edge)"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                />
                {[0, 1, 2].map((dIdx) => {
                  const phase = reducedMotion ? dIdx * 0.33 : (t * 0.9 + dIdx * 0.33) % 1
                  const dy = 218 + phase * 42
                  return (
                    <circle
                      key={`drop-${dIdx}`}
                      cx={34}
                      cy={dy}
                      r={3.6}
                      fill="var(--liquid-edge)"
                      opacity={1 - phase * 0.55}
                    />
                  )
                })}
                <text
                  x={34}
                  y={280}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={600}
                  fill="var(--rev)"
                >
                  H<Sub>2</Sub>O
                </text>
              </g>
            )}

            {/* Twin-chamber vessel interior glass fill */}
            <path
              d={`M 76 98 L 76 ${vesselBottom - 10} Q 76 ${vesselBottom} 86 ${vesselBottom} L 486 ${vesselBottom} Q 496 ${vesselBottom} 496 ${vesselBottom - 10} L 496 98 Z`}
              fill="var(--glass-fill)"
            />

            {/* Left chamber: pure water */}
            <rect
              x={77}
              y={leftLiquidTop}
              width={199}
              height={Math.max(20, vesselBottom - leftLiquidTop)}
              fill="var(--liquid)"
              style={transitionStyle}
            />
            <path
              d={meniscusPath(78, 275, leftLiquidTop)}
              fill="none"
              stroke="var(--liquid-edge)"
              strokeWidth={2.4}
              style={transitionStyle}
            />

            {/* Right chamber: solution */}
            <rect
              x={296}
              y={rightLiquidTop}
              width={199}
              height={Math.max(20, vesselBottom - rightLiquidTop)}
              fill="var(--liquid)"
              style={transitionStyle}
            />
            <rect
              x={296}
              y={rightLiquidTop}
              width={199}
              height={Math.max(20, vesselBottom - rightLiquidTop)}
              fill="var(--accent-soft)"
              opacity={0.22 + (molarity / 0.6) * 0.45}
              style={transitionStyle}
            />
            <path
              d={meniscusPath(297, 494, rightLiquidTop)}
              fill="none"
              stroke="var(--accent)"
              strokeWidth={2.4}
              style={transitionStyle}
            />

            {/* 3D-shaded solute particles in right chamber with gentle thermal bobbing */}
            {SOLUTE_POSITIONS.slice(0, visibleSolutes)
              .filter((pt) => pt.y > rightLiquidTop + 14)
              .map((pt, idx) => {
                const dx = reducedMotion ? 0 : Math.sin(t * 1.2 + pt.ph) * 3.2
                const dy = reducedMotion ? 0 : Math.cos(t * 1.0 + pt.ph * 1.2) * 2.6
                const cx = Math.max(308, Math.min(484, pt.x + dx))
                const cy = Math.max(rightLiquidTop + 13, Math.min(vesselBottom - 12, pt.y + dy))
                return (
                  <g key={`sol-${idx}`}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={7.8}
                      fill={idx % 2 === 0 ? 'var(--spot-2)' : 'var(--spot-3)'}
                      stroke="var(--atom-rim)"
                      strokeWidth={1}
                    />
                    <circle cx={cx} cy={cy} r={7.8} fill="url(#osmlab-sphere-shading)" />
                  </g>
                )
              })}

            {/* Semipermeable membrane with animated water-crossing dots */}
            <rect
              x={276}
              y={140}
              width={20}
              height={vesselBottom - 140}
              fill="var(--surface)"
              stroke="var(--glass-wall)"
              strokeWidth={1.5}
            />
            {PORE_YS.map((py, pIdx) => {
              const submerged = py > Math.min(leftLiquidTop, rightLiquidTop) + 6
              const phase = (pIdx * 0.23) % 1
              const u = reducedMotion ? 0.5 : (t * streamSpeed + phase) % 1
              let dotX = 286
              let dotAlpha = 0.9
              if (regime === 'forward-osmosis') {
                dotX = 250 + u * 72
                dotAlpha = Math.sin(u * Math.PI)
              } else if (regime === 'reverse-osmosis') {
                dotX = 322 - u * 72
                dotAlpha = Math.sin(u * Math.PI)
              } else {
                const dir = pIdx % 2 === 0 ? 1 : -1
                dotX = dir > 0 ? 256 + u * 60 : 316 - u * 60
                dotAlpha = Math.sin(u * Math.PI)
              }
              return (
                <g key={`lab-pore-${py}`}>
                  <rect x={275} y={py - 4} width={22} height={8} fill={submerged ? 'var(--liquid)' : 'var(--glass-fill)'} />
                  {submerged && (
                    <g opacity={Math.max(0.2, dotAlpha)}>
                      <circle cx={dotX} cy={py} r={3.4} fill="var(--liquid-edge)" />
                      <circle cx={dotX} cy={py} r={3.4} fill="url(#osmlab-sphere-shading)" />
                    </g>
                  )}
                </g>
              )
            })}

            {/* Movable piston on right chamber */}
            <g>
              <rect
                x={389}
                y={104}
                width={14}
                height={Math.max(10, rightLiquidTop - 118)}
                fill="var(--surface)"
                stroke="var(--glass-wall)"
                strokeWidth={1.2}
                style={transitionStyle}
              />
              <rect
                x={299}
                y={rightLiquidTop - 14}
                width={193}
                height={14}
                rx={3}
                fill="var(--glass-wall)"
                stroke="var(--fg)"
                strokeWidth={1.1}
                style={transitionStyle}
              />
              {appliedPressureBar > 0.05 && (
                <line
                  x1={396}
                  y1={76}
                  x2={396}
                  y2={84 + Math.min(22, (appliedPressureBar / MAX_PRESSURE_BAR) * 22)}
                  stroke="var(--accent)"
                  strokeWidth={3.2}
                  markerEnd="url(#lab-arrow-accent)"
                />
              )}
            </g>

            {/* Outer glass walls + specular sheen */}
            <path
              d={`M 71 95 L 76 100 L 76 ${vesselBottom - 10} Q 76 ${vesselBottom} 86 ${vesselBottom} L 486 ${vesselBottom} Q 496 ${vesselBottom} 496 ${vesselBottom - 10} L 496 100 L 501 95`}
              fill="none"
              stroke="var(--glass-wall)"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <line
              x1={86}
              y1={114}
              x2={86}
              y2={vesselBottom - 20}
              stroke="var(--glass-sheen)"
              strokeWidth={2.5}
              strokeLinecap="round"
              opacity={0.65}
            />

            {/* Net flow arrow & clean borderless regime label */}
            {regime === 'forward-osmosis' && (
              <g>
                <line
                  x1={232}
                  y1={230}
                  x2={338}
                  y2={230}
                  stroke="var(--fwd)"
                  strokeWidth={4}
                  markerEnd="url(#lab-arrow-fwd)"
                />
                <text
                  x={176}
                  y={124}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--fwd)"
                >
                  Forward osmosis →
                </text>
              </g>
            )}

            {regime === 'equilibrium' && (
              <g>
                <line
                  x1={244}
                  y1={224}
                  x2={326}
                  y2={224}
                  stroke="var(--success)"
                  strokeWidth={2.6}
                  markerEnd="url(#lab-arrow-eq)"
                />
                <line
                  x1={330}
                  y1={236}
                  x2={248}
                  y2={236}
                  stroke="var(--success)"
                  strokeWidth={2.6}
                  markerEnd="url(#lab-arrow-eq)"
                />
                <text
                  x={176}
                  y={124}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--success)"
                >
                  Equilibrium (P<Sub>ext</Sub> = Π)
                </text>
              </g>
            )}

            {regime === 'reverse-osmosis' && (
              <g>
                <line
                  x1={342}
                  y1={230}
                  x2={236}
                  y2={230}
                  stroke="var(--rev)"
                  strokeWidth={4}
                  markerEnd="url(#lab-arrow-rev)"
                />
                <text
                  x={176}
                  y={124}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--rev)"
                >
                  ← Reverse osmosis
                </text>
              </g>
            )}

            {/* Bottom chamber labels */}
            <text
              x={176}
              y={342}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={600}
              fill="var(--fg)"
            >
              {regime === 'reverse-osmosis' ? 'Freshwater permeate' : 'Pure water'}
            </text>
            <text
              x={286}
              y={342}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={700}
              fill="var(--accent)"
            >
              SPM
            </text>
            <text
              x={396}
              y={342}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={600}
              fill="var(--fg)"
            >
              Solution ({molarity.toFixed(2)} mol L<Sup>−1</Sup>)
            </text>
          </svg>
        ) : (
          <svg
            viewBox="0 0 580 364"
            style={{ width: '100%', height: 'auto', display: 'block' }}
            role="img"
            aria-label={`Red blood cell immersed in ${salinePercent.toFixed(2)} percent weight by volume aqueous sodium chloride. ${tonicityLabel}.`}
          >
            <VocabDefs idPrefix="osmlab-ton" />
            <defs>
              <marker
                id="ton-arrow-in"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--fwd)" />
              </marker>
              <marker
                id="ton-arrow-out"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--heat)" />
              </marker>
              <marker
                id="ton-arrow-eq"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--success)" />
              </marker>
              <radialGradient id="osmlab-rbc-grad" cx="35%" cy="32%" r="68%">
                <stop offset="0%" stopColor="var(--sphere-highlight)" stopOpacity="0.45" />
                <stop offset="48%" stopColor="var(--heat)" stopOpacity="0.92" />
                <stop offset="100%" stopColor="var(--sphere-shadow)" stopOpacity="0.55" />
              </radialGradient>
              <radialGradient id="osmlab-rbc-dimple" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.44" />
                <stop offset="75%" stopColor="var(--heat)" stopOpacity="0.1" />
                <stop offset="100%" stopColor="var(--heat)" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="osmlab-bath-grad" cx="50%" cy="50%" r="54%">
                <stop offset="0%" stopColor="var(--liquid)" stopOpacity="0.95" />
                <stop offset="82%" stopColor="var(--liquid)" stopOpacity="0.55" />
                <stop offset="100%" stopColor="var(--liquid)" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Header */}
            <text
              x={46}
              y={26}
              fontFamily="var(--font-sans)"
              fontSize={15}
              fontWeight={700}
              fill="var(--fg)"
            >
              Red blood cell in {salinePercent.toFixed(2)}% (w/v) NaCl
            </text>
            <text
              x={534}
              y={26}
              textAnchor="end"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={700}
              fill={
                tonicityResult.tonicity === 'isotonic'
                  ? 'var(--success)'
                  : tonicityResult.tonicity === 'hypotonic'
                    ? 'var(--fwd)'
                    : 'var(--heat)'
              }
            >
              {tonicityResult.tonicity.toUpperCase()}
            </text>

            {/* Borderless soft saline bath field */}
            <ellipse cx={290} cy={158} rx={244} ry={112} fill="url(#osmlab-bath-grad)" />

            {/* Dissolved Na+ and Cl- ions gently drifting in bath */}
            {BATH_ION_POSITIONS.slice(0, visibleBathIons).map((pt, i) => {
              const dx = reducedMotion ? 0 : Math.sin(t * 1.15 + pt.ph) * 3.2
              const dy = reducedMotion ? 0 : Math.cos(t * 0.95 + pt.ph * 1.2) * 2.6
              return (
                <g key={`ion-${i}`}>
                  <circle
                    cx={pt.x + dx}
                    cy={pt.y + dy}
                    r={4.5}
                    fill={i % 2 === 0 ? 'var(--el-Na)' : 'var(--el-Cl)'}
                    stroke="var(--atom-rim)"
                    strokeWidth={0.7}
                  />
                  <circle
                    cx={pt.x + dx}
                    cy={pt.y + dy}
                    r={4.5}
                    fill="url(#osmlab-ton-sphere-shading)"
                  />
                </g>
              )
            })}

            {/* Central 3D-shaded red blood cell morphing by tonicity */}
            {tonicityResult.tonicity === 'hypertonic' ? (
              <path
                d={crenatedPath}
                fill="url(#osmlab-rbc-grad)"
                stroke="var(--atom-rim)"
                strokeWidth={2}
                style={transitionStyle}
              />
            ) : (
              <g>
                <ellipse
                  cx={cellCx}
                  cy={cellCy}
                  rx={54 + hypoFactor * 16 + cellBreath * hypoFactor}
                  ry={38 + hypoFactor * 30 + cellBreath * hypoFactor}
                  fill="url(#osmlab-rbc-grad)"
                  stroke="var(--atom-rim)"
                  strokeWidth={2}
                  style={transitionStyle}
                />
                <ellipse
                  cx={cellCx}
                  cy={cellCy}
                  rx={25 * (1 - hypoFactor * 0.45)}
                  ry={14 * (1 - hypoFactor * 0.45)}
                  fill="url(#osmlab-rbc-dimple)"
                  opacity={1 - hypoFactor * 0.65}
                  style={transitionStyle}
                />
              </g>
            )}

            {/* Animated directional water-flux arrows */}
            {tonicityResult.tonicity === 'hypotonic' && (
              <g>
                <line
                  x1={158 + arrowPulse}
                  y1={cellCy}
                  x2={208 + arrowPulse}
                  y2={cellCy}
                  stroke="var(--fwd)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-in)"
                />
                <line
                  x1={422 - arrowPulse}
                  y1={cellCy}
                  x2={372 - arrowPulse}
                  y2={cellCy}
                  stroke="var(--fwd)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-in)"
                />
                <line
                  x1={cellCx}
                  y1={50 + arrowPulse}
                  x2={cellCx}
                  y2={82 + arrowPulse}
                  stroke="var(--fwd)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-in)"
                />
                <line
                  x1={cellCx}
                  y1={264 - arrowPulse}
                  x2={cellCx}
                  y2={232 - arrowPulse}
                  stroke="var(--fwd)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-in)"
                />
                <text
                  x={206}
                  y={104}
                  textAnchor="end"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--fwd)"
                >
                  H<Sub>2</Sub>O enters
                </text>
              </g>
            )}

            {tonicityResult.tonicity === 'isotonic' && (
              <g>
                <line
                  x1={256}
                  y1={96}
                  x2={286}
                  y2={96}
                  stroke="var(--success)"
                  strokeWidth={2.4}
                  markerEnd="url(#ton-arrow-eq)"
                />
                <line
                  x1={324}
                  y1={106}
                  x2={294}
                  y2={106}
                  stroke="var(--success)"
                  strokeWidth={2.4}
                  markerEnd="url(#ton-arrow-eq)"
                />
                <text
                  x={cellCx}
                  y={80}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--success)"
                >
                  Balanced H<Sub>2</Sub>O flow (no net osmosis)
                </text>
                <text
                  x={cellCx}
                  y={244}
                  textAnchor="middle"
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={600}
                  fill="var(--fg)"
                >
                  Healthy biconcave disc
                </text>
              </g>
            )}

            {tonicityResult.tonicity === 'hypertonic' && (
              <g>
                <line
                  x1={232 - arrowPulse}
                  y1={cellCy}
                  x2={176 - arrowPulse}
                  y2={cellCy}
                  stroke="var(--heat)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-out)"
                />
                <line
                  x1={348 + arrowPulse}
                  y1={cellCy}
                  x2={404 + arrowPulse}
                  y2={cellCy}
                  stroke="var(--heat)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-out)"
                />
                <line
                  x1={cellCx}
                  y1={108 - arrowPulse}
                  x2={cellCx}
                  y2={62 - arrowPulse}
                  stroke="var(--heat)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-out)"
                />
                <line
                  x1={cellCx}
                  y1={208 + arrowPulse}
                  x2={cellCx}
                  y2={254 + arrowPulse}
                  stroke="var(--heat)"
                  strokeWidth={3.5}
                  markerEnd="url(#ton-arrow-out)"
                />
                <text
                  x={382}
                  y={104}
                  fontFamily="var(--font-sans)"
                  fontSize={14}
                  fontWeight={700}
                  fill="var(--heat)"
                >
                  H<Sub>2</Sub>O exits
                </text>
              </g>
            )}

            {/* Tonicity scale bar */}
            <rect
              x={scaleLeft}
              y={300}
              width={scaleWidth}
              height={10}
              rx={5}
              fill="var(--surface)"
              stroke="var(--border)"
              strokeWidth={1.2}
            />
            <rect
              x={scaleLeft}
              y={300}
              width={isoX - scaleLeft}
              height={10}
              rx={5}
              fill="var(--fwd)"
              opacity={0.28}
            />
            <rect
              x={isoX}
              y={300}
              width={scaleLeft + scaleWidth - isoX}
              height={10}
              rx={5}
              fill="var(--heat)"
              opacity={0.28}
            />
            {/* 0.9% Isotonic tick */}
            <line x1={isoX} y1={290} x2={isoX} y2={320} stroke="var(--success)" strokeWidth={2.5} />
            <text
              x={isoX}
              y={340}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fontWeight={700}
              fill="var(--success)"
            >
              0.9% isotonic
            </text>
            <text
              x={scaleLeft}
              y={340}
              fontFamily="var(--font-sans)"
              fontSize={14}
              fill="var(--fg-muted)"
            >
              0.1%
            </text>
            <text
              x={scaleLeft + scaleWidth}
              y={340}
              textAnchor="end"
              fontFamily="var(--font-sans)"
              fontSize={14}
              fill="var(--fg-muted)"
            >
              2.5% NaCl
            </text>
            {/* Current salinity dot */}
            <circle
              cx={currSalineX}
              cy={305}
              r={7}
              fill="var(--accent)"
              stroke="var(--surface)"
              strokeWidth={2}
              style={transitionStyle}
            />
          </svg>
        )}
      </div>

      <div className={styles.readout}>
        {mode === 'ro' ? (
          <>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Osmotic pressure Π</span>
                <span className={styles.metricValue}>{piBar.toFixed(2)} bar</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Π in kilopascals</span>
                <span className={styles.metricValue}>{piKpa.toFixed(0)} kPa</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Applied pressure P<sub>ext</sub>
                </span>
                <span className={styles.metricValue}>{appliedPressureBar.toFixed(1)} bar</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>
                  Net drive (P<sub>ext</sub> − Π)
                </span>
                <span className={styles.metricValue}>
                  {netPressureBar >= 0 ? '+' : ''}
                  {netPressureBar.toFixed(2)} bar
                </span>
              </div>
            </div>
            <div className={styles.verdictRow}>
              <span
                className={`${styles.badge} ${
                  regime === 'forward-osmosis'
                    ? styles.badgeForward
                    : regime === 'equilibrium'
                      ? styles.badgeEquilibrium
                      : styles.badgeReverse
                }`}
              >
                {regimeLabel}
              </span>
              <p className={styles.verdictNote}>{regimeNote}</p>
            </div>
          </>
        ) : (
          <>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>External NaCl</span>
                <span className={styles.metricValue}>{salinePercent.toFixed(2)}% (w/v)</span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Blood-cell reference</span>
                <span className={styles.metricValue}>
                  {ISOTONIC_SALINE_MASS_PERCENT.toFixed(2)}% (w/v)
                </span>
              </div>
              <div className={styles.metric}>
                <span className={styles.metricLabel}>Cell volume response</span>
                <span className={styles.metricValue}>{tonicityResult.cellResponse}</span>
              </div>
            </div>
            <div className={styles.verdictRow}>
              <span
                className={`${styles.badge} ${
                  tonicityResult.tonicity === 'isotonic'
                    ? styles.badgeEquilibrium
                    : tonicityResult.tonicity === 'hypotonic'
                      ? styles.badgeForward
                      : styles.badgeHypertonic
                }`}
              >
                {tonicityLabel}
              </span>
              <p className={styles.verdictNote}>{tonicityNote}</p>
            </div>
          </>
        )}
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {liveSummary}
      </p>
    </div>
  )
}
