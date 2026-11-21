'use client'

import type { ReactNode } from 'react'
import { Sup, useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import {
  BRIDGE_R1,
  BRIDGE_R3,
  BRIDGE_R4,
  CELL_CONSTANT,
  getConductivityStepState,
  KCL_KAPPA_REF,
  KCL_RESISTANCE_OHM,
  UNKNOWN_KAPPA_SCM,
  UNKNOWN_KAPPA_SM,
  UNKNOWN_LAMBDA_SCM2,
  UNKNOWN_CONCENTRATION,
  UNKNOWN_R,
  WIRE_R_BASE,
  WIRE_R_LONG,
  WIRE_R_THICK,
} from './conductivity-steps'
import { ConductivityCell, Galvanometer, GasBubbles, Ion, Wire, type Point } from '@/components/vocab/electrochem'

export interface ConductivityMeasurementProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 500
const CONTENT = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const CARD = 'var(--glass-fill)'
const RULE = 'var(--glass-wall)'

function Txt({
  x,
  y,
  size = 16,
  anchor = 'start',
  muted = false,
  weight,
  children,
}: {
  x: number
  y: number
  size?: number
  anchor?: 'start' | 'middle' | 'end'
  muted?: boolean
  weight?: number
  children: ReactNode
}) {
  return (
    <text x={x} y={y} fontSize={size} textAnchor={anchor} fill={muted ? MUTED : CONTENT} fontWeight={weight}>
      {children}
    </text>
  )
}

function Terminals({ x, y, height = 28 }: { x: number; y: number; height?: number }) {
  return <rect x={x - 3} y={y - height / 2} width={6} height={height} rx={2} fill={RULE} />
}

/** Step 1: three wires compared with their R values. */
function WireScene() {
  const rows: { y: number; l: number; sw: number; caption: string; r: number; a: string }[] = [
    { y: 110, l: 1.0, sw: 7, caption: 'Base wire', r: WIRE_R_BASE, a: 'A = 1.0 mm²' },
    { y: 235, l: 2.0, sw: 7, caption: 'Longer: l doubles', r: WIRE_R_LONG, a: 'A = 1.0 mm²' },
    { y: 360, l: 1.0, sw: 11, caption: 'Thicker: A doubles', r: WIRE_R_THICK, a: 'A = 2.0 mm²' },
  ]
  return (
    <g>
      {rows.map((row) => {
        const x0 = 50
        const x1 = x0 + row.l * 170
        return (
          <g key={row.caption}>
            <Txt x={50} y={row.y - 52} size={17} weight={600}>
              {row.caption}
            </Txt>
            <Wire corners={[{ x: x0, y: row.y }, { x: x1, y: row.y }]} strokeWidth={row.sw} />
            <Terminals x={x0 - 4} y={row.y} height={26} />
            <Terminals x={x1 + 4} y={row.y} height={26} />
            <Txt x={50} y={row.y + 36} size={15} muted>
              {`l = ${row.l.toFixed(1)} m · ${row.a}`}
            </Txt>
            <rect x={436} y={row.y - 34} width={124} height={68} rx={10} fill={CARD} stroke={RULE} strokeWidth={1.5} />
            <Txt x={498} y={row.y + 7} size={20} anchor="middle" weight={600}>
              {`R = ${row.r.toFixed(2)} Ω`}
            </Txt>
          </g>
        )
      })}
      <Txt x={290} y={480} size={16} anchor="middle" muted>
        ρ = 5.0 × 10
        <Sup>−7</Sup> Ω m for all three wires
      </Txt>
    </g>
  )
}

/** Step 2: the same geometry as a solution between two plates. */
function CellScene({ t }: { t: number }) {
  const ions: { x: number; y: number; kind: 'cation' | 'anion'; formula: string; charge: string; ph: number }[] = [
    { x: 215, y: 200, kind: 'cation', formula: 'K', charge: '+', ph: 0 },
    { x: 300, y: 250, kind: 'anion', formula: 'Cl', charge: '−', ph: 1.3 },
    { x: 370, y: 190, kind: 'cation', formula: 'K', charge: '+', ph: 2.1 },
    { x: 240, y: 275, kind: 'anion', formula: 'Cl', charge: '−', ph: 3.4 },
    { x: 335, y: 160, kind: 'anion', formula: 'Cl', charge: '−', ph: 4.2 },
    { x: 400, y: 265, kind: 'cation', formula: 'K', charge: '+', ph: 5.0 },
  ]
  return (
    <g>
      <ConductivityCell x={110} y={100} width={360} height={230} tint="clear" lengthLabel="l" areaLabel="A" dimensions />
      {ions.map((ion, i) => (
        <Ion
          key={i}
          x={ion.x + 12 * Math.sin(t * 0.9 + ion.ph)}
          y={ion.y + 8 * Math.cos(t * 0.7 + ion.ph)}
          kind={ion.kind}
          formula={ion.formula}
          charge={ion.charge}
          fontSize={16}
        />
      ))}
      <rect x={180} y={378} width={220} height={44} rx={10} fill={CARD} stroke={RULE} strokeWidth={1.5} />
      <Txt x={290} y={406} size={19} anchor="middle" weight={600}>
        G* = l / A
      </Txt>
      <Txt x={290} y={448} size={15} anchor="middle" muted>
        cell constant set by the plates, not by the liquid
      </Txt>
    </g>
  )
}

/** Step 3: DC versus AC, side by side. */
function AcScene({ t }: { t: number }) {
  const panels = [0, 290] as const
  return (
    <g>
      {panels.map((x0, p) => {
        const cellX = x0 + 35
        const leadL = cellX + 34.5
        const leadR = cellX + 165.5
        const boxX = leadL - 22
        const boxW = leadR - leadL + 44
        const isDc = p === 0
        return (
          <g key={p}>
            <Txt x={x0 + 135} y={36} size={17} anchor="middle" weight={600}>
              {isDc ? 'Direct current' : 'Alternating current'}
            </Txt>
            <rect x={boxX} y={56} width={boxW} height={52} rx={8} fill={CARD} stroke={RULE} strokeWidth={1.5} />
            {isDc ? (
              <Txt x={boxX + boxW / 2} y={88} size={16} anchor="middle">
                2.0 V DC
              </Txt>
            ) : (
              <g>
                <path
                  d={Array.from({ length: 33 }, (_, i) => {
                    const sx = boxX + boxW / 2 - 40 + i * (80 / 32)
                    const sy = 82 - 11 * Math.sin((i / 32) * Math.PI * 2)
                    return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`
                  }).join(' ')}
                  fill="none"
                  stroke={CONTENT}
                  strokeWidth={2}
                />
              </g>
            )}
            <Wire corners={[{ x: leadL, y: 108 }, { x: leadL, y: 126 }]} strokeWidth={3} />
            <Wire corners={[{ x: leadR, y: 108 }, { x: leadR, y: 126 }]} strokeWidth={3} />
            <ConductivityCell x={cellX} y={150} width={200} height={160} tint="clear" dimensions={false} />
            {isDc ? (
              <>
                <Ion x={cellX + 62 + 8 * Math.sin(t * 0.3)} y={215} kind="cation" formula="K" charge="+" fontSize={16} />
                <Ion x={cellX + 100} y={262} kind="cation" formula="K" charge="+" fontSize={16} />
                <Ion x={cellX + 150} y={210} kind="anion" formula="Cl" charge="−" fontSize={16} />
                <Ion x={cellX + 150} y={265} kind="anion" formula="Cl" charge="−" fontSize={16} />
                <GasBubbles x={leadL} y={296} width={36} height={100} count={5} t={t} formula="H₂" />
                <Txt x={x0 + 135} y={345} size={16} anchor="middle" weight={600}>
                  Composition changes
                </Txt>
              </>
            ) : (
              <>
                <Ion x={cellX + 100 + 8 * Math.sin(t * 2.2)} y={215 + 6 * Math.cos(t * 2.2)} kind="cation" formula="K" charge="+" fontSize={16} />
                <Ion x={cellX + 150 - 8 * Math.sin(t * 2.2)} y={240 - 6 * Math.cos(t * 2.2)} kind="anion" formula="Cl" charge="−" fontSize={16} />
                <Ion x={cellX + 100 - 8 * Math.sin(t * 2.2)} y={270 + 6 * Math.cos(t * 2.2)} kind="anion" formula="Cl" charge="−" fontSize={16} />
                <Ion x={cellX + 150 + 8 * Math.sin(t * 2.2)} y={265 - 6 * Math.cos(t * 2.2)} kind="cation" formula="K" charge="+" fontSize={16} />
                <Txt x={x0 + 135} y={345} size={16} anchor="middle" weight={600}>
                  Composition unchanged
                </Txt>
              </>
            )}
          </g>
        )
      })}
    </g>
  )
}

/** Step 4: the Wheatstone bridge as a diamond. Oscillator on the top-bottom diagonal, detector on the left-right one. */
function BridgeScene() {
  const top = { x: 290, y: 90 }
  const bottom = { x: 290, y: 370 }
  const left = { x: 160, y: 230 }
  const right = { x: 420, y: 230 }
  const armLabel = (p: Point, text: string, dx: number, dy: number) => (
    <Txt x={p.x + dx} y={p.y + dy} size={18} anchor="middle" weight={600}>
      {text}
    </Txt>
  )
  const mid = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const r2Mid = mid(left, bottom)
  const oscX = 60
  return (
    <g>
      {/* Oscillator branch: from the top vertex, around the outside, to the bottom vertex */}
      <Wire
        corners={[top, { x: top.x, y: 40 }, { x: oscX, y: 40 }, { x: oscX, y: 204 }]}
        strokeWidth={3}
      />
      <Wire corners={[{ x: oscX, y: 256 }, { x: oscX, y: 410 }, { x: bottom.x, y: 410 }, bottom]} strokeWidth={3} />
      <circle cx={oscX} cy={230} r={26} fill={CARD} stroke={RULE} strokeWidth={2} />
      <path
        d={Array.from({ length: 17 }, (_, i) => {
          const sx = oscX - 14 + i * (28 / 16)
          const sy = 230 - 7 * Math.sin((i / 16) * Math.PI * 2)
          return `${i === 0 ? 'M' : 'L'} ${sx.toFixed(1)} ${sy.toFixed(1)}`
        }).join(' ')}
        fill="none"
        stroke={CONTENT}
        strokeWidth={2}
      />
      <Txt x={175} y={440} size={15} anchor="middle" muted>
        AC oscillator
      </Txt>
      {/* The four arms of the diamond */}
      <Wire corners={[top, left]} strokeWidth={5} />
      <Wire corners={[left, bottom]} strokeWidth={5} />
      <Wire corners={[top, right]} strokeWidth={5} />
      <Wire corners={[right, bottom]} strokeWidth={5} />
      {armLabel(mid(top, left), 'R₁', -20, -10)}
      {armLabel(mid(top, right), 'R₃', 20, -10)}
      {armLabel(mid(right, bottom), 'R₄', 20, 22)}
      <ConductivityCell x={r2Mid.x - 32} y={r2Mid.y - 20} width={64} height={40} tint="clear" dimensions={false} />
      <Txt x={r2Mid.x - 42} y={r2Mid.y + 6} size={18} anchor="end" weight={600}>
        R₂
      </Txt>
      {/* Detector across the left-right diagonal */}
      <Wire corners={[left, { x: 230, y: 230 }]} strokeWidth={3} />
      <Wire corners={[{ x: 350, y: 230 }, right]} strokeWidth={3} />
      <Galvanometer x={290} y={218} width={110} height={78} value={0} range={[-1, 1]} unit="" scaleLabels={['−', '0', '+']} caption="Detector" />
      <Txt x={290} y={480} size={17} anchor="middle">
        {`R₂ = R₁R₄ / R₃ = ${BRIDGE_R1} × ${BRIDGE_R4} / ${BRIDGE_R3} = ${UNKNOWN_R} Ω`}
      </Txt>
    </g>
  )
}

/** Step 5: calibration with KCl, then the unknown cell, then κ and Λm. */
function ChainScene() {
  return (
    <g>
      <Txt x={140} y={90} size={17} anchor="middle" weight={600}>
        KCl calibration
      </Txt>
      <Txt x={440} y={90} size={17} anchor="middle" weight={600}>
        Unknown
      </Txt>
      <ConductivityCell x={40} y={106} width={200} height={150} tint="clear" dimensions={false} />
      <ConductivityCell x={340} y={106} width={200} height={150} tint="clear" dimensions={false} />
      <Wire corners={[{ x: 252, y: 181 }, { x: 328, y: 181 }]} strokeWidth={3} />
      <Txt x={290} y={170} size={15} anchor="middle" muted>
        κ = G*/R
      </Txt>
      <Txt x={140} y={290} size={16} anchor="middle">
        {`κ = ${KCL_KAPPA_REF} S m⁻¹`}
      </Txt>
      <Txt x={140} y={312} size={16} anchor="middle">
        {`R = ${KCL_RESISTANCE_OHM} Ω`}
      </Txt>
      <Txt x={140} y={334} size={16} anchor="middle">
        {`G* = ${CELL_CONSTANT} m⁻¹ = ${(CELL_CONSTANT / 100).toFixed(2)} cm⁻¹`}
      </Txt>
      <Txt x={440} y={290} size={16} anchor="middle">
        {`R = ${UNKNOWN_R} Ω`}
      </Txt>
      <rect x={40} y={398} width={500} height={90} rx={12} fill={CARD} stroke={RULE} strokeWidth={1.5} />
      <Txt x={290} y={426} size={16} anchor="middle">
        {`κ = ${CELL_CONSTANT} m⁻¹ ÷ ${UNKNOWN_R} Ω = ${UNKNOWN_KAPPA_SM} S m⁻¹`}
      </Txt>
      <Txt x={290} y={450} size={16} anchor="middle">
        {`= ${UNKNOWN_KAPPA_SCM.toExponential(3).replace('e-4', ' × 10⁻⁴')} S cm⁻¹`}
      </Txt>
      <Txt x={290} y={474} size={17} anchor="middle" weight={600}>
        {`Λm = ${UNKNOWN_LAMBDA_SCM2.toFixed(1)} S cm² mol⁻¹ at ${UNKNOWN_CONCENTRATION.toFixed(4)} mol L⁻¹`}
      </Txt>
    </g>
  )
}

export function ConductivityMeasurement({ step, reducedMotion }: ConductivityMeasurementProps) {
  const state = getConductivityStepState(step)
  const t = useAmbientTime(reducedMotion)
  let scene: ReactNode
  switch (state.scene) {
    case 'wire':
      scene = <WireScene />
      break
    case 'cell':
      scene = <CellScene t={t} />
      break
    case 'ac':
      scene = <AcScene t={t} />
      break
    case 'bridge':
      scene = <BridgeScene />
      break
    case 'chain':
      scene = <ChainScene />
      break
  }
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      role="img"
      aria-label={state.ariaLabel}
      data-scene={state.scene}
      style={{ display: 'block' }}
    >
      {scene}
    </svg>
  )
}
