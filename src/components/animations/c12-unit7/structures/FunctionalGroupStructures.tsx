'use client'

import { CurvedArrow } from '@/components/organic'
import { TETRAHEDRAL_ANGLE } from '@/lib/chem/ncert-c12-unit7-data'
import { formatBondAngle, geometryRecord } from '@/lib/chem/c12-u7-s3-geometry'
import { FunctionalGroupMolecule } from './FunctionalGroupMolecule'
import {
  getFunctionalGroupStepState,
  type FunctionalGroupStepState,
} from './functional-group-steps'

export interface FunctionalGroupStructuresProps {
  /** 0-based Step index passed by Scrolly. */
  step: number
  /** True when the user requests reduced motion. */
  reducedMotion: boolean
}

const W = 560
const H = 472
const FONT = 'var(--font-sans)'
const MONO = 'var(--font-mono)'

function PhenolConjugationZoom({ reducedMotion }: { reducedMotion: boolean }) {
  const c1 = { x: 136, y: 206 }
  const c2 = { x: 80, y: 162 }
  const c6 = { x: 80, y: 250 }
  const ox = { x: 244, y: 206 }
  const hy = { x: 298, y: 244 }

  return (
    <g>
      {/* Left diagram: pi-overlap & partial double bond */}
      <rect
        x={16}
        y={72}
        width={308}
        height={268}
        rx={12}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <text x={32} y={96} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        1. Lone pair conjugates into ring
      </text>

      {/* Partial ring vertices */}
      <polyline
        points={`48,176 ${c2.x},${c2.y} ${c1.x},${c1.y} ${c6.x},${c6.y} 48,236`}
        fill="none"
        stroke="var(--fg)"
        strokeWidth={2.6}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <text x={52} y={208} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        ring
      </text>

      {/* Carbon 2p orbital lobes (vertical) */}
      <ellipse
        cx={c1.x}
        cy={c1.y - 36}
        rx={13}
        ry={26}
        fill="var(--pi-lobe)"
        fillOpacity={0.22}
        stroke="var(--pi-lobe)"
        strokeWidth={1.8}
      />
      <ellipse
        cx={c1.x}
        cy={c1.y + 36}
        rx={13}
        ry={26}
        fill="var(--pi-lobe)"
        fillOpacity={0.14}
        stroke="var(--pi-lobe)"
        strokeWidth={1.8}
      />

      {/* Oxygen lone-pair p orbital tilted into conjugation */}
      <ellipse
        cx={ox.x}
        cy={ox.y - 36}
        rx={13}
        ry={26}
        fill="var(--lone-pair)"
        fillOpacity={0.26}
        stroke="var(--lone-pair-edge)"
        strokeWidth={1.8}
      />
      <ellipse
        cx={ox.x}
        cy={ox.y + 36}
        rx={13}
        ry={26}
        fill="var(--lone-pair)"
        fillOpacity={0.14}
        stroke="var(--lone-pair-edge)"
        strokeWidth={1.8}
      />
      <circle cx={ox.x - 4} cy={ox.y - 40} r={2.8} fill="var(--lone-pair-edge)" />
      <circle cx={ox.x + 4} cy={ox.y - 40} r={2.8} fill="var(--lone-pair-edge)" />

      {/* Sideways pi-overlap bridges */}
      <line
        x1={c1.x + 12}
        y1={c1.y - 48}
        x2={ox.x - 12}
        y2={ox.y - 48}
        stroke="var(--pi-lobe)"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <line
        x1={c1.x + 12}
        y1={c1.y + 48}
        x2={ox.x - 12}
        y2={ox.y + 48}
        stroke="var(--pi-lobe)"
        strokeWidth={2}
        strokeDasharray="4 4"
      />

      {/* Curved electron-pushing arrow */}
      <CurvedArrow
        from={{ x: ox.x - 10, y: ox.y - 44 }}
        to={{ x: (c1.x + ox.x) / 2, y: c1.y - 12 }}
        bend={-0.38}
        kind="pair"
        headSize={11}
        strokeWidth={2.2}
      />

      {/* C-O sigma + dashed partial double bond */}
      <line x1={c1.x + 12} y1={c1.y - 4} x2={ox.x - 16} y2={ox.y - 4} stroke="var(--fg)" strokeWidth={3} strokeLinecap="round" />
      <line
        x1={c1.x + 14}
        y1={c1.y + 5}
        x2={ox.x - 18}
        y2={ox.y + 5}
        stroke="var(--e-arrow)"
        strokeWidth={2.6}
        strokeDasharray="6 4"
      />

      {/* O-H stem */}
      <line x1={ox.x + 14} y1={ox.y + 10} x2={hy.x - 12} y2={hy.y - 8} stroke="var(--fg)" strokeWidth={2.8} strokeLinecap="round" />
      <circle cx={c1.x} cy={c1.y} r={12} fill="var(--surface)" />
      <text x={c1.x} y={c1.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        C
      </text>
      <circle cx={ox.x} cy={ox.y} r={12} fill="var(--surface)" />
      <text x={ox.x} y={ox.y + 1} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fontFamily={FONT} fill="var(--atom-o)">
        O
      </text>
      <text x={hy.x} y={hy.y} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fontFamily={FONT} fill="var(--fg)">
        H
      </text>

      <text x={170} y={306} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--accent)">
        Partial C=O character
      </text>
      <text x={170} y={328} textAnchor="middle" fontSize={16} fontFamily={MONO} fill="var(--fg-muted)">
        C–O tightens to 136 pm
      </text>

      {/* Right panel: sp2 vs sp3 orbital reach */}
      <rect
        x={336}
        y={72}
        width={208}
        height={268}
        rx={12}
        fill="var(--surface)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <text x={352} y={96} fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        2. sp² vs sp³ carbon
      </text>

      {/* sp2 row */}
      <text x={352} y={132} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--accent)">
        sp² (33.3% s)
      </text>
      <path
        d="M 362 162 C 384 146, 422 142, 444 162 C 422 182, 384 178, 362 162 Z"
        fill="var(--pi-lobe)"
        fillOpacity={0.28}
        stroke="var(--pi-lobe)"
        strokeWidth={2}
      />
      <circle cx={362} cy={162} r={7} fill="var(--fg)" />
      <text x={456} y={162} dominantBaseline="central" fontSize={16} fontWeight={700} fontFamily={MONO} fill="var(--accent)">
        136 pm
      </text>

      {/* sp3 row */}
      <text x={352} y={214} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        sp³ (25% s)
      </text>
      <path
        d="M 362 244 C 392 224, 442 220, 466 244 C 442 268, 392 264, 362 244 Z"
        fill="var(--orbital-pos)"
        fillOpacity={0.24}
        stroke="var(--orbital-pos)"
        strokeWidth={2}
      />
      <circle cx={362} cy={244} r={7} fill="var(--fg)" />
      <text x={474} y={244} dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily={MONO} fill="var(--fg-muted)">
        142 pm
      </text>

      <text x={440} y={304} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg)">
        Higher s-character pulls
      </text>
      <text x={440} y={326} textAnchor="middle" fontSize={16} fontWeight={500} fontFamily={FONT} fill="var(--fg)">
        C closer to O
      </text>
      {/* Keep reducedMotion referenced cleanly without unused lint warning */}
      <title>{reducedMotion ? 'Phenol C–O conjugation and sp² orbital diagram' : 'Phenol C–O conjugation and sp² orbital diagram'}</title>
    </g>
  )
}

