'use client'

import { Fragment } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { useTweenedNumber } from '@/components/animations/unit5/gibbs/useTweenedNumber'
import {
  Beaker,
  Electrode,
  Galvanometer,
  Ion,
  SaltBridge,
  VocabDefs,
  Voltmeter,
  Wire,
  type Point,
} from '@/components/vocab'
import { getDaniellStepState } from './daniell-steps'

export interface DaniellOpposingVoltageProps {
  step: number
  reducedMotion: boolean
}

/** Electrode tops sit on one rail height; the external circuit runs along it. */
const RAIL_Y = 150
const ZN_X = 125
const CU_X = 455
const ELECTRODE_TOP = 190
const ELECTRODE_LENGTH = 170
const BEAKER_Y = 230
const BEAKER_H = 190
const SALT_START: Point = { x: 165, y: 330 }
const SALT_FINISH: Point = { x: 415, y: 330 }

const SUPPLY = { x: 300, y: 28, w: 100, h: 100 } as const
const SUPPLY_MINUS_X = 316
const SUPPLY_PLUS_X = 384

/** SVG caption text with every "Eext" written as italic E and a subscript ext. */
function Caption({ text }: { text: string }) {
  const parts = text.split('Eext')
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              <tspan className="sym" fontStyle="italic">E</tspan>
              <tspan baselineShift="sub" fontSize="72%">ext</tspan>
            </>
          )}
          {part}
        </Fragment>
      ))}
    </>
  )
}

