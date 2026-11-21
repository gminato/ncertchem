'use client'

import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { VocabDefs } from '@/components/vocab'
import { clampOsmosisStep, getOsmosisStepState } from './osmosis-steps'

export interface OsmosisMembraneProps {
  step: number
  reducedMotion: boolean
}

const VESSEL_TOP = 132
const VESSEL_BOTTOM = 426
const LEFT_INNER_X = 84
const RIGHT_INNER_X = 300
const CHAMBER_W = 196
const MEMBRANE_X = 280
const MEMBRANE_W = 20
const PORE_YS = [266, 294, 322, 350, 378, 406] as const

const SOLVENT_DOTS_LEFT = [
  { x: 112, y: 278, ph: 0.4 },
  { x: 148, y: 298, ph: 1.5 },
  { x: 186, y: 274, ph: 2.3 },
  { x: 224, y: 292, ph: 3.1 },
  { x: 254, y: 276, ph: 0.9 },
  { x: 122, y: 340, ph: 4.0 },
  { x: 168, y: 356, ph: 5.1 },
  { x: 212, y: 338, ph: 1.9 },
  { x: 248, y: 358, ph: 3.6 },
  { x: 140, y: 392, ph: 2.8 },
  { x: 202, y: 396, ph: 4.7 },
  { x: 158, y: 252, ph: 5.6 },
] as const

const SOLVENT_DOTS_RIGHT = [
  { x: 328, y: 278, ph: 1.1 },
  { x: 372, y: 292, ph: 2.5 },
  { x: 422, y: 276, ph: 3.7 },
  { x: 468, y: 294, ph: 0.6 },
  { x: 344, y: 344, ph: 4.3 },
  { x: 396, y: 352, ph: 5.2 },
  { x: 452, y: 342, ph: 1.8 },
  { x: 358, y: 394, ph: 2.9 },
  { x: 438, y: 396, ph: 4.9 },
] as const

const SOLUTE_SPHERES_RIGHT = [
  { x: 322, y: 318, kind: 'a' as const, nearMembrane: true, ph: 0.5 },
  { x: 382, y: 274, kind: 'b' as const, nearMembrane: false, ph: 1.7 },
  { x: 438, y: 318, kind: 'a' as const, nearMembrane: false, ph: 2.9 },
  { x: 470, y: 368, kind: 'b' as const, nearMembrane: false, ph: 4.1 },
  { x: 364, y: 372, kind: 'a' as const, nearMembrane: false, ph: 5.0 },
  { x: 416, y: 374, kind: 'b' as const, nearMembrane: false, ph: 1.2 },
  { x: 322, y: 374, kind: 'a' as const, nearMembrane: true, ph: 3.4 },
] as const

/** Generates a deterministic crenated (shrunken wavy) red blood cell SVG path. */
function buildCrenatedPath(cx: number, cy: number, baseR: number, amp = 4.6, lobes = 12): string {
  const points: string[] = []
  const samples = lobes * 4
  for (let i = 0; i < samples; i++) {
    const angle = (i / samples) * Math.PI * 2
    const wave = Math.sin(angle * lobes) * amp
    const r = baseR + wave
    const x = cx + Math.cos(angle) * r
    const y = cy + Math.sin(angle) * r
    points.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
  }
  return `${points.join(' ')} Z`
}

/** Concave liquid meniscus path spanning [x1, x2] at level y. */
function meniscusPath(x1: number, x2: number, y: number): string {
  const mid = (x1 + x2) / 2
  return `M ${x1} ${y - 2} Q ${mid} ${y + 3.5} ${x2} ${y - 2}`
}