function LowerGauges({ state, reducedMotion }: { state: FunctionalGroupStepState; reducedMotion: boolean }) {
  const coPm = state.readout.record.coBondLengthPm
  const angleDeg = state.readout.record.bondAngleDeg
  const methanolPm = geometryRecord('methanol').coBondLengthPm

  // Left gauge: C-O bond length 130 - 150 pm
  const lenMin = 130
  const lenMax = 150
  const lenX0 = 42
  const lenSpan = 204
  const mapLenX = (pm: number) => lenX0 + ((pm - lenMin) / (lenMax - lenMin)) * lenSpan
  const activeLenX = mapLenX(coPm)
  const ghostLenX = mapLenX(methanolPm)

  // Right gauge: bond angle 105° - 115°
  const angMin = 105
  const angMax = 115
  const angX0 = 314
  const angSpan = 204
  const mapAngX = (deg: number) => angX0 + ((deg - angMin) / (angMax - angMin)) * angSpan
  const activeAngX = mapAngX(angleDeg)
  const refAngX = mapAngX(TETRAHEDRAL_ANGLE.deg)

  const trackY = 416
  const transitionStyle = reducedMotion ? undefined : { transition: 'all 0.35s var(--ease-out)' }

  return (
    <g>
      <rect
        x={16}
        y={352}
        width={528}
        height={108}
        rx={12}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <line x1={280} y1={364} x2={280} y2={448} stroke="var(--border)" strokeWidth={1.2} />

      {/* Left: C-O bond length gauge */}
      <text x={36} y={376} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        C–O length
      </text>
      <text x={256} y={376} textAnchor="end" fontSize={16} fontWeight={700} fontFamily={MONO} fill="var(--accent)">
        {`${coPm} pm`}
      </text>

      <line x1={lenX0} y1={trackY} x2={lenX0 + lenSpan} y2={trackY} stroke="var(--border)" strokeWidth={6} strokeLinecap="round" />
      <line
        x1={lenX0}
        y1={trackY}
        x2={activeLenX}
        y2={trackY}
        stroke="var(--accent)"
        strokeWidth={6}
        strokeLinecap="round"
        style={transitionStyle}
      />
      {state.showMethanolGhost && (
        <line
          x1={ghostLenX}
          y1={trackY - 12}
          x2={ghostLenX}
          y2={trackY + 12}
          stroke="var(--fg-muted)"
          strokeWidth={2}
          strokeDasharray="3 3"
        />
      )}
      <circle cx={activeLenX} cy={trackY} r={7.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} style={transitionStyle} />

      {[130, 140, 150].map((v) => {
        const tx = mapLenX(v)
        return (
          <g key={`lt-${v}`}>
            <line x1={tx} y1={trackY + 8} x2={tx} y2={trackY + 13} stroke="var(--fg-subtle)" strokeWidth={1.4} />
            <text x={tx} y={446} textAnchor="middle" fontSize={16} fontFamily={MONO} fill="var(--fg-muted)">
              {v}
            </text>
          </g>
        )
      })}

      {/* Right: Bond angle gauge */}
      <text x={300} y={376} fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
        {state.readout.record.bondAngleLabel}
      </text>
      <text x={524} y={376} textAnchor="end" fontSize={16} fontWeight={700} fontFamily={MONO} fill="var(--accent)">
        {formatBondAngle(angleDeg)}
      </text>

      <line x1={angX0} y1={trackY} x2={angX0 + angSpan} y2={trackY} stroke="var(--border)" strokeWidth={6} strokeLinecap="round" />
      {/* 109°28′ dashed tetrahedral reference line */}
      <line
        x1={refAngX}
        y1={trackY - 14}
        x2={refAngX}
        y2={trackY + 14}
        stroke="var(--fg-muted)"
        strokeWidth={2}
        strokeDasharray="4 3"
      />
      <circle cx={activeAngX} cy={trackY} r={7.5} fill="var(--accent)" stroke="var(--surface)" strokeWidth={2} style={transitionStyle} />

      {[
        { x: mapAngX(105), label: '105°' },
        { x: refAngX, label: TETRAHEDRAL_ANGLE.printed },
        { x: mapAngX(115), label: '115°' },
      ].map((t) => (
        <g key={`at-${t.label}`}>
          <line x1={t.x} y1={trackY + 8} x2={t.x} y2={trackY + 13} stroke="var(--fg-subtle)" strokeWidth={1.4} />
          <text x={t.x} y={446} textAnchor="middle" fontSize={16} fontFamily={MONO} fill="var(--fg-muted)">
            {t.label}
          </text>
        </g>
      ))}
    </g>
  )
}

