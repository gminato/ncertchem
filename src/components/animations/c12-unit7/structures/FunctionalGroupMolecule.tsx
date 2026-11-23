'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { CurvedArrow } from '@/components/organic'
import { stereoPath } from '@/components/organic/frame'
import { TETRAHEDRAL_ANGLE } from '@/lib/chem/ncert-c12-unit7-data'
import { geometryRecord, type MoleculeId } from '@/lib/chem/c12-u7-s3-geometry'

const DEG = Math.PI / 180

export interface FunctionalGroupMoleculeProps {
  moleculeId: MoleculeId
  /** Position of the central oxygen atom in the parent SVG viewBox. */
  ox: number
  oy: number
  /** Drawn SVG units per picometre. */
  unitsPerPm?: number
  showLonePairs?: boolean
  showTetrahedralRef?: boolean
  showOrbitalOverlap?: boolean
  showConjugation?: boolean
  showStericHalos?: boolean
  showMethanolGhost?: boolean
  highlightCarbons?: boolean
  showHybridTags?: boolean
  showBondLengthCallouts?: boolean
  showAngleCallout?: boolean
  /** Compact mode omits secondary reference text for side-by-side 3-up cards. */
  compact?: boolean
  reducedMotion?: boolean
}

interface Pt {
  x: number
  y: number
}

function polar(origin: Pt, r: number, angleDeg: number): Pt {
  const rad = angleDeg * DEG
  return { x: origin.x + r * Math.cos(rad), y: origin.y + r * Math.sin(rad) }
}

function alongDist(from: Pt, to: Pt, trimStart: number, trimEnd: number): { a: Pt; b: Pt } {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const ux = dx / len
  const uy = dy / len
  return {
    a: { x: from.x + ux * trimStart, y: from.y + uy * trimStart },
    b: { x: to.x - ux * trimEnd, y: to.y - uy * trimEnd },
  }
}

/** Smoothly tween a numeric geometry parameter unless reducedMotion is active. */
function useTweenValue(target: number, reducedMotion: boolean, durationMs = 280): number {
  const [current, setCurrent] = useState(target)
  const latestRef = useRef(target)

  useEffect(() => {
    if (reducedMotion) {
      latestRef.current = target
      return
    }
    const start = latestRef.current
    if (Math.abs(start - target) < 0.01) return
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      const val = start + (target - start) * eased
      latestRef.current = val
      setCurrent(val)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, reducedMotion, durationMs])

  return reducedMotion ? target : current
}

/** Smooth asymmetric teardrop orbital path originating at (0,0) and extending along +x to length L. */
function lobePath(len: number, halfWidth: number): string {
  const w = halfWidth
  return `M 0 0 C ${len * 0.25} ${-w * 0.65}, ${len * 0.72} ${-w}, ${len} 0 C ${len * 0.72} ${w}, ${len * 0.25} ${w * 0.65}, 0 0 Z`
}

/** Dimension bracket parallel to segment `p -> q`, offset along normal `(nx, ny)` by `offset`. */
function DimensionCallout({
  p,
  q,
  offset,
  label,
  labelDx = 0,
  labelDy = -12,
  fontSize = 18,
  color = 'var(--fg)',
}: {
  p: Pt
  q: Pt
  offset: number
  label: string
  labelDx?: number
  labelDy?: number
  fontSize?: number
  color?: string
}) {
  const dx = q.x - p.x
  const dy = q.y - p.y
  const len = Math.hypot(dx, dy) || 1
  const nx = -dy / len
  const ny = dx / len
  const a = { x: p.x + nx * offset, y: p.y + ny * offset }
  const b = { x: q.x + nx * offset, y: q.y + ny * offset }
  const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  const tick = 5

  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <line
        x1={a.x - nx * tick}
        y1={a.y - ny * tick}
        x2={a.x + nx * tick}
        y2={a.y + ny * tick}
        stroke={color}
        strokeWidth={1.6}
      />
      <line
        x1={b.x - nx * tick}
        y1={b.y - ny * tick}
        x2={b.x + nx * tick}
        y2={b.y + ny * tick}
        stroke={color}
        strokeWidth={1.6}
      />
      <text
        x={mid.x + labelDx}
        y={mid.y + labelDy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={600}
        fontFamily="var(--font-mono)"
        fill={color}
      >
        {label}
      </text>
    </g>
  )
}

