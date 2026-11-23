'use client'

import { useState } from 'react'
import { Segmented } from '@/components/controls'
import { BenzeneRing, CurvedArrow, benzeneVertices, deltaText } from '@/components/organic'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  ANISOLE_EAS_REACTIONS,
  CLEAVAGE_SUBSTRATES,
  HX_REACTIVITY_ORDER,
  STOICHIOMETRY_OPTIONS,
  evaluateCleavage,
  getAnisoleEas,
  type AnisoleEasId,
  type AnisoleEasRecord,
  type CleavageOutcome,
  type CleavageSubstrateId,
  type Stoichiometry,
  type WorkbenchMode,
} from '@/lib/chem/c12-u7-s12-ether-lab'
import styles from './ether-reaction-workbench.module.css'

const W = 760
const H = 360

const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const RAISED = 'var(--surface-raised)'
const BORDER = 'var(--border)'
const ACCENT = 'var(--accent)'
const ACCENT_SOFT = 'var(--accent-soft)'
const BOND = 'var(--bond)'
const O_TONE = 'var(--atom-o)'
const I_TONE = 'var(--el-I)'
const SUCCESS = 'var(--success)'
const SUCCESS_SOFT = 'var(--success-soft)'
const CAUTION = 'var(--caution)'
const CAUTION_SOFT = 'var(--caution-soft)'
const ORB_POS = 'var(--orbital-pos)'
const ORB_NEG = 'var(--orbital-neg)'
const D_PLUS = 'var(--delta-plus)'
const D_MINUS = 'var(--delta-minus)'
const HIGHLIGHT = 'var(--highlight)'

const MODE_OPTIONS: readonly { value: WorkbenchMode; label: string }[] = [
  { value: 'cleavage', label: 'C-O Cleavage (HI)' },
  { value: 'eas', label: 'Anisole Ring EAS' },
]

function HorizontalBenzene({ cx, cy, r }: { cx: number; cy: number; r: number }) {
  const pts = [0, 1, 2, 3, 4, 5].map((k) => {
    const th = (k * 60 * Math.PI) / 180
    return { x: cx + r * Math.cos(th), y: cy + r * Math.sin(th) }
  })
  const innerLine = (i: number) => {
    const p = pts[i]
    const q = pts[(i + 1) % 6]
    const dx = q.x - p.x
    const dy = q.y - p.y
    const len = Math.hypot(dx, dy)
    let nx = -dy / len
    let ny = dx / len
    const mx = (p.x + q.x) / 2 - cx
    const my = (p.y + q.y) / 2 - cy
    if (nx * mx + ny * my > 0) {
      nx = -nx
      ny = -ny
    }
    const off = 6
    const s = 0.16
    return {
      x1: p.x + dx * s + nx * off,
      y1: p.y + dy * s + ny * off,
      x2: q.x - dx * s + nx * off,
      y2: q.y - dy * s + ny * off,
    }
  }
  return (
    <g>
      <polygon
        points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={FG}
        strokeWidth={2.4}
        strokeLinejoin="round"
      />
      {[0, 2, 4].map((i) => {
        const l = innerLine(i)
        return <line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={FG} strokeWidth={2} strokeLinecap="round" />
      })}
    </g>
  )
}

