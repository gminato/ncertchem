'use client'

import katex from 'katex'
import 'katex/contrib/mhchem'
import { useState } from 'react'
import { useAmbientTime } from '@/components/animations/c12-unit1/ChemSvg'
import { Toggle } from '@/components/controls'
import type { SimulationProps } from '@/components/simulation/registry'
import {
  Beaker,
  Ion,
  METAL_FILL,
  SaltBridge,
  VocabDefs,
  Voltmeter,
  Wire,
} from '@/components/vocab'
import {
  COUPLES,
  pairCouples,
  plainNotation,
  signed,
  type CellPairing,
  type Couple,
  type CoupleKind,
} from '@/lib/chem/half-cell-pairing'
import styles from './half-cell-pairing.module.css'

/** Alkali and alkaline-earth metals react with water: their half-cells are drawn schematically. */
const REACTS_WITH_WATER = new Set(['Li', 'Na', 'K', 'Ca', 'Mg', 'Ba', 'Sr'])

const GROUPS: readonly { readonly label: string; readonly kind: CoupleKind }[] = [
  { label: 'Metal electrodes', kind: 'metal' },
  { label: 'Gas electrodes on Pt', kind: 'gas' },
  { label: 'Ion–ion couples on Pt', kind: 'ion' },
]

/** Ion pill positions inside a beaker, relative to the electrode centre. */
/** Ion positions relative to the beaker centre (x offset, absolute y). */
const ION_SLOTS: readonly (readonly [number, number])[] = [
  [-52, 262],
  [52, 262],
  [-52, 314],
  [52, 314],
]
const BEAKER_W = 200
const BEAKER_TOP = 214
const BEAKER_H = 166
const ELECTRODE_TOP = 190
const LADDER_Y = 490
const VIEW_H = 530

const SUBSCRIPT_DIGITS = '₀₁₂₃₄₅₆₇₈₉'

function subscriptDigits(text: string): string {
  return text.replace(/\d/g, (d) => SUBSCRIPT_DIGITS[Number(d)] ?? d)
}

function ce(body: string): string {
  return katex.renderToString(`\\ce{${body}}`, { throwOnError: false })
}

/** Reverses a half-reaction, so a reduction becomes the oxidation written at the anode. */
function reverseHalf(body: string): string {
  return body.split(' -> ').reverse().join(' -> ')
}

function withSign(value: number): string {
  return `${value > 0 ? '+' : ''}${signed(value)}`
}

/** x position on the potential ladder for a potential in volts. */
function ladderX(e0: number): number {
  return 300 + e0 * 78
}

interface HalfProps {
  readonly couple: Couple
  readonly cx: number
  readonly role: 'anode' | 'cathode'
  readonly t: number
}

function Half({ couple, cx, role, t }: HalfProps) {
  const roleColour = role === 'anode' ? 'var(--ox)' : 'var(--red)'
  const tagX = role === 'anode' ? cx - 18 : cx + 18
  return (
    <g>
      <Beaker x={cx - BEAKER_W / 2} y={BEAKER_TOP} width={BEAKER_W} height={BEAKER_H} level={0.78} tint={couple.tint} />
      {couple.solution.slice(0, ION_SLOTS.length).map((ion, i) => {
        const [dx, dy] = ION_SLOTS[i] ?? [0, 0]
        return (
          <Ion
            key={ion.ce}
            x={cx + dx}
            y={dy}
            kind={ion.charge.endsWith('-') ? 'anion' : 'cation'}
            formula={ion.formula}
            charge={ion.charge}
          />
        )
      })}
      <rect
        x={cx - 9}
        y={ELECTRODE_TOP}
        width={18}
        height={172}
        rx={4}
        fill={METAL_FILL[couple.electrode]}
        stroke="var(--glass-wall)"
        strokeWidth={1.2}
      />
      <text x={cx} y={404} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--fg)">
        {couple.electrodeLabel}
      </text>
      <text
        x={tagX}
        y={200}
        textAnchor={role === 'anode' ? 'end' : 'start'}
        fontSize={15}
        fontWeight={600}
        fill={roleColour}
      >
        {role === 'anode' ? 'Anode (−)' : 'Cathode (+)'}
      </text>
      {couple.kind === 'gas' && couple.gasCe ? (
        <g>
          <text x={cx + 14} y={240} fontSize={15} fill="var(--fg)">
            {`${subscriptDigits(couple.gasCe)}(g)`}
          </text>
          {[0, 1, 2].map((i) => {
            const y = 370 - ((t * 28 + i * 33) % 100)
            return <circle key={i} cx={cx + 14 + (i % 2) * 4} cy={y} r={3.5} fill="var(--fg-muted)" opacity={0.75} />
          })}
        </g>
      ) : null}
    </g>
  )
}

