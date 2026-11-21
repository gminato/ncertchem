'use client'

import { useId } from 'react'
import { Vessel, VocabDefs } from '@/components/vocab'
import { Thermometer } from '@/components/vocab/Thermometer'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  clampConcentrationStep,
  getConcentrationStep,
} from './concentration-steps'

export interface ConcentrationScalesProps {
  step: number
  reducedMotion: boolean
}

const FONT = 'var(--font-sans)'
const MONO = 'var(--font-mono)'

const DILUTE_DOTS: readonly [number, number][] = [
  [118, 250],
  [184, 268],
  [146, 304],
  [196, 336],
  [120, 344],
]

const CONC_DOTS: readonly [number, number][] = [
  [364, 240], [394, 246], [424, 238], [454, 248], [482, 242],
  [372, 272], [404, 278], [436, 270], [468, 278],
  [362, 302], [392, 308], [422, 300], [452, 310], [482, 304],
  [374, 334], [406, 340], [438, 332], [470, 340],
  [368, 358], [402, 360], [436, 356], [474, 358],
]

const FLASK_DOTS_REL: readonly [number, number][] = [
  [-24, 52],
  [0, 38],
  [24, 54],
  [-36, 78],
  [2, 76],
  [34, 80],
]

const BEAKER_DOTS_REL: readonly [number, number][] = [
  [-32, 6],
  [4, -4],
  [34, 10],
  [-24, 38],
  [14, 34],
  [-4, 58],
]

function ShadedSphere({
  cx,
  cy,
  r,
  fill,
  shadeUrl,
  stroke = 'var(--atom-rim)',
  strokeWidth = 0.9,
  fillOpacity = 1,
}: {
  cx: number
  cy: number
  r: number
  fill: string
  shadeUrl: string
  stroke?: string
  strokeWidth?: number
  fillOpacity?: number
}) {
  return (
    <g>
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill={fill}
        fillOpacity={fillOpacity}
        stroke={stroke}
        strokeWidth={strokeWidth}
      />
      <circle cx={cx} cy={cy} r={r} fill={shadeUrl} style={{ pointerEvents: 'none' }} />
    </g>
  )
}

function LockGlyph({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <path
        d="M -3.5 -2 L -3.5 -5 A 3.5 3.5 0 0 1 3.5 -5 L 3.5 -2"
        fill="none"
        stroke="var(--success)"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <rect
        x={-5.5}
        y={-2}
        width={11}
        height={8.5}
        rx={2}
        fill="var(--success-soft)"
        stroke="var(--success)"
        strokeWidth={1.5}
      />
      <circle cx={0} cy={2.2} r={1.2} fill="var(--success)" />
    </g>
  )
}

