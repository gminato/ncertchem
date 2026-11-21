'use client'

import { Label, Vessel, VocabDefs } from '@/components/vocab'
import { Thermometer } from '@/components/vocab/Thermometer'
import { RateBars } from '@/components/equilibrium'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { HENRY_STEPS, clampHenryStep } from './henry-steps'

export interface HenryLawPistonProps {
  step: number
  reducedMotion: boolean
}

/** Deterministic normalised coordinates (0..1) for headspace gas particles. */
const GAS_PARTICLE_SLOTS: readonly [number, number][] = [
  [0.14, 0.24], [0.36, 0.36], [0.58, 0.20], [0.80, 0.32], [0.24, 0.64],
  [0.48, 0.72], [0.72, 0.62], [0.86, 0.78], [0.14, 0.80], [0.32, 0.18],
  [0.64, 0.46], [0.44, 0.50], [0.84, 0.20], [0.22, 0.46], [0.54, 0.82],
  [0.74, 0.44], [0.38, 0.82], [0.68, 0.26],
]

/** Deterministic normalised coordinates (0..1) for dissolved solute particles in liquid. */
const DISSOLVED_SLOTS: readonly [number, number][] = [
  [0.18, 0.22], [0.46, 0.30], [0.74, 0.24], [0.30, 0.60],
  [0.62, 0.66], [0.82, 0.54], [0.16, 0.74], [0.50, 0.50],
  [0.26, 0.38], [0.76, 0.78], [0.40, 0.82], [0.64, 0.38],
]

/** Cylinder geometry (centred at x=146, y=248; height=310, width=174). */
const CYL_CX = 146
const CYL_CY = 248
const CYL_W = 174
const CYL_H = 310
const CYL_LEFT = CYL_CX - CYL_W / 2 // 59
const CYL_RIGHT = CYL_CX + CYL_W / 2 // 233
const CYL_TOP = CYL_CY - CYL_H / 2 // 93
const CYL_BOTTOM = CYL_CY + CYL_H / 2 // 403
const LIQUID_LEVEL = 0.44
const LIQUID_Y = CYL_BOTTOM - LIQUID_LEVEL * CYL_H // 266.6

/** Right-side Henry's-law plot geometry. */
const PLOT_LEFT = 322
const PLOT_RIGHT = 554
const PLOT_TOP = 104
const PLOT_BOTTOM = 340
const PLOT_W = PLOT_RIGHT - PLOT_LEFT // 232
const PLOT_H = PLOT_BOTTOM - PLOT_TOP // 236

function ShadedSphere({
  cx,
  cy,
  r,
  fill,
  opacity = 1,
}: {
  cx: number
  cy: number
  r: number
  fill: string
  opacity?: number
}) {
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={r} fill={fill} stroke="var(--atom-rim)" strokeWidth={0.9} />
      <circle cx={cx} cy={cy} r={r} fill="url(#hl-sphere-shading)" style={{ pointerEvents: 'none' }} />
    </g>
  )
}

