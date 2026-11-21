'use client'

import type { ReactNode } from 'react'
import {
  Beaker,
  Electrode,
  HydrogenElectrode,
  Ion,
  SaltBridge,
  Voltmeter,
  VocabDefs,
  Wire,
  type Point,
} from '@/components/vocab'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import {
  LADDER_IDS,
  getSheStep,
  signedVolts,
  standardRow,
  type HalfSpec,
  type SheScene,
} from './she-steps'
import styles from './SheMeasurement.module.css'

export interface SheMeasurementProps {
  step: number
  reducedMotion: boolean
}

const VIEW_W = 580
const VIEW_H = 440
const BEAKER_Y = 198
const BEAKER_H = 152
const BEAKER_W = 200
const LEFT_X = 24
const RIGHT_X = 320
const ELECTRODE_TOP = 128
const ELECTRODE_LEN = 172
const METER_X = 290
const METER_Y = 34
const METER_W = 120
const METER_H = 70
/** Voltmeter plusSide="right": + is the right terminal (cathode side), − the left (anode side). */
const PLUS_X = METER_X + 34
const MINUS_X = METER_X - 34
const METER_TERM_Y = METER_Y + METER_H / 2 + 22
/** Bus height for both leads: below the meter body, above the electrode tops, so the leads never cross. */
const BUS_Y = 116

function fmtE(e: number): string {
  const body = Math.abs(e).toFixed(2)
  return e < 0 ? `−${body}` : `+${body}`
}

function PairHalf({ spec, x, role, t }: { spec: HalfSpec; x: number; role: 'anode' | 'cathode'; t: number }) {
  const cx = x + BEAKER_W / 2
  if (spec.material === 'pt') {
    return (
      <g data-half={spec.couple}>
        <HydrogenElectrode
          x={x}
          y={BEAKER_Y}
          width={BEAKER_W}
          height={BEAKER_H}
          t={t}
          label={spec.solution}
          gasLabel="H₂ (1 bar)"
        />
        {/* The SHE has no Electrode badge, so name its role here: the anode's label sits above the
            rim on the outer (left) side; the cathode's sits inside the beaker on the outer side,
            clear of the H₂ inlet that leaves to the right. */}
        <text
          x={role === 'anode' ? x + 8 : x + BEAKER_W - 12}
          y={role === 'anode' ? BEAKER_Y - 12 : BEAKER_Y + 30}
          textAnchor={role === 'anode' ? 'start' : 'end'}
          fontSize={14}
          fontWeight={600}
          fill={role === 'anode' ? 'var(--ox)' : 'var(--red)'}
        >
          {role === 'anode' ? 'Anode (−)' : 'Cathode (+)'}
        </text>
      </g>
    )
  }
  return (
    <g data-half={spec.couple}>
      <Beaker x={x} y={BEAKER_Y} width={BEAKER_W} height={BEAKER_H} level={0.74} tint={spec.tint} label={spec.solution} />
      <Electrode
        x={cx}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LEN}
        width={16}
        material={spec.material}
        polarity={role === 'anode' ? '−' : '+'}
        role={role}
      />
      <Ion x={x + 52} y={250} kind="cation" formula={spec.ion} charge={spec.charge} fontSize={16} />
      <Ion x={x + 148} y={290} kind="cation" formula={spec.ion} charge={spec.charge} fontSize={16} />
      <Ion x={x + 70} y={326} kind="cation" formula={spec.ion} charge={spec.charge} fontSize={16} />
    </g>
  )
}

function Pair({ scene, meter, t }: { scene: Extract<SheScene, { kind: 'pair' }>; meter: number; t: number }) {
  const { anode, cathode } = scene.pair
  const anodeX = LEFT_X + BEAKER_W / 2
  const cathodeX = RIGHT_X + BEAKER_W / 2
  const minus = { x: MINUS_X, y: METER_TERM_Y }
  const plus = { x: PLUS_X, y: METER_TERM_Y }
  const anodeLead: Point[] = [
    { x: anodeX, y: ELECTRODE_TOP },
    { x: anodeX, y: BUS_Y },
    { x: minus.x, y: BUS_Y },
    { x: minus.x, y: minus.y },
  ]
  const cathodeLead: Point[] = [
    { x: plus.x, y: plus.y },
    { x: plus.x, y: BUS_Y },
    { x: cathodeX, y: BUS_Y },
    { x: cathodeX, y: ELECTRODE_TOP },
  ]
  return (
    <>
      <PairHalf spec={anode} x={LEFT_X} role="anode" t={t} />
      <PairHalf spec={cathode} x={RIGHT_X} role="cathode" t={t} />
      <Wire corners={anodeLead} t={t} electrons direction="forward" strokeWidth={3} />
      <Wire corners={cathodeLead} t={t} electrons direction="forward" strokeWidth={3} />
      <Voltmeter
        x={METER_X}
        y={METER_Y}
        width={METER_W}
        height={METER_H}
        value={meter}
        range={[0, 3]}
        unit="V"
        digital
        decimals={2}
        terminals
        plusSide="right"
      />
      <SaltBridge start={{ x: LEFT_X + BEAKER_W - 4, y: 290 }} finish={{ x: RIGHT_X + 4, y: 290 }} apex={230} t={t} ions legend="KCl gel" />
    </>
  )
}