function CleavageStage({ outcome }: { outcome: CleavageOutcome }) {
  const { substrate, stoichiometry } = outcome
  const isSn1 = outcome.mechanismKind === 'SN1'
  const isAnisole = substrate.id === 'anisole'
  const isEthylMethyl = substrate.id === 'ethyl-methyl'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Cleavage pathway for ${substrate.name} with ${stoichiometry === '1eq' ? 'one equivalent of HI' : 'excess hot HI'}: ${outcome.mechanismBadge}, giving ${outcome.productsText}`}
      className={styles.scene}
      data-testid="cleavage-svg"
    >
      {/* Left panel: Oxonium intermediate & bond cleavage */}
      <rect x={12} y={12} width={452} height={336} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />
      <text x={28} y={36} dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
        Protonated oxonium intermediate
      </text>

      {isAnisole ? (
        <g>
          <HorizontalBenzene cx={84} cy={178} r={38} />
          <text x={84} y={178} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={ACCENT}>
            sp²
          </text>
          {/* Strong locked O-C6H5 bond */}
          <line x1={122} y1={178} x2={176} y2={178} stroke={FG} strokeWidth={2.8} strokeLinecap="round" />
          <line x1={128} y1={186} x2={170} y2={186} stroke={ACCENT} strokeWidth={2} strokeDasharray="4 4" />

          <text x={196} y={178} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fill={O_TONE}>
            O⁺
          </text>
          <line x1={196} y1={162} x2={196} y2={142} stroke={BOND} strokeWidth={2.2} />
          <text x={196} y={130} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fill={FG}>
            H
          </text>

          {/* Breaking O-CH3 bond */}
          <line x1={216} y1={178} x2={266} y2={178} stroke={BOND} strokeWidth={2.6} />
          <line x1={241} y1={154} x2={241} y2={202} stroke={D_PLUS} strokeWidth={2.2} strokeDasharray="4 4" />

          <rect x={270} y={158} width={58} height={40} rx={8} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.4} />
          <text x={299} y={178} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill={FG}>
            CH₃
          </text>

          <text x={426} y={178} textAnchor="middle" dominantBaseline="central" fontSize={21} fontWeight={700} fill={I_TONE}>
            I⁻
          </text>
          <CurvedArrow from={{ x: 408, y: 166 }} to={{ x: 332, y: 166 }} bend={0.34} />
          <CurvedArrow from={{ x: 238, y: 176 }} to={{ x: 204, y: 160 }} bend={0.55} />

          <rect x={40} y={70} width={246} height={30} rx={15} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.2} />
          <text x={163} y={85} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={FG}>
            O-C₆H₅ locked (partial C=O)
          </text>
          <text x={324} y={230} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={I_TONE}>
            I⁻ breaks O-CH₃ only
          </text>
        </g>
      ) : isSn1 ? (
        <g>
          {/* (CH3)3C - O+(H) - CH3 */}
          <rect x={42} y={108} width={96} height={40} rx={8} fill={CAUTION_SOFT} stroke={CAUTION} strokeWidth={1.4} />
          <text x={90} y={128} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill={FG}>
            (CH₃)₃C
          </text>

          <line x1={140} y1={128} x2={190} y2={128} stroke={BOND} strokeWidth={2.6} />
          <line x1={165} y1={104} x2={165} y2={152} stroke={D_PLUS} strokeWidth={2.2} strokeDasharray="4 4" />

          <text x={208} y={128} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fill={O_TONE}>
            O⁺
          </text>
          <line x1={208} y1={112} x2={208} y2={94} stroke={BOND} strokeWidth={2.2} />
          <text x={208} y={82} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={FG}>
            H
          </text>

          <line x1={226} y1={128} x2={264} y2={128} stroke={BOND} strokeWidth={2.6} />
          <text x={288} y={128} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill={FG}>
            CH₃
          </text>

          <CurvedArrow from={{ x: 162, y: 130 }} to={{ x: 198, y: 148 }} bend={0.55} />

          <text x={338} y={114} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={MUTED}>
            slow
          </text>
          <line x1={314} y1={128} x2={364} y2={128} stroke={FG} strokeWidth={2} />
          <polygon points="358,123 368,128 358,133" fill={FG} />

          {/* Planar carbocation badge */}
          <rect x={38} y={178} width={400} height={88} rx={10} fill={SURFACE} stroke={ACCENT} strokeWidth={1.3} />
          <ellipse cx={126} cy={222} rx={44} ry={13} fill={ACCENT_SOFT} stroke={BORDER} strokeDasharray="3 3" />
          <ellipse cx={126} cy={200} rx={8} ry={12} fill={ORB_POS} fillOpacity={0.22} stroke={ORB_POS} strokeWidth={1.4} strokeDasharray="3 3" />
          <ellipse cx={126} cy={244} rx={8} ry={12} fill={ORB_NEG} fillOpacity={0.22} stroke={ORB_NEG} strokeWidth={1.4} strokeDasharray="3 3" />
          <circle cx={126} cy={222} r={10} fill={SURFACE} stroke={FG} strokeWidth={1.3} />
          <text x={126} y={222} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={FG}>
            C⁺
          </text>
          <text x={294} y={208} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
            Planar (CH₃)₃C⁺ intermediate
          </text>
          <text x={294} y={234} textAnchor="middle" dominantBaseline="central" fontSize={15} fill={MUTED}>
            Fast I⁻ capture after CH₃OH departs
          </text>
        </g>
      ) : (
        <g>
          {/* SN2 for diethyl or ethyl-methyl */}
          <text x={60} y={156} textAnchor="middle" dominantBaseline="central" fontSize={21} fontWeight={700} fill={I_TONE}>
            I⁻
          </text>

          <rect x={122} y={136} width={78} height={40} rx={8} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.5} />
          <text x={161} y={156} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill={FG}>
            {isEthylMethyl ? 'CH₃' : 'C₂H₅'}
          </text>

          <line x1={202} y1={156} x2={252} y2={156} stroke={BOND} strokeWidth={2.6} />
          <line x1={227} y1={132} x2={227} y2={180} stroke={D_PLUS} strokeWidth={2.2} strokeDasharray="4 4" />

          <text x={270} y={156} textAnchor="middle" dominantBaseline="central" fontSize={20} fontWeight={700} fill={O_TONE}>
            O⁺
          </text>
          <line x1={270} y1={140} x2={270} y2={120} stroke={BOND} strokeWidth={2.2} />
          <text x={270} y={108} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fill={FG}>
            H
          </text>

          <line x1={288} y1={156} x2={324} y2={156} stroke={BOND} strokeWidth={2.6} />
          <rect
            x={328}
            y={136}
            width={104}
            height={40}
            rx={8}
            fill={isEthylMethyl ? CAUTION_SOFT : SUCCESS_SOFT}
            stroke={isEthylMethyl ? CAUTION : SUCCESS}
            strokeDasharray={isEthylMethyl ? '4 3' : undefined}
            strokeWidth={1.4}
          />
          <text x={380} y={156} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={600} fill={FG}>
            {substrate.rightGroup}
          </text>

          <CurvedArrow from={{ x: 78, y: 148 }} to={{ x: 122, y: 148 }} bend={-0.38} />
          <CurvedArrow from={{ x: 224, y: 158 }} to={{ x: 264, y: 176 }} bend={0.55} />

          <text x={161} y={208} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={ACCENT}>
            {isEthylMethyl ? 'Less hindered target' : 'SN2 target'}
          </text>
          <text x={380} y={208} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={MUTED}>
            {isEthylMethyl ? 'Crowded (leaves)' : 'Leaves as C₂H₅OH'}
          </text>
        </g>
      )}

      {/* Bottom status strip inside left panel */}
      <rect
        x={28}
        y={282}
        width={420}
        height={48}
        rx={10}
        fill={isAnisole && stoichiometry === 'excess' ? CAUTION_SOFT : outcome.excessConvertsAlcohol ? CAUTION_SOFT : SURFACE}
        stroke={isAnisole && stoichiometry === 'excess' ? CAUTION : outcome.excessConvertsAlcohol ? CAUTION : BORDER}
        strokeWidth={1.3}
      />
      <text x={238} y={306} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={FG}>
        {isAnisole
          ? stoichiometry === 'excess'
            ? 'Excess HI: Phenol still resists substitution (no C₆H₅I)'
            : 'Alkyl-oxygen bond cleaves; aryl C-O stays intact'
          : outcome.excessConvertsAlcohol
            ? 'Excess HI, high T: alcohol converts to second iodide + H₂O'
            : '1 eq HI: stops after one alkyl iodide + one alcohol'}
      </text>

      {/* Right panel: Mechanism & Products */}
      <rect x={476} y={12} width={272} height={336} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />

      <rect x={488} y={30} width={248} height={36} rx={18} fill={ACCENT_SOFT} stroke={ACCENT} strokeWidth={1.4} />
      <text x={612} y={48} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
        {`Pathway: ${outcome.mechanismBadge}`}
      </text>

      <text x={612} y={96} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={MUTED}>
        Products formed
      </text>

      {isAnisole && (
        <g>
          <HorizontalBenzene cx={534} cy={164} r={24} />
          <line x1={558} y1={164} x2={578} y2={164} stroke={BOND} strokeWidth={2.4} />
          <text x={596} y={164} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={700} fill={O_TONE}>
            OH
          </text>
          <text x={630} y={164} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill={MUTED}>
            +
          </text>
          <rect x={648} y={144} width={78} height={40} rx={10} fill={ACCENT_SOFT} stroke={I_TONE} strokeWidth={1.6} />
          <text x={687} y={164} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill={FG}>
            CH₃I
          </text>
        </g>
      )}

      {!isAnisole &&
        outcome.productTokens.map((tok, i) => {
          const y = 136 + i * 52
          const isIodide = tok.includes('I')
          return (
            <g key={tok}>
              <rect
                x={516}
                y={y - 18}
                width={192}
                height={38}
                rx={10}
                fill={isIodide ? ACCENT_SOFT : SUCCESS_SOFT}
                stroke={isIodide ? I_TONE : SUCCESS}
                strokeWidth={1.5}
              />
              <text x={612} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill={FG}>
                {tok}
              </text>
            </g>
          )
        })}

      <text x={612} y={314} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={MUTED}>
        {`HX reactivity: ${HX_REACTIVITY_ORDER}`}
      </text>
    </svg>
  )
}

function ProductMiniRing({
  cx,
  cy,
  r,
  group,
  position,
}: {
  cx: number
  cy: number
  r: number
  group: string
  position: 'ortho' | 'para'
}) {
  const verts = benzeneVertices(r).map((p) => ({ x: cx + p.x, y: cy + p.y }))
  const target = position === 'ortho' ? verts[1] : verts[3]
  const gx = position === 'ortho' ? target.x + 18 : target.x
  const gy = position === 'ortho' ? target.y - 10 : target.y + 18
  return (
    <g>
      <polygon
        points={verts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')}
        fill="none"
        stroke={FG}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={r * 0.56} fill="none" stroke={FG} strokeWidth={1.5} />
      <line x1={verts[0].x} y1={verts[0].y} x2={verts[0].x} y2={verts[0].y - 14} stroke={FG} strokeWidth={2} />
      <text x={verts[0].x} y={verts[0].y - 24} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={O_TONE}>
        OCH₃
      </text>
      <line x1={target.x} y1={target.y} x2={gx} y2={gy} stroke={FG} strokeWidth={2} />
      <text
        x={position === 'ortho' ? gx + 4 : gx}
        y={position === 'ortho' ? gy - 4 : gy + 11}
        textAnchor={position === 'ortho' ? 'start' : 'middle'}
        dominantBaseline="central"
        fontSize={15}
        fontWeight={700}
        fill={ACCENT}
      >
        {group}
      </text>
    </g>
  )
}

function splitProductName(name: string, yieldPercent: number | null): [string, string] {
  const clean = name.replace(/\s*\([^)]*\)/g, '').trim()
  if (yieldPercent !== null) {
    return [clean, `(${yieldPercent}% yield)`]
  }
  if (clean.length <= 15) return [clean, '']
  const dash = clean.indexOf('-', 2)
  if (dash > 0 && dash < clean.length - 3) {
    return [clean.slice(0, dash + 1), clean.slice(dash + 1)]
  }
  const mid = Math.ceil(clean.length / 2)
  return [clean.slice(0, mid), clean.slice(mid)]
}

function EasStage({ reaction }: { reaction: AnisoleEasRecord }) {
  const cx = 126
  const cy = 186
  const R = 56
  const verts = benzeneVertices(R).map((p) => ({ x: cx + p.x, y: cy + p.y }))
  const [majorL1, majorL2] = splitProductName(reaction.majorProduct, reaction.majorYieldPercent)
  const [minorL1, minorL2] = splitProductName(reaction.minorProduct, null)

  const reagentLines =
    reaction.id === 'bromination'
      ? ['Br₂ in', 'CH₃COOH']
      : reaction.id === 'nitration'
        ? ['Conc. H₂SO₄ +', 'conc. HNO₃']
        : [reaction.reagents]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Anisole ${reaction.reactionType}: reagents ${reaction.reagents}, catalyst ${reaction.catalystLabel}, major product ${reaction.majorProduct}, minor product ${reaction.minorProduct}`}
      className={styles.scene}
      data-testid="eas-svg"
    >
      {/* Left panel: Activated Anisole */}
      <rect x={12} y={12} width={236} height={336} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />
      <text x={130} y={36} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
        Activated anisole
      </text>

      <g transform={`translate(${cx} ${cy}) scale(${(R / 92).toFixed(3)})`}>
        <BenzeneRing variant="hexagon" />
      </g>
      <line x1={cx} y1={cy - R} x2={cx} y2={cy - R - 26} stroke={FG} strokeWidth={2.4} />
      <line x1={cx + 5} y1={cy - R - 4} x2={cx + 5} y2={cy - R - 22} stroke={ACCENT} strokeWidth={1.8} strokeDasharray="3 3" />
      <text x={cx} y={cy - R - 38} textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight={700} fill={O_TONE}>
        OCH₃
      </text>

      {[1, 3, 5].map((idx) => (
        <circle key={`act-${idx}`} cx={verts[idx].x} cy={verts[idx].y} r={12} fill={HIGHLIGHT} />
      ))}
      <text x={verts[1].x + 16} y={verts[1].y - 10} textAnchor="start" dominantBaseline="central" fontSize={15} fontWeight={700} fill={D_MINUS}>
        {deltaText('δ−')}
      </text>
      <text x={verts[3].x} y={verts[3].y + 20} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={D_MINUS}>
        {deltaText('δ−')}
      </text>
      <text x={verts[5].x - 16} y={verts[5].y - 10} textAnchor="end" dominantBaseline="central" fontSize={15} fontWeight={700} fill={D_MINUS}>
        {deltaText('δ−')}
      </text>

      <text x={130} y={316} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={MUTED}>
        ortho, para directing
      </text>

      {/* Center reagent & catalyst arrow box */}
      <rect x={258} y={64} width={202} height={232} rx={12} fill={RAISED} stroke={BORDER} strokeWidth={1.3} />
      {reagentLines.map((line, i) => (
        <text
          key={line}
          x={359}
          y={reagentLines.length === 1 ? 124 : 108 + i * 22}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={16}
          fontWeight={700}
          fill={FG}
        >
          {line}
        </text>
      ))}

      <line x1={278} y1={164} x2={434} y2={164} stroke={FG} strokeWidth={2.4} strokeLinecap="round" />
      <polygon points="428,158 440,164 428,170" fill={FG} />

      <rect
        x={270}
        y={184}
        width={178}
        height={40}
        rx={10}
        fill={reaction.noLewisAcidNeeded ? SUCCESS_SOFT : ACCENT_SOFT}
        stroke={reaction.noLewisAcidNeeded ? SUCCESS : ACCENT}
        strokeWidth={1.4}
      />
      <text x={359} y={204} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={FG}>
        {reaction.noLewisAcidNeeded
          ? 'No FeBr₃ needed'
          : reaction.id === 'nitration'
            ? 'H₂SO₄ + HNO₃'
            : reaction.catalystLabel}
      </text>

      <text x={359} y={258} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={MUTED}>
        {`E⁺: ${reaction.electrophile}`}
      </text>

      {/* Right panel: Para (major) & Ortho (minor) products */}
      <rect x={470} y={12} width={278} height={172} rx={12} fill={SURFACE} stroke={SUCCESS} strokeWidth={1.8} />
      <rect x={470} y={12} width={278} height={32} rx={12} fill={SUCCESS_SOFT} stroke="none" />
      <rect x={470} y={32} width={278} height={12} fill={SUCCESS_SOFT} stroke="none" />
      <text x={609} y={28} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={700} fill={FG}>
        {reaction.majorYieldPercent ? `Major · ${reaction.majorYieldPercent}% yield` : 'Major product (para)'}
      </text>
      <ProductMiniRing cx={524} cy={114} r={25} group={reaction.substituentGroup} position="para" />
      <text x={648} y={majorL2 ? 104 : 114} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={700} fill={FG}>
        {majorL1}
      </text>
      {majorL2 && (
        <text x={648} y={126} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={SUCCESS}>
          {majorL2}
        </text>
      )}

      <rect x={470} y={194} width={278} height={154} rx={12} fill={SURFACE} stroke={BORDER} strokeWidth={1.3} />
      <rect x={470} y={194} width={278} height={30} rx={12} fill={RAISED} stroke="none" />
      <rect x={470} y={212} width={278} height={12} fill={RAISED} stroke="none" />
      <text x={609} y={209} textAnchor="middle" dominantBaseline="central" fontSize={15} fontWeight={600} fill={MUTED}>
        Minor product (ortho)
      </text>
      <ProductMiniRing cx={524} cy={284} r={25} group={reaction.substituentGroup} position="ortho" />
      <text x={656} y={minorL2 ? 274 : 284} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={FG}>
        {minorL1}
      </text>
      {minorL2 && (
        <text x={656} y={296} textAnchor="middle" dominantBaseline="central" fontSize={16} fontWeight={600} fill={FG}>
          {minorL2}
        </text>
      )}
    </svg>
  )
}

