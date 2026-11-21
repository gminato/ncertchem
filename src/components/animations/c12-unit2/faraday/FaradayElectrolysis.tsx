'use client'

import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  Beaker,
  DcSource,
  Electrode,
  Ion,
  VocabDefs,
  Wire,
  dcTerminals,
  driftAlong,
  type Point,
} from '@/components/vocab'
import { FARADAY } from '@/lib/chem/ncert-c12-unit2-tables'
import {
  SERIES_CURRENT_A,
  SERIES_TIME_S,
  countingNumbers,
  firstLawMass,
  getFaradayStepState,
  seriesMasses,
  roundTo,
  AG_MOLAR_MASS,
  CU_MOLAR_MASS,
} from './faraday-steps'

export interface FaradayElectrolysisProps {
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 482

/** DC source on top; its + terminal sits left of its − terminal. */
const SOURCE = { x: 170, y: 40, width: 220, height: 60 }
const TERM = dcTerminals(SOURCE.x, SOURCE.y, SOURCE.width)

const TOP = 150
const LENGTH = 160
const ELECTRODE_W = 18

const SINGLE = { x: 50, y: 170, width: 400, height: 230, level: 0.8, anodeX: 130, cathodeX: 420 }
const LEFT = { x: 20, y: 170, width: 255, height: 230, level: 0.8, cathodeX: 100, anodeX: 200 }
const RIGHT = { x: 305, y: 170, width: 255, height: 230, level: 0.8, cathodeX: 370, anodeX: 470 }

const CATION_ROW = 335
const ANION_ROW = 375

const BARS = { baseline: 392, maxH: 210, xs: [462, 528] as const, w: 40 }
const CARD_Y = [36, 176, 316] as const
const CARD_H = 118

const TEXT = { fontFamily: 'var(--font-sans)', fill: 'var(--fg)' } as const
const MUTED = { fontFamily: 'var(--font-sans)', fill: 'var(--fg-muted)' } as const

/** Electron and ion motion runs slowly: one loop every five seconds of ambient time. */
const phase = (t: number) => t * 0.2

const groupThousands = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

export function FaradayElectrolysis({ step, reducedMotion }: FaradayElectrolysisProps) {
  const state = getFaradayStepState(step)
  const t = useAmbientTime(reducedMotion)

  const singleO = useTweenedNumber(state.scene === 'single' ? 1 : 0, reducedMotion, 0.5)
  const seriesO = useTweenedNumber(state.scene === 'series' ? 1 : 0, reducedMotion, 0.5)
  const countO = useTweenedNumber(state.scene === 'count' ? 1 : 0, reducedMotion, 0.5)
  const barsO = useTweenedNumber(state.barsOn ? 1 : 0, reducedMotion, 0.8)

  const depA = useTweenedNumber(state.cells[0].deposit, reducedMotion, 1.0)
  const eroA = useTweenedNumber(state.cells[0].erosion, reducedMotion, 1.0)
  const depB = useTweenedNumber(state.cells[1].deposit, reducedMotion, 1.0)
  const eroB = useTweenedNumber(state.cells[1].erosion, reducedMotion, 1.0)

  const ph = phase(t)
  const single = state.scene === 'single' || singleO > 0.01
  const series = state.scene === 'series' || seriesO > 0.01

  // Single cell: copper electrodes, anode on the + side.
  const singleWires = {
    anode: [
      { x: SINGLE.anodeX, y: TOP },
      { x: SINGLE.anodeX, y: TERM.plus.y },
      { x: TERM.plus.x, y: TERM.plus.y },
    ],
    cathode: [
      { x: TERM.minus.x, y: TERM.minus.y },
      { x: SINGLE.cathodeX, y: TERM.minus.y },
      { x: SINGLE.cathodeX, y: TOP },
    ],
  }
  const cuIons = driftAlong(
    [
      { x: 90, y: CATION_ROW },
      { x: 400, y: CATION_ROW },
    ],
    2,
    ph,
    true,
  )
  const so4Ions = driftAlong(
    [
      { x: 400, y: ANION_ROW },
      { x: 90, y: ANION_ROW },
    ],
    2,
    ph,
    true,
  )

  // Series: one wire passes through both cells (silver on the left, copper on the right).
  const seriesWires = {
    silver: [
      { x: TERM.minus.x, y: TERM.minus.y },
      { x: TERM.minus.x, y: 8 },
      { x: LEFT.cathodeX, y: 8 },
      { x: LEFT.cathodeX, y: TOP },
    ],
    link: [
      { x: LEFT.anodeX, y: TOP },
      { x: LEFT.anodeX, y: 90 },
      { x: RIGHT.cathodeX, y: 90 },
      { x: RIGHT.cathodeX, y: TOP },
    ],
    copper: [
      { x: RIGHT.anodeX, y: TOP },
      { x: RIGHT.anodeX, y: 16 },
      { x: TERM.plus.x, y: 16 },
      { x: TERM.plus.x, y: TERM.plus.y },
    ],
  }
  const agIons = driftAlong(
    [
      { x: 230, y: CATION_ROW },
      { x: 40, y: CATION_ROW },
    ],
    2,
    ph,
    true,
  )
  const no3Ions = driftAlong(
    [
      { x: 40, y: ANION_ROW },
      { x: 230, y: ANION_ROW },
    ],
    2,
    ph,
    true,
  )
  const cuSeriesIons = driftAlong(
    [
      { x: 545, y: CATION_ROW },
      { x: 325, y: CATION_ROW },
    ],
    2,
    ph,
    true,
  )
  const so4SeriesIons = driftAlong(
    [
      { x: 325, y: ANION_ROW },
      { x: 545, y: ANION_ROW },
    ],
    2,
    ph,
    true,
  )

  const barFirst = firstLawMass(1000)
  const barSecond = firstLawMass(2000)
  const seriesM = seriesMasses()
  const counts = countingNumbers()
  const barH1 = barsO * (barFirst / barSecond) * BARS.maxH
  const barH2 = barsO * BARS.maxH

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={state.ariaLabel}
      style={{ display: 'block', overflow: 'visible' }}
    >
      <VocabDefs idPrefix="faraday" />

      {/* Shared DC source, hidden on the counting Step. */}
      <g opacity={1 - countO}>
        <DcSource
          x={SOURCE.x}
          y={SOURCE.y}
          width={SOURCE.width}
          height={SOURCE.height}
          display="DC supply"
        />
      </g>

      {single && (
        <g opacity={singleO}>
          <text x={16} y={452} fontSize={15} {...MUTED}>
            e⁻ flow: anode → cathode (wire)
          </text>
          <text x={16} y={472} fontSize={15} {...MUTED}>
            current I: cathode → anode (wire)
          </text>
          <Beaker
            x={SINGLE.x}
            y={SINGLE.y}
            width={SINGLE.width}
            height={SINGLE.height}
            level={SINGLE.level}
            tint="blue"
            label="CuSO₄(aq)"
          />
          <Wire
            corners={singleWires.anode}
            t={ph}
            electrons={state.electronsOn}
            dots={6}
            direction="forward"
            currentArrow
            currentLabel="I"
          />
          <Wire
            corners={singleWires.cathode}
            t={ph}
            electrons={state.electronsOn}
            dots={6}
            direction="forward"
            currentArrow
            currentLabel="I"
          />
          <Electrode
            x={SINGLE.anodeX}
            top={TOP}
            length={LENGTH}
            width={ELECTRODE_W}
            material="cu"
            thinning={eroA}
            role="anode"
            polarity="+"
          />
          <Electrode
            x={SINGLE.cathodeX}
            top={TOP}
            length={LENGTH}
            width={ELECTRODE_W}
            material="cu"
            plating={depA}
            depositMaterial="cu"
            role="cathode"
            polarity="−"
          />
          {state.ionsOn &&
            cuIons.map((p: Point, i: number) => (
              <Ion key={`cu-${i}`} x={p.x} y={p.y} kind="cation" formula="Cu" charge="2+" fontSize={16} />
            ))}
          {state.ionsOn &&
            so4Ions.map((p: Point, i: number) => (
              <Ion key={`so4-${i}`} x={p.x} y={p.y} kind="anion" formula="SO4" charge="2-" fontSize={16} />
            ))}
        </g>
      )}

      {series && (
        <g opacity={seriesO}>
          <text x={100} y={452} textAnchor="middle" fontSize={17} {...TEXT}>
            Ag {seriesM.silver.toFixed(2)} g
          </text>
          <text x={100} y={474} textAnchor="middle" fontSize={15} {...MUTED}>
            M/n = {AG_MOLAR_MASS.toFixed(2)}
          </text>
          <text x={370} y={452} textAnchor="middle" fontSize={17} {...TEXT}>
            Cu {seriesM.copper.toFixed(2)} g
          </text>
          <text x={370} y={474} textAnchor="middle" fontSize={15} {...MUTED}>
            M/n = {roundTo(CU_MOLAR_MASS / 2, 2).toFixed(2)}
          </text>
          <Beaker
            x={LEFT.x}
            y={LEFT.y}
            width={LEFT.width}
            height={LEFT.height}
            level={LEFT.level}
            tint="clear"
            label="AgNO₃(aq)"
          />
          <Beaker
            x={RIGHT.x}
            y={RIGHT.y}
            width={RIGHT.width}
            height={RIGHT.height}
            level={RIGHT.level}
            tint="blue"
            label="CuSO₄(aq)"
          />
          <Wire corners={seriesWires.silver} t={ph} electrons={state.electronsOn} dots={5} direction="forward" />
          <Wire corners={seriesWires.link} t={ph} electrons={state.electronsOn} dots={5} direction="forward" />
          <Wire corners={seriesWires.copper} t={ph} electrons={state.electronsOn} dots={5} direction="forward" />
          <Electrode
            x={LEFT.cathodeX}
            top={TOP}
            length={LENGTH}
            width={ELECTRODE_W}
            material="ag"
            plating={depA}
            depositMaterial="ag"
            role="cathode"
          />
          <Electrode
            x={LEFT.anodeX}
            top={TOP}
            length={LENGTH}
            width={ELECTRODE_W}
            material="ag"
            thinning={eroA}
            role="anode"
          />
          <Electrode
            x={RIGHT.cathodeX}
            top={TOP}
            length={LENGTH}
            width={ELECTRODE_W}
            material="cu"
            plating={depB}
            depositMaterial="cu"
            role="cathode"
          />
          <Electrode
            x={RIGHT.anodeX}
            top={TOP}
            length={LENGTH}
            width={ELECTRODE_W}
            material="cu"
            thinning={eroB}
            role="anode"
          />
          {state.ionsOn &&
            agIons.map((p: Point, i: number) => (
              <Ion key={`ag-${i}`} x={p.x} y={p.y} kind="cation" formula="Ag" charge="+" fontSize={16} />
            ))}
          {state.ionsOn &&
            no3Ions.map((p: Point, i: number) => (
              <Ion key={`no3-${i}`} x={p.x} y={p.y} kind="anion" formula="NO3" charge="-" fontSize={16} />
            ))}
          {state.ionsOn &&
            cuSeriesIons.map((p: Point, i: number) => (
              <Ion key={`cu2-${i}`} x={p.x} y={p.y} kind="cation" formula="Cu" charge="2+" fontSize={16} />
            ))}
          {state.ionsOn &&
            so4SeriesIons.map((p: Point, i: number) => (
              <Ion key={`so4b-${i}`} x={p.x} y={p.y} kind="anion" formula="SO4" charge="2-" fontSize={16} />
            ))}
        </g>
      )}

      {barsO > 0.01 && (
        <g opacity={barsO}>
          <text x={520} y={108} textAnchor="middle" fontSize={16} {...TEXT}>
            Cu at 1.00 A
          </text>
          <rect
            x={BARS.xs[0]}
            y={BARS.baseline - barH1}
            width={BARS.w}
            height={barH1}
            rx={4}
            style={{ fill: 'var(--metal-cu)' }}
          />
          <rect
            x={BARS.xs[1]}
            y={BARS.baseline - barH2}
            width={BARS.w}
            height={barH2}
            rx={4}
            style={{ fill: 'var(--metal-cu)' }}
          />
          <text x={BARS.xs[0] + BARS.w / 2} y={BARS.baseline - barH1 - 8} textAnchor="middle" fontSize={16} {...TEXT}>
            {barFirst.toFixed(3)} g
          </text>
          <text x={BARS.xs[1] + BARS.w / 2} y={BARS.baseline - barH2 - 8} textAnchor="middle" fontSize={16} {...TEXT}>
            {barSecond.toFixed(3)} g
          </text>
          <line x1={460} x2={575} y1={BARS.baseline} y2={BARS.baseline} style={{ stroke: 'var(--fg-muted)' }} />
          <text x={BARS.xs[0] + BARS.w / 2} y={BARS.baseline + 22} textAnchor="middle" fontSize={15} {...MUTED}>
            1000 s
          </text>
          <text x={BARS.xs[1] + BARS.w / 2} y={BARS.baseline + 22} textAnchor="middle" fontSize={15} {...MUTED}>
            2000 s
          </text>
        </g>
      )}

      {countO > 0.01 && (
        <g opacity={countO}>
          {CARD_Y.map((y) => (
            <rect
              key={y}
              x={40}
              y={y}
              width={500}
              height={CARD_H}
              rx={14}
              style={{ fill: 'var(--surface-raised)', stroke: 'var(--fg-muted)', strokeOpacity: 0.35 }}
            />
          ))}
          <text x={290} y={CARD_Y[0] + 46} textAnchor="middle" fontSize={26} {...TEXT}>
            Q = I × t
          </text>
          <text x={290} y={CARD_Y[0] + 88} textAnchor="middle" fontSize={19} {...MUTED}>
            {SERIES_CURRENT_A.toFixed(2)} A × {SERIES_TIME_S} s = {counts.charge} C
          </text>
          <text x={290} y={CARD_Y[1] + 46} textAnchor="middle" fontSize={26} {...TEXT}>
            n(e⁻) = Q ÷ F
          </text>
          <text x={290} y={CARD_Y[1] + 88} textAnchor="middle" fontSize={19} {...MUTED}>
            {counts.charge} C ÷ {groupThousands(FARADAY)} C mol⁻¹ = {counts.moles.toFixed(4)} mol e⁻
          </text>
          <text x={290} y={CARD_Y[2] + 50} textAnchor="middle" fontSize={19} {...TEXT}>
            Ag⁺ (1 e⁻ each): {counts.molesAg.toFixed(4)} mol Ag⁺
          </text>
          <text x={290} y={CARD_Y[2] + 92} textAnchor="middle" fontSize={19} {...TEXT}>
            Cu²⁺ (2 e⁻ each): {counts.molesCu.toFixed(4)} mol Cu²⁺
          </text>
        </g>
      )}
    </svg>
  )
}