/**
 * Shared SVG molecular renderer centred on the functional-group oxygen atom.
 * Renders methanol, phenol, and methoxymethane to a unified picometre scale with
 * optional lone pairs, 109°28′ tetrahedral wedge, and electronic/steric overlays.
 */
export function FunctionalGroupMolecule({
  moleculeId,
  ox,
  oy,
  unitsPerPm = 0.85,
  showLonePairs = true,
  showTetrahedralRef = true,
  showOrbitalOverlap = false,
  showConjugation = false,
  showStericHalos = false,
  showMethanolGhost = false,
  highlightCarbons = false,
  showHybridTags = true,
  showBondLengthCallouts = true,
  showAngleCallout = true,
  compact = false,
  reducedMotion = false,
}: FunctionalGroupMoleculeProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const rec = geometryRecord(moleculeId)
  const methanolRec = geometryRecord('methanol')

  const animCoPm = useTweenValue(rec.coBondLengthPm, reducedMotion)
  const animAngleDeg = useTweenValue(rec.bondAngleDeg, reducedMotion)

  const O: Pt = { x: ox, y: oy }
  const s = unitsPerPm
  const leftAngleDeg = 90 + animAngleDeg / 2
  const rightAngleDeg = 90 - animAngleDeg / 2

  const coLen = animCoPm * s
  const C1 = polar(O, coLen, leftAngleDeg)

  // Right partner: H for methanol/phenol, C2 for methoxymethane
  const rightBondPm = moleculeId === 'methoxymethane' ? animCoPm : (rec.ohBondLengthPm ?? 96)
  const rightLen = rightBondPm * s
  const RAtom = polar(O, rightLen, rightAngleDeg)

  // Tetrahedral reference rays (109°28′)
  const refHalf = TETRAHEDRAL_ANGLE.deg / 2
  const refLeftDeg = 90 + refHalf
  const refRightDeg = 90 - refHalf
  const refRayLen = 104 * s
  const refArcR = 86 * s
  const refRayL = polar(O, refRayLen, refLeftDeg)
  const refRayR = polar(O, refRayLen, refRightDeg)
  const refArcL = polar(O, refArcR, refLeftDeg)
  const refArcRPt = polar(O, refArcR, refRightDeg)

  // Active angle sector & arc
  const actArcR = 40 * s
  const actArcL = polar(O, actArcR, leftAngleDeg)
  const actArcRPt = polar(O, actArcR, rightAngleDeg)

  // Benzene ring geometry for phenol (vertex 0 is C1, ring extends down-left along leftAngleDeg)
  const ringR = 54 * s
  const ringCentre = polar(C1, ringR, leftAngleDeg)
  const ringVerts = Array.from({ length: 6 }, (_, k) =>
    polar(ringCentre, ringR, leftAngleDeg + 180 - k * 60),
  )
  const ringInnerR = ringR * (Math.sqrt(3) / 2) * 0.62

  // Methyl H positions for methanol & methoxymethane
  const hBondLen = 48 * s
  const leftMethylArms = [
    { kind: 'plain' as const, deg: 196 },
    { kind: 'dash' as const, deg: 146 },
    { kind: 'wedge' as const, deg: 94 },
  ]
  const rightMethylArms = [
    { kind: 'plain' as const, deg: -16 },
    { kind: 'dash' as const, deg: 34 },
    { kind: 'wedge' as const, deg: 86 },
  ]

  // Lone pair lobe angles above oxygen (-108° and -72°)
  const lpAngles = [-108, -72]
  const lpLen = 40 * s
  const lpHalfW = 9 * s

  // Bond segments trimmed cleanly around atom labels
  const trimC = moleculeId === 'phenol' ? 0 : 16
  const trimO = 17
  const coSeg = alongDist(C1, O, trimC, trimO)
  const rightSeg = alongDist(O, RAtom, trimO, moleculeId === 'methoxymethane' ? 16 : 15)

  // Bond-length DimensionCallout offset & methanol 142 pm ghost tick along the bracket line
  const coOffset = -38 * s
  const coDx = O.x - C1.x
  const coDy = O.y - C1.y
  const coSegLen = Math.hypot(coDx, coDy) || 1
  const coNx = -coDy / coSegLen
  const coNy = coDx / coSegLen
  const oBracket: Pt = { x: O.x + coNx * coOffset, y: O.y + coNy * coOffset }
  const cBracket: Pt = { x: C1.x + coNx * coOffset, y: C1.y + coNy * coOffset }
  const ghostBracketPt = polar(oBracket, methanolRec.coBondLengthPm * s, leftAngleDeg)

  const atomFont = compact ? 20 : 22
  const hFont = 19
  const calloutFont = 19

  const angleDisplay = Number.isInteger(rec.bondAngleDeg)
    ? `${rec.bondAngleDeg}°`
    : `${rec.bondAngleDeg.toFixed(1)}°`

  return (
    <g>
      <defs>
        <marker
          id={`arrow-${uid}`}
          viewBox="0 0 10 10"
          refX="7"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M 1 2 L 8 5 L 1 8 Z" fill="var(--caution)" />
        </marker>
      </defs>

      {/* 1. Steric halos around methyl groups in methoxymethane */}
      {showStericHalos && moleculeId === 'methoxymethane' && (
        <g>
          {[C1, RAtom].map((cPt, idx) => {
            const haloCenter = {
              x: cPt.x + (idx === 0 ? -16 * s : 16 * s),
              y: cPt.y + 15 * s,
            }
            return (
              <circle
                key={`halo-${idx}`}
                cx={haloCenter.x}
                cy={haloCenter.y}
                r={66 * s}
                fill="var(--caution-soft)"
                stroke="var(--caution)"
                strokeWidth={1.8}
                strokeDasharray="6 4"
              />
            )
          })}
          {/* Outward steric push arrows (dropped clear below ref 109°28′ label) */}
          <line
            x1={O.x - 24 * s}
            y1={C1.y + 43 * s}
            x2={C1.x + 24 * s}
            y2={C1.y + 43 * s}
            stroke="var(--caution)"
            strokeWidth={2.4}
            markerEnd={`url(#arrow-${uid})`}
          />
          <line
            x1={O.x + 24 * s}
            y1={RAtom.y + 43 * s}
            x2={RAtom.x - 24 * s}
            y2={RAtom.y + 43 * s}
            stroke="var(--caution)"
            strokeWidth={2.4}
            markerEnd={`url(#arrow-${uid})`}
          />
        </g>
      )}

      {/* 2. Carbon highlights */}
      {highlightCarbons && (
        <g>
          <circle
            cx={C1.x}
            cy={C1.y}
            r={19 * s}
            fill="var(--highlight)"
            stroke="var(--accent)"
            strokeWidth={1.6}
            strokeDasharray="4 3"
          />
          {moleculeId === 'methoxymethane' && (
            <circle
              cx={RAtom.x}
              cy={RAtom.y}
              r={19 * s}
              fill="var(--highlight)"
              stroke="var(--accent)"
              strokeWidth={1.6}
              strokeDasharray="4 3"
            />
          )}
        </g>
      )}

      {/* 3. Tetrahedral 109°28′ reference wedge */}
      {showTetrahedralRef && (
        <g>
          <line
            x1={O.x}
            y1={O.y}
            x2={refRayL.x}
            y2={refRayL.y}
            stroke="var(--fg-subtle)"
            strokeWidth={1.6}
            strokeDasharray="5 4"
          />
          <line
            x1={O.x}
            y1={O.y}
            x2={refRayR.x}
            y2={refRayR.y}
            stroke="var(--fg-subtle)"
            strokeWidth={1.6}
            strokeDasharray="5 4"
          />
          <path
            d={`M ${refArcRPt.x.toFixed(1)} ${refArcRPt.y.toFixed(1)} A ${refArcR.toFixed(1)} ${refArcR.toFixed(1)} 0 0 1 ${refArcL.x.toFixed(1)} ${refArcL.y.toFixed(1)}`}
            fill="none"
            stroke="var(--fg-subtle)"
            strokeWidth={1.6}
            strokeDasharray="4 4"
          />
          {!compact && (
            <text
              x={O.x}
              y={O.y + refArcR + 13 * s}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={19}
              fontWeight={500}
              fontFamily="var(--font-sans)"
              fill="var(--fg-muted)"
            >
              {`ref ${TETRAHEDRAL_ANGLE.printed}`}
            </text>
          )}
        </g>
      )}

      {/* 4. Active angle wedge & arc */}
      {showAngleCallout && (
        <g>
          <path
            d={`M ${O.x} ${O.y} L ${actArcRPt.x.toFixed(1)} ${actArcRPt.y.toFixed(1)} A ${actArcR.toFixed(1)} ${actArcR.toFixed(1)} 0 0 1 ${actArcL.x.toFixed(1)} ${actArcL.y.toFixed(1)} Z`}
            fill="var(--accent-soft)"
          />
          <path
            d={`M ${actArcRPt.x.toFixed(1)} ${actArcRPt.y.toFixed(1)} A ${actArcR.toFixed(1)} ${actArcR.toFixed(1)} 0 0 1 ${actArcL.x.toFixed(1)} ${actArcL.y.toFixed(1)}`}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={2.4}
          />
          <text
            x={O.x}
            y={O.y + actArcR + 19 * s}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={calloutFont}
            fontWeight={700}
            fontFamily="var(--font-mono)"
            fill="var(--accent)"
          >
            {angleDisplay}
          </text>
        </g>
      )}

      {/* 5. Methanol sp3-sp3 orbital overlap along C-O */}
      {showOrbitalOverlap && moleculeId === 'methanol' && (
        <g>
          <g transform={`translate(${C1.x}, ${C1.y}) rotate(${leftAngleDeg + 180})`}>
            <path
              d={lobePath(coLen * 0.64, 18 * s)}
              fill="var(--orbital-pos)"
              fillOpacity={0.22}
              stroke="var(--orbital-pos)"
              strokeWidth={1.6}
            />
          </g>
          <g transform={`translate(${O.x}, ${O.y}) rotate(${leftAngleDeg})`}>
            <path
              d={lobePath(coLen * 0.64, 18 * s)}
              fill="var(--orbital-neg)"
              fillOpacity={0.22}
              stroke="var(--orbital-neg)"
              strokeWidth={1.6}
            />
          </g>
        </g>
      )}

      {/* 6. Phenol partial double-bond conjugation overlay */}
      {showConjugation && moleculeId === 'phenol' && (
        <g>
          {(() => {
            const dx = coSeg.b.x - coSeg.a.x
            const dy = coSeg.b.y - coSeg.a.y
            const len = Math.hypot(dx, dy) || 1
            const nx = (-dy / len) * (-9 * s)
            const ny = (dx / len) * (-9 * s)
            const inset = 0.08
            return (
              <line
                x1={coSeg.a.x + dx * inset + nx}
                y1={coSeg.a.y + dy * inset + ny}
                x2={coSeg.b.x - dx * inset + nx}
                y2={coSeg.b.y - dy * inset + ny}
                stroke="var(--e-arrow)"
                strokeWidth={2.6}
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            )
          })()}
          {showLonePairs && (
            <CurvedArrow
              from={polar(O, lpLen * 0.56, lpAngles[0])}
              to={{ x: C1.x * 0.36 + O.x * 0.64 - 4 * s, y: C1.y * 0.36 + O.y * 0.64 - 8 * s }}
              bend={0.24}
              kind="pair"
              headSize={11}
              strokeWidth={2.2}
            />
          )}
        </g>
      )}

      {/* 7. Lone pair teardrop lobes above oxygen */}
      {showLonePairs && (
        <g>
          {lpAngles.map((deg, idx) => {
            const dotCenter = polar(O, lpLen * 0.56, deg)
            const perp = (deg + 90) * DEG
            const sep = 4.6 * s
            return (
              <g key={`lp-${idx}`}>
                <g transform={`translate(${O.x}, ${O.y}) rotate(${deg})`}>
                  <path
                    d={lobePath(lpLen, lpHalfW)}
                    fill="var(--lone-pair)"
                    fillOpacity={0.22}
                    stroke="var(--lone-pair-edge)"
                    strokeWidth={1.6}
                  />
                </g>
                {[-1, 1].map((side) => (
                  <circle
                    key={`dot-${idx}-${side}`}
                    cx={dotCenter.x + Math.cos(perp) * sep * side}
                    cy={dotCenter.y + Math.sin(perp) * sep * side}
                    r={2.8}
                    fill="var(--lone-pair-edge)"
                  />
                ))}
              </g>
            )
          })}
          {/* Gentle inward compression indicators for methanol */}
          {showOrbitalOverlap && moleculeId === 'methanol' && !compact && (
            <g stroke="var(--lone-pair-edge)" strokeWidth={1.6} fill="none" strokeDasharray="3 3">
              <path
                d={`M ${(O.x - 40 * s).toFixed(1)} ${(O.y - 6 * s).toFixed(1)} Q ${(O.x - 42 * s).toFixed(1)} ${(O.y + 14 * s).toFixed(1)} ${(O.x - 30 * s).toFixed(1)} ${(O.y + 24 * s).toFixed(1)}`}
              />
              <path
                d={`M ${(O.x + 40 * s).toFixed(1)} ${(O.y - 6 * s).toFixed(1)} Q ${(O.x + 42 * s).toFixed(1)} ${(O.y + 14 * s).toFixed(1)} ${(O.x + 30 * s).toFixed(1)} ${(O.y + 24 * s).toFixed(1)}`}
              />
            </g>
          )}
        </g>
      )}

      {/* 8. Substituents attached to left carbon (methyl or phenyl ring) */}
      {moleculeId === 'phenol' ? (
        <g>
          <polygon
            points={ringVerts.map((v) => `${v.x.toFixed(1)},${v.y.toFixed(1)}`).join(' ')}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2.8}
            strokeLinejoin="round"
          />
          <circle
            cx={ringCentre.x}
            cy={ringCentre.y}
            r={ringInnerR}
            fill="none"
            stroke="var(--fg)"
            strokeWidth={2}
          />
          {highlightCarbons && (
            <circle cx={C1.x} cy={C1.y} r={4.5} fill="var(--accent)" />
          )}
        </g>
      ) : (
        <g>
          {leftMethylArms.map((arm, idx) => {
            const hPos = polar(C1, hBondLen, arm.deg)
            const seg = alongDist(C1, hPos, 15, 13)
            const lblPos = polar(C1, hBondLen + 11, arm.deg)
            return (
              <g key={`lh-${idx}`}>
                {arm.kind === 'plain' ? (
                  <line
                    x1={seg.a.x}
                    y1={seg.a.y}
                    x2={seg.b.x}
                    y2={seg.b.y}
                    stroke="var(--fg)"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d={stereoPath(seg.a, seg.b, arm.kind, 6.5 * s)}
                    fill={arm.kind === 'wedge' ? 'var(--fg)' : 'none'}
                    stroke="var(--fg)"
                    strokeWidth={arm.kind === 'wedge' ? 0.8 : 2}
                    strokeLinejoin="round"
                  />
                )}
                <text
                  x={lblPos.x}
                  y={lblPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={hFont}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg)"
                >
                  H
                </text>
              </g>
            )
          })}
        </g>
      )}

      {/* 9. Substituents attached to right carbon (methoxymethane only) */}
      {moleculeId === 'methoxymethane' && (
        <g>
          {rightMethylArms.map((arm, idx) => {
            const hPos = polar(RAtom, hBondLen, arm.deg)
            const seg = alongDist(RAtom, hPos, 15, 13)
            const lblPos = polar(RAtom, hBondLen + 11, arm.deg)
            return (
              <g key={`rh-${idx}`}>
                {arm.kind === 'plain' ? (
                  <line
                    x1={seg.a.x}
                    y1={seg.a.y}
                    x2={seg.b.x}
                    y2={seg.b.y}
                    stroke="var(--fg)"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                ) : (
                  <path
                    d={stereoPath(seg.a, seg.b, arm.kind, 6.5 * s)}
                    fill={arm.kind === 'wedge' ? 'var(--fg)' : 'none'}
                    stroke="var(--fg)"
                    strokeWidth={arm.kind === 'wedge' ? 0.8 : 2}
                    strokeLinejoin="round"
                  />
                )}
                <text
                  x={lblPos.x}
                  y={lblPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={hFont}
                  fontWeight={600}
                  fontFamily="var(--font-sans)"
                  fill="var(--fg)"
                >
                  H
                </text>
              </g>
            )
          })}
        </g>
      )}

      {/* 10. Methanol 142 pm ghost tick along C-O DimensionCallout bracket */}
      {showMethanolGhost && moleculeId !== 'methanol' && (
        <g>
          <line
            x1={cBracket.x}
            y1={cBracket.y}
            x2={ghostBracketPt.x}
            y2={ghostBracketPt.y}
            stroke="var(--fg-subtle)"
            strokeWidth={1.8}
            strokeDasharray="3 3"
          />
          <circle
            cx={ghostBracketPt.x}
            cy={ghostBracketPt.y}
            r={4}
            fill="var(--surface)"
            stroke="var(--fg-muted)"
            strokeWidth={1.6}
          />
        </g>
      )}

      {/* 11. Main C-O and O-H / O-C bonds */}
      <line
        x1={coSeg.a.x}
        y1={coSeg.a.y}
        x2={coSeg.b.x}
        y2={coSeg.b.y}
        stroke="var(--fg)"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={rightSeg.a.x}
        y1={rightSeg.a.y}
        x2={rightSeg.b.x}
        y2={rightSeg.b.y}
        stroke="var(--fg)"
        strokeWidth={3}
        strokeLinecap="round"
      />

      {/* 12. Atom labels with crisp surface backing so arcs/lobes never strike letters */}
      <circle cx={O.x} cy={O.y} r={13} fill="var(--surface)" />
      <text
        x={O.x}
        y={O.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={atomFont}
        fontWeight={700}
        fontFamily="var(--font-sans)"
        fill="var(--atom-o)"
      >
        O
      </text>
      {moleculeId !== 'phenol' && (
        <>
          <circle cx={C1.x} cy={C1.y} r={12} fill="var(--surface)" fillOpacity={highlightCarbons ? 0.55 : 0.92} />
          <text
            x={C1.x}
            y={C1.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={atomFont}
            fontWeight={600}
            fontFamily="var(--font-sans)"
            fill="var(--fg)"
          >
            C
          </text>
        </>
      )}
      {moleculeId === 'methoxymethane' && (
        <circle cx={RAtom.x} cy={RAtom.y} r={12} fill="var(--surface)" fillOpacity={highlightCarbons ? 0.55 : 0.92} />
      )}
      <text
        x={RAtom.x}
        y={RAtom.y}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={atomFont}
        fontWeight={600}
        fontFamily="var(--font-sans)"
        fill="var(--fg)"
      >
        {moleculeId === 'methoxymethane' ? 'C' : 'H'}
      </text>

      {/* 13. Bond length dimension brackets */}
      {showBondLengthCallouts && (
        <g>
          {/* C-O callout always sits above-left of the C-O bond */}
          <DimensionCallout
            p={C1}
            q={O}
            offset={coOffset}
            label={`${rec.coBondLengthPm} pm`}
            labelDx={-36 * s}
            labelDy={-17 * s}
            fontSize={calloutFont}
            color={moleculeId === 'phenol' ? 'var(--accent)' : 'var(--fg)'}
          />
          {/* O-H callout ONLY for methanol where NCERT Fig. 7.1 prints 96 pm */}
          {rec.ohBondLengthPm !== null && (
            <DimensionCallout
              p={O}
              q={RAtom}
              offset={coOffset}
              label={`${rec.ohBondLengthPm} pm`}
              labelDx={compact ? 34 * s : 28 * s}
              labelDy={compact ? -14 * s : -14 * s}
              fontSize={calloutFont}
              color="var(--fg)"
            />
          )}
        </g>
      )}

      {/* 14. Carbon hybridisation tag */}
      {showHybridTags && !compact && (
        <text
          x={
            moleculeId === 'phenol'
              ? ringCentre.x - 20 * s
              : showStericHalos && moleculeId === 'methoxymethane'
                ? C1.x - 82 * s
                : C1.x - 62 * s
          }
          y={
            moleculeId === 'phenol'
              ? ringCentre.y - ringR - 20 * s
              : showStericHalos && moleculeId === 'methoxymethane'
                ? C1.y - 68 * s
                : C1.y - 46 * s
          }
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={19}
          fontWeight={600}
          fontFamily="var(--font-sans)"
          fill={rec.carbonHybridisation === 'sp²' ? 'var(--accent)' : 'var(--fg-muted)'}
        >
          {`${rec.carbonHybridisation} C`}
        </text>
      )}
    </g>
  )
}