export function EtherReactionWorkbench({ reducedMotion }: SimulationProps) {
  const [mode, setMode] = useState<WorkbenchMode>('cleavage')
  const [substrateId, setSubstrateId] = useState<CleavageSubstrateId>('ethyl-methyl')
  const [stoichiometry, setStoichiometry] = useState<Stoichiometry>('1eq')
  const [easId, setEasId] = useState<AnisoleEasId>('bromination')

  const cleavage = evaluateCleavage(substrateId, stoichiometry)
  const eas = getAnisoleEas(easId)

  const liveSummary =
    mode === 'cleavage'
      ? `${cleavage.substrate.name} with ${stoichiometry === '1eq' ? '1 eq conc. HI' : 'excess conc. HI at high T'}: mechanism ${cleavage.mechanismBadge}, breaks ${cleavage.bondBroken}, products ${cleavage.productsText}. ${cleavage.reason}`
      : `Anisole ${eas.reactionType}: reagents ${eas.reagents}, catalyst ${eas.catalystLabel}, major product ${eas.majorProduct}${eas.majorYieldPercent ? ` (${eas.majorYieldPercent}% yield)` : ''}, minor product ${eas.minorProduct}.`

  return (
    <div
      className={styles.sim}
      data-mode={mode}
      data-reduced={reducedMotion ? 'true' : 'false'}
    >
      {/* Top mode switcher & reagent stoichiometry */}
      <div className={styles.topBar}>
        <div className={styles.modeGroup}>
          <Segmented
            label="Reaction mode"
            options={MODE_OPTIONS}
            value={mode}
            onChange={setMode}
          />
        </div>

        {mode === 'cleavage' && (
          <div className={styles.modeGroup}>
            <Segmented
              label="Reagent stoichiometry"
              options={STOICHIOMETRY_OPTIONS}
              value={stoichiometry}
              onChange={setStoichiometry}
            />
          </div>
        )}
      </div>

      {/* Substrate / EAS reaction pills */}
      {mode === 'cleavage' ? (
        <div className={styles.controlBlock}>
          <span className={styles.controlLabel}>Ether substrate</span>
          <div className={styles.pillRow} role="group" aria-label="Ether substrate">
            {CLEAVAGE_SUBSTRATES.map((sub) => {
              const active = sub.id === substrateId
              return (
                <button
                  key={sub.id}
                  type="button"
                  aria-pressed={active}
                  className={`${styles.pillBtn} ${active ? styles.pillBtnActive : ''}`}
                  onClick={() => setSubstrateId(sub.id)}
                >
                  {sub.pillLabel}
                </button>
              )
            })}
          </div>
        </div>
      ) : (
        <div className={styles.controlBlock}>
          <span className={styles.controlLabel}>Anisole ring substitution reaction</span>
          <div className={styles.pillRow} role="group" aria-label="Anisole substitution reaction">
            {ANISOLE_EAS_REACTIONS.map((rxn) => {
              const active = rxn.id === easId
              return (
                <button
                  key={rxn.id}
                  type="button"
                  aria-pressed={active}
                  className={`${styles.pillBtn} ${active ? styles.pillBtnActive : ''}`}
                  onClick={() => setEasId(rxn.id)}
                >
                  {rxn.pillLabel}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Overall balanced / summary equation */}
      <p className={styles.equationBar} data-testid="workbench-equation">
        {mode === 'cleavage'
          ? cleavage.equation
          : `C₆H₅OCH₃ + ${eas.reagents} -> ${eas.majorProduct} (major) + ${eas.minorProduct} (minor)`}
      </p>

      {/* Main interactive SVG stage */}
      <div className={styles.stage}>
        {mode === 'cleavage' ? <CleavageStage outcome={cleavage} /> : <EasStage reaction={eas} />}
      </div>

      {/* Readouts */}
      {mode === 'cleavage' ? (
        <div className={styles.readouts}>
          <article className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Mechanism</span>
            <p className={styles.cardValue} data-testid="cleavage-mechanism">
              {cleavage.mechanismBadge}
            </p>
          </article>

          <article className={styles.card}>
            <span className={styles.cardLabel}>Bond broken</span>
            <p className={styles.cardValue} data-testid="cleavage-bond">
              {cleavage.bondBroken}
            </p>
          </article>

          <article className={`${styles.card} ${styles.cardSuccess}`}>
            <span className={styles.cardLabel}>Products</span>
            <p className={styles.cardValue} data-testid="cleavage-products">
              {cleavage.productsText}
            </p>
          </article>

          <article className={`${styles.card} ${styles.reasonCard}`}>
            <span className={styles.cardLabel}>Mechanistic reason</span>
            <p className={styles.cardBody} data-testid="cleavage-reason">
              {cleavage.reason}
            </p>
          </article>
        </div>
      ) : (
        <div className={styles.readouts}>
          <article className={styles.card}>
            <span className={styles.cardLabel}>Reagent & catalyst</span>
            <p className={styles.cardValue} data-testid="eas-reagent">
              {`${eas.reagents} · ${eas.catalystLabel}`}
            </p>
          </article>

          <article className={`${styles.card} ${styles.cardAccent}`}>
            <span className={styles.cardLabel}>Directing effect</span>
            <p className={styles.cardValue} data-testid="eas-directing">
              {eas.directingEffect}
            </p>
          </article>

          <article className={`${styles.card} ${styles.cardSuccess}`}>
            <span className={styles.cardLabel}>Major product</span>
            <p className={styles.cardValue} data-testid="eas-major">
              {eas.majorYieldPercent
                ? `${eas.majorProduct} (${eas.majorYieldPercent}% yield)`
                : eas.majorProduct}
            </p>
          </article>

          <article className={styles.card}>
            <span className={styles.cardLabel}>Minor product</span>
            <p className={styles.cardValue} data-testid="eas-minor">
              {eas.minorProduct}
            </p>
          </article>

          <article className={`${styles.card} ${styles.reasonCard}`}>
            <span className={styles.cardLabel}>Ring activation note</span>
            <p className={styles.cardBody} data-testid="eas-note">
              {eas.note}
            </p>
          </article>
        </div>
      )}

      {mode === 'cleavage' && cleavage.arylLockNote && (
        <div className={styles.noticeBanner} data-testid="aryl-lock-note">
          <strong>Aryl-oxygen stability:</strong> {cleavage.arylLockNote}
        </div>
      )}

      <p className={styles.srOnly} aria-live="polite" data-testid="workbench-live">
        {liveSummary}
      </p>
    </div>
  )
}