/**
 * Section 7.3 Scrolly visual (`functional-group-structures`):
 * Two-part SVG stage showing methanol, phenol, and methoxymethane geometries
 * scaled in pm, plus live C–O length and bond-angle gauges.
 */
export function FunctionalGroupStructures({ step, reducedMotion }: FunctionalGroupStructuresProps) {
  const state = getFunctionalGroupStepState(step)
  const label = `${state.headline}. ${state.callout}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={label}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      {/* Top headline card */}
      <rect
        x={16}
        y={10}
        width={528}
        height={54}
        rx={10}
        fill="var(--surface-raised)"
        stroke="var(--border)"
        strokeWidth={1.2}
      />
      <text x={W / 2} y={29} textAnchor="middle" fontSize={16} fontWeight={700} fontFamily={FONT} fill="var(--fg)">
        {state.headline}
      </text>
      <text x={W / 2} y={51} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--accent)">
        {state.callout}
      </text>

      {/* Upper stage */}
      {state.scene === 'phenol-zoom' ? (
        <PhenolConjugationZoom reducedMotion={reducedMotion} />
      ) : (
        <g>
          <FunctionalGroupMolecule
            moleculeId={state.moleculeId}
            ox={296}
            oy={148}
            unitsPerPm={0.88}
            showLonePairs={state.showLonePairs}
            showTetrahedralRef={state.showTetrahedralRef}
            showOrbitalOverlap={state.showOrbitalOverlap}
            showConjugation={state.showConjugation}
            showStericHalos={state.showStericHalos}
            showMethanolGhost={state.showMethanolGhost}
            highlightCarbons={state.highlightRingCarbon || state.highlightMethylCarbons}
            showHybridTags
            showBondLengthCallouts
            showAngleCallout
            reducedMotion={reducedMotion}
          />
          {state.step === 0 && (
            <text
              x={245}
              y={202}
              textAnchor="middle"
              fontSize={17}
              fontWeight={700}
              fontFamily={FONT}
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth={4}
              paintOrder="stroke"
            >
              σ
            </text>
          )}
          {(state.step === 1 || state.step === 3) && (
            <g>
              <circle cx={38} cy={104} r={4} fill="none" stroke="var(--fg-muted)" strokeWidth={1.6} />
              <text x={50} y={104} dominantBaseline="central" fontSize={16} fontWeight={600} fontFamily={FONT} fill="var(--fg-muted)">
                CH₃OH ref: 142 pm
              </text>
            </g>
          )}
        </g>
      )}

      {/* Lower two-gauge strip */}
      <LowerGauges state={state} reducedMotion={reducedMotion} />
    </svg>
  )
}