export function HalfCellPairingBench({ reducedMotion }: SimulationProps) {
  const [firstId, setFirstId] = useState('Cu2+/Cu')
  const [secondId, setSecondId] = useState('Zn2+/Zn')
  const [swapped, setSwapped] = useState(false)
  const t = useAmbientTime(reducedMotion)

  const first = COUPLES.find((c) => c.id === firstId)
  const second = COUPLES.find((c) => c.id === secondId)
  const pairing: CellPairing | null =
    first && second ? pairCouples(first, second, swapped ? 'reversed' : 'spontaneous') : null

  const alkaliCaption =
    pairing !== null &&
    [pairing.anode, pairing.cathode].some((c) => c.kind === 'metal' && REACTS_WITH_WATER.has(c.electrodeLabel))

  const eText = pairing ? `${withSign(pairing.eCell)} V` : ''
  const verdict = pairing
    ? pairing.spontaneous
      ? `Spontaneous as written: ${pairing.cathode.label} is reduced and ${pairing.anode.label} is oxidised.`
      : `Not spontaneous as written: E°cell is negative, so the reverse reaction is the one that occurs.`
    : 'Pick two different couples to build a cell.'

  return (
    <div className={styles.bench}>
      <div className={styles.controls}>
        <label className={styles.field}>
          <span>First couple</span>
          <select className={styles.select} value={firstId} onChange={(e) => setFirstId(e.target.value)}>
            {GROUPS.map((g) => (
              <optgroup key={g.kind} label={g.label}>
                {COUPLES.filter((c) => c.kind === g.kind).map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.label}  (E° ${withSign(c.e0)} V)`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Second couple</span>
          <select className={styles.select} value={secondId} onChange={(e) => setSecondId(e.target.value)}>
            {GROUPS.map((g) => (
              <optgroup key={g.kind} label={g.label}>
                {COUPLES.filter((c) => c.kind === g.kind).map((c) => (
                  <option key={c.id} value={c.id}>
                    {`${c.label}  (E° ${withSign(c.e0)} V)`}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className={styles.toggleRow}>
          <Toggle
            label="Swap the roles (show the reverse direction)"
            checked={swapped}
            onChange={setSwapped}
          />
        </div>
      </div>

      {pairing && first && second ? (
        <>
          <svg
            className={styles.stage}
            viewBox={`0 0 600 ${VIEW_H}`}
            role="img"
            aria-label={`Cell diagram: ${plainNotation(pairing.notation)}. Anode, oxidation: ${pairing.anode.label}. Cathode, reduction: ${pairing.cathode.label}.`}
          >
            <VocabDefs idPrefix="hcp" />
            <Half couple={pairing.anode} cx={150} role="anode" t={t} />
            <Half couple={pairing.cathode} cx={450} role="cathode" t={t} />
            <SaltBridge
              start={{ x: 246, y: 300 }}
              finish={{ x: 354, y: 300 }}
              apex={206}
              width={26}
              t={t}
              ionCount={4}
              cationsTo="to"
            />
            <Voltmeter
              x={300}
              y={81}
              width={200}
              height={110}
              value={pairing.eCell}
              range={[-1.5, 1.5]}
              scaleLabels={['−1.5', '0', '+1.5']}
              unit="V"
              decimals={2}
              digital={false}
              terminals
              plusSide="right"
            />
            <Wire
              corners={[
                { x: 150, y: ELECTRODE_TOP },
                { x: 150, y: 176 },
                { x: 266, y: 176 },
                { x: 266, y: 158 },
              ]}
              t={t}
              electrons={false}
              dots={0}
            />
            <Wire
              corners={[
                { x: 450, y: ELECTRODE_TOP },
                { x: 450, y: 176 },
                { x: 334, y: 176 },
                { x: 334, y: 158 },
              ]}
              t={t}
              electrons={false}
              dots={0}
            />

            <text x={50} y={436} fontSize={15} fill="var(--fg-muted)">
              Standard potentials E° / V (higher means a stronger oxidising agent)
            </text>
            <line x1={50} y1={LADDER_Y} x2={550} y2={LADDER_Y} stroke="var(--fg-muted)" strokeWidth={1.2} />
            {COUPLES.map((c) => (
              <line
                key={c.id}
                x1={ladderX(c.e0)}
                x2={ladderX(c.e0)}
                y1={LADDER_Y - 6}
                y2={LADDER_Y + 6}
                stroke="var(--fg-muted)"
                strokeWidth={1}
              />
            ))}
            {[first, second].map((c) => {
              const role = c.id === pairing.cathode.id ? 'cathode' : 'anode'
              const x = ladderX(c.e0)
              const above = c.e0 >= (c.id === first.id ? second.e0 : first.e0)
              const anchor = x < 120 ? 'start' : x > 480 ? 'end' : 'middle'
              const colour = role === 'cathode' ? 'var(--red)' : 'var(--ox)'
              return (
                <g key={c.id}>
                  <circle cx={x} cy={LADDER_Y} r={7} fill={colour} />
                  <text
                    x={x}
                    y={above ? 470 : 516}
                    textAnchor={anchor}
                    fontSize={15}
                    fontWeight={600}
                    fill={colour}
                  >
                    {`${c.label}  ${withSign(c.e0)} V`}
                  </text>
                </g>
              )
            })}
          </svg>
          {alkaliCaption ? (
            <p className={styles.caption}>
              Schematic only: alkali and alkaline-earth metals react with water, so such half-cells are not built with water
              in practice.
            </p>
          ) : null}
        </>
      ) : (
        <p className={styles.caption}>Pick two different couples to build a cell.</p>
      )}

      <section className={styles.readout} aria-label="Cell readout">
        <p className={styles.summary} aria-live="polite" data-spontaneous={pairing ? String(pairing.spontaneous) : undefined}>
          {pairing ? `E°cell = ${eText}. ${verdict}` : verdict}
        </p>
        {pairing ? (
          <dl className={styles.grid}>
            <div>
              <dt>Cathode (reduction)</dt>
              <dd dangerouslySetInnerHTML={{ __html: ce(pairing.cathode.ce) }} />
            </div>
            <div>
              <dt>Anode (oxidation)</dt>
              <dd dangerouslySetInnerHTML={{ __html: ce(reverseHalf(pairing.anode.ce)) }} />
            </div>
            <div className={styles.wide}>
              <dt>Cell notation</dt>
              <dd dangerouslySetInnerHTML={{ __html: ce(pairing.notation) }} />
            </div>
            <div className={styles.wide}>
              <dt>Overall, {pairing.electrons} e⁻ cancelled</dt>
              <dd dangerouslySetInnerHTML={{ __html: ce(pairing.overall) }} />
            </div>
            <div>
              <dt>E°cell = E°cathode − E°anode</dt>
              <dd>{`${withSign(pairing.cathode.e0)} − (${withSign(pairing.anode.e0)}) = ${eText}`}</dd>
            </div>
          </dl>
        ) : null}
      </section>
    </div>
  )
}
