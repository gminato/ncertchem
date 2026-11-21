'use client'

import { Fragment, useId, useState, type ReactNode } from 'react'
import { Segmented } from '@/components/controls'
import { VocabDefs } from '@/components/vocab'
import { Sub, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  PHASE_LABELS,
  classifyBinarySolution,
  getHomogeneityNote,
  type PhysicalPhase,
} from '@/lib/chem/solution-types'
import styles from './solution-type-explorer.module.css'

const FONT = 'var(--font-sans)'

const PHASE_OPTIONS: readonly { value: PhysicalPhase; label: string }[] = [
  { value: 'gas', label: 'Gas' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'solid', label: 'Solid' },
]

const MATRIX_CAPTIONS: Record<PhysicalPhase, string> = {
  gas: 'Spaced, fast-moving gas',
  liquid: 'Close, flowing liquid',
  solid: 'Ordered crystal lattice',
}

const SUB_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
}

function renderChemSvg(text: string): ReactNode {
  const parts = text.split(/([₀-₉]+)/g)
  if (parts.length === 1) return text
  return parts.map((part, idx) =>
    /^[₀-₉]+$/.test(part) ? (
      <Sub key={idx}>
        {part
          .split('')
          .map((c) => SUB_MAP[c] ?? c)
          .join('')}
      </Sub>
    ) : (
      <Fragment key={idx}>{part}</Fragment>
    ),
  )
}

function renderChemHtml(text: string): ReactNode {
  const parts = text.split(/([₀-₉]+)/g)
  if (parts.length === 1) return text
  return parts.map((part, idx) =>
    /^[₀-₉]+$/.test(part) ? (
      <sub key={idx}>
        {part
          .split('')
          .map((c) => SUB_MAP[c] ?? c)
          .join('')}
      </sub>
    ) : (
      <Fragment key={idx}>{part}</Fragment>
    ),
  )
}

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

function Diatomic({
  cx,
  cy,
  angleDeg,
  r,
  fill,
  shadeUrl,
}: {
  cx: number
  cy: number
  angleDeg: number
  r: number
  fill: string
  shadeUrl: string
}) {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.cos(rad) * (r * 0.76)
  const dy = Math.sin(rad) * (r * 0.76)
  return (
    <g>
      <ShadedSphere cx={cx - dx} cy={cy - dy} r={r} fill={fill} shadeUrl={shadeUrl} />
      <ShadedSphere cx={cx + dx} cy={cy + dy} r={r} fill={fill} shadeUrl={shadeUrl} />
    </g>
  )
}

function HexUnit({
  cx,
  cy,
  r,
  angleDeg = 0,
  fill,
  shadeUrl,
}: {
  cx: number
  cy: number
  r: number
  angleDeg?: number
  fill: string
  shadeUrl: string
}) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = ((i * 60 - 30 + angleDeg) * Math.PI) / 180
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`
  }).join(' ')
  return (
    <g>
      <polygon points={pts} fill={fill} stroke="var(--atom-rim)" strokeWidth={0.95} />
      <circle cx={cx} cy={cy} r={r * 0.7} fill={shadeUrl} opacity={0.8} />
    </g>
  )
}

function ChloroformUnit({
  cx,
  cy,
  angleDeg = 0,
  shadeUrl,
}: {
  cx: number
  cy: number
  angleDeg?: number
  shadeUrl: string
}) {
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`}>
      <ShadedSphere cx={-5.8} cy={3.8} r={3.8} fill="var(--el-Cl)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={5.8} cy={3.8} r={3.8} fill="var(--el-Cl)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={0} cy={-5.8} r={3.8} fill="var(--el-Cl)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={0} cy={0.2} r={4.1} fill="var(--el-C)" shadeUrl={shadeUrl} />
    </g>
  )
}