export function ConcentrationScales({
  step,
  reducedMotion,
}: ConcentrationScalesProps) {
  const index = clampConcentrationStep(step)
  const meta = getConcentrationStep(index)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const shadeUrl = `url(#${uid}-sphere-shading)`
  const t = useAmbientTime(reducedMotion)

  // Smooth step transition weights
  const w0 = useTweenedNumber(index === 0 ? 1 : 0, reducedMotion, 0.45)
  const w1 = useTweenedNumber(index === 1 ? 1 : 0, reducedMotion, 0.45)
  const w2 = useTweenedNumber(index === 2 ? 1 : 0, reducedMotion, 0.45)
  const w3 = useTweenedNumber(index === 3 ? 1 : 0, reducedMotion, 0.45)
  const w4 = useTweenedNumber(index === 4 ? 1 : 0, reducedMotion, 0.45)

  // Step 2: smooth arc sweep
  const ringSweep = useTweenedNumber(index === 2 ? 1 : 0, reducedMotion, 0.65)

  // Step 4: continuous thermal expansion from 20 °C to 80 °C
  const heatProgress = useTweenedNumber(index === 4 ? 1 : 0, reducedMotion, 1.0)
  const tempC = 20 + heatProgress * 60
  const displayMolarity = 1.0 - heatProgress * 0.026
  const flaskLevel = 0.66 + heatProgress * 0.16
  const flaskY = 236
  const flaskH = 218
  const refLineY = flaskY + flaskH / 2 - 0.66 * flaskH
  const liveMeniscusY = flaskY + flaskH / 2 - flaskLevel * flaskH
  const flameFlicker = Math.sin(t * 9) * 2.5

  // Ring geometry for Step 2
  const ringR = 100
  const ringC = 2 * Math.PI * ringR
  const solventArc = 0.8 * ringC * ringSweep
  const soluteArc = 0.2 * ringC * ringSweep

  return (
    <svg
      viewBox="0 0 580 540"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={meta.ariaLabel}
      data-testid="concentration-scales"
      data-step={index}
    >
      <VocabDefs idPrefix={uid} />

      {/* Clean editorial stage title (borderless, no step pill) */}
      <text
        x={290}
        y={34}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={17.5}
        fontWeight={700}
        fill="var(--fg)"
      >
        {index === 0 && 'Qualitative Labels vs Quantitative Ratios'}
        {index === 1 && 'Percentage Scales & Trace ppm'}
        {index === 2 && 'Mole Fraction: Pure Particle Ratios'}
        {index === 3 && 'Molarity (M) vs Molality (m)'}
        {index === 4 && 'Thermal Expansion: Why Only M Shifts'}
      </text>

      {/* ─────────────────────── STEP 0: DILUTE vs CONCENTRATED ─────────────────────── */}
      {w0 > 0.01 && (
        <g opacity={w0} transform={`translate(0, ${((1 - w0) * 10).toFixed(1)})`}>
          {/* Left beaker: Dilute */}
          <text
            x={156}
            y={104}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={16.5}
            fontWeight={700}
            fill="var(--fg)"
          >
            Dilute
          </text>
          <text
            x={156}
            y={126}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            5 solute particles
          </text>

          <Vessel
            variant="beaker"
            x={156}
            y={266}
            width={166}
            height={224}
            level={0.72}
            liquid
            graduated
          />
          {DILUTE_DOTS.map(([dx, dy], i) => (
            <ShadedSphere
              key={`dil-${i}`}
              cx={dx + Math.sin(t * 1.2 + i * 1.4) * 3.2}
              cy={dy + Math.cos(t * 1.0 + i * 1.1) * 2.6}
              r={6.4}
              fill="var(--spot-1)"
              shadeUrl={shadeUrl}
            />
          ))}
          <text
            x={156}
            y={412}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14.5}
            fontWeight={600}
            fill="var(--fg-muted)"
          >
            Lower solute ratio
          </text>

          {/* Center comparison cue */}
          <text
            x={290}
            y={248}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--accent)"
          >
            Exact?
          </text>
          <line
            x1={258}
            y1={266}
            x2={314}
            y2={266}
            stroke="var(--accent)"
            strokeWidth={2.2}
            strokeLinecap="round"
          />
          <polygon points="312,260 324,266 312,272" fill="var(--accent)" />

          {/* Right beaker: Concentrated */}
          <text
            x={424}
            y={104}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={16.5}
            fontWeight={700}
            fill="var(--fg)"
          >
            Concentrated
          </text>
          <text
            x={424}
            y={126}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            22 solute particles
          </text>

          <Vessel
            variant="beaker"
            x={424}
            y={266}
            width={166}
            height={224}
            level={0.72}
            liquid
            graduated
          />
          {/* Slightly richer solute tint inside concentrated beaker */}
          <rect
            x={344}
            y={218}
            width={160}
            height={156}
            rx={6}
            fill="var(--spot-1)"
            fillOpacity={0.12}
          />
          {CONC_DOTS.map(([dx, dy], i) => (
            <ShadedSphere
              key={`conc-${i}`}
              cx={dx + Math.cos(t * 1.15 + i * 0.9) * 2.5}
              cy={dy + Math.sin(t * 1.05 + i * 1.2) * 2.2}
              r={6.2}
              fill="var(--spot-1)"
              shadeUrl={shadeUrl}
            />
          ))}
          <text
            x={424}
            y={412}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14.5}
            fontWeight={600}
            fill="var(--accent)"
          >
            Higher solute ratio
          </text>
        </g>
      )}

      {/* ─────────────────────── STEP 1: PERCENTAGE SCALES & PPM ─────────────────────── */}
      {w1 > 0.01 && (
        <g opacity={w1} transform={`translate(0, ${((1 - w1) * 10).toFixed(1)})`}>
          {/* Visual composition bar (borderless, no cards) */}
          <rect x={54} y={76} width={472} height={32} rx={16} fill="var(--liquid-edge)" />
          <rect x={54} y={76} width={136} height={32} rx={16} fill="var(--spot-1)" />
          <text
            x={122}
            y={97}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--accent-fg)"
          >
            Solute part
          </text>
          <text
            x={358}
            y={97}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--accent-fg)"
          >
            Solvent bulk (per 100 total)
          </text>

          {/* Three percentage columns directly beneath bar */}
          {[
            {
              cx: 112,
              tag: 'w / w',
              name: 'Mass %',
              unit: 'g / 100 g soln',
              ex: 'Bleach 3.6%',
              color: 'var(--success)',
            },
            {
              cx: 290,
              tag: 'V / V',
              name: 'Volume %',
              unit: 'mL / 100 mL',
              ex: 'Antifreeze 35%',
              color: 'var(--caution)',
            },
            {
              cx: 468,
              tag: 'w / V',
              name: 'Mass / Vol %',
              unit: 'g / 100 mL',
              ex: 'Saline 0.9%',
              color: 'var(--caution)',
            },
          ].map((col, idx) => (
            <g key={col.tag}>
              {idx > 0 && (
                <line
                  x1={idx === 1 ? 201 : 379}
                  y1={126}
                  x2={idx === 1 ? 201 : 379}
                  y2={204}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
              )}
              <text
                x={col.cx}
                y={140}
                textAnchor="middle"
                fontFamily={MONO}
                fontSize={14}
                fontWeight={700}
                fill={col.color}
              >
                {col.tag}
              </text>
              <text
                x={col.cx}
                y={162}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={15}
                fontWeight={700}
                fill="var(--fg)"
              >
                {col.name}
              </text>
              <text
                x={col.cx}
                y={183}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={14}
                fill="var(--fg-muted)"
              >
                {col.unit}
              </text>
              <text
                x={col.cx}
                y={203}
                textAnchor="middle"
                fontFamily={FONT}
                fontSize={14}
                fill="var(--fg-subtle)"
              >
                {col.ex}
              </text>
            </g>
          ))}

          {/* Subtle horizontal separator */}
          <line x1={54} y1={222} x2={526} y2={222} stroke="var(--border)" strokeWidth={1} />

          {/* Lower trace ppm seawater Vessel + zoomed magnifying loupe */}
          <Vessel
            variant="beaker"
            x={136}
            y={352}
            width={142}
            height={190}
            level={0.76}
            liquid
            graduated
          />
          {/* Faint water particles inside seawater beaker */}
          {[
            [94, 322], [126, 316], [164, 326], [186, 344],
            [100, 366], [134, 386], [174, 392], [114, 418], [160, 424],
          ].map(([bx, by], i) => (
            <circle
              key={`sw-${i}`}
              cx={bx + Math.sin(t + i) * 1.5}
              cy={by + Math.cos(t * 0.9 + i) * 1.2}
              r={4.2}
              fill="var(--liquid-edge)"
              fillOpacity={0.38}
            />
          ))}

          {/* Tiny glowing trace O2 pinpoint inside seawater */}
          <circle
            cx={152}
            cy={352}
            r={8 + Math.sin(t * 2.8) * 1.8}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={1.6}
            strokeDasharray="3 2"
          />
          <circle cx={152} cy={352} r={3} fill="var(--spot-1)" />

          <text
            x={136}
            y={468}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            1 L seawater (1030 g)
          </text>

          {/* Tangent callout rays from pinpoint to loupe */}
          <line
            x1={159}
            y1={346}
            x2={292}
            y2={278}
            stroke="var(--accent)"
            strokeWidth={1.2}
            strokeOpacity={0.55}
            strokeDasharray="4 3"
          />
          <line
            x1={159}
            y1={358}
            x2={292}
            y2={406}
            stroke="var(--accent)"
            strokeWidth={1.2}
            strokeOpacity={0.55}
            strokeDasharray="4 3"
          />

          {/* Zoomed circular magnifying loupe */}
          <defs>
            <clipPath id={`${uid}-loupe-clip`}>
              <circle cx={326} cy={342} r={68} />
            </clipPath>
          </defs>
          <circle
            cx={326}
            cy={342}
            r={68}
            fill="var(--liquid)"
            fillOpacity={0.28}
            stroke="var(--accent)"
            strokeWidth={2.4}
          />
          <g clipPath={`url(#${uid}-loupe-clip)`}>
            {/* Surrounding water sea in loupe */}
            {[
              [284, 306], [326, 294], [368, 308], [278, 344],
              [376, 344], [292, 384], [332, 392], [368, 378],
            ].map(([lx, ly], i) => (
              <ShadedSphere
                key={`lw-${i}`}
                cx={lx + Math.sin(t * 1.1 + i) * 2}
                cy={ly + Math.cos(t * 0.9 + i) * 2}
                r={9.5}
                fill="var(--liquid)"
                fillOpacity={0.7}
                stroke="var(--liquid-edge)"
                shadeUrl={shadeUrl}
              />
            ))}
            {/* Glowing zoomed O2 diatomic solute */}
            <g
              transform={`translate(${(326 + Math.sin(t * 1.4) * 3.5).toFixed(1)}, ${(342 + Math.cos(t * 1.2) * 3).toFixed(1)}) rotate(${(-24 + Math.sin(t) * 14).toFixed(1)})`}
            >
              <ShadedSphere cx={-8.5} cy={0} r={10.5} fill="var(--spot-1)" shadeUrl={shadeUrl} />
              <ShadedSphere cx={8.5} cy={0} r={10.5} fill="var(--spot-1)" shadeUrl={shadeUrl} />
            </g>
          </g>
          {/* Loupe rim specular arc */}
          <path
            d="M 276 306 A 62 62 0 0 1 322 280"
            fill="none"
            stroke="var(--glass-sheen)"
            strokeWidth={3}
            strokeLinecap="round"
          />

          {/* Clean ppm readout right of loupe */}
          <text
            x={414}
            y={308}
            fontFamily={FONT}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            Trace O<Sub>2</Sub> (ppm)
          </text>
          <text
            x={414}
            y={338}
            fontFamily={MONO}
            fontSize={18}
            fontWeight={700}
            fill="var(--accent)"
          >
            5.8 ppm
          </text>
          <text
            x={414}
            y={366}
            fontFamily={MONO}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            6 × 10<Sup>−3</Sup> g O<Sub>2</Sub>
          </text>
          <text
            x={414}
            y={389}
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            in 1030 g seawater
          </text>
        </g>
      )}

      {/* ─────────────────────── STEP 2: MOLE FRACTION RING ─────────────────────── */}
      {w2 > 0.01 && (
        <g opacity={w2} transform={`translate(0, ${((1 - w2) * 10).toFixed(1)})`}>
          {/* Unified mole-fraction ring smoothly sweeping to 1.00 */}
          <circle
            cx={290}
            cy={232}
            r={ringR}
            fill="none"
            stroke="var(--border)"
            strokeWidth={30}
            strokeOpacity={0.35}
          />
          {/* Solvent 80% segment */}
          <circle
            cx={290}
            cy={232}
            r={ringR}
            fill="none"
            stroke="var(--liquid-edge)"
            strokeWidth={30}
            strokeDasharray={`${solventArc.toFixed(1)} ${ringC.toFixed(1)}`}
            transform="rotate(-90 290 232)"
          />
          {/* Solute 20% segment */}
          <circle
            cx={290}
            cy={232}
            r={ringR}
            fill="none"
            stroke="var(--spot-1)"
            strokeWidth={30}
            strokeDasharray={`${soluteArc.toFixed(1)} ${ringC.toFixed(1)}`}
            transform={`rotate(${(-90 + 0.8 * 360 * ringSweep).toFixed(1)} 290 232)`}
          />

          {/* 20 particle spheres clustered inside the ring (16 solvent + 4 solute) */}
          {Array.from({ length: 20 }, (_, i) => {
            const isSolute = i < 4
            const ring = i < 8 ? 0 : 1
            const idxInRing = ring === 0 ? i : i - 8
            const countInRing = ring === 0 ? 8 : 12
            const rad = ring === 0 ? 28 : 58
            const angle = (idxInRing / countInRing) * Math.PI * 2 + (ring === 0 ? 0.2 : 0) + t * (ring === 0 ? 0.12 : -0.08)
            const px = 290 + Math.cos(angle) * rad
            const py = 232 + Math.sin(angle) * rad
            return (
              <ShadedSphere
                key={`mf-${i}`}
                cx={px}
                cy={py}
                r={8.5}
                fill={isSolute ? 'var(--spot-1)' : 'var(--liquid)'}
                stroke={isSolute ? 'var(--atom-rim)' : 'var(--liquid-edge)'}
                shadeUrl={shadeUrl}
              />
            )
          })}

          {/* Clean direct side callouts */}
          <line x1={164} y1={232} x2={132} y2={232} stroke="var(--liquid-edge)" strokeWidth={1.6} />
          <text
            x={124}
            y={210}
            textAnchor="end"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--fg-muted)"
          >
            Solvent (A)
          </text>
          <text
            x={124}
            y={236}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={17.5}
            fontWeight={700}
            fill="var(--liquid-edge)"
          >
            x<Sub>A</Sub> = 0.80
          </text>
          <text
            x={124}
            y={258}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            1.60 mol
          </text>

          <line x1={416} y1={206} x2={448} y2={206} stroke="var(--spot-1)" strokeWidth={1.6} />
          <text
            x={456}
            y={184}
            textAnchor="start"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--fg-muted)"
          >
            Solute (B)
          </text>
          <text
            x={456}
            y={210}
            textAnchor="start"
            fontFamily={MONO}
            fontSize={17.5}
            fontWeight={700}
            fill="var(--spot-1)"
          >
            x<Sub>B</Sub> = 0.20
          </text>
          <text
            x={456}
            y={232}
            textAnchor="start"
            fontFamily={MONO}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            0.40 mol
          </text>

          {/* Clean stacked unity bar below ring */}
          <text
            x={290}
            y={386}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={15}
            fontWeight={600}
            fill="var(--fg)"
          >
            Binary total: x<Sub>A</Sub> + x<Sub>B</Sub> = 1.00
          </text>

          <rect x={68} y={402} width={444} height={34} rx={17} fill="var(--liquid-edge)" />
          <rect x={68} y={402} width={96} height={34} rx={17} fill="var(--spot-1)" />
          <text
            x={116}
            y={424}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--accent-fg)"
          >
            0.20
          </text>
          <text
            x={338}
            y={424}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--accent-fg)"
          >
            0.80 (solvent)
          </text>
        </g>
      )}

      {/* ─────────────────────── STEP 3: MOLARITY vs MOLALITY ─────────────────────── */}
      {w3 > 0.01 && (
        <g opacity={w3} transform={`translate(0, ${((1 - w3) * 10).toFixed(1)})`}>
          {/* Left: 1.00 L Volumetric Flask for Molarity */}
          <text
            x={150}
            y={86}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={17}
            fontWeight={700}
            fill="var(--caution)"
          >
            Molarity (M)
          </text>

          <Vessel
            variant="flask"
            x={150}
            y={234}
            width={158}
            height={216}
            level={0.7}
            liquid
          />
          {/* 1.00 L calibration mark on neck */}
          <line
            x1={118}
            y1={190.8}
            x2={182}
            y2={190.8}
            stroke="var(--caution)"
            strokeWidth={2}
            strokeDasharray="4 3"
          />
          <text
            x={192}
            y={195}
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--caution)"
          >
            1.00 L
          </text>
          {/* Drifting solute spheres in flask */}
          {FLASK_DOTS_REL.map(([rx, ry], i) => (
            <ShadedSphere
              key={`mf3-${i}`}
              cx={150 + rx + Math.sin(t * 1.3 + i) * 2.4}
              cy={234 + ry + Math.cos(t * 1.1 + i) * 2}
              r={5.8}
              fill="var(--spot-1)"
              shadeUrl={shadeUrl}
            />
          ))}

          <text
            x={150}
            y={384}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            n<Sub>solute</Sub> / V<Sub>soln</Sub> (L)
          </text>
          <text
            x={150}
            y={410}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            mol L<Sup>−1</Sup> · per L solution
          </text>
          <text
            x={150}
            y={438}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--caution)"
          >
            Depends on volume V(T)
          </text>

          {/* Center vertical divider */}
          <line
            x1={290}
            y1={82}
            x2={290}
            y2={448}
            stroke="var(--border)"
            strokeWidth={1.2}
            strokeDasharray="5 4"
          />

          {/* Right: Beaker on lab balance for Molality */}
          <text
            x={430}
            y={86}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={17}
            fontWeight={700}
            fill="var(--success)"
          >
            Molality (m)
          </text>

          <Vessel
            variant="beaker"
            x={430}
            y={204}
            width={132}
            height={162}
            level={0.68}
            liquid
            graduated
          />
          {BEAKER_DOTS_REL.map(([rx, ry], i) => (
            <ShadedSphere
              key={`mb3-${i}`}
              cx={430 + rx + Math.cos(t * 1.2 + i) * 2.2}
              cy={204 + ry + Math.sin(t * 1.0 + i) * 2}
              r={5.8}
              fill="var(--spot-1)"
              shadeUrl={shadeUrl}
            />
          ))}

          {/* Sleek laboratory digital balance */}
          <line
            x1={352}
            y1={291}
            x2={508}
            y2={291}
            stroke="var(--fg-muted)"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <rect
            x={344}
            y={298}
            width={172}
            height={44}
            rx={10}
            fill="var(--surface-raised)"
            stroke="var(--border)"
            strokeWidth={1.6}
          />
          <rect
            x={358}
            y={307}
            width={144}
            height={26}
            rx={6}
            fill="var(--success-soft)"
          />
          <text
            x={430}
            y={325}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={14}
            fontWeight={700}
            fill="var(--success)"
          >
            1.000 kg H<Sub>2</Sub>O
          </text>

          <text
            x={430}
            y={384}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            n<Sub>solute</Sub> / w<Sub>solvent</Sub> (kg)
          </text>
          <text
            x={430}
            y={410}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            mol kg<Sup>−1</Sup> · per kg solvent
          </text>
          <text
            x={430}
            y={438}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fontWeight={700}
            fill="var(--success)"
          >
            Pure mass · T-invariant
          </text>
        </g>
      )}

      {/* ─────────────────────── STEP 4: THERMAL EXPANSION ─────────────────────── */}
      {w4 > 0.01 && (
        <g opacity={w4} transform={`translate(0, ${((1 - w4) * 10).toFixed(1)})`}>
          {/* Left: Thermometer + heated volumetric flask + burner */}
          <text
            x={56}
            y={94}
            textAnchor="middle"
            fontFamily={MONO}
            fontSize={15.5}
            fontWeight={700}
            fill={heatProgress > 0.35 ? 'var(--flame)' : 'var(--accent)'}
          >
            {Math.round(tempC)} °C
          </text>
          <Thermometer
            x={56}
            y={328}
            height={212}
            bulbRadius={15}
            stemWidth={10}
            level={0.24 + heatProgress * 0.66}
            ticks={[0.24, 0.46, 0.68, 0.9]}
          />

          {/* Volumetric flask with smoothly rising liquid level */}
          <Vessel
            variant="flask"
            x={178}
            y={flaskY}
            width={158}
            height={flaskH}
            level={flaskLevel}
            liquid
          />

          {/* Fixed 1.00 L reference line */}
          <line
            x1={144}
            y1={refLineY}
            x2={212}
            y2={refLineY}
            stroke="var(--fg-muted)"
            strokeWidth={1.6}
            strokeDasharray="4 3"
          />
          <text
            x={218}
            y={refLineY + 5}
            fontFamily={MONO}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            1.00 L
          </text>

          {/* Rising heated meniscus cue */}
          <line
            x1={154}
            y1={liveMeniscusY}
            x2={202}
            y2={liveMeniscusY}
            stroke="var(--flame)"
            strokeWidth={2.6}
          />
          {heatProgress > 0.12 && (
            <text
              x={218}
              y={liveMeniscusY + 5}
              fontFamily={FONT}
              fontSize={14}
              fontWeight={700}
              fill="var(--flame)"
              opacity={Math.min(1, heatProgress * 1.4)}
            >
              V ↑
            </text>
          )}

          {/* Fixed 6 solute particles with lively thermal drift */}
          {FLASK_DOTS_REL.map(([rx, ry], i) => {
            const speed = 1.4 + heatProgress * 2.1
            return (
              <ShadedSphere
                key={`hf-${i}`}
                cx={178 + rx + Math.sin(t * speed + i * 1.3) * (2.2 + heatProgress * 2.6)}
                cy={flaskY + ry + Math.cos(t * speed * 0.9 + i * 1.7) * (2 + heatProgress * 2.2)}
                r={5.8}
                fill="var(--spot-1)"
                shadeUrl={shadeUrl}
              />
            )
          })}

          {/* Burner flame glowing beneath flask */}
          <g opacity={0.22 + 0.78 * heatProgress}>
            <path
              d={`M 148 402 Q 160 ${368 + flameFlicker} 170 398 Q 178 ${354 - flameFlicker} 186 398 Q 196 ${368 + flameFlicker} 208 402 Z`}
              fill="var(--flame)"
              fillOpacity={0.82}
            />
            <path
              d={`M 162 402 Q 178 ${374 - flameFlicker * 0.6} 194 402 Z`}
              fill="var(--caution)"
              fillOpacity={0.9}
            />
            <rect x={136} y={404} width={84} height={9} rx={4.5} fill="var(--fg-muted)" />
          </g>
          <text
            x={178}
            y={442}
            textAnchor="middle"
            fontFamily={FONT}
            fontSize={14}
            fill="var(--fg-muted)"
          >
            Same moles · larger V(T)
          </text>

          {/* Right side: borderless live comparison bars */}
          {/* Row 1: Molarity (drops smoothly 1.000 -> 0.974 M) */}
          <text
            x={294}
            y={104}
            fontFamily={FONT}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            Molarity (M)
          </text>
          <text
            x={552}
            y={104}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={15.5}
            fontWeight={700}
            fill="var(--caution)"
          >
            {displayMolarity.toFixed(3)} M ↓
          </text>
          <rect x={294} y={118} width={258} height={14} rx={7} fill="var(--caution-soft)" />
          <rect
            x={294}
            y={118}
            width={Math.max(120, 232 - heatProgress * 64)}
            height={14}
            rx={7}
            fill="var(--caution)"
          />
          {/* 20 °C reference notch */}
          <line
            x1={294 + 232}
            y1={114}
            x2={294 + 232}
            y2={136}
            stroke="var(--fg)"
            strokeWidth={2}
          />
          <text
            x={294}
            y={154}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--caution)"
          >
            Volume expands → M drops
          </text>

          <line x1={294} y1={174} x2={552} y2={174} stroke="var(--border)" strokeWidth={1} />

          {/* Row 2: Molality (rock-steady with green lock) */}
          <LockGlyph x={301} y={200} />
          <text
            x={316}
            y={204}
            fontFamily={FONT}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            Molality (m)
          </text>
          <text
            x={552}
            y={204}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={15.5}
            fontWeight={700}
            fill="var(--success)"
          >
            1.000 m
          </text>
          <rect x={294} y={218} width={258} height={14} rx={7} fill="var(--success-soft)" />
          <rect x={294} y={218} width={232} height={14} rx={7} fill="var(--success)" />
          <text
            x={294}
            y={254}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--success)"
          >
            Mass-based · locked
          </text>

          <line x1={294} y1={274} x2={552} y2={274} stroke="var(--border)" strokeWidth={1} />

          {/* Row 3: Mole fraction (rock-steady with green lock) */}
          <LockGlyph x={301} y={300} />
          <text
            x={316}
            y={304}
            fontFamily={FONT}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            Mole fraction (x<Sub>2</Sub>)
          </text>
          <text
            x={552}
            y={304}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={15.5}
            fontWeight={700}
            fill="var(--success)"
          >
            0.0177
          </text>
          <rect x={294} y={318} width={258} height={14} rx={7} fill="var(--success-soft)" />
          <rect x={294} y={318} width={186} height={14} rx={7} fill="var(--success)" />
          <text
            x={294}
            y={354}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--success)"
          >
            Mole ratio · locked
          </text>

          <line x1={294} y1={374} x2={552} y2={374} stroke="var(--border)" strokeWidth={1} />

          {/* Row 4: Mass % (rock-steady with green lock) */}
          <LockGlyph x={301} y={400} />
          <text
            x={316}
            y={404}
            fontFamily={FONT}
            fontSize={15}
            fontWeight={700}
            fill="var(--fg)"
          >
            Mass % (w/w)
          </text>
          <text
            x={552}
            y={404}
            textAnchor="end"
            fontFamily={MONO}
            fontSize={15.5}
            fontWeight={700}
            fill="var(--success)"
          >
            5.66%
          </text>
          <rect x={294} y={418} width={258} height={14} rx={7} fill="var(--success-soft)" />
          <rect x={294} y={418} width={158} height={14} rx={7} fill="var(--success)" />
          <text
            x={294}
            y={454}
            fontFamily={FONT}
            fontSize={14}
            fontWeight={600}
            fill="var(--success)"
          >
            Mass ratio · locked
          </text>
        </g>
      )}

      {/* Subtle hairline divider above single-line equation */}
      <line
        x1={54}
        y1={486}
        x2={526}
        y2={486}
        stroke="var(--border)"
        strokeWidth={1}
        strokeOpacity={0.7}
      />

      {/* Understated single-line scientific equation */}
      <text
        x={290}
        y={514}
        textAnchor="middle"
        fontFamily={FONT}
        fontSize={14.5}
        fontWeight={600}
        fill="var(--fg-muted)"
      >
        {index === 0 && 'Concentration = amount of solute ÷ amount of solution (or solvent)'}
        {index === 1 && (
          <>
            ppm = (parts of solute ÷ total parts of solution) × 10<Sup>6</Sup>
          </>
        )}
        {index === 2 && (
          <>
            x<Sub>i</Sub> = n<Sub>i</Sub> ÷ (n<Sub>A</Sub> + n<Sub>B</Sub>) · dimensionless and sums to 1
          </>
        )}
        {index === 3 && (
          <>
            M = n<Sub>2</Sub> / V<Sub>soln</Sub> (L)   vs   m = n<Sub>2</Sub> / w<Sub>1</Sub> (kg)
          </>
        )}
        {index === 4 && (
          <>
            Heating increases V(T) → M decreases while m, x<Sub>2</Sub>, and w/w remain constant
          </>
        )}
      </text>
    </svg>
  )
}