function dialPoint(cx: number, cy: number, r: number, fraction: number) {
  const clamped = Math.min(1, Math.max(0, fraction))
  const deg = -135 + clamped * 270
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

function dialArc(cx: number, cy: number, r: number, from: number, to: number): string {
  const a = dialPoint(cx, cy, r, from)
  const b = dialPoint(cx, cy, r, to)
  const large = to - from > 0.5 ? 1 : 0
  return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${b.x.toFixed(2)} ${b.y.toFixed(2)}`
}

export function HenryLawPiston({ step, reducedMotion }: HenryLawPistonProps) {
  const index = clampHenryStep(step)
  const current = HENRY_STEPS[index]
  const t = useAmbientTime(reducedMotion)

  // Map step piston heights cleanly onto the 580x540 cylinder
  const targetPistonY =
    current.mode === 'gas-low-p'
      ? 122
      : current.mode === 'gas-high-p'
        ? 194
        : current.mode === 'kh-compare'
          ? 158
          : 132

  const targetTempLevel = current.mode === 'kh-compare' ? 0.82 : 0.36
  // Slope factor for O2 line: 1.0 at 293 K (34.86 kbar), 1.343 at 303 K (46.82 kbar)
  const targetKhKbar = current.mode === 'kh-compare' ? 46.82 : 34.86

  const pistonY = useTweenedNumber(targetPistonY, reducedMotion, 0.55)
  const pressure = useTweenedNumber(current.pressureBar, reducedMotion, 0.55)
  const moleFrac1e5 = useTweenedNumber(current.moleFraction1e5, reducedMotion, 0.55)
  const tempLevel = useTweenedNumber(targetTempLevel, reducedMotion, 0.65)
  const khTween = useTweenedNumber(targetKhKbar, reducedMotion, 0.65)

  const headspaceTop = pistonY + 13
  const headspaceH = Math.max(28, LIQUID_Y - headspaceTop - 6)

  // Map p (0..4 bar) and x (0..12 x 10^-5) onto plot coordinates
  const dotX = PLOT_LEFT + (moleFrac1e5 / 12) * PLOT_W
  const dotY = PLOT_BOTTOM - (pressure / 4) * PLOT_H

  // Active O2 Henry line endpoint at p = 4 bar: x = 4 / (khTween * 1000) * 1e5 = 400 / khTween
  const xAt4Bar = 400 / khTween
  const activeLineX2 = PLOT_LEFT + Math.min(1, xAt4Bar / 12) * PLOT_W

  const isWarm = current.mode === 'kh-compare'
  const dissolvedToShow = isWarm ? 6 : current.dissolvedCount

  return (
    <svg
      viewBox="0 0 580 540"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={current.ariaLabel}
      data-testid="henry-law-piston"
      data-step={index}
    >
      <VocabDefs idPrefix="hl" />
      <defs>
        <marker
          id="hl-arrow-fwd"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--fwd)" />
        </marker>
        <marker
          id="hl-arrow-rev"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--rev)" />
        </marker>
        <marker
          id="hl-arrow-heat"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--heat)" />
        </marker>
      </defs>

      {/* ============================================================
          STEP 0: SOLID–LIQUID DYNAMIC EQUILIBRIUM (Beaker + RateBars)
         ============================================================ */}
      {current.mode === 'solid-equilibrium' && (
        <g>
          <Label x={290} y={32} fontSize={15} fontWeight={600} fill="var(--fg)">
            Saturated solid–liquid equilibrium
          </Label>

          {/* Real Beaker Vessel */}
          <Vessel
            variant="beaker"
            width={236}
            height={240}
            x={290}
            y={178}
            level={0.72}
            liquid
            graduated
          />

          {/* Solid ionic crystal lattice sitting at the bottom of the beaker (y = 262..290) */}
          <g>
            {[0, 1, 2, 3, 4, 5].map((col) => (
              <ShadedSphere
                key={`lat0-${col}`}
                cx={222 + col * 27}
                cy={286}
                r={10.5}
                fill={col % 2 === 0 ? 'var(--el-Na)' : 'var(--el-Cl)'}
              />
            ))}
            {[0, 1, 2, 3, 4].map((col) => (
              <ShadedSphere
                key={`lat1-${col}`}
                cx={235.5 + col * 27}
                cy={267}
                r={10.5}
                fill={col % 2 === 0 ? 'var(--el-Cl)' : 'var(--el-Na)'}
              />
            ))}
          </g>

          {/* Dissolved ions drifting gently in the solvent */}
          {DISSOLVED_SLOTS.slice(0, 8).map(([nx, ny], i) => {
            const baseX = 192 + nx * 196
            const baseY = 142 + ny * 98
            const dx = reducedMotion ? 0 : Math.sin(t * 1.3 + i * 1.9) * 5
            const dy = reducedMotion ? 0 : Math.cos(t * 1.1 + i * 2.3) * 4
            return (
              <ShadedSphere
                key={`ion-${i}`}
                cx={baseX + dx}
                cy={baseY + dy}
                r={6.5}
                fill={i % 2 === 0 ? 'var(--el-Na)' : 'var(--el-Cl)'}
              />
            )
          })}

          {/* Living crossing particles: dissolving upward on left, crystallising downward on right */}
          {[0, 0.5].map((phase, idx) => {
            const u = reducedMotion ? (idx === 0 ? 0.42 : 0.78) : (t * 0.42 + phase) % 1
            const upY = 256 - u * 74
            const downY = 182 + u * 74
            const fadeUp = Math.sin(u * Math.PI)
            const fadeDown = Math.sin(u * Math.PI)
            return (
              <g key={`cross-${idx}`}>
                <ShadedSphere cx={238} cy={upY} r={5.5} fill="var(--fwd)" opacity={0.3 + 0.7 * fadeUp} />
                <ShadedSphere cx={342} cy={downY} r={5.5} fill="var(--rev)" opacity={0.3 + 0.7 * fadeDown} />
              </g>
            )
          })}

          {/* Clean exchange arrows inside beaker */}
          <line
            x1={222}
            y1={250}
            x2={222}
            y2={188}
            stroke="var(--fwd)"
            strokeWidth={2.4}
            markerEnd="url(#hl-arrow-fwd)"
          />
          <line
            x1={358}
            y1={188}
            x2={358}
            y2={250}
            stroke="var(--rev)"
            strokeWidth={2.4}
            markerEnd="url(#hl-arrow-rev)"
          />

          {/* Side labels outside glass walls */}
          <text
            x={152}
            y={204}
            textAnchor="end"
            fill="var(--fwd)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Dissolution
          </text>
          <text
            x={152}
            y={224}
            textAnchor="end"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            polar in polar
          </text>

          <text
            x={428}
            y={204}
            textAnchor="start"
            fill="var(--rev)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Crystallisation
          </text>
          <text
            x={428}
            y={224}
            textAnchor="start"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            ions rejoin crystal
          </text>

          {/* Real Class 11 RateBars below the beaker */}
          <RateBars
            x={110}
            y={334}
            progress={1}
            config={{ forwardStart: 1, reverseStart: 0, equilibrium: 0.62 }}
            forwardLabel="Dissolution rate"
            reverseLabel="Crystallisation rate"
            title="Balanced dissolution and crystallisation rates at saturation"
          />

          {/* Understated bottom equation */}
          <text
            x={290}
            y={516}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={15}
          >
            Solute (s) + Solvent (l) ⇌ Solution  —  saturated equilibrium
          </text>
        </g>
      )}

      {/* ============================================================
          STEPS 1, 2, 3: UNIFIED PISTON-CYLINDER + THERMOMETER + HENRY PLOT
         ============================================================ */}
      {(current.mode === 'gas-low-p' ||
        current.mode === 'gas-high-p' ||
        current.mode === 'kh-compare') && (
        <g>
          {/* Left top pressure/state label above piston */}
          <text
            x={CYL_CX}
            y={34}
            textAnchor="middle"
            fill={isWarm ? 'var(--heat)' : 'var(--fg)'}
            fontFamily="var(--font-sans)"
            fontSize={15}
            fontWeight={600}
          >
            {current.mode === 'gas-low-p' && (
              <>
                Low pressure: p<Sub>1</Sub> = 1.0 bar
              </>
            )}
            {current.mode === 'gas-high-p' && (
              <>
                Compressed: p<Sub>2</Sub> = 3.0 bar
              </>
            )}
            {current.mode === 'kh-compare' && <>Warming liquid: 293 K → 303 K</>}
          </text>

          {/* Real Thermometer permanently paired beside cylinder */}
          <Thermometer
            x={30}
            y={374}
            height={156}
            bulbRadius={13}
            stemWidth={9}
            level={tempLevel}
            ticks={[0.25, 0.5, 0.75]}
          />
          <text
            x={30}
            y={408}
            textAnchor="middle"
            fill={isWarm ? 'var(--heat)' : 'var(--coolant)'}
            fontFamily="var(--font-mono)"
            fontSize={14}
            fontWeight={700}
          >
            {isWarm ? '303 K' : '293 K'}
          </text>

          {/* Headspace vapour shading inside cylinder */}
          <rect
            x={CYL_LEFT + 2}
            y={pistonY + 12}
            width={CYL_W - 4}
            height={Math.max(8, LIQUID_Y - (pistonY + 12))}
            fill="var(--vapour)"
            opacity={current.mode === 'gas-high-p' ? 0.92 : 0.62}
          />

          {/* Real Glass Cylinder Vessel */}
          <Vessel
            variant="cylinder"
            width={CYL_W}
            height={CYL_H}
            x={CYL_CX}
            y={CYL_CY}
            level={LIQUID_LEVEL}
            liquid
            graduated
          />

          {/* Piston rod, sealing plate, and weights */}
          <line
            x1={CYL_CX}
            y1={56}
            x2={CYL_CX}
            y2={pistonY}
            stroke="var(--fg-muted)"
            strokeWidth={5.5}
            strokeLinecap="round"
          />
          <rect
            x={CYL_LEFT + 3}
            y={pistonY}
            width={CYL_W - 6}
            height={12}
            rx={3}
            fill="var(--fg-muted)"
          />
          <line
            x1={CYL_LEFT + 12}
            y1={pistonY + 3.5}
            x2={CYL_RIGHT - 12}
            y2={pistonY + 3.5}
            stroke="var(--glass-sheen)"
            strokeWidth={1.6}
            strokeLinecap="round"
          />

          {/* Stacked pressure weights sitting on the piston plate */}
          {Array.from({ length: current.weightCount }).map((_, idx) => {
            const weightW = 38
            const gap = 8
            const totalW = current.weightCount * weightW + (current.weightCount - 1) * gap
            const wx = CYL_CX - totalW / 2 + idx * (weightW + gap)
            return (
              <g key={`w-${idx}`}>
                <rect
                  x={wx}
                  y={pistonY - 24}
                  width={weightW}
                  height={22}
                  rx={4}
                  fill="var(--accent)"
                  stroke="var(--atom-rim)"
                  strokeWidth={1}
                />
                <text
                  x={wx + weightW / 2}
                  y={pistonY - 9}
                  textAnchor="middle"
                  fill="var(--accent-fg)"
                  fontFamily="var(--font-mono)"
                  fontSize={14}
                  fontWeight={700}
                >
                  W
                </text>
              </g>
            )
          })}

          {/* Living headspace gas molecules (bounce gently with useAmbientTime) */}
          {GAS_PARTICLE_SLOTS.slice(0, current.gasParticleCount).map(([nx, ny], i) => {
            const speed = isWarm ? 2.5 : current.mode === 'gas-high-p' ? 2.0 : 1.4
            const ampX = 5.5
            const ampY = Math.min(5, headspaceH * 0.14)
            const dx = reducedMotion ? 0 : Math.sin(t * speed + i * 1.7) * ampX
            const dy = reducedMotion ? 0 : Math.cos(t * speed * 1.15 + i * 2.1) * ampY
            const cx = Math.max(CYL_LEFT + 12, Math.min(CYL_RIGHT - 12, CYL_LEFT + 14 + nx * (CYL_W - 28) + dx))
            const cy = Math.max(
              headspaceTop + 6,
              Math.min(LIQUID_Y - 8, headspaceTop + 6 + ny * Math.max(14, headspaceH - 12) + dy),
            )
            return <ShadedSphere key={`gas-${i}`} cx={cx} cy={cy} r={5} fill="var(--ox)" />
          })}

          {/* Dissolved gas spheres drifting gently in the liquid */}
          {DISSOLVED_SLOTS.slice(0, dissolvedToShow).map(([nx, ny], i) => {
            const dx = reducedMotion ? 0 : Math.sin(t * 1.2 + i * 2.2) * 4.5
            const dy = reducedMotion ? 0 : Math.cos(t * 1.0 + i * 1.6) * 3.5
            const cx = CYL_LEFT + 16 + nx * (CYL_W - 32) + dx
            const cy = LIQUID_Y + 18 + ny * (CYL_BOTTOM - LIQUID_Y - 34) + dy
            return <ShadedSphere key={`sol-${i}`} cx={cx} cy={cy} r={5} fill="var(--ox)" />
          })}

          {/* Living crossing dots across the liquid meniscus */}
          {!isWarm ? (
            <g>
              {/* Entering & escaping equilibrium exchange */}
              {(current.mode === 'gas-high-p' ? [0, 0.33, 0.66] : [0, 0.5]).map((phase, idx) => {
                const rate = current.mode === 'gas-high-p' ? 0.68 : 0.38
                const u = reducedMotion ? (idx * 0.3 + 0.35) % 1 : (t * rate + phase) % 1
                const enterY = LIQUID_Y - 22 + u * 44
                const leaveY = LIQUID_Y + 22 - u * 44
                const op = 0.25 + 0.75 * Math.sin(u * Math.PI)
                return (
                  <g key={`xchg-${idx}`}>
                    <ShadedSphere cx={106} cy={enterY} r={4.5} fill="var(--fwd)" opacity={op} />
                    <ShadedSphere cx={186} cy={leaveY} r={4.5} fill="var(--rev)" opacity={op} />
                  </g>
                )
              })}
              <line
                x1={92}
                y1={LIQUID_Y - 18}
                x2={92}
                y2={LIQUID_Y + 18}
                stroke="var(--fwd)"
                strokeWidth={current.mode === 'gas-high-p' ? 2.6 : 2}
                markerEnd="url(#hl-arrow-fwd)"
              />
              <line
                x1={200}
                y1={LIQUID_Y + 18}
                x2={200}
                y2={LIQUID_Y - 18}
                stroke="var(--rev)"
                strokeWidth={current.mode === 'gas-high-p' ? 2.6 : 2}
                markerEnd="url(#hl-arrow-rev)"
              />
            </g>
          ) : (
            <g>
              {/* Warming: gas bubbles visibly rising out of warm liquid! */}
              {[0, 0.28, 0.56, 0.82].map((phase, idx) => {
                const u = reducedMotion ? (0.2 + idx * 0.22) % 1 : (t * 0.52 + phase) % 1
                const bx = CYL_LEFT + 34 + idx * 34 + (reducedMotion ? 0 : Math.sin(t * 3 + idx) * 3)
                const by = CYL_BOTTOM - 22 - u * (CYL_BOTTOM - LIQUID_Y - 6)
                const op = 0.25 + 0.75 * Math.sin(u * Math.PI)
                return (
                  <circle
                    key={`bub-${idx}`}
                    cx={bx}
                    cy={by}
                    r={4.2}
                    fill="none"
                    stroke="var(--heat)"
                    strokeWidth={1.8}
                    opacity={op}
                  />
                )
              })}
              <line
                x1={CYL_CX}
                y1={LIQUID_Y + 28}
                x2={CYL_CX}
                y2={LIQUID_Y - 18}
                stroke="var(--heat)"
                strokeWidth={2.5}
                markerEnd="url(#hl-arrow-heat)"
              />

              {/* Warm flame glowing beneath the cylinder */}
              <g transform={`translate(${CYL_CX}, 448)`}>
                <ellipse
                  cx={0}
                  cy={-26}
                  rx={42}
                  ry={8}
                  fill="var(--heat)"
                  opacity={reducedMotion ? 0.2 : 0.16 + 0.08 * Math.sin(t * 5.2)}
                />
                {[-22, 0, 22].map((fx, fi) => {
                  const flicker = reducedMotion ? 0 : Math.sin(t * 7 + fi * 2.1) * 2.5
                  return (
                    <g key={`fl-${fi}`} transform={`translate(${fx}, 0)`}>
                      <path
                        d={`M -9 0 Q -10 -14 0 ${-28 - flicker} Q 10 -14 9 0 Z`}
                        fill="var(--heat)"
                        opacity={0.85}
                      />
                      <path
                        d={`M -4.5 0 Q -5 -9 0 ${-16 - flicker * 0.5} Q 5 -9 4.5 0 Z`}
                        fill="var(--accent-fg)"
                        opacity={0.7}
                      />
                    </g>
                  )
                })}
              </g>
            </g>
          )}

          {/* Dissolved count label below cylinder (clear of flame when warming) */}
          <text
            x={CYL_CX}
            y={isWarm ? 474 : 434}
            textAnchor="middle"
            fill={isWarm ? 'var(--heat)' : 'var(--fg-muted)'}
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={isWarm ? 600 : 500}
          >
            {current.mode === 'gas-low-p' && 'Sparse dissolved gas'}
            {current.mode === 'gas-high-p' && '3× dissolved gas'}
            {current.mode === 'kh-compare' && 'Gas escapes as T rises'}
          </text>

          {/* ============================================================
              RIGHT PANEL: SYNCHRONISED HENRY'S-LAW PLOT (Borderless)
             ============================================================ */}
          <text
            x={PLOT_LEFT + PLOT_W / 2}
            y={34}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={15}
            fontWeight={600}
          >
            {isWarm ? (
              <>
                Slope K<Sub>H</Sub> across gases &amp; T
              </>
            ) : (
              <>
                Henry&apos;s law: p vs x (O<Sub>2</Sub>, 293 K)
              </>
            )}
          </text>

          {/* Horizontal pressure gridlines (1, 2, 3, 4 bar) */}
          {[1, 2, 3, 4].map((pTick) => {
            const gy = PLOT_BOTTOM - (pTick / 4) * PLOT_H
            return (
              <g key={`py-${pTick}`}>
                <line
                  x1={PLOT_LEFT}
                  y1={gy}
                  x2={PLOT_RIGHT}
                  y2={gy}
                  stroke="var(--border)"
                  strokeDasharray="3 4"
                />
                <text
                  x={PLOT_LEFT - 10}
                  y={gy + 5}
                  textAnchor="end"
                  fill="var(--fg-muted)"
                  fontFamily="var(--font-mono)"
                  fontSize={14}
                >
                  {pTick}
                </text>
              </g>
            )
          })}
          <text
            x={PLOT_LEFT - 10}
            y={PLOT_BOTTOM + 5}
            textAnchor="end"
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
            fontSize={14}
          >
            0
          </text>

          {/* Crisp open L-axes */}
          <line
            x1={PLOT_LEFT}
            y1={PLOT_TOP - 8}
            x2={PLOT_LEFT}
            y2={PLOT_BOTTOM}
            stroke="var(--fg)"
            strokeWidth={1.8}
          />
          <line
            x1={PLOT_LEFT}
            y1={PLOT_BOTTOM}
            x2={PLOT_RIGHT + 6}
            y2={PLOT_BOTTOM}
            stroke="var(--fg)"
            strokeWidth={1.8}
          />

          {/* Axis labels */}
          <text
            x={PLOT_LEFT - 42}
            y={PLOT_TOP + PLOT_H / 2}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
            transform={`rotate(-90 ${PLOT_LEFT - 42} ${PLOT_TOP + PLOT_H / 2})`}
          >
            p (bar)
          </text>
          <text
            x={PLOT_LEFT + PLOT_W / 2}
            y={PLOT_BOTTOM + 36}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Mole fraction x (× 10<Sup>−5</Sup>)
          </text>

          {/* X-axis tick numbers */}
          {[4, 8, 12].map((xTick) => {
            const gx = PLOT_LEFT + (xTick / 12) * PLOT_W
            return (
              <text
                key={`xt-${xTick}`}
                x={gx}
                y={PLOT_BOTTOM + 18}
                textAnchor="middle"
                fill="var(--fg-muted)"
                fontFamily="var(--font-mono)"
                fontSize={14}
              >
                {xTick}
              </text>
            )
          })}

          {!isWarm ? (
            <g>
              {/* Linear Henry's-law line */}
              <line
                x1={PLOT_LEFT}
                y1={PLOT_BOTTOM}
                x2={activeLineX2}
                y2={PLOT_TOP}
                stroke="var(--energy-curve)"
                strokeWidth={3}
                strokeLinecap="round"
              />
              <text
                x={PLOT_RIGHT - 4}
                y={PLOT_TOP - 14}
                textAnchor="end"
                fill="var(--energy-curve)"
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={700}
              >
                slope = K<Sub>H</Sub>
              </text>

              {/* Dashed projections to smoothly gliding operating point */}
              <line
                x1={PLOT_LEFT}
                y1={dotY}
                x2={dotX}
                y2={dotY}
                stroke="var(--accent)"
                strokeDasharray="4 4"
                strokeWidth={1.6}
              />
              <line
                x1={dotX}
                y1={dotY}
                x2={dotX}
                y2={PLOT_BOTTOM}
                stroke="var(--accent)"
                strokeDasharray="4 4"
                strokeWidth={1.6}
              />
              <circle
                cx={dotX}
                cy={dotY}
                r={7}
                fill="var(--accent)"
                stroke="var(--surface)"
                strokeWidth={2.2}
              />
              <text
                x={dotX + 12}
                y={dotY + 5}
                fill="var(--accent)"
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={700}
              >
                {current.mode === 'gas-low-p' ? (
                  <>
                    (x<Sub>1</Sub>, p<Sub>1</Sub>)
                  </>
                ) : (
                  <>
                    (x<Sub>2</Sub>, p<Sub>2</Sub>)
                  </>
                )}
              </text>

              {/* Compact analog pressure gauge + numeric readout below plot */}
              <g transform="translate(362, 444)">
                <circle cx={0} cy={0} r={32} fill="var(--surface-raised)" stroke="var(--border)" strokeWidth={1.4} />
                <path d={dialArc(0, 0, 25, 0, 1)} fill="none" stroke="var(--border)" strokeWidth={4} strokeLinecap="round" />
                <path
                  d={dialArc(0, 0, 25, 0, pressure / 4)}
                  fill="none"
                  stroke="var(--accent)"
                  strokeWidth={4}
                  strokeLinecap="round"
                />
                {(() => {
                  const tip = dialPoint(0, 0, 19, pressure / 4)
                  return (
                    <line
                      x1={0}
                      y1={0}
                      x2={tip.x}
                      y2={tip.y}
                      stroke="var(--fg)"
                      strokeWidth={2.4}
                      strokeLinecap="round"
                    />
                  )
                })()}
                <circle cx={0} cy={0} r={3.2} fill="var(--fg)" />
              </g>

              <text
                x={408}
                y={436}
                fill="var(--fg)"
                fontFamily="var(--font-mono)"
                fontSize={15}
                fontWeight={700}
              >
                p = {pressure.toFixed(1)} bar
              </text>
              <text
                x={408}
                y={460}
                fill="var(--accent)"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={600}
              >
                x = {moleFrac1e5.toFixed(2)} × 10<Sup>−5</Sup>
              </text>
            </g>
          ) : (
            <g>
              {/* He (145 kbar) steep reference ray */}
              <line
                x1={PLOT_LEFT}
                y1={PLOT_BOTTOM}
                x2={PLOT_LEFT + (2.76 / 12) * PLOT_W}
                y2={PLOT_TOP}
                stroke="var(--spot-4)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <text
                x={PLOT_LEFT + (2.76 / 12) * PLOT_W - 6}
                y={PLOT_TOP - 10}
                textAnchor="middle"
                fill="var(--spot-4)"
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={700}
              >
                He
              </text>

              {/* N2 (76.5 kbar) reference ray */}
              <line
                x1={PLOT_LEFT}
                y1={PLOT_BOTTOM}
                x2={PLOT_LEFT + (5.23 / 12) * PLOT_W}
                y2={PLOT_TOP}
                stroke="var(--spot-2)"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <text
                x={PLOT_LEFT + (5.23 / 12) * PLOT_W}
                y={PLOT_TOP - 10}
                textAnchor="middle"
                fill="var(--spot-2)"
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={700}
              >
                N<Sub>2</Sub>
              </text>

              {/* Cool O2 (293 K, 34.86 kbar) dashed baseline */}
              <line
                x1={PLOT_LEFT}
                y1={PLOT_BOTTOM}
                x2={PLOT_LEFT + (11.47 / 12) * PLOT_W}
                y2={PLOT_TOP}
                stroke="var(--coolant)"
                strokeWidth={2.2}
                strokeDasharray="6 4"
              />
              <text
                x={PLOT_RIGHT}
                y={PLOT_TOP + 28}
                textAnchor="end"
                fill="var(--coolant)"
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={600}
              >
                O<Sub>2</Sub> 293 K
              </text>

              {/* Active O2 line smoothly tilting steeper to 303 K (46.82 kbar) */}
              <line
                x1={PLOT_LEFT}
                y1={PLOT_BOTTOM}
                x2={activeLineX2}
                y2={PLOT_TOP}
                stroke="var(--heat)"
                strokeWidth={3.2}
                strokeLinecap="round"
              />
              <text
                x={activeLineX2 + 6}
                y={PLOT_TOP - 10}
                textAnchor="middle"
                fill="var(--heat)"
                fontFamily="var(--font-sans)"
                fontSize={14}
                fontWeight={700}
              >
                O<Sub>2</Sub> 303 K
              </text>

              {/* Constant-pressure comparison line at p = 2 bar */}
              {(() => {
                const y2Bar = PLOT_BOTTOM - 0.5 * PLOT_H
                const xCool = PLOT_LEFT + (5.74 / 12) * PLOT_W
                const xWarm = PLOT_LEFT + (200 / khTween / 12) * PLOT_W
                return (
                  <g>
                    <line
                      x1={PLOT_LEFT}
                      y1={y2Bar}
                      x2={xCool}
                      y2={y2Bar}
                      stroke="var(--fg-subtle)"
                      strokeWidth={1.5}
                      strokeDasharray="3 3"
                    />
                    <circle cx={xCool} cy={y2Bar} r={5} fill="var(--coolant)" stroke="var(--surface)" strokeWidth={1.5} />
                    <circle cx={xWarm} cy={y2Bar} r={6} fill="var(--heat)" stroke="var(--surface)" strokeWidth={1.8} />
                    {/* Leftward shift arrow showing drop in x */}
                    {xCool - xWarm > 14 && (
                      <line
                        x1={xCool - 7}
                        y1={y2Bar + 16}
                        x2={xWarm + 4}
                        y2={y2Bar + 16}
                        stroke="var(--heat)"
                        strokeWidth={2}
                        markerEnd="url(#hl-arrow-heat)"
                      />
                    )}
                    <text
                      x={(xCool + xWarm) / 2}
                      y={y2Bar + 35}
                      textAnchor="middle"
                      fill="var(--heat)"
                      fontFamily="var(--font-sans)"
                      fontSize={14}
                      fontWeight={600}
                    >
                      x drops
                    </text>
                  </g>
                )
              })()}

              {/* Clean summary lines below plot (borderless) */}
              <text
                x={PLOT_LEFT + PLOT_W / 2}
                y={434}
                textAnchor="middle"
                fill="var(--heat)"
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={700}
              >
                K<Sub>H</Sub>(O<Sub>2</Sub>): 34.9 → 46.8 kbar
              </text>
              <text
                x={PLOT_LEFT + PLOT_W / 2}
                y={458}
                textAnchor="middle"
                fill="var(--fg-muted)"
                fontFamily="var(--font-sans)"
                fontSize={14}
              >
                Steeper slope → lower solubility
              </text>
            </g>
          )}

          {/* Understated single-line equation at bottom */}
          <text
            x={290}
            y={516}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={15}
          >
            {!isWarm ? (
              <>
                p = K<Sub>H</Sub> · x   (K<Sub>H</Sub> = 34.86 kbar for O<Sub>2</Sub> at 293 K)
              </>
            ) : (
              <>
                x = p / K<Sub>H</Sub>   —   higher K<Sub>H</Sub> at higher T lowers dissolved gas
              </>
            )}
          </text>
        </g>
      )}

      {/* ============================================================
          STEP 4: SPLIT REAL-WORLD APPLICATIONS (Soda Bottle vs Scuba)
         ============================================================ */}
      {current.mode === 'applications' && (
        <g>
          {/* Hairline vertical divider */}
          <line x1={290} y1={42} x2={290} y2={474} stroke="var(--border)" strokeWidth={1.2} />

          {/* LEFT HALF: Pressurised Soda Bottle Fizzing */}
          <text
            x={145}
            y={40}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={15}
            fontWeight={700}
          >
            Carbonated Beverage
          </text>

          {/* Popped fizzing cap tilted slightly above bottle */}
          <g transform={`translate(128, ${92 - (reducedMotion ? 0 : Math.sin(t * 2.4) * 3)}) rotate(-12)`}>
            <rect x={-18} y={-8} width={36} height={11} rx={3} fill="var(--accent)" stroke="var(--atom-rim)" strokeWidth={1.2} />
          </g>

          {/* Fizzing CO2 spray dots escaping open bottle mouth */}
          {[
            { dx: -16, dy: 0, phase: 0.0 },
            { dx: 0, dy: 4, phase: 0.28 },
            { dx: 18, dy: 2, phase: 0.56 },
            { dx: -8, dy: 6, phase: 0.78 },
            { dx: 11, dy: 5, phase: 0.42 },
          ].map((b, i) => {
            const u = reducedMotion ? 0.35 + i * 0.12 : (t * 0.75 + b.phase) % 1
            const bx = 128 + b.dx * (0.5 + u * 1.1)
            const by = 132 - u * 44
            return (
              <circle
                key={`fizz-${i}`}
                cx={bx}
                cy={by}
                r={3.5 + u * 1.5}
                fill="none"
                stroke="var(--spot-3)"
                strokeWidth={1.8}
                opacity={1 - u * 0.75}
              />
            )
          })}

          {/* Glass Soda Bottle silhouette (centred at x=128) */}
          <defs>
            <clipPath id="hl-bottle-clip">
              <path d="M 112 128 L 112 182 Q 112 202 87 224 L 87 388 Q 87 402 101 402 L 155 402 Q 169 402 169 388 L 169 224 Q 144 202 144 182 L 144 128 Z" />
            </clipPath>
          </defs>
          <path
            d="M 112 128 L 112 182 Q 112 202 87 224 L 87 388 Q 87 402 101 402 L 155 402 Q 169 402 169 388 L 169 224 Q 144 202 144 182 L 144 128 Z"
            fill="var(--glass-fill)"
          />
          {/* Liquid fill inside bottle */}
          <g clipPath="url(#hl-bottle-clip)">
            <rect x={79} y={208} width={98} height={204} fill="var(--liquid)" />
            <line x1={79} y1={208} x2={177} y2={208} stroke="var(--liquid-edge)" strokeWidth={2} />
            {/* Animated rising CO2 bubbles inside bottle */}
            {[
              { x: 105, phase: 0.05 },
              { x: 121, phase: 0.35 },
              { x: 137, phase: 0.62 },
              { x: 151, phase: 0.22 },
              { x: 113, phase: 0.78 },
              { x: 131, phase: 0.90 },
            ].map((bub, bi) => {
              const u = reducedMotion ? (0.15 + bi * 0.14) % 1 : (t * 0.48 + bub.phase) % 1
              const by = 392 - u * 184
              const bx = bub.x + (reducedMotion ? 0 : Math.sin(t * 3 + bi) * 2.5)
              return (
                <circle
                  key={`cb-${bi}`}
                  cx={bx}
                  cy={by}
                  r={3.8}
                  fill="var(--spot-3)"
                  opacity={0.35 + 0.65 * Math.sin(u * Math.PI)}
                />
              )
            })}
          </g>
          {/* Bottle glass walls & highlight */}
          <path
            d="M 108 128 L 112 128 L 112 182 Q 112 202 87 224 L 87 388 Q 87 402 101 402 L 155 402 Q 169 402 169 388 L 169 224 Q 144 202 144 182 L 144 128 L 148 128"
            fill="none"
            stroke="var(--glass-wall)"
            strokeWidth={2.2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          <line
            x1={96}
            y1={236}
            x2={96}
            y2={382}
            stroke="var(--glass-sheen)"
            strokeWidth={2.8}
            strokeLinecap="round"
          />

          {/* Clean side annotations for bottle */}
          <text
            x={180}
            y={152}
            fill="var(--spot-3)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Opened: p ↓
          </text>
          <text
            x={180}
            y={172}
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            CO<Sub>2</Sub> fizzes out
          </text>

          <text
            x={145}
            y={434}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Sealed under high p(CO<Sub>2</Sub>)
          </text>
          <text
            x={145}
            y={458}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
            fontSize={14}
          >
            K<Sub>H</Sub>(CO<Sub>2</Sub>) = 1.67 kbar
          </text>

          {/* RIGHT HALF: Diver Depth Gauge + N2 vs He Comparison */}
          <text
            x={435}
            y={40}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={15}
            fontWeight={700}
          >
            Deep-Sea Scuba Diving
          </text>

          {/* Depth & Pressure Gauge along left of right panel (x=326) */}
          {/* Sea surface wave */}
          <path
            d="M 308 88 Q 318 82 328 88 T 348 88"
            fill="none"
            stroke="var(--coolant)"
            strokeWidth={2.2}
          />
          <line x1={328} y1={94} x2={328} y2={292} stroke="var(--coolant)" strokeWidth={3} strokeLinecap="round" />
          {[
            { y: 94, label: '0 m' },
            { y: 160, label: '10 m' },
            { y: 226, label: '20 m' },
            { y: 292, label: '30 m' },
          ].map((d) => (
            <g key={d.label}>
              <line x1={322} y1={d.y} x2={334} y2={d.y} stroke="var(--fg-muted)" strokeWidth={1.6} />
              <text
                x={342}
                y={d.y + 5}
                fill={d.label === '30 m' ? 'var(--accent)' : 'var(--fg-muted)'}
                fontFamily="var(--font-mono)"
                fontSize={14}
                fontWeight={d.label === '30 m' ? 700 : 400}
              >
                {d.label}
              </text>
            </g>
          ))}
          {/* Pulsing depth marker at 30 m (4 bar) */}
          <circle
            cx={328}
            cy={292}
            r={reducedMotion ? 7 : 6.5 + Math.sin(t * 3) * 1.4}
            fill="var(--accent)"
            stroke="var(--surface)"
            strokeWidth={2}
          />
          <text
            x={328}
            y={322}
            textAnchor="middle"
            fill="var(--accent)"
            fontFamily="var(--font-mono)"
            fontSize={14}
            fontWeight={700}
          >
            4 bar
          </text>

          {/* N2 vs He dissolved gas comparison at 30 m depth (x = 404..562) */}
          <text
            x={404}
            y={104}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Dissolved in blood at 4 bar
          </text>

          {/* N2 bar (low K_H -> dissolves too much -> bends) */}
          <text
            x={404}
            y={144}
            fill="var(--caution)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={700}
          >
            N<Sub>2</Sub>  (K<Sub>H</Sub> = 76.5 kbar)
          </text>
          <rect x={404} y={154} width={154} height={22} rx={5} fill="var(--surface-raised)" />
          <rect x={404} y={154} width={142} height={22} rx={5} fill="var(--caution)" />
          <text
            x={404}
            y={196}
            fill="var(--caution)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            High uptake → bends risk
          </text>

          {/* He bar (high K_H -> dissolves far less -> safe) */}
          <text
            x={404}
            y={240}
            fill="var(--success)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={700}
          >
            He  (K<Sub>H</Sub> = 145 kbar)
          </text>
          <rect x={404} y={250} width={154} height={22} rx={5} fill="var(--surface-raised)" />
          <rect x={404} y={250} width={74} height={22} rx={5} fill="var(--success)" />
          <text
            x={404}
            y={292}
            fill="var(--success)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            Low uptake → safe diluent
          </text>

          {/* Scuba tank mix & high altitude note */}
          <text
            x={435}
            y={386}
            textAnchor="middle"
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
          >
            Tank: 11.7% He · 56.2% N<Sub>2</Sub> · 32.1% O<Sub>2</Sub>
          </text>
          <text
            x={435}
            y={422}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            High altitude: low p(O<Sub>2</Sub>) → anoxia
          </text>

          {/* Bottom understated equation */}
          <text
            x={290}
            y={516}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={15}
          >
            p = K<Sub>H</Sub> · x   —   pressure governs dissolved gas in drinks &amp; blood
          </text>
        </g>
      )}
    </svg>
  )
}