function EthanolUnit({
  cx,
  cy,
  angleDeg = 0,
  shadeUrl,
}: {
  cx: number
  cy: number
  angleDeg?: number
  shadeUrl: string
}) {
  return (
    <g transform={`translate(${cx.toFixed(1)}, ${cy.toFixed(1)}) rotate(${angleDeg.toFixed(1)})`}>
      <ShadedSphere cx={-5.8} cy={1.2} r={4.5} fill="var(--el-C)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={0.6} cy={-2.2} r={4.5} fill="var(--el-C)" shadeUrl={shadeUrl} />
      <ShadedSphere cx={7.2} cy={1.2} r={4.5} fill="var(--spot-2)" shadeUrl={shadeUrl} />
    </g>
  )
}

function SolventLegendSwatch({
  id,
  cx,
  cy,
  shadeUrl,
}: {
  id: string
  cx: number
  cy: number
  shadeUrl: string
}) {
  if (id.endsWith('-gas')) {
    return <Diatomic cx={cx} cy={cy} angleDeg={-20} r={4.6} fill="var(--el-N)" shadeUrl={shadeUrl} />
  }
  if (id.endsWith('-liquid')) {
    return (
      <ShadedSphere
        cx={cx}
        cy={cy}
        r={7.4}
        fill="var(--liquid)"
        stroke="var(--liquid-edge)"
        strokeWidth={1.2}
        shadeUrl={shadeUrl}
      />
    )
  }
  const solidFill =
    id === 'gas-solid'
      ? 'var(--el-other)'
      : id === 'liquid-solid'
        ? 'var(--el-Na)'
        : 'var(--spot-4)'
  return <ShadedSphere cx={cx} cy={cy} r={8} fill={solidFill} shadeUrl={shadeUrl} strokeWidth={1.1} />
}

function SoluteLegendSwatch({
  id,
  cx,
  cy,
  shadeUrl,
}: {
  id: string
  cx: number
  cy: number
  shadeUrl: string
}) {
  switch (id) {
    case 'gas-gas':
    case 'gas-liquid':
      return <Diatomic cx={cx} cy={cy} angleDeg={25} r={4.6} fill="var(--el-O)" shadeUrl={shadeUrl} />
    case 'liquid-gas':
      return <ChloroformUnit cx={cx} cy={cy} shadeUrl={shadeUrl} />
    case 'solid-gas':
    case 'solid-liquid':
      return <HexUnit cx={cx} cy={cy} r={7.4} fill="var(--spot-3)" shadeUrl={shadeUrl} />
    case 'liquid-liquid':
      return <EthanolUnit cx={cx} cy={cy} shadeUrl={shadeUrl} />
    case 'gas-solid':
      return (
        <ShadedSphere
          cx={cx}
          cy={cy}
          r={5.6}
          fill="var(--el-H)"
          stroke="var(--accent)"
          strokeWidth={1.4}
          shadeUrl={shadeUrl}
        />
      )
    case 'liquid-solid':
      return <ShadedSphere cx={cx} cy={cy} r={7.4} fill="var(--spot-2)" shadeUrl={shadeUrl} />
    case 'solid-solid':
    default:
      return <ShadedSphere cx={cx} cy={cy} r={7.8} fill="var(--el-Cu)" shadeUrl={shadeUrl} />
  }
}