function Ladder({ highlight }: { highlight: readonly string[] }) {
  const rows = LADDER_IDS.map((id) => standardRow(id))
  const top = 84
  const gap = 36
  const first = top
  const last = top + (rows.length - 1) * gap
  return (
    <g>
      <line x1={270} y1={first - 14} x2={270} y2={last + 14} className={styles.rail} />
      <line x1={310} y1={first - 14} x2={310} y2={last + 14} className={styles.rail} />
      <text x={290} y={first - 24} textAnchor="middle" fontSize={14} className={styles.note}>
        stronger oxidising agents
      </text>
      <text x={290} y={last + 36} textAnchor="middle" fontSize={14} className={styles.note}>
        stronger reducing agents
      </text>
      {rows.map((row, i) => {
        const y = top + i * gap
        const on = highlight.includes(row.id)
        return (
          <g key={row.id} data-rung={row.id} data-on={on ? 'true' : 'false'}>
            {on ? <rect x={112} y={y - 13} width={356} height={26} rx={6} className={styles.hit} /> : null}
            <line x1={270} y1={y} x2={310} y2={y} className={styles.rung} />
            <text x={256} y={y + 5} textAnchor="end" fontSize={15} className={styles.rxn}>
              {row.reaction}
            </text>
            <text x={324} y={y + 5} fontSize={15} className={styles.value}>
              {fmtE(row.e0)} V
            </text>
          </g>
        )
      })}
    </g>
  )
}

export function SheMeasurement({ step, reducedMotion }: SheMeasurementProps) {
  const state = getSheStep(step)
  const t = useAmbientTime(reducedMotion)
  const meter = state.meter ?? 0
  const scene = state.scene

  let drawing: ReactNode
  if (scene.kind === 'single') {
    drawing = (
      <g>
        <Beaker x={190} y={BEAKER_Y} width={BEAKER_W} height={BEAKER_H} level={0.74} tint={scene.half.tint} label={scene.half.solution} />
        <Electrode x={290} top={ELECTRODE_TOP} length={ELECTRODE_LEN} width={16} material={scene.half.material} />
        <Ion x={242} y={250} kind="cation" formula={scene.half.ion} charge={scene.half.charge} fontSize={16} />
        <Ion x={338} y={290} kind="cation" formula={scene.half.ion} charge={scene.half.charge} fontSize={16} />
        <rect x={METER_X - METER_W / 2} y={METER_Y} width={METER_W} height={METER_H} rx={10} className={styles.unknownMeter} />
        <text x={METER_X} y={METER_Y + METER_H / 2 + 12} textAnchor="middle" fontSize={34} className={styles.unknownMark}>
          ?
        </text>
      </g>
    )
  } else if (scene.kind === 'she') {
    drawing = (
      <HydrogenElectrode
        x={160}
        y={92}
        width={260}
        height={262}
        t={t}
        label="1 M H⁺(aq)"
        gasLabel="H₂ (1 bar)"
      />
    )
  } else if (scene.kind === 'pair') {
    drawing = <Pair scene={scene} meter={meter} t={t} />
  } else {
    drawing = <Ladder highlight={scene.highlight} />
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-label={state.ariaLabel}
      aria-live="polite"
      width="100%"
      data-testid="she-measurement-svg"
      data-step={state.id}
      preserveAspectRatio="xMidYMid meet"
    >
      <VocabDefs />
      {drawing}
      {scene.kind === 'ladder' ? null : (
        <text x={VIEW_W / 2} textAnchor="middle" fontSize={15} className={styles.readout}>
          {state.readout.split('\n').map((line, i, all) => (
            <tspan key={i} x={VIEW_W / 2} y={VIEW_H - 12 - (all.length - 1 - i) * 20}>
              {line}
            </tspan>
          ))}
        </text>
      )}
    </svg>
  )
}