export function DaniellOpposingVoltage({ step, reducedMotion }: DaniellOpposingVoltageProps) {
  const s = getDaniellStepState(step)
  const t = useAmbientTime(reducedMotion)
  const voltmeterValue = useTweenedNumber(s.voltmeterValue, reducedMotion)
  const galvanometerValue = useTweenedNumber(s.galvanometerValue, reducedMotion)

  const electrolytic = s.mode === 'electrolytic'
  const znLabel = electrolytic ? 'Zn: cathode (−)' : 'Zn: anode (−)'
  const cuLabel = electrolytic ? 'Cu: anode (+)' : 'Cu: cathode (+)'
  const eExtText = `${s.eExt.toFixed(2)} V`

  if (s.mode === 'direct') {
    return (
      <svg
        viewBox="0 0 580 480"
        role="img"
        aria-label={s.ariaLabel}
        data-testid="daniell-svg"
        data-step={s.index}
        width="100%"
        style={{ display: 'block', height: 'auto' }}
      >
        <VocabDefs />
        <Beaker x={80} y={180} width={420} height={240} level={0.82} tint="blue" label="CuSO₄(aq)" />
        <Ion x={210} y={300} kind="cation" formula="Cu" charge="2+" fontSize={17} />
        <Ion x={380} y={262} kind="anion" formula="SO4" charge="2−" fontSize={17} />
        <Ion x={200} y={370} kind="anion" formula="SO4" charge="2−" fontSize={17} />
        <Ion x={390} y={360} kind="cation" formula="Cu" charge="2+" fontSize={17} />
        <Electrode
          x={290}
          top={150}
          length={210}
          width={40}
          material="zn"
          thinning={s.znThinning}
          plating={s.cuPlating}
          depositMaterial="cu"
        />
        <text x={330} y={168} fontSize={17} className="sym">
          Zn
        </text>
        <text x={290} y={466} textAnchor="middle" fontSize={15} fill="currentColor">
          <Caption text={s.caption} />
        </text>
      </svg>
    )
  }

  return (
    <svg
      viewBox="0 0 580 480"
      role="img"
      aria-label={s.ariaLabel}
      data-testid="daniell-svg"
      data-step={s.index}
      width="100%"
      style={{ display: 'block', height: 'auto' }}
    >
      <VocabDefs />

      <Beaker x={40} y={BEAKER_Y} width={170} height={BEAKER_H} level={0.8} tint="clear" label="ZnSO₄(aq)" />
      <Beaker x={370} y={BEAKER_Y} width={170} height={BEAKER_H} level={0.8} tint="blue" label="CuSO₄(aq)" />

      <Ion x={75} y={300} kind="cation" formula="Zn" charge="2+" fontSize={15} />
      <Ion x={75} y={368} kind="anion" formula="SO4" charge="2−" fontSize={15} />
      <Ion x={500} y={300} kind="cation" formula="Cu" charge="2+" fontSize={15} />
      <Ion x={500} y={368} kind="anion" formula="SO4" charge="2−" fontSize={15} />
      
      <SaltBridge
        start={SALT_START}
        finish={SALT_FINISH}
        apex={205}
        width={14}
        plugs
        t={t}
        ions={!reducedMotion && s.mode !== 'balanced'}
        ionCount={2}
        cationsTo="to"
        legend="KCl salt bridge"
      />

      <Electrode
        x={ZN_X}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LENGTH}
        width={24}
        material="zn"
        thinning={s.znThinning}
        plating={s.znPlating}
        depositMaterial="zn"
      />
      <Electrode
        x={CU_X}
        top={ELECTRODE_TOP}
        length={ELECTRODE_LENGTH}
        width={24}
        material="cu"
        thinning={s.cuThinning}
        plating={s.cuPlating}
        depositMaterial="cu"
      />
      <text x={108} y={182} fontSize={14} textAnchor="end" fill="currentColor">
        {znLabel}
      </text>
      <text x={472} y={182} fontSize={14} fill="currentColor">
        {cuLabel}
      </text>

      {s.circuit === 'voltmeter' && (
        <>
          <Voltmeter
            x={290}
            y={RAIL_Y - 72}
            width={110}
            height={100}
            value={voltmeterValue}
            range={[0, 3]}
            unit="V"
            decimals={2}
            terminals
            scaleLabels={['0', '1.5', '3']}
            caption="Voltmeter"
          />
          <Wire corners={[{ x: ZN_X, y: ELECTRODE_TOP }, { x: ZN_X, y: RAIL_Y }, { x: 256, y: RAIL_Y }]} t={t} electrons dots={3} direction={s.electronDirection} />
          <Wire corners={[{ x: 324, y: RAIL_Y }, { x: CU_X, y: RAIL_Y }, { x: CU_X, y: ELECTRODE_TOP }]} t={t} electrons dots={3} direction={s.electronDirection} />
        </>
      )}

      {s.circuit === 'supply' && (
        <>
          <Galvanometer
            x={200}
            y={RAIL_Y - 72}
            width={130}
            height={100}
            value={galvanometerValue}
            range={[-1, 1]}
            unit="a.u."
            caption="Current (schematic)"
            scaleLabels={['−', '0', '+']}
            terminals
          />
          <rect
            x={SUPPLY.x}
            y={SUPPLY.y}
            width={SUPPLY.w}
            height={SUPPLY.h}
            rx={10}
            fill="var(--surface-raised, transparent)"
            stroke="currentColor"
            strokeWidth={1.5}
          />
          <text x={SUPPLY.x + SUPPLY.w / 2} y={SUPPLY.y + 24} fontSize={14} textAnchor="middle" fill="currentColor">
            DC supply
          </text>
          <text x={SUPPLY.x + SUPPLY.w / 2} y={SUPPLY.y + 52} fontSize={15} textAnchor="middle" fill="currentColor">
            <tspan className="sym" fontStyle="italic">E</tspan>
            <tspan baselineShift="sub" fontSize="72%">ext</tspan>
            {` = ${eExtText}`}
          </text>
          <text x={SUPPLY_MINUS_X} y={SUPPLY.y + SUPPLY.h - 10} fontSize={15} textAnchor="middle" fill="currentColor">
            −
          </text>
          <text x={SUPPLY_PLUS_X} y={SUPPLY.y + SUPPLY.h - 10} fontSize={15} textAnchor="middle" fill="currentColor">
            +
          </text>
          <Wire corners={[{ x: ZN_X, y: ELECTRODE_TOP }, { x: ZN_X, y: RAIL_Y }, { x: 166, y: RAIL_Y }]} t={t} electrons={s.electronsVisible} dots={3} direction={s.electronDirection} />
          <Wire corners={[{ x: 234, y: RAIL_Y }, { x: SUPPLY_MINUS_X, y: RAIL_Y }, { x: SUPPLY_MINUS_X, y: SUPPLY.y + SUPPLY.h }]} t={t} electrons={s.electronsVisible} dots={2} direction={s.electronDirection} />
          <Wire corners={[{ x: SUPPLY_PLUS_X, y: SUPPLY.y + SUPPLY.h }, { x: SUPPLY_PLUS_X, y: RAIL_Y }, { x: CU_X, y: RAIL_Y }, { x: CU_X, y: ELECTRODE_TOP }]} t={t} electrons={s.electronsVisible} dots={3} direction={s.electronDirection} />
        </>
      )}

      <text x={290} y={466} textAnchor="middle" fontSize={14} fill="currentColor">
        <Caption text={s.caption} />
      </text>
    </svg>
  )
}