export function SolutionTypeExplorer({ reducedMotion }: SimulationProps) {
  const [solventPhase, setSolventPhase] = useState<PhysicalPhase>('liquid')
  const [solutePhase, setSolutePhase] = useState<PhysicalPhase>('solid')
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '')
  const shadeUrl = `url(#${uid}-sphere-shading)`
  const t = useAmbientTime(reducedMotion)

  const entry = classifyBinarySolution(solutePhase, solventPhase)
  const homogeneityNote = getHomogeneityNote(solutePhase, solventPhase)

  const summary = `${entry.category} solution: ${entry.example}. Solute is ${entry.soluteName} (${PHASE_LABELS[solutePhase]}), solvent is ${entry.solventName} (${PHASE_LABELS[solventPhase]}). ${entry.solventName} determines the final ${PHASE_LABELS[solventPhase].toLowerCase()} state.`

  // Chamber coordinates: x=14, y=48, w=364, h=272
  const cx0 = 14
  const cy0 = 48
  const cw = 364
  const ch = 272

  const gasSolventCoords = [
    [42, 34, 22], [116, 28, -18], [202, 38, 35], [290, 30, -28], [334, 62, 14],
    [66, 98, -32], [164, 92, 18], [254, 96, -16], [322, 126, 40],
    [46, 162, 26], [132, 158, -22], [224, 164, 30], [306, 186, -34], [176, 212, 12],
  ] as const

  const gasSoluteCoords = [
    [88, 62], [240, 62], [114, 126], [282, 134], [84, 198], [244, 202],
  ] as const

  const liquidSolventCoords = [
    [30, 58], [68, 54], [108, 60], [148, 55], [188, 59], [228, 54], [268, 60], [308, 56], [340, 60],
    [46, 92], [88, 90], [128, 94], [170, 89], [210, 93], [252, 90], [292, 94], [330, 90],
    [30, 126], [70, 124], [112, 128], [152, 122], [192, 127], [234, 123], [274, 128], [314, 124], [344, 128],
    [50, 160], [92, 158], [134, 162], [176, 156], [216, 161], [258, 157], [298, 162], [334, 158],
    [36, 194], [76, 192], [118, 196], [160, 191], [202, 195], [242, 192], [284, 196], [322, 192],
    [56, 224], [104, 222], [154, 226], [204, 222], [254, 224], [304, 222], [340, 224],
  ] as const

  const liquidSoluteCoords = [
    [78, 74], [198, 74], [308, 76],
    [138, 140], [260, 142],
    [70, 178], [188, 178], [306, 180],
  ] as const

  // 6 columns × 4 rows crystal lattice inside chamber
  const latticeX = [56, 108, 160, 212, 264, 316]
  const latticeY = [46, 96, 146, 196]
  const substitutedLatticeSites = new Set([2, 7, 10, 14, 19, 22])

  const solidSolventFill =
    entry.id === 'gas-solid'
      ? 'var(--el-other)'
      : entry.id === 'liquid-solid'
        ? 'var(--el-Na)'
        : 'var(--spot-4)'

  const waveOffset = Math.sin(t * 1.4) * 3.5

  return (
    <div className={styles.sim}>
      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Solvent phase</span>
          <Segmented
            label="Solvent phase (sets final state)"
            options={PHASE_OPTIONS}
            value={solventPhase}
            onChange={setSolventPhase}
          />
        </div>
        <div className={styles.controlGroup}>
          <span className={styles.controlLabel}>Solute phase</span>
          <Segmented
            label="Solute phase (dispersed component)"
            options={PHASE_OPTIONS}
            value={solutePhase}
            onChange={setSolutePhase}
          />
        </div>
      </div>

      <div className={styles.stage}>
        <svg
          viewBox="0 0 580 332"
          style={{ width: '100%', height: 'auto', display: 'block' }}
          role="img"
          aria-label={`Particle-level diagram of ${entry.category.toLowerCase()} solution: ${entry.example}`}
          data-testid="solution-type-explorer-svg"
          data-solution-id={entry.id}
        >
          <VocabDefs idPrefix={uid} />
          <defs>
            <clipPath id={`chamber-${uid}`}>
              <rect x={cx0} y={cy0} width={cw} height={ch} rx={12} />
            </clipPath>
          </defs>

          {/* Clean top title row (no outer box card) */}
          <text x={14} y={28} fontSize={15.5} fontWeight={700} fill="var(--fg)" fontFamily={FONT}>
            {entry.category} Solution: {renderChemSvg(entry.example)}
          </text>
          <rect x={442} y={10} width={124} height={26} rx={13} fill="var(--accent-soft)" />
          <text
            x={504}
            y={28}
            textAnchor="middle"
            fontSize={13.5}
            fontWeight={600}
            fill="var(--accent)"
            fontFamily={FONT}
          >
            State: {PHASE_LABELS[solventPhase]}
          </text>

          {/* Left cutaway chamber */}
          <rect
            x={cx0}
            y={cy0}
            width={cw}
            height={ch}
            rx={12}
            fill={solventPhase === 'solid' ? 'var(--surface)' : 'var(--glass-fill)'}
            stroke="var(--glass-wall)"
            strokeWidth={1.8}
          />

          <g clipPath={`url(#chamber-${uid})`}>
            {/* GAS SOLVENT */}
            {solventPhase === 'gas' && (
              <>
                <rect x={cx0} y={cy0} width={cw} height={ch} fill="var(--vapour)" fillOpacity={0.2} />
                {gasSolventCoords.map(([px, py, ang], idx) => {
                  const dx = Math.sin(t * 1.9 + idx * 1.3) * 8.5
                  const dy = Math.cos(t * 1.6 + idx * 1.7) * 7.5
                  const rot = ang + Math.sin(t * 1.4 + idx) * 20
                  return (
                    <Diatomic
                      key={`gs-${idx}`}
                      cx={cx0 + px + dx}
                      cy={cy0 + py + dy}
                      angleDeg={rot}
                      r={5.2}
                      fill="var(--el-N)"
                      shadeUrl={shadeUrl}
                    />
                  )
                })}
                {gasSoluteCoords.map(([px, py], idx) => {
                  const dx = Math.cos(t * 1.7 + idx * 2.1) * 8
                  const dy = Math.sin(t * 1.45 + idx * 1.5) * 7
                  const gx = cx0 + px + dx
                  const gy = cy0 + py + dy

                  if (entry.id === 'gas-gas') {
                    return (
                      <Diatomic
                        key={`gso2-${idx}`}
                        cx={gx}
                        cy={gy}
                        angleDeg={(idx % 2 === 0 ? -28 : 34) + t * 22}
                        r={5.4}
                        fill="var(--el-O)"
                        shadeUrl={shadeUrl}
                      />
                    )
                  }
                  if (entry.id === 'liquid-gas') {
                    return (
                      <ChloroformUnit
                        key={`gsch-${idx}`}
                        cx={gx}
                        cy={gy}
                        angleDeg={idx * 35 + Math.sin(t + idx) * 18}
                        shadeUrl={shadeUrl}
                      />
                    )
                  }
                  return (
                    <HexUnit
                      key={`gscam-${idx}`}
                      cx={gx}
                      cy={gy}
                      r={8}
                      angleDeg={idx * 24 + t * 14}
                      fill="var(--spot-3)"
                      shadeUrl={shadeUrl}
                    />
                  )
                })}
              </>
            )}

            {/* LIQUID SOLVENT */}
            {solventPhase === 'liquid' && (
              <>
                <path
                  d={`M ${cx0} ${cy0 + 34} Q ${cx0 + cw * 0.25} ${cy0 + 40 + waveOffset}, ${cx0 + cw * 0.5} ${cy0 + 34} T ${cx0 + cw} ${cy0 + 34} L ${cx0 + cw} ${cy0 + ch} L ${cx0} ${cy0 + ch} Z`}
                  fill="var(--liquid)"
                  fillOpacity={0.28}
                />
                <path
                  d={`M ${cx0} ${cy0 + 34} Q ${cx0 + cw * 0.25} ${cy0 + 40 + waveOffset}, ${cx0 + cw * 0.5} ${cy0 + 34} T ${cx0 + cw} ${cy0 + 34}`}
                  fill="none"
                  stroke="var(--liquid-edge)"
                  strokeWidth={2}
                />
                {liquidSolventCoords.map(([px, py], idx) => {
                  const dx = Math.sin(t * 1.15 + idx * 0.85) * 2.5
                  const dy = Math.cos(t * 0.95 + idx * 1.15) * 2
                  return (
                    <ShadedSphere
                      key={`ls-${idx}`}
                      cx={cx0 + px + dx}
                      cy={cy0 + py + dy}
                      r={6.4}
                      fill="var(--liquid)"
                      fillOpacity={0.85}
                      stroke="var(--liquid-edge)"
                      shadeUrl={shadeUrl}
                    />
                  )
                })}
                {liquidSoluteCoords.map(([px, py], idx) => {
                  const dx = Math.cos(t * 1.25 + idx * 1.4) * 3.4
                  const dy = Math.sin(t * 1.05 + idx * 1.6) * 2.8
                  const lx = cx0 + px + dx
                  const ly = cy0 + py + dy

                  if (entry.id === 'gas-liquid') {
                    return (
                      <Diatomic
                        key={`lso2-${idx}`}
                        cx={lx}
                        cy={ly}
                        angleDeg={idx * 40 + Math.sin(t + idx) * 14}
                        r={4.5}
                        fill="var(--el-O)"
                        shadeUrl={shadeUrl}
                      />
                    )
                  }
                  if (entry.id === 'liquid-liquid') {
                    return (
                      <EthanolUnit
                        key={`lset-${idx}`}
                        cx={lx}
                        cy={ly}
                        angleDeg={idx * 30 + Math.sin(t * 0.9 + idx) * 12}
                        shadeUrl={shadeUrl}
                      />
                    )
                  }
                  return (
                    <HexUnit
                      key={`lsglu-${idx}`}
                      cx={lx}
                      cy={ly}
                      r={7.8}
                      angleDeg={idx * 20 + Math.sin(t * 0.8 + idx) * 10}
                      fill="var(--spot-3)"
                      shadeUrl={shadeUrl}
                    />
                  )
                })}
              </>
            )}

            {/* SOLID SOLVENT */}
            {solventPhase === 'solid' && (
              <>
                {latticeY.map((ly, rIdx) => (
                  <line
                    key={`sr-${rIdx}`}
                    x1={cx0 + latticeX[0]}
                    y1={cy0 + ly}
                    x2={cx0 + latticeX[latticeX.length - 1]}
                    y2={cy0 + ly}
                    stroke="var(--border)"
                    strokeWidth={1.4}
                  />
                ))}
                {latticeX.map((lx, cIdx) => (
                  <line
                    key={`sc-${cIdx}`}
                    x1={cx0 + lx}
                    y1={cy0 + latticeY[0]}
                    x2={cx0 + lx}
                    y2={cy0 + latticeY[latticeY.length - 1]}
                    stroke="var(--border)"
                    strokeWidth={1.4}
                  />
                ))}
                {latticeY.map((ly, rIdx) =>
                  latticeX.map((lx, cIdx) => {
                    const flatIdx = rIdx * latticeX.length + cIdx
                    const isGuest =
                      (entry.id === 'solid-solid' || entry.id === 'liquid-solid') &&
                      substitutedLatticeSites.has(flatIdx)
                    const atomFill = isGuest
                      ? entry.id === 'solid-solid'
                        ? 'var(--el-Cu)'
                        : 'var(--spot-2)'
                      : solidSolventFill
                    const vibX = Math.sin(t * 8 + flatIdx * 2.1) * 0.8
                    const vibY = Math.cos(t * 7.2 + flatIdx * 1.7) * 0.8
                    return (
                      <ShadedSphere
                        key={`sl-${flatIdx}`}
                        cx={cx0 + lx + vibX}
                        cy={cy0 + ly + vibY}
                        r={isGuest && entry.id === 'liquid-solid' ? 9.8 : 11.2}
                        fill={atomFill}
                        shadeUrl={shadeUrl}
                        stroke={isGuest ? 'var(--fg)' : 'var(--atom-rim)'}
                        strokeWidth={isGuest ? 1.2 : 1}
                      />
                    )
                  }),
                )}

                {/* Interstitial H atoms for H2 in Pd */}
                {entry.id === 'gas-solid' &&
                  [0, 1, 2, 3, 4].flatMap((ci) =>
                    [0, 1, 2].map((ri) => {
                      if ((ci + ri) % 2 !== 0) return null
                      const ix = (latticeX[ci] + latticeX[ci + 1]) / 2
                      const iy = (latticeY[ri] + latticeY[ri + 1]) / 2
                      const vibX = Math.sin(t * 9.5 + ci * 2 + ri) * 1.1
                      const vibY = Math.cos(t * 8.8 + ri * 3 + ci) * 1.1
                      return (
                        <ShadedSphere
                          key={`ih-${ci}-${ri}`}
                          cx={cx0 + ix + vibX}
                          cy={cy0 + iy + vibY}
                          r={5.2}
                          fill="var(--el-H)"
                          shadeUrl={shadeUrl}
                          stroke="var(--accent)"
                          strokeWidth={1.4}
                        />
                      )
                    }),
                  )}
              </>
            )}

            {/* Glass wall specular sheen */}
            <line
              x1={cx0 + 10}
              y1={cy0 + 18}
              x2={cx0 + 10}
              y2={cy0 + ch - 48}
              stroke="var(--glass-sheen)"
              strokeWidth={2.5}
              strokeLinecap="round"
            />

            {/* Matrix caption pill inside vessel */}
            <rect
              x={cx0 + 12}
              y={cy0 + ch - 38}
              width={216}
              height={26}
              rx={8}
              fill="var(--surface)"
              fillOpacity={0.92}
              stroke="var(--border)"
              strokeWidth={1}
            />
            <text
              x={cx0 + 24}
              y={cy0 + ch - 20}
              fontSize={13.5}
              fontWeight={600}
              fill="var(--fg-muted)"
              fontFamily={FONT}
            >
              {MATRIX_CAPTIONS[solventPhase]}
            </text>
          </g>

          {/* Clean right legend & phase inspector (borderless — hairline separator only) */}
          <line
            x1={396}
            y1={56}
            x2={396}
            y2={312}
            stroke="var(--border)"
            strokeWidth={1}
            strokeOpacity={0.85}
          />

          <text x={414} y={76} fontSize={13.5} fontWeight={700} fill="var(--fg-muted)" fontFamily={FONT}>
            Solvent (host)
          </text>
          <SolventLegendSwatch id={entry.id} cx={426} cy={104} shadeUrl={shadeUrl} />
          <text x={446} y={102} fontSize={15} fontWeight={700} fill="var(--fg)" fontFamily={FONT}>
            {renderChemSvg(entry.solventName)}
          </text>
          <text x={446} y={122} fontSize={13.5} fontWeight={600} fill="var(--accent)" fontFamily={FONT}>
            {PHASE_LABELS[solventPhase]} phase
          </text>

          <line x1={414} y1={142} x2={560} y2={142} stroke="var(--border)" strokeWidth={1} />

          <text x={414} y={168} fontSize={13.5} fontWeight={700} fill="var(--fg-muted)" fontFamily={FONT}>
            Solute (guest)
          </text>
          <SoluteLegendSwatch id={entry.id} cx={426} cy={196} shadeUrl={shadeUrl} />
          <text x={446} y={194} fontSize={15} fontWeight={700} fill="var(--fg)" fontFamily={FONT}>
            {renderChemSvg(entry.soluteName)}
          </text>
          <text x={446} y={214} fontSize={13.5} fontWeight={600} fill="var(--spot-2)" fontFamily={FONT}>
            {PHASE_LABELS[solutePhase]} phase
          </text>

          <line x1={414} y1={234} x2={560} y2={234} stroke="var(--border)" strokeWidth={1} />

          <rect x={414} y={250} width={146} height={58} rx={10} fill="var(--success-soft)" />
          <text
            x={487}
            y={274}
            textAnchor="middle"
            fontSize={14}
            fontWeight={700}
            fill="var(--success)"
            fontFamily={FONT}
          >
            Homogeneous
          </text>
          <text
            x={487}
            y={295}
            textAnchor="middle"
            fontSize={13.5}
            fill="var(--success)"
            fontFamily={FONT}
          >
            1 uniform phase
          </text>
        </svg>
      </div>

      <div className={styles.readout}>
        <dl className={styles.metrics}>
          <div className={styles.metric}>
            <dt className={styles.metricLabel}>Solution category</dt>
            <dd className={styles.metricValue}>{entry.category} solution</dd>
          </div>
          <div className={styles.metric}>
            <dt className={styles.metricLabel}>Representative example</dt>
            <dd className={styles.metricValue}>{renderChemHtml(entry.example)}</dd>
          </div>
          <div className={styles.metric}>
            <dt className={styles.metricLabel}>Decides final physical state</dt>
            <dd className={styles.metricValue}>
              {renderChemHtml(entry.solventName)} ({PHASE_LABELS[solventPhase]} solvent)
            </dd>
          </div>
        </dl>

        <div className={styles.noteBlock}>
          <p className={styles.noteHeading}>Why it is homogeneous</p>
          <p className={styles.noteText}>{renderChemHtml(homogeneityNote)}</p>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
