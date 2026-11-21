'use client'

import { VocabDefs } from '@/components/vocab'
import { Sub, Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import { getRaoultStep, type RaoultStepSpec } from './raoult-steps'

export interface RaoultSurfaceProps {
  step: number
  reducedMotion: boolean
}

const MAX_DIAL_PRESSURE = 420

const VESSEL_X = 34
const VESSEL_Y = 82
const VESSEL_W = 282
const VESSEL_H = 342
const VESSEL_RIGHT = VESSEL_X + VESSEL_W // 316
const SURFACE_Y = 264

const BULK_ROWS = [
  { y: 312, xs: [64, 102, 140, 178, 216, 254, 290] },
  { y: 350, xs: [54, 92, 130, 168, 206, 244, 282] },
  { y: 388, xs: [68, 106, 144, 182, 220, 258, 292] },
] as const

const PURE_VAPOUR_DOTS = [
  { x: 74, y: 122 },
  { x: 132, y: 148 },
  { x: 188, y: 116 },
  { x: 244, y: 144 },
  { x: 286, y: 120 },
  { x: 102, y: 188 },
  { x: 168, y: 182 },
  { x: 234, y: 194 },
] as const

const BINARY_VAPOUR_DOTS: readonly { x: number; y: number; kind: 'solvent' | 'volatile' }[] = [
  { x: 68, y: 118, kind: 'volatile' },
  { x: 116, y: 146, kind: 'solvent' },
  { x: 158, y: 112, kind: 'volatile' },
  { x: 204, y: 148, kind: 'volatile' },
  { x: 252, y: 116, kind: 'volatile' },
  { x: 288, y: 142, kind: 'volatile' },
  { x: 90, y: 186, kind: 'volatile' },
  { x: 144, y: 180, kind: 'solvent' },
  { x: 194, y: 192, kind: 'volatile' },
  { x: 242, y: 180, kind: 'volatile' },
  { x: 282, y: 194, kind: 'solvent' },
  { x: 128, y: 118, kind: 'solvent' },
]

const NONVOL_VAPOUR_DOTS = [
  { x: 86, y: 132 },
  { x: 164, y: 154 },
  { x: 242, y: 128 },
  { x: 122, y: 188 },
  { x: 214, y: 190 },
] as const

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
      <circle cx={cx} cy={cy} r={r} fill="url(#rl-sphere-shading)" style={{ pointerEvents: 'none' }} />
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

function VesselScene({
  spec,
  p1Tween,
  p2Tween,
  pTotalTween,
  t,
  reducedMotion,
}: {
  spec: RaoultStepSpec
  p1Tween: number
  p2Tween: number
  pTotalTween: number
  t: number
  reducedMotion: boolean
}) {
  const isPure = spec.mode === 'vessel-pure'
  const isBinary = spec.mode === 'vessel-binary'
  const isNonVol = spec.mode === 'vessel-nonvolatile'

  const dialCx = 456
  const dialCy = 166
  const dialR = 52
  const dialFrac = Math.min(1, Math.max(0, pTotalTween / MAX_DIAL_PRESSURE))
  const pureRefFrac = spec.p1Zero / MAX_DIAL_PRESSURE
  const dialColor = isBinary ? 'var(--accent)' : 'var(--spot-1)'

  const hBarX = 360
  const hBarW = 190

  return (
    <g>
      {/* Top concise stage label */}
      <text
        x={VESSEL_X + VESSEL_W / 2}
        y={34}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        {isPure && 'Pure volatile solvent 1'}
        {isBinary && 'Binary volatile mixture (1 + 2)'}
        {isNonVol && 'Solvent 1 + non-volatile solute'}
      </text>

      {/* Glass manometer bridge tube connecting sealed vessel to analog pressure dial */}
      <path
        d={`M ${VESSEL_RIGHT} 166 L ${dialCx - dialR - 8} 166`}
        stroke="var(--glass-wall)"
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M ${VESSEL_RIGHT} 166 L ${dialCx - dialR - 8} 166`}
        stroke="var(--vapour)"
        strokeWidth={2.5}
        fill="none"
      />

      {/* Ground-glass stopper on top of sealed chamber */}
      <rect
        x={VESSEL_X + VESSEL_W / 2 - 42}
        y={60}
        width={84}
        height={24}
        rx={5}
        fill="var(--surface-raised)"
        stroke="var(--glass-wall)"
        strokeWidth={2}
      />

      {/* Sealed glass chamber */}
      <rect
        x={VESSEL_X}
        y={VESSEL_Y}
        width={VESSEL_W}
        height={VESSEL_H}
        rx={20}
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2.2}
      />

      {/* Vapour headspace tint */}
      <rect
        x={VESSEL_X + 2}
        y={VESSEL_Y + 2}
        width={VESSEL_W - 4}
        height={SURFACE_Y - VESSEL_Y - 2}
        rx={18}
        fill="var(--vapour)"
        opacity={isBinary ? 0.72 : isNonVol ? 0.42 : 0.56}
      />

      {/* Liquid phase fill */}
      <path
        d={`M ${VESSEL_X + 2} ${SURFACE_Y} L ${VESSEL_RIGHT - 2} ${SURFACE_Y} L ${VESSEL_RIGHT - 2} ${VESSEL_Y + VESSEL_H - 18} Q ${VESSEL_RIGHT - 2} ${VESSEL_Y + VESSEL_H - 2} ${VESSEL_RIGHT - 18} ${VESSEL_Y + VESSEL_H - 2} L ${VESSEL_X + 18} ${VESSEL_Y + VESSEL_H - 2} Q ${VESSEL_X + 2} ${VESSEL_Y + VESSEL_H - 2} ${VESSEL_X + 2} ${VESSEL_Y + VESSEL_H - 18} Z`}
        fill="var(--liquid)"
        opacity={0.82}
      />
      <line
        x1={VESSEL_X + 2}
        y1={SURFACE_Y}
        x2={VESSEL_RIGHT - 2}
        y2={SURFACE_Y}
        stroke="var(--liquid-edge)"
        strokeWidth={2.2}
      />

      {/* Specular glass sheen along left wall */}
      <line
        x1={VESSEL_X + 14}
        y1={VESSEL_Y + 22}
        x2={VESSEL_X + 14}
        y2={VESSEL_Y + VESSEL_H - 24}
        stroke="var(--glass-sheen)"
        strokeWidth={3.2}
        strokeLinecap="round"
      />

      {/* Vapour phase particles drifting smoothly with useAmbientTime */}
      {isPure &&
        PURE_VAPOUR_DOTS.map((pt, idx) => {
          const dx = reducedMotion ? 0 : Math.sin(t * 1.5 + idx * 1.8) * 6
          const dy = reducedMotion ? 0 : Math.cos(t * 1.2 + idx * 2.1) * 5
          return <ShadedSphere key={`pv-${idx}`} cx={pt.x + dx} cy={pt.y + dy} r={6.5} fill="var(--spot-1)" />
        })}

      {isBinary &&
        BINARY_VAPOUR_DOTS.map((pt, idx) => {
          const speed = pt.kind === 'volatile' ? 2.1 : 1.35
          const dx = reducedMotion ? 0 : Math.sin(t * speed + idx * 1.7) * 6.5
          const dy = reducedMotion ? 0 : Math.cos(t * speed * 0.9 + idx * 2.3) * 5.5
          return (
            <ShadedSphere
              key={`bv-${idx}`}
              cx={pt.x + dx}
              cy={pt.y + dy}
              r={6.5}
              fill={pt.kind === 'volatile' ? 'var(--spot-2)' : 'var(--spot-1)'}
            />
          )
        })}

      {isNonVol &&
        NONVOL_VAPOUR_DOTS.map((pt, idx) => {
          const dx = reducedMotion ? 0 : Math.sin(t * 1.35 + idx * 2.0) * 5.5
          const dy = reducedMotion ? 0 : Math.cos(t * 1.1 + idx * 1.7) * 4.5
          return <ShadedSphere key={`nv-${idx}`} cx={pt.x + dx} cy={pt.y + dy} r={6.5} fill="var(--spot-1)" />
        })}

      {/* 10 surface sites + living escape arrows/particles or non-volatile blocks */}
      {spec.surfaceSites.map((kind, idx) => {
        const cx = 56 + idx * 26.5
        const cy = SURFACE_Y + 12
        const isSolvent = kind === 'solvent'
        const isVolatile = kind === 'volatile'
        const isBlocked = kind === 'nonvolatile'

        const fill = isSolvent
          ? 'var(--spot-1)'
          : isVolatile
            ? 'var(--spot-2)'
            : 'var(--spot-4)'
        const radius = isBlocked ? 10.5 : 8
        const arrowTop = isVolatile ? SURFACE_Y - 46 : SURFACE_Y - 30

        // Animated rising vapour droplet from escaping sites
        const u = reducedMotion
          ? 0.45
          : (t * (isVolatile ? 0.65 : 0.42) + idx * 0.19) % 1
        const riseY = SURFACE_Y - 4 - u * (isVolatile ? 46 : 32)
        const riseOp = Math.sin(u * Math.PI)

        return (
          <g key={`site-${idx}`}>
            {!isBlocked && (
              <g>
                <line
                  x1={cx}
                  y1={SURFACE_Y - 3}
                  x2={cx}
                  y2={arrowTop}
                  stroke={fill}
                  strokeWidth={isVolatile ? 2.3 : 1.9}
                  strokeLinecap="round"
                  opacity={0.85}
                />
                <polygon
                  points={`${cx},${arrowTop - 6} ${cx - 4},${arrowTop + 1} ${cx + 4},${arrowTop + 1}`}
                  fill={fill}
                />
                {/* Rising escaping droplet */}
                {!reducedMotion && idx % 2 === 0 && (
                  <circle cx={cx} cy={riseY} r={3.6} fill={fill} opacity={0.85 * riseOp} />
                )}
              </g>
            )}
            {isBlocked && (
              <g>
                <line
                  x1={cx - 8}
                  y1={SURFACE_Y - 6}
                  x2={cx + 8}
                  y2={SURFACE_Y - 6}
                  stroke="var(--caution)"
                  strokeWidth={2.8}
                  strokeLinecap="round"
                />
              </g>
            )}
            <ShadedSphere cx={cx} cy={cy} r={radius} fill={fill} />
          </g>
        )
      })}

      {/* Condensing return arrow on pure / binary vessels showing dynamic equilibrium */}
      {(isPure || isBinary) && (
        <g opacity={0.7}>
          <line
            x1={VESSEL_RIGHT - 20}
            y1={SURFACE_Y - 44}
            x2={VESSEL_RIGHT - 20}
            y2={SURFACE_Y - 12}
            stroke="var(--rev)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <polygon
            points={`${VESSEL_RIGHT - 20},${SURFACE_Y - 6} ${VESSEL_RIGHT - 24},${SURFACE_Y - 13} ${VESSEL_RIGHT - 16},${SURFACE_Y - 13}`}
            fill="var(--rev)"
          />
        </g>
      )}

      {/* Bulk liquid molecules gently drifting */}
      {BULK_ROWS.map((row, rIdx) =>
        row.xs.map((bx, cIdx) => {
          const flat = rIdx * 7 + cIdx
          const kind = isPure
            ? 'solvent'
            : isBinary
              ? flat % 2 === 0
                ? 'solvent'
                : 'volatile'
              : flat % 3 === 1
                ? 'nonvolatile'
                : 'solvent'
          const fill =
            kind === 'solvent'
              ? 'var(--spot-1)'
              : kind === 'volatile'
                ? 'var(--spot-2)'
                : 'var(--spot-4)'
          const r = kind === 'nonvolatile' ? 9.5 : 7.5
          const dx = reducedMotion ? 0 : Math.sin(t * 0.9 + flat * 1.4) * 2.5
          const dy = reducedMotion ? 0 : Math.cos(t * 0.8 + flat * 1.9) * 2
          return (
            <ShadedSphere
              key={`bulk-${rIdx}-${cIdx}`}
              cx={bx + dx}
              cy={row.y + dy}
              r={r}
              fill={fill}
              opacity={0.86}
            />
          )
        }),
      )}

      {/* Species legend directly beneath the vessel */}
      {isPure && (
        <g transform="translate(175, 456)">
          <ShadedSphere cx={-82} cy={-4} r={6} fill="var(--spot-1)" />
          <text
            x={-68}
            y={0}
            fill="var(--fg)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            Solvent 1 (x<Sub>1</Sub> = 1.00)
          </text>
        </g>
      )}
      {isBinary && (
        <g>
          <g transform="translate(52, 456)">
            <ShadedSphere cx={0} cy={-4} r={6} fill="var(--spot-1)" />
            <text x={14} y={0} fill="var(--fg)" fontFamily="var(--font-sans)" fontSize={14}>
              Liquid 1 (x<Sub>1</Sub> = 0.5)
            </text>
          </g>
          <g transform="translate(236, 456)">
            <ShadedSphere cx={0} cy={-4} r={6} fill="var(--spot-2)" />
            <text x={14} y={0} fill="var(--fg)" fontFamily="var(--font-sans)" fontSize={14}>
              Liquid 2 (more volatile)
            </text>
          </g>
        </g>
      )}
      {isNonVol && (
        <g>
          <g transform="translate(52, 456)">
            <ShadedSphere cx={0} cy={-4} r={6} fill="var(--spot-1)" />
            <text x={14} y={0} fill="var(--fg)" fontFamily="var(--font-sans)" fontSize={14}>
              Solvent 1 (x<Sub>1</Sub> = 0.7)
            </text>
          </g>
          <g transform="translate(236, 456)">
            <ShadedSphere cx={0} cy={-4} r={7.5} fill="var(--spot-4)" />
            <text x={14} y={0} fill="var(--fg)" fontFamily="var(--font-sans)" fontSize={14}>
              Non-volatile solute (x<Sub>2</Sub> = 0.3)
            </text>
          </g>
        </g>
      )}

      {/* ============================================================
          RIGHT SIDE: ANALOG PRESSURE DIAL + CLEAN PRESSURE BARS
         ============================================================ */}
      <text
        x={dialCx}
        y={34}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Vapour Pressure Gauge
      </text>

      {/* Analog Dial (inspired by Class 11 SealedVessel) */}
      <g>
        <circle
          cx={dialCx}
          cy={dialCy}
          r={dialR + 10}
          fill="var(--surface-raised)"
          stroke="var(--border)"
          strokeWidth={1.6}
        />
        <path
          d={dialArc(dialCx, dialCy, dialR, 0, 1)}
          fill="none"
          stroke="var(--border)"
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* Caution pressure-lowering arc on non-volatile step (from p1 up to pure p1Zero) */}
        {isNonVol && pureRefFrac > dialFrac + 0.005 && (
          <path
            d={dialArc(dialCx, dialCy, dialR, dialFrac, pureRefFrac)}
            fill="none"
            stroke="var(--caution)"
            strokeWidth={6}
            strokeDasharray="4 4"
          />
        )}

        {/* Active pressure arc */}
        {dialFrac > 0.005 && (
          <path
            d={dialArc(dialCx, dialCy, dialR, 0, dialFrac)}
            fill="none"
            stroke={dialColor}
            strokeWidth={6}
            strokeLinecap="round"
          />
        )}

        {/* Reference tick on dial rim for pure solvent p1Zero = 200 mmHg */}
        {(() => {
          const inner = dialPoint(dialCx, dialCy, dialR - 8, pureRefFrac)
          const outer = dialPoint(dialCx, dialCy, dialR + 6, pureRefFrac)
          return (
            <line
              x1={inner.x}
              y1={inner.y}
              x2={outer.x}
              y2={outer.y}
              stroke="var(--spot-1)"
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          )
        })()}

        {/* Dial needle */}
        {(() => {
          const tip = dialPoint(dialCx, dialCy, dialR - 11, dialFrac)
          return (
            <line
              x1={dialCx}
              y1={dialCy}
              x2={tip.x}
              y2={tip.y}
              stroke="var(--fg)"
              strokeWidth={2.8}
              strokeLinecap="round"
            />
          )
        })()}
        <circle cx={dialCx} cy={dialCy} r={4.5} fill="var(--fg)" />

        {/* Live numeric readout beneath dial */}
        <text
          x={dialCx}
          y={dialCy + dialR + 30}
          textAnchor="middle"
          fontSize={17}
          fontWeight={700}
          fill={dialColor}
          fontFamily="var(--font-mono)"
        >
          {pTotalTween % 1 === 0 ? Math.round(pTotalTween) : pTotalTween.toFixed(1)} mmHg
        </text>
      </g>

      {/* Borderless horizontal breakdown bars below dial */}
      {isPure && (
        <g transform={`translate(${hBarX}, 296)`}>
          <text x={0} y={0} fill="var(--fg)" fontFamily="var(--font-sans)" fontSize={14} fontWeight={600}>
            Pure p<Sub>1</Sub><Sup>0</Sup>
          </text>
          <text x={hBarW} y={0} textAnchor="end" fill="var(--fg)" fontFamily="var(--font-mono)" fontSize={14} fontWeight={700}>
            {Math.round(p1Tween)} mmHg
          </text>
          <rect x={0} y={10} width={hBarW} height={18} rx={5} fill="var(--surface-raised)" />
          <rect
            x={0}
            y={10}
            width={Math.max(4, (p1Tween / MAX_DIAL_PRESSURE) * hBarW)}
            height={18}
            rx={5}
            fill="var(--spot-1)"
          />
          <text
            x={hBarW / 2}
            y={56}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            10 / 10 surface sites free
          </text>
        </g>
      )}

      {isBinary && (
        <g transform={`translate(${hBarX}, 284)`}>
          {/* p1 bar */}
          <text x={0} y={0} fill="var(--spot-1)" fontFamily="var(--font-sans)" fontSize={14} fontWeight={600}>
            p<Sub>1</Sub> = p<Sub>1</Sub><Sup>0</Sup>x<Sub>1</Sub>
          </text>
          <text x={hBarW} y={0} textAnchor="end" fill="var(--fg)" fontFamily="var(--font-mono)" fontSize={14} fontWeight={600}>
            {p1Tween.toFixed(0)} mmHg
          </text>
          <rect x={0} y={8} width={hBarW} height={14} rx={4} fill="var(--surface-raised)" />
          <rect x={0} y={8} width={Math.max(4, (p1Tween / MAX_DIAL_PRESSURE) * hBarW)} height={14} rx={4} fill="var(--spot-1)" />

          {/* p2 bar */}
          <text x={0} y={46} fill="var(--spot-2)" fontFamily="var(--font-sans)" fontSize={14} fontWeight={600}>
            p<Sub>2</Sub> = p<Sub>2</Sub><Sup>0</Sup>x<Sub>2</Sub>
          </text>
          <text x={hBarW} y={46} textAnchor="end" fill="var(--fg)" fontFamily="var(--font-mono)" fontSize={14} fontWeight={600}>
            {p2Tween.toFixed(1)} mmHg
          </text>
          <rect x={0} y={54} width={hBarW} height={14} rx={4} fill="var(--surface-raised)" />
          <rect x={0} y={54} width={Math.max(4, (p2Tween / MAX_DIAL_PRESSURE) * hBarW)} height={14} rx={4} fill="var(--spot-2)" />

          {/* p_total bar */}
          <text x={0} y={92} fill="var(--accent)" fontFamily="var(--font-sans)" fontSize={14} fontWeight={700}>
            p<Sub>total</Sub> = p<Sub>1</Sub> + p<Sub>2</Sub>
          </text>
          <text x={hBarW} y={92} textAnchor="end" fill="var(--accent)" fontFamily="var(--font-mono)" fontSize={14} fontWeight={700}>
            {pTotalTween.toFixed(1)} mmHg
          </text>
          <rect x={0} y={100} width={hBarW} height={16} rx={4} fill="var(--surface-raised)" />
          <rect x={0} y={100} width={Math.max(4, (pTotalTween / MAX_DIAL_PRESSURE) * hBarW)} height={16} rx={4} fill="var(--accent)" />
        </g>
      )}

      {isNonVol && (
        <g transform={`translate(${hBarX}, 286)`}>
          {/* Pure reference bar */}
          <text x={0} y={0} fill="var(--fg-muted)" fontFamily="var(--font-sans)" fontSize={14} fontWeight={600}>
            Pure p<Sub>1</Sub><Sup>0</Sup>
          </text>
          <text x={hBarW} y={0} textAnchor="end" fill="var(--fg-muted)" fontFamily="var(--font-mono)" fontSize={14}>
            200 mmHg
          </text>
          <rect x={0} y={8} width={hBarW} height={16} rx={4} fill="var(--surface-raised)" />
          <rect
            x={0}
            y={8}
            width={(spec.p1Zero / MAX_DIAL_PRESSURE) * hBarW}
            height={16}
            rx={4}
            fill="var(--spot-1)"
            opacity={0.35}
            stroke="var(--spot-1)"
            strokeWidth={1.4}
            strokeDasharray="4 3"
          />

          {/* Solution bar + lowering segment */}
          <text x={0} y={50} fill="var(--fg)" fontFamily="var(--font-sans)" fontSize={14} fontWeight={700}>
            Solution p<Sub>1</Sub>
          </text>
          <text x={hBarW} y={50} textAnchor="end" fill="var(--fg)" fontFamily="var(--font-mono)" fontSize={14} fontWeight={700}>
            {Math.round(p1Tween)} mmHg
          </text>
          <rect x={0} y={58} width={hBarW} height={16} rx={4} fill="var(--surface-raised)" />
          <rect
            x={0}
            y={58}
            width={Math.max(4, (p1Tween / MAX_DIAL_PRESSURE) * hBarW)}
            height={16}
            rx={4}
            fill="var(--spot-1)"
          />
          {spec.p1Zero > p1Tween + 1 && (
            <rect
              x={(p1Tween / MAX_DIAL_PRESSURE) * hBarW}
              y={58}
              width={((spec.p1Zero - p1Tween) / MAX_DIAL_PRESSURE) * hBarW}
              height={16}
              rx={3}
              fill="var(--caution-soft)"
              stroke="var(--caution)"
              strokeWidth={1.5}
              strokeDasharray="3 2"
            />
          )}

          <text
            x={hBarW / 2}
            y={102}
            textAnchor="middle"
            fill="var(--caution)"
            fontFamily="var(--font-sans)"
            fontSize={14}
            fontWeight={700}
          >
            Δp<Sub>1</Sub> = x<Sub>2</Sub> p<Sub>1</Sub><Sup>0</Sup> = 60 mmHg
          </text>
          <text
            x={hBarW / 2}
            y={124}
            textAnchor="middle"
            fill="var(--fg-muted)"
            fontFamily="var(--font-sans)"
            fontSize={14}
          >
            7 / 10 solvent sites escape
          </text>
        </g>
      )}

      {/* Single understated bottom equation */}
      <text
        x={290}
        y={516}
        textAnchor="middle"
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
        fontSize={15}
      >
        {isPure && (
          <>
            p<Sub>1</Sub> = p<Sub>1</Sub><Sup>0</Sup>   —   all surface sites belong to solvent 1
          </>
        )}
        {isBinary && (
          <>
            p<Sub>total</Sub> = p<Sub>1</Sub><Sup>0</Sup>x<Sub>1</Sub> + p<Sub>2</Sub><Sup>0</Sup>x<Sub>2</Sub>   (Raoult&apos;s law for binary volatile liquids)
          </>
        )}
        {isNonVol && (
          <>
            p<Sub>1</Sub> = p<Sub>1</Sub><Sup>0</Sup>x<Sub>1</Sub>   ⇒   Δp<Sub>1</Sub> / p<Sub>1</Sub><Sup>0</Sup> = x<Sub>2</Sub>
          </>
        )}
      </text>
    </g>
  )
}

function DiagramDaltonScene({
  spec,
  y2Tween,
}: {
  spec: RaoultStepSpec
  y2Tween: number
}) {
  const gx0 = 66
  const gx1 = 358
  const gy0 = 382
  const gy1 = 76
  const maxP = 450

  const toX = (x2: number) => gx0 + x2 * (gx1 - gx0)
  const toY = (p: number) => gy0 - (p / maxP) * (gy0 - gy1)

  const curX = toX(spec.x2)
  const barTop = 108
  const barH = 248
  const liq2H = spec.x2 * barH
  const vap2H = y2Tween * barH

  return (
    <g>
      {/* Left: Borderless Raoult Vapour-Pressure Graph */}
      <text
        x={(gx0 + gx1) / 2}
        y={36}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Raoult Vapour-Pressure Diagram
      </text>

      {/* Open axes + right pure-2 spine */}
      <line x1={gx0} y1={gy1} x2={gx0} y2={gy0} stroke="var(--fg)" strokeWidth={1.8} />
      <line x1={gx0} y1={gy0} x2={gx1} y2={gy0} stroke="var(--fg)" strokeWidth={1.8} />
      <line x1={gx1} y1={gy1} x2={gx1} y2={gy0} stroke="var(--border)" strokeWidth={1.4} />

      {/* Horizontal gridlines */}
      {[100, 200, 300, 400].map((p) => (
        <g key={`g-${p}`}>
          <line
            x1={gx0}
            y1={toY(p)}
            x2={gx1}
            y2={toY(p)}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
          <text
            x={gx0 - 10}
            y={toY(p) + 5}
            textAnchor="end"
            fontSize={14}
            fill="var(--fg-muted)"
            fontFamily="var(--font-mono)"
          >
            {p}
          </text>
        </g>
      ))}
      <text
        x={gx0 - 10}
        y={gy0 + 5}
        textAnchor="end"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-mono)"
      >
        0
      </text>

      {/* Y-axis title */}
      <text
        x={18}
        y={(gy0 + gy1) / 2}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
        transform={`rotate(-90 18 ${(gy0 + gy1) / 2})`}
      >
        Vapour pressure (mmHg)
      </text>

      {/* p1 dashed line */}
      <line
        x1={toX(0)}
        y1={toY(spec.p1Zero)}
        x2={toX(1)}
        y2={toY(0)}
        stroke="var(--spot-1)"
        strokeWidth={2.4}
        strokeDasharray="6 4"
      />
      {/* p2 dashed line */}
      <line
        x1={toX(0)}
        y1={toY(0)}
        x2={toX(1)}
        y2={toY(spec.p2Zero)}
        stroke="var(--spot-2)"
        strokeWidth={2.4}
        strokeDasharray="6 4"
      />
      {/* pTotal bold line */}
      <line
        x1={toX(0)}
        y1={toY(spec.p1Zero)}
        x2={toX(1)}
        y2={toY(spec.p2Zero)}
        stroke="var(--accent)"
        strokeWidth={3.2}
        strokeLinecap="round"
      />

      {/* Active equimolar slice at x2 = 0.50 */}
      <line
        x1={curX}
        y1={gy0}
        x2={curX}
        y2={toY(spec.pTotal)}
        stroke="var(--fg-subtle)"
        strokeWidth={1.6}
        strokeDasharray="4 3"
      />
      <circle cx={curX} cy={toY(spec.p1)} r={5.5} fill="var(--spot-1)" stroke="var(--surface)" strokeWidth={1.6} />
      <circle cx={curX} cy={toY(spec.p2)} r={5.5} fill="var(--spot-2)" stroke="var(--surface)" strokeWidth={1.6} />
      <circle cx={curX} cy={toY(spec.pTotal)} r={6.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} />

      {/* Direct clean curve labels using Sub / Sup */}
      <text
        x={gx0 + 8}
        y={toY(spec.p1Zero) - 10}
        fontSize={14}
        fontWeight={700}
        fill="var(--spot-1)"
        fontFamily="var(--font-sans)"
      >
        p<Sub>1</Sub><Sup>0</Sup>
      </text>
      <text
        x={gx1 - 6}
        y={toY(spec.p2Zero) - 10}
        textAnchor="end"
        fontSize={14}
        fontWeight={700}
        fill="var(--spot-2)"
        fontFamily="var(--font-sans)"
      >
        p<Sub>2</Sub><Sup>0</Sup>
      </text>
      <text
        x={toX(0.48)}
        y={toY(346)}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent)"
        fontFamily="var(--font-sans)"
      >
        p<Sub>total</Sub>
      </text>
      <text
        x={toX(0.76)}
        y={toY(spec.p1Zero * 0.24) - 10}
        fontSize={14}
        fontWeight={600}
        fill="var(--spot-1)"
        fontFamily="var(--font-sans)"
      >
        p<Sub>1</Sub>
      </text>
      <text
        x={toX(0.76)}
        y={toY(spec.p2Zero * 0.76) + 22}
        fontSize={14}
        fontWeight={600}
        fill="var(--spot-2)"
        fontFamily="var(--font-sans)"
      >
        p<Sub>2</Sub>
      </text>

      {/* X-axis ticks & label */}
      <text x={gx0} y={gy0 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-mono)">
        0
      </text>
      <text x={curX} y={gy0 + 22} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--fg)" fontFamily="var(--font-mono)">
        0.50
      </text>
      <text x={gx1} y={gy0 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-mono)">
        1
      </text>
      <text
        x={(gx0 + gx1) / 2}
        y={gy0 + 48}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Mole fraction x<Sub>2</Sub>
      </text>

      {/* Subtle vertical divider */}
      <line x1={386} y1={52} x2={386} y2={446} stroke="var(--border)" strokeWidth={1.2} />

      {/* Right: Borderless Liquid vs Vapour Dalton Enrichment Bars */}
      <text
        x={480}
        y={36}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Liquid vs Vapour
      </text>
      <text
        x={480}
        y={60}
        textAnchor="middle"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        at x<Sub>2</Sub> = 0.50
      </text>

      {/* Liquid stacked bar */}
      <rect x={412} y={barTop} width={54} height={barH - liq2H} fill="var(--spot-1)" rx={4} />
      <rect x={412} y={barTop + (barH - liq2H)} width={54} height={liq2H} fill="var(--spot-2)" rx={4} />
      <text
        x={439}
        y={barTop + (barH - liq2H) / 2 + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent-fg)"
        fontFamily="var(--font-mono)"
      >
        50%
      </text>
      <text
        x={439}
        y={barTop + (barH - liq2H) + liq2H / 2 + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent-fg)"
        fontFamily="var(--font-mono)"
      >
        50%
      </text>
      <text
        x={439}
        y={barTop + barH + 24}
        textAnchor="middle"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        Liquid
      </text>

      {/* Vapour stacked bar */}
      <rect x={492} y={barTop} width={54} height={Math.max(0, barH - vap2H)} fill="var(--spot-1)" rx={4} />
      <rect x={492} y={barTop + (barH - vap2H)} width={54} height={Math.max(0, vap2H)} fill="var(--spot-2)" rx={4} />
      <text
        x={519}
        y={barTop + (barH - vap2H) / 2 + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent-fg)"
        fontFamily="var(--font-mono)"
      >
        {Math.round((1 - y2Tween) * 100)}%
      </text>
      <text
        x={519}
        y={barTop + (barH - vap2H) + vap2H / 2 + 5}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent-fg)"
        fontFamily="var(--font-mono)"
      >
        {Math.round(y2Tween * 100)}%
      </text>
      <text
        x={519}
        y={barTop + barH + 24}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Vapour
      </text>

      {/* Enrichment takeaway directly under bars */}
      <text
        x={480}
        y={428}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent)"
        fontFamily="var(--font-mono)"
      >
        y<Sub>2</Sub> ({y2Tween.toFixed(2)}) &gt; x<Sub>2</Sub> (0.50)
      </text>

      {/* Understated bottom equation */}
      <text
        x={290}
        y={516}
        textAnchor="middle"
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
        fontSize={15}
      >
        y<Sub>2</Sub> = p<Sub>2</Sub> / p<Sub>total</Sub>   —   vapour is enriched in the more volatile component
      </text>
    </g>
  )
}

function HenrySpecialCaseScene({
  t,
  reducedMotion,
}: {
  t: number
  reducedMotion: boolean
}) {
  const gx0 = 96
  const gx1 = 496
  const gy0 = 374
  const gy1 = 76

  const endY = 166 // Coincident endpoint at x_i = 1 (p_i = p_i^0 = K_H)
  const pulse = reducedMotion ? 0 : Math.sin(t * 2.2) * 0.5 + 0.5

  return (
    <g>
      <text
        x={290}
        y={36}
        textAnchor="middle"
        fontSize={15}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Raoult&apos;s Law Coincides with Henry&apos;s Law when K<Sub>H</Sub> = p<Sub>i</Sub><Sup>0</Sup>
      </text>

      {/* Open axes */}
      <line x1={gx0} y1={gy1} x2={gx0} y2={gy0} stroke="var(--fg)" strokeWidth={1.8} />
      <line x1={gx0} y1={gy0} x2={gx1} y2={gy0} stroke="var(--fg)" strokeWidth={1.8} />

      {/* Horizontal reference at p_i^0 */}
      <line
        x1={gx0}
        y1={endY}
        x2={gx1}
        y2={endY}
        stroke="var(--border)"
        strokeWidth={1.3}
        strokeDasharray="4 4"
      />
      <text
        x={gx0 - 12}
        y={endY + 5}
        textAnchor="end"
        fontSize={14}
        fontWeight={700}
        fill="var(--accent)"
        fontFamily="var(--font-sans)"
      >
        p<Sub>i</Sub><Sup>0</Sup>
      </text>

      {/* Vertical reference at x_i = 1 */}
      <line
        x1={gx1}
        y1={endY}
        x2={gx1}
        y2={gy0}
        stroke="var(--border)"
        strokeWidth={1.3}
        strokeDasharray="4 4"
      />

      {/* General Henry's law ray with K_H > p_i^0 (steeper) */}
      <line
        x1={gx0}
        y1={gy0}
        x2={336}
        y2={94}
        stroke="var(--fg-subtle)"
        strokeWidth={2}
        strokeDasharray="5 5"
      />
      <text
        x={344}
        y={98}
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        Henry: K<Sub>H</Sub> &gt; p<Sub>i</Sub><Sup>0</Sup>
      </text>

      {/* General Henry's law ray with K_H < p_i^0 (shallower) */}
      <line
        x1={gx0}
        y1={gy0}
        x2={gx1}
        y2={274}
        stroke="var(--fg-subtle)"
        strokeWidth={2}
        strokeDasharray="5 5"
      />
      <text
        x={gx1 - 6}
        y={296}
        textAnchor="end"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        Henry: K<Sub>H</Sub> &lt; p<Sub>i</Sub><Sup>0</Sup>
      </text>

      {/* Coincident glow halo */}
      <line
        x1={gx0}
        y1={gy0}
        x2={gx1}
        y2={endY}
        stroke="var(--accent)"
        strokeWidth={10}
        strokeLinecap="round"
        opacity={0.14 + pulse * 0.12}
      />

      {/* Raoult's law solid line: p_i = p_i^0 x_i */}
      <line
        x1={gx0}
        y1={gy0}
        x2={gx1}
        y2={endY}
        stroke="var(--accent)"
        strokeWidth={4}
        strokeLinecap="round"
      />

      {/* Henry's law dashed overlay aligned directly on top when K_H = p_i^0 */}
      <line
        x1={gx0}
        y1={gy0}
        x2={gx1}
        y2={endY}
        stroke="var(--energy-curve)"
        strokeWidth={2.4}
        strokeDasharray="10 7"
        strokeLinecap="round"
      />

      {/* Endpoint dot at (x_i = 1, p_i = p_i^0 = K_H) */}
      <circle
        cx={gx1}
        cy={endY}
        r={7}
        fill="var(--accent)"
        stroke="var(--surface)"
        strokeWidth={2.2}
      />

      {/* Direct label along coincident line (positioned cleanly in open gap above line) */}
      <text
        x={320}
        y={204}
        fontSize={14}
        fontWeight={700}
        fill="var(--accent)"
        fontFamily="var(--font-sans)"
      >
        K<Sub>H</Sub> = p<Sub>i</Sub><Sup>0</Sup>
      </text>
      <text
        x={320}
        y={224}
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        lines coincide
      </text>

      {/* Axis labels */}
      <text
        x={34}
        y={(gy0 + gy1) / 2}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
        transform={`rotate(-90 34 ${(gy0 + gy1) / 2})`}
      >
        Partial pressure p<Sub>i</Sub>
      </text>
      <text x={gx0} y={gy0 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-mono)">
        0
      </text>
      <text x={gx1} y={gy0 + 22} textAnchor="middle" fontSize={14} fill="var(--fg-muted)" fontFamily="var(--font-mono)">
        1
      </text>
      <text
        x={(gx0 + gx1) / 2}
        y={gy0 + 24}
        textAnchor="middle"
        fontSize={14}
        fontWeight={600}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        Mole fraction x<Sub>i</Sub>
      </text>

      {/* Clean borderless inline equation alignment below graph */}
      <text
        x={172}
        y={452}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        fill="var(--accent)"
        fontFamily="var(--font-mono)"
      >
        p<Sub>i</Sub> = p<Sub>i</Sub><Sup>0</Sup> · x<Sub>i</Sub>
      </text>
      <text
        x={290}
        y={452}
        textAnchor="middle"
        fontSize={18}
        fontWeight={700}
        fill="var(--fg)"
        fontFamily="var(--font-sans)"
      >
        ≡
      </text>
      <text
        x={408}
        y={452}
        textAnchor="middle"
        fontSize={16}
        fontWeight={700}
        fill="var(--energy-curve)"
        fontFamily="var(--font-mono)"
      >
        p<Sub>i</Sub> = K<Sub>H</Sub> · x<Sub>i</Sub>
      </text>
      <text
        x={172}
        y={474}
        textAnchor="middle"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        Raoult&apos;s law
      </text>
      <text
        x={408}
        y={474}
        textAnchor="middle"
        fontSize={14}
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
      >
        Henry&apos;s law
      </text>

      {/* Understated bottom line */}
      <text
        x={290}
        y={516}
        textAnchor="middle"
        fill="var(--fg-muted)"
        fontFamily="var(--font-sans)"
        fontSize={15}
      >
        Raoult&apos;s law is the special case of Henry&apos;s law where K<Sub>H</Sub> = p<Sub>i</Sub><Sup>0</Sup>
      </text>
    </g>
  )
}

export function RaoultSurface({ step, reducedMotion }: RaoultSurfaceProps) {
  const spec = getRaoultStep(step)
  const t = useAmbientTime(reducedMotion)

  const p1Tween = useTweenedNumber(spec.p1, reducedMotion, 0.55)
  const p2Tween = useTweenedNumber(spec.p2, reducedMotion, 0.55)
  const pTotalTween = useTweenedNumber(spec.pTotal, reducedMotion, 0.55)
  const y2Tween = useTweenedNumber(spec.y2, reducedMotion, 0.55)

  return (
    <svg
      viewBox="0 0 580 540"
      style={{ width: '100%', height: 'auto', display: 'block' }}
      role="img"
      aria-label={spec.ariaLabel}
      data-testid="raoult-surface"
      data-step={spec.index}
    >
      <VocabDefs idPrefix="rl" />

      {(spec.mode === 'vessel-pure' ||
        spec.mode === 'vessel-binary' ||
        spec.mode === 'vessel-nonvolatile') && (
        <VesselScene
          spec={spec}
          p1Tween={p1Tween}
          p2Tween={p2Tween}
          pTotalTween={pTotalTween}
          t={t}
          reducedMotion={reducedMotion}
        />
      )}

      {spec.mode === 'diagram-dalton' && (
        <DiagramDaltonScene spec={spec} y2Tween={y2Tween} />
      )}

      {spec.mode === 'henry-special-case' && (
        <HenrySpecialCaseScene t={t} reducedMotion={reducedMotion} />
      )}
    </svg>
  )
}