export function OsmosisMembrane({ step, reducedMotion }: OsmosisMembraneProps) {
  const index = clampOsmosisStep(step)
  const state = getOsmosisStepState(index)
  const t = useAmbientTime(reducedMotion)

  const isTonicity = state.sceneMode === 'tonicity'
  const isReverse = state.id === 'reverse-osmosis'

  // Map step-model heights smoothly onto the 580x540 vertical stage
  const targetLeftTop = state.leftLiquidTop + 68
  const targetRightTop = state.rightLiquidTop + 68
  const targetPistonY = state.showPiston ? state.pistonY + 68 : VESSEL_TOP + 12

  const leftTop = useTweenedNumber(targetLeftTop, reducedMotion, 0.56)
  const rightTop = useTweenedNumber(targetRightTop, reducedMotion, 0.56)
  const pistonY = useTweenedNumber(targetPistonY, reducedMotion, 0.56)
  const chamberOpacity = useTweenedNumber(isTonicity ? 0 : 1, reducedMotion, 0.38)
  const tonicityOpacity = useTweenedNumber(isTonicity ? 1 : 0, reducedMotion, 0.38)
  const pistonOpacity = useTweenedNumber(state.showPiston ? 1 : 0, reducedMotion, 0.38)
  const outletOpacity = useTweenedNumber(state.showFreshwaterOutlet ? 1 : 0, reducedMotion, 0.38)
  const deltaHOpacity = useTweenedNumber(state.id === 'forward-osmosis' ? 1 : 0, reducedMotion, 0.38)
  const poreZoomOpacity = useTweenedNumber(state.id === 'spm-barrier' ? 1 : 0, reducedMotion, 0.38)

  const leftHeight = Math.max(24, VESSEL_BOTTOM - leftTop)
  const rightHeight = Math.max(24, VESSEL_BOTTOM - rightTop)

  // Living tonicity geometry
  const hypoPulse = reducedMotion ? 0 : Math.sin(t * 2.2) * 2.2
  const hyperPulse = reducedMotion ? 0 : Math.sin(t * 2.4 + 1) * 1.1
  const crenatedPath = buildCrenatedPath(474, 268, 25 - hyperPulse * 0.6, 4.6 + hyperPulse * 0.4)
  const arrowDrift = reducedMotion ? 0 : Math.sin(t * 3.0) * 3.5

  return (
    <svg
      viewBox="0 0 580 540"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={state.ariaLabel}
      data-testid="osmosis-membrane"
      data-step={index}
    >
      <VocabDefs idPrefix="osm" />
      <defs>
        <marker
          id="osm-arrow-fwd"
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
          id="osm-arrow-rev"
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
          id="osm-arrow-heat"
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
          id="osm-arrow-work"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--accent)" />
        </marker>
        <marker
          id="osm-arrow-eq"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M 1 1 L 9 5 L 1 9 z" fill="var(--success)" />
        </marker>

        {/* Clip paths for left & right liquid columns */}
        <clipPath id="osm-left-clip">
          <rect
            x={LEFT_INNER_X + 1}
            y={leftTop - 2}
            width={CHAMBER_W - 1}
            height={leftHeight + 2}
            rx={10}
          />
        </clipPath>
        <clipPath id="osm-right-clip">
          <rect
            x={RIGHT_INNER_X}
            y={rightTop - 2}
            width={CHAMBER_W - 1}
            height={rightHeight + 2}
            rx={10}
          />
        </clipPath>

        {/* 3D radial shading for red blood cells */}
        <radialGradient id="osm-rbc-grad" cx="35%" cy="32%" r="68%">
          <stop offset="0%" stopColor="var(--sphere-highlight)" stopOpacity="0.45" />
          <stop offset="48%" stopColor="var(--heat)" stopOpacity="0.92" />
          <stop offset="100%" stopColor="var(--sphere-shadow)" stopOpacity="0.55" />
        </radialGradient>
        <radialGradient id="osm-rbc-dimple" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--surface)" stopOpacity="0.42" />
          <stop offset="75%" stopColor="var(--heat)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--heat)" stopOpacity="0" />
        </radialGradient>

        {/* Soft circular saline bath halo for tonicity */}
        <radialGradient id="osm-bath-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--liquid)" stopOpacity="0.95" />
          <stop offset="78%" stopColor="var(--liquid)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--liquid)" stopOpacity="0" />
        </radialGradient>

        {/* Pore zoom circular clip */}
        <clipPath id="osm-zoom-clip">
          <circle cx={290} cy={66} r={42} />
        </clipPath>
      </defs>

      {/* ===================== TWIN-CHAMBER OSMOSIS / RO SCENE ===================== */}
      <g opacity={chamberOpacity} style={{ pointerEvents: 'none' }}>
        {/* Step 0 pore-scale zoom inset floating cleanly above the membrane */}
        <g opacity={poreZoomOpacity}>
          <line
            x1={290}
            y1={108}
            x2={290}
            y2={156}
            stroke="var(--border)"
            strokeWidth={1.4}
            strokeDasharray="3 3"
          />
          <circle
            cx={290}
            cy={66}
            r={43}
            fill="var(--liquid)"
            stroke="var(--glass-wall)"
            strokeWidth={2}
          />
          <g clipPath="url(#osm-zoom-clip)">
            {/* Upper & lower membrane pore walls */}
            <rect x={282} y={20} width={16} height={35} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={1.2} />
            <rect x={282} y={77} width={16} height={35} fill="var(--surface-raised)" stroke="var(--glass-wall)" strokeWidth={1.2} />
            {/* Small H2O gliding through the pore */}
            {(() => {
              const u = reducedMotion ? 0.52 : (t * 0.55) % 1
              const wx = 252 + u * 76
              return (
                <g>
                  <circle cx={wx} cy={66} r={5.2} fill="var(--liquid-edge)" />
                  <circle cx={wx} cy={66} r={5.2} fill="url(#osm-sphere-shading)" />
                </g>
              )
            })()}
            {/* Bulky solute bouncing back off the right pore face */}
            {(() => {
              const bounce = reducedMotion ? 0 : Math.abs(Math.sin(t * 2.6)) * 10
              const sx = 313 + bounce
              return (
                <g>
                  <circle cx={sx} cy={66} r={12.5} fill="var(--spot-2)" stroke="var(--atom-rim)" strokeWidth={1} />
                  <circle cx={sx} cy={66} r={12.5} fill="url(#osm-sphere-shading)" />
                </g>
              )
            })()}
          </g>
          <text
            x={236}
            y={58}
            textAnchor="end"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
            fill="var(--liquid-edge)"
          >
            H<Sub>2</Sub>O passes
          </text>
          <text
            x={344}
            y={58}
            textAnchor="start"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
            fill="var(--spot-2)"
          >
            Solute blocked
          </text>
        </g>

        {/* Freshwater outlet spout (Step 4 Reverse Osmosis) */}
        <g opacity={outletOpacity}>
          <path
            d="M 84 246 L 46 246 Q 34 246 34 260 L 34 286"
            fill="none"
            stroke="var(--glass-wall)"
            strokeWidth={7}
            strokeLinecap="round"
          />
          <path
            d="M 84 246 L 46 246 Q 34 246 34 260 L 34 284"
            fill="none"
            stroke="var(--liquid-edge)"
            strokeWidth={3.2}
            strokeLinecap="round"
          />
          {/* Animated falling pure water drops */}
          {[0, 1, 2].map((dIdx) => {
            const dropPhase = reducedMotion ? dIdx * 0.32 : (t * 0.85 + dIdx * 0.33) % 1
            const dy = 292 + dropPhase * 70
            const dropAlpha = 1 - dropPhase * 0.55
            return (
              <g key={`ro-drop-${dIdx}`} opacity={dropAlpha}>
                <circle cx={34} cy={dy} r={4.2} fill="var(--liquid-edge)" />
                <circle cx={34} cy={dy} r={4.2} fill="url(#osm-sphere-shading)" />
              </g>
            )
          })}
          <text
            x={36}
            y={386}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
            fill="var(--rev)"
          >
            Pure
          </text>
          <text
            x={36}
            y={404}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={600}
            fill="var(--rev)"
          >
            H<Sub>2</Sub>O
          </text>
        </g>

        {/* Twin-chamber glass interior fill */}
        <path
          d={`M ${LEFT_INNER_X} ${VESSEL_TOP} L ${LEFT_INNER_X} ${VESSEL_BOTTOM - 14} Q ${LEFT_INNER_X} ${VESSEL_BOTTOM} ${LEFT_INNER_X + 14} ${VESSEL_BOTTOM} L ${RIGHT_INNER_X + CHAMBER_W - 14} ${VESSEL_BOTTOM} Q ${RIGHT_INNER_X + CHAMBER_W} ${VESSEL_BOTTOM} ${RIGHT_INNER_X + CHAMBER_W} ${VESSEL_BOTTOM - 14} L ${RIGHT_INNER_X + CHAMBER_W} ${VESSEL_TOP} Z`}
          fill="var(--glass-fill)"
        />

        {/* Left chamber liquid (pure solvent / freshwater) */}
        <g clipPath="url(#osm-left-clip)">
          <rect
            x={LEFT_INNER_X}
            y={leftTop - 4}
            width={CHAMBER_W}
            height={leftHeight + 8}
            fill="var(--liquid)"
          />
          {SOLVENT_DOTS_LEFT.map((pt, i) => {
            const dx = reducedMotion ? 0 : Math.sin(t * 1.4 + pt.ph) * 4.5
            const dy = reducedMotion ? 0 : Math.cos(t * 1.15 + pt.ph * 1.3) * 3.5
            const cy = pt.y + dy
            if (cy < leftTop + 10) return null
            return (
              <g key={`l-solv-${i}`}>
                <circle cx={pt.x + dx} cy={cy} r={4.6} fill="var(--liquid-edge)" />
                <circle cx={pt.x + dx} cy={cy} r={4.6} fill="url(#osm-sphere-shading)" />
              </g>
            )
          })}
        </g>
        <path
          d={meniscusPath(LEFT_INNER_X + 2, MEMBRANE_X - 1, leftTop)}
          fill="none"
          stroke="var(--liquid-edge)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />

        {/* Right chamber liquid (solution / seawater) */}
        <g clipPath="url(#osm-right-clip)">
          <rect
            x={RIGHT_INNER_X}
            y={rightTop - 4}
            width={CHAMBER_W}
            height={rightHeight + 8}
            fill="var(--liquid)"
          />
          <rect
            x={RIGHT_INNER_X}
            y={rightTop - 4}
            width={CHAMBER_W}
            height={rightHeight + 8}
            fill="var(--accent-soft)"
            opacity={0.44}
          />
          {/* Solvent molecules in right chamber */}
          {SOLVENT_DOTS_RIGHT.map((pt, i) => {
            const dx = reducedMotion ? 0 : Math.sin(t * 1.35 + pt.ph) * 4.5
            const dy = reducedMotion ? 0 : Math.cos(t * 1.1 + pt.ph * 1.2) * 3.5
            const cy = pt.y + dy
            if (cy < rightTop + 10) return null
            return (
              <g key={`r-solv-${i}`}>
                <circle cx={pt.x + dx} cy={cy} r={4.6} fill="var(--liquid-edge)" />
                <circle cx={pt.x + dx} cy={cy} r={4.6} fill="url(#osm-sphere-shading)" />
              </g>
            )
          })}
          {/* Larger 3D-shaded solute particles blocked by SPM */}
          {SOLUTE_SPHERES_RIGHT.map((pt, i) => {
            const bounce =
              pt.nearMembrane && !reducedMotion
                ? Math.abs(Math.sin(t * 2.1 + pt.ph)) * 10
                : reducedMotion
                  ? 0
                  : Math.sin(t * 1.0 + pt.ph) * 4
            const dy = reducedMotion ? 0 : Math.cos(t * 0.9 + pt.ph) * 3.5
            const cx = Math.max(RIGHT_INNER_X + 13, pt.x + bounce)
            const cy = pt.y + dy
            if (cy < rightTop + 15) return null
            const fill = isReverse
              ? pt.kind === 'a'
                ? 'var(--el-Na)'
                : 'var(--el-Cl)'
              : 'var(--spot-2)'
            return (
              <g key={`r-solute-${i}`}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={10}
                  fill={fill}
                  stroke="var(--atom-rim)"
                  strokeWidth={1}
                />
                <circle cx={cx} cy={cy} r={10} fill="url(#osm-sphere-shading)" />
              </g>
            )
          })}
        </g>
        <path
          d={meniscusPath(RIGHT_INNER_X + 1, RIGHT_INNER_X + CHAMBER_W - 2, rightTop)}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />

        {/* Semipermeable membrane with visible pores & living crossing water molecules */}
        <g>
          <rect
            x={MEMBRANE_X}
            y={156}
            width={MEMBRANE_W}
            height={VESSEL_BOTTOM - 156}
            fill="var(--surface-raised)"
            stroke="var(--glass-wall)"
            strokeWidth={1.6}
          />
          {PORE_YS.map((py, pIdx) => {
            const submerged = py > Math.min(leftTop, rightTop) + 8
            const phase = (pIdx * 0.27) % 1
            const streamU = reducedMotion ? 0.5 : (t * 0.62 + phase) % 1

            let dotX = MEMBRANE_X + MEMBRANE_W / 2
            let dotAlpha = 0.95
            if (state.fluxMode === 'forward') {
              dotX = 252 + streamU * 76
              dotAlpha = Math.sin(streamU * Math.PI)
            } else if (state.fluxMode === 'reverse') {
              dotX = 328 - streamU * 76
              dotAlpha = Math.sin(streamU * Math.PI)
            } else if (state.fluxMode === 'equilibrium') {
              const dir = pIdx % 2 === 0 ? 1 : -1
              dotX = dir > 0 ? 256 + streamU * 68 : 324 - streamU * 68
              dotAlpha = Math.sin(streamU * Math.PI)
            } else {
              // blocked-preview: gentle pore oscillation
              dotX = MEMBRANE_X + MEMBRANE_W / 2 + (reducedMotion ? 0 : Math.sin(t * 2 + pIdx) * 5)
            }

            return (
              <g key={`pore-${py}`}>
                <rect
                  x={MEMBRANE_X - 1}
                  y={py - 4.5}
                  width={MEMBRANE_W + 2}
                  height={9}
                  fill={submerged ? 'var(--liquid)' : 'var(--glass-fill)'}
                />
                {submerged && (
                  <g opacity={Math.max(0.18, dotAlpha)}>
                    <circle cx={dotX} cy={py} r={3.8} fill="var(--liquid-edge)" />
                    <circle cx={dotX} cy={py} r={3.8} fill="url(#osm-sphere-shading)" />
                  </g>
                )}
              </g>
            )
          })}
        </g>

        {/* Hydrostatic rise indicator Δh (Step 1) */}
        <g opacity={deltaHOpacity}>
          <line
            x1={516}
            y1={rightTop}
            x2={516}
            y2={leftTop}
            stroke="var(--fwd)"
            strokeWidth={2.2}
            strokeDasharray="4 3"
          />
          <line x1={509} y1={rightTop} x2={523} y2={rightTop} stroke="var(--fwd)" strokeWidth={2.2} />
          <line x1={509} y1={leftTop} x2={523} y2={leftTop} stroke="var(--fwd)" strokeWidth={2.2} />
          <text
            x={544}
            y={(rightTop + leftTop) / 2 + 5}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={16}
            fontWeight={700}
            fill="var(--fwd)"
          >
            Δh
          </text>
        </g>

        {/* Weighted piston assembly on right chamber (Steps 2 & 4) */}
        <g opacity={pistonOpacity}>
          {/* Pressure label cleanly above downward force arrow */}
          <text
            x={RIGHT_INNER_X + CHAMBER_W / 2}
            y={54}
            textAnchor="middle"
            fontFamily="var(--font-sans)"
            fontSize={16}
            fontWeight={700}
            fill={isReverse ? 'var(--rev)' : 'var(--accent)'}
          >
            {isReverse ? (
              <>
                P<Sub>ext</Sub> &gt; Π
              </>
            ) : (
              <>
                P<Sub>ext</Sub> = Π = CRT
              </>
            )}
          </text>
          {/* Downward applied pressure arrow */}
          <line
            x1={RIGHT_INNER_X + CHAMBER_W / 2}
            y1={66}
            x2={RIGHT_INNER_X + CHAMBER_W / 2}
            y2={isReverse ? 104 : 96}
            stroke={isReverse ? 'var(--rev)' : 'var(--accent)'}
            strokeWidth={isReverse ? 4.2 : 3.2}
            markerEnd={isReverse ? 'url(#osm-arrow-rev)' : 'url(#osm-arrow-work)'}
          />
          {/* Weight block sitting atop the piston shaft */}
          <rect
            x={RIGHT_INNER_X + CHAMBER_W / 2 - (isReverse ? 46 : 34)}
            y={112}
            width={isReverse ? 92 : 68}
            height={isReverse ? 28 : 18}
            rx={5}
            fill="var(--surface-raised)"
            stroke={isReverse ? 'var(--rev)' : 'var(--accent)'}
            strokeWidth={1.8}
          />
          {/* Piston shaft */}
          <rect
            x={RIGHT_INNER_X + CHAMBER_W / 2 - 7}
            y={isReverse ? 140 : 130}
            width={14}
            height={Math.max(12, pistonY - (isReverse ? 156 : 146))}
            fill="var(--surface-raised)"
            stroke="var(--glass-wall)"
            strokeWidth={1.3}
          />
          {/* Piston head with subtle sheen */}
          <rect
            x={RIGHT_INNER_X + 3}
            y={pistonY - 16}
            width={CHAMBER_W - 6}
            height={16}
            rx={4}
            fill="var(--glass-wall)"
            stroke="var(--fg)"
            strokeWidth={1.2}
          />
          <line
            x1={RIGHT_INNER_X + 12}
            y1={pistonY - 11}
            x2={RIGHT_INNER_X + CHAMBER_W - 12}
            y2={pistonY - 11}
            stroke="var(--glass-sheen)"
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.7}
          />
        </g>

        {/* Outer glass vessel walls (open top with subtle pouring lips) */}
        <path
          d={`M ${LEFT_INNER_X - 7} ${VESSEL_TOP - 4} L ${LEFT_INNER_X} ${VESSEL_TOP + 3} L ${LEFT_INNER_X} ${VESSEL_BOTTOM - 14} Q ${LEFT_INNER_X} ${VESSEL_BOTTOM} ${LEFT_INNER_X + 14} ${VESSEL_BOTTOM} L ${RIGHT_INNER_X + CHAMBER_W - 14} ${VESSEL_BOTTOM} Q ${RIGHT_INNER_X + CHAMBER_W} ${VESSEL_BOTTOM} ${RIGHT_INNER_X + CHAMBER_W} ${VESSEL_BOTTOM - 14} L ${RIGHT_INNER_X + CHAMBER_W} ${VESSEL_TOP + 3} L ${RIGHT_INNER_X + CHAMBER_W + 7} ${VESSEL_TOP - 4}`}
          fill="none"
          stroke="var(--glass-wall)"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Glass specular sheen highlights */}
        <line
          x1={LEFT_INNER_X + 12}
          y1={VESSEL_TOP + 22}
          x2={LEFT_INNER_X + 12}
          y2={VESSEL_BOTTOM - 26}
          stroke="var(--glass-sheen)"
          strokeWidth={3}
          strokeLinecap="round"
          opacity={0.65}
        />
        <line
          x1={RIGHT_INNER_X + CHAMBER_W - 12}
          y1={VESSEL_TOP + 22}
          x2={RIGHT_INNER_X + CHAMBER_W - 12}
          y2={VESSEL_BOTTOM - 26}
          stroke="var(--glass-sheen)"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.45}
        />

        {/* Directional net-flux overlay directly on the apparatus */}
        {state.fluxMode === 'forward' && (
          <g>
            <line
              x1={234}
              y1={280}
              x2={346}
              y2={280}
              stroke="var(--fwd)"
              strokeWidth={4.2}
              markerEnd="url(#osm-arrow-fwd)"
            />
            <text
              x={290}
              y={104}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={16}
              fontWeight={700}
              fill="var(--fwd)"
            >
              Net osmosis →
            </text>
          </g>
        )}

        {state.fluxMode === 'equilibrium' && (
          <g>
            <line
              x1={244}
              y1={274}
              x2={334}
              y2={274}
              stroke="var(--success)"
              strokeWidth={2.8}
              markerEnd="url(#osm-arrow-eq)"
            />
            <line
              x1={336}
              y1={288}
              x2={246}
              y2={288}
              stroke="var(--success)"
              strokeWidth={2.8}
              markerEnd="url(#osm-arrow-eq)"
            />
            <text
              x={182}
              y={104}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={15}
              fontWeight={700}
              fill="var(--success)"
            >
              ⇄ Net flux = 0
            </text>
          </g>
        )}

        {state.fluxMode === 'reverse' && (
          <g>
            <line
              x1={346}
              y1={308}
              x2={234}
              y2={308}
              stroke="var(--rev)"
              strokeWidth={4.2}
              markerEnd="url(#osm-arrow-rev)"
            />
            <text
              x={182}
              y={104}
              textAnchor="middle"
              fontFamily="var(--font-sans)"
              fontSize={16}
              fontWeight={700}
              fill="var(--rev)"
            >
              ← Reverse osmosis
            </text>
          </g>
        )}

        {/* Clean direct labels below vessel chambers */}
        <text
          x={LEFT_INNER_X + CHAMBER_W / 2}
          y={458}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg)"
        >
          {state.leftLabel}
        </text>
        <text
          x={MEMBRANE_X + MEMBRANE_W / 2}
          y={458}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={700}
          fill="var(--accent)"
        >
          {state.membraneLabel}
        </text>
        <text
          x={RIGHT_INNER_X + CHAMBER_W / 2}
          y={458}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg)"
        >
          {state.rightLabel}
        </text>
      </g>

      {/* ===================== TONICITY BORDERLESS 3-CELL SCENE (STEP 3) ===================== */}
      <g opacity={tonicityOpacity} style={{ pointerEvents: 'none' }}>
        {/* Subtle vertical dividers (borderless editorial layout) */}
        <line
          x1={198}
          y1={96}
          x2={198}
          y2={428}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.55}
        />
        <line
          x1={382}
          y1={96}
          x2={382}
          y2={428}
          stroke="var(--border)"
          strokeWidth={1}
          opacity={0.55}
        />

        {/* -------- Column 1: Hypotonic (< 0.9% NaCl) -------- */}
        <text
          x={106}
          y={114}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={16}
          fontWeight={700}
          fill="var(--fwd)"
        >
          Hypotonic
        </text>
        <text
          x={106}
          y={138}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          &lt; 0.9% NaCl
        </text>
        {/* Soft circular aqueous bath */}
        <circle cx={106} cy={268} r={78} fill="url(#osm-bath-halo)" />
        {/* Swollen 3D-shaded RBC */}
        <circle
          cx={106}
          cy={268}
          r={46 + hypoPulse}
          fill="url(#osm-rbc-grad)"
          stroke="var(--atom-rim)"
          strokeWidth={1.8}
        />
        <circle cx={106} cy={268} r={22} fill="url(#osm-rbc-dimple)" opacity={0.45} />
        {/* Animated inward water-flux arrows */}
        <line
          x1={26 + arrowDrift}
          y1={268}
          x2={52 + arrowDrift}
          y2={268}
          stroke="var(--fwd)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-fwd)"
        />
        <line
          x1={186 - arrowDrift}
          y1={268}
          x2={160 - arrowDrift}
          y2={268}
          stroke="var(--fwd)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-fwd)"
        />
        <line
          x1={106}
          y1={188 + arrowDrift}
          x2={106}
          y2={214 + arrowDrift}
          stroke="var(--fwd)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-fwd)"
        />
        <line
          x1={106}
          y1={348 - arrowDrift}
          x2={106}
          y2={322 - arrowDrift}
          stroke="var(--fwd)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-fwd)"
        />
        <text
          x={106}
          y={394}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg)"
        >
          Water enters
        </text>
        <text
          x={106}
          y={416}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          Cell swells
        </text>

        {/* -------- Column 2: Isotonic (0.9% NaCl) -------- */}
        <text
          x={290}
          y={114}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={16}
          fontWeight={700}
          fill="var(--success)"
        >
          Isotonic
        </text>
        <text
          x={290}
          y={138}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          0.9% NaCl
        </text>
        <circle cx={290} cy={268} r={78} fill="url(#osm-bath-halo)" />
        {/* Healthy 3D-shaded biconcave disc RBC */}
        <ellipse
          cx={290}
          cy={268}
          rx={44}
          ry={31}
          fill="url(#osm-rbc-grad)"
          stroke="var(--atom-rim)"
          strokeWidth={1.8}
        />
        <ellipse cx={290} cy={268} rx={21} ry={12} fill="url(#osm-rbc-dimple)" />
        {/* Balanced opposing flux indicators */}
        <line
          x1={258}
          y1={206}
          x2={284}
          y2={206}
          stroke="var(--success)"
          strokeWidth={2.4}
          markerEnd="url(#osm-arrow-eq)"
        />
        <line
          x1={322}
          y1={216}
          x2={296}
          y2={216}
          stroke="var(--success)"
          strokeWidth={2.4}
          markerEnd="url(#osm-arrow-eq)"
        />
        <text
          x={290}
          y={192}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fontWeight={700}
          fill="var(--success)"
        >
          Equal flux
        </text>
        <text
          x={290}
          y={394}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg)"
        >
          Normal saline
        </text>
        <text
          x={290}
          y={416}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          Steady biconcave
        </text>

        {/* -------- Column 3: Hypertonic (> 0.9% NaCl) -------- */}
        <text
          x={474}
          y={114}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={16}
          fontWeight={700}
          fill="var(--heat)"
        >
          Hypertonic
        </text>
        <text
          x={474}
          y={138}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          &gt; 0.9% NaCl
        </text>
        <circle cx={474} cy={268} r={78} fill="url(#osm-bath-halo)" />
        {/* Shrivelled crenated 3D-shaded RBC */}
        <path
          d={crenatedPath}
          fill="url(#osm-rbc-grad)"
          stroke="var(--atom-rim)"
          strokeWidth={1.8}
        />
        {/* Animated outward water-flux arrows */}
        <line
          x1={440 - arrowDrift}
          y1={268}
          x2={408 - arrowDrift}
          y2={268}
          stroke="var(--heat)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-heat)"
        />
        <line
          x1={508 + arrowDrift}
          y1={268}
          x2={540 + arrowDrift}
          y2={268}
          stroke="var(--heat)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-heat)"
        />
        <line
          x1={474}
          y1={232 - arrowDrift}
          x2={474}
          y2={198 - arrowDrift}
          stroke="var(--heat)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-heat)"
        />
        <line
          x1={474}
          y1={304 + arrowDrift}
          x2={474}
          y2={338 + arrowDrift}
          stroke="var(--heat)"
          strokeWidth={2.8}
          markerEnd="url(#osm-arrow-heat)"
        />
        <text
          x={474}
          y={394}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={15}
          fontWeight={600}
          fill="var(--fg)"
        >
          Water exits
        </text>
        <text
          x={474}
          y={416}
          textAnchor="middle"
          fontFamily="var(--font-sans)"
          fontSize={14}
          fill="var(--fg-muted)"
        >
          Cell shrinks
        </text>
      </g>

      {/* Understated single-line scientific working equation at bottom */}
      <text
        x={290}
        y={512}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg-muted)"
      >
        {state.id === 'spm-barrier' && (
          <>
            SPM pores admit H<Sub>2</Sub>O · reject larger solute
          </>
        )}
        {state.id === 'forward-osmosis' && <>Pure solvent → Solution · hydrostatic rise Δh</>}
        {state.id === 'osmotic-equilibrium' && (
          <>
            P<Sub>ext</Sub> = Π = C · R · T · net flux = 0
          </>
        )}
        {state.id === 'tonicity-cells' && <>Blood plasma ≡ 0.9% (w/v) aqueous NaCl</>}
        {state.id === 'reverse-osmosis' && (
          <>
            P<Sub>ext</Sub> &gt; Π · seawater → pure H<Sub>2</Sub>O permeate
          </>
        )}
      </text>
    </svg>
  )
}
