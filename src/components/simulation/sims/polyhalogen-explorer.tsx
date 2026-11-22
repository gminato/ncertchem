'use client'

import { useState } from 'react'
import { Segmented, Toggle } from '@/components/controls'
import { SimulationControls } from '@/components/simulation/Simulation'
import { SkeletalFormula, drawingFrame } from '@/components/organic'
import { HALOGEN_TONE } from '@/components/vocab/organic6'
import { formulaUnicode } from '@/lib/chem/haloalkanes'
import { molecularFormula, parseSmiles } from '@/lib/chem/molecule-parse'
import {
  FOOD_CHAIN_LEVELS,
  POLYHALOGEN_COMPOUNDS,
  atmosphereSummary,
  chloroformGuardNote,
  chloroformSummary,
  ddtSummary,
  findPolyhalogen,
  ozoneThinned,
  phosgeneForms,
  systematicName,
  type AtmosphereLayer,
  type FoodChainLevel,
  type PolyhalogenCompound,
  type PolyhalogenId,
} from '@/lib/chem/polyhalogen'
import styles from './polyhalogen-explorer.module.css'

const SVG_W = 600
const SVG_H = 500

const BOTTLE_FILL = [
  { value: 'brown', label: 'Brown glass' },
  { value: 'clear', label: 'Clear glass' },
] as const
const FILL_OPTIONS = [
  { value: 'full', label: 'Full to the top' },
  { value: 'half', label: 'Half empty' },
] as const
const LAYER_OPTIONS = [
  { value: 'ground', label: 'Ground' },
  { value: 'troposphere', label: 'Lower air' },
  { value: 'stratosphere', label: 'Stratosphere' },
] as const
const LEVEL_OPTIONS = [
  { value: '0', label: 'Water' },
  { value: '1', label: 'Small fish' },
  { value: '2', label: 'Fish-eating bird' },
] as const
const AIR_OPTIONS = [
  { value: 'low', label: 'Low level' },
  { value: 'high', label: 'Higher level' },
] as const

const LAYER_Y: Record<AtmosphereLayer, number> = { ground: 384, troposphere: 318, stratosphere: 216 }
const CHAIN_X = [110, 300, 490] as const
const CHAIN_DOTS = [2, 6, 12] as const

/** Deterministic dots for a molecule count that stands for "more" or "less", not a measured amount. */
function dotPositions(count: number, x0: number, y0: number, w: number, h: number) {
  return Array.from({ length: count }, (_, i) => ({ x: x0 + ((i * 137) % w), y: y0 + ((i * 71) % h) }))
}

interface SceneProps {
  compound: PolyhalogenCompound
  light: boolean
  bottle: 'brown' | 'clear'
  fill: 'full' | 'half'
  layer: AtmosphereLayer
  level: FoodChainLevel
  air: 'low' | 'high'
  released: boolean
}

function ChloroformScene({ light, bottle, fill }: Pick<SceneProps, 'light' | 'bottle' | 'fill'>) {
  const phosgene = phosgeneForms({ light, bottle, fill })
  const liquidTop = fill === 'full' ? 212 : 330
  return (
    <g>
      <rect x={270} y={166} width={60} height={14} rx={4} fill="var(--fg-subtle)" />
      <rect x={230} y={180} width={140} height={220} rx={18} fill={bottle === 'brown' ? 'var(--glass-amber)' : 'var(--glass-fill)'} stroke="var(--glass-wall)" strokeWidth={3} />
      <rect x={236} y={liquidTop} width={128} height={396 - liquidTop} rx={12} fill="var(--liquid)" stroke="var(--liquid-edge)" strokeWidth={2} />
      {fill === 'half' && (
        <text x={300} y={318} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
          air
        </text>
      )}
      {light && (
        <g stroke="var(--caution)" strokeWidth={4} strokeDasharray="12 9" strokeLinecap="round">
          <line x1={30} y1={250} x2={200} y2={250} />
          <line x1={30} y1={290} x2={200} y2={290} />
          <line x1={30} y1={330} x2={200} y2={330} />
        </g>
      )}
      {light && (
        <text x={30} y={226} fontSize={16} fill="var(--fg-muted)">
          light
        </text>
      )}
      {phosgene && (
        <g>
          {[
            [262, 250],
            [290, 232],
            [318, 256],
            [276, 280],
            [306, 282],
          ].map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={15} fill="var(--ox)" opacity={0.55} />
          ))}
          <text x={392} y={250} fontSize={16} fill="var(--fg)">
            phosgene
          </text>
          <text x={392} y={272} fontSize={16} fill="var(--fg)">
            COCl₂ forms
          </text>
        </g>
      )}
      <text x={300} y={432} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {phosgene ? 'Air and light, clear glass, half empty: phosgene forms' : `Phosgene does not form: ${chloroformGuardNote({ light, bottle, fill })}`}
      </text>
    </g>
  )
}

function AtmosphereScene({ compound, layer }: { compound: PolyhalogenCompound; layer: AtmosphereLayer }) {
  const thinned = ozoneThinned(layer)
  const graph = parseSmiles(compound.smiles)
  return (
    <g>
      <rect x={20} y={170} width={560} height={92} fill="var(--accent-soft)" />
      <rect x={20} y={262} width={560} height={118} fill="var(--surface)" />
      <rect x={20} y={380} width={560} height={40} fill="var(--border)" />
      <text x={580} y={200} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
        stratosphere
      </text>
      <text x={580} y={290} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
        troposphere
      </text>
      <text x={580} y={406} textAnchor="end" fontSize={16} fill="var(--fg-muted)">
        ground
      </text>
      <text x={300} y={208} textAnchor="middle" fontSize={16} fill="var(--fg)">
        {thinned ? 'ozone layer, thinned' : 'ozone layer'}
      </text>
      {Array.from({ length: 9 }, (_, i) => i)
        .filter((i) => !thinned || i % 3 !== 1)
        .map((i) => (
          <circle key={i} cx={236 + i * 40} cy={238} r={7} fill="var(--accent)" />
        ))}
      <line x1={44} y1={370} x2={44} y2={200} stroke="var(--fg-muted)" strokeWidth={3} strokeDasharray="8 7" />
      <polygon points="44,188 37,204 51,204" fill="var(--fg-muted)" />
      <SkeletalFormula graph={graph} scale={34} x={100} y={LAYER_Y[layer]} />
      {layer === 'stratosphere' && (
        <text x={176} y={LAYER_Y.stratosphere + 6} fontSize={18} fill="var(--red)">
          Cl•
        </text>
      )}
    </g>
  )
}

function ChainScene({ level }: { level: FoodChainLevel }) {
  return (
    <g>
      {CHAIN_X.map((cx, k) => (
        <g key={FOOD_CHAIN_LEVELS[k]}>
          <ellipse
            cx={cx}
            cy={300}
            rx={70}
            ry={44}
            fill="var(--surface-raised)"
            stroke={k === level ? 'var(--accent)' : 'var(--border)'}
            strokeWidth={k === level ? 5 : 2}
          />
          {dotPositions(CHAIN_DOTS[k], cx - 42, 288, 80, 36).map((p, i) => (
            <circle key={i} cx={p.x + 2} cy={p.y - 4} r={5} fill="var(--ox)" />
          ))}
          <text x={cx} y={372} textAnchor="middle" fontSize={16} fill="var(--fg)">
            {FOOD_CHAIN_LEVELS[k]}
          </text>
        </g>
      ))}
      <line x1={186} y1={300} x2={214} y2={300} stroke="var(--fg-subtle)" strokeWidth={3} />
      <line x1={386} y1={300} x2={414} y2={300} stroke="var(--fg-subtle)" strokeWidth={3} />
      <text x={300} y={420} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        Schematic, not to scale: DDT builds up in fatty tissue over time.
      </text>
    </g>
  )
}

function AirScene({ air }: { air: 'low' | 'high' }) {
  const count = air === 'low' ? 3 : 12
  return (
    <g>
      <rect x={40} y={196} width={520} height={200} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
      {dotPositions(count, 90, 230, 420, 140).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={9} fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth={2} />
      ))}
      <text x={300} y={430} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        {air === 'low' ? 'Air at a low level: hearing and vision slightly impaired' : 'Air at a higher level: dizziness, nausea and numbness'}
      </text>
    </g>
  )
}

function IodineScene({ released }: { released: boolean }) {
  const carrierIodines = [
    [80, 262],
    [120, 282],
    [160, 262],
  ]
  const woundIodines = [
    [350, 270],
    [430, 310],
    [510, 270],
  ]
  const atoms = released ? woundIodines : carrierIodines
  return (
    <g>
      <rect x={40} y={220} width={160} height={110} rx={14} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
      <text x={120} y={366} textAnchor="middle" fontSize={16} fill="var(--fg)">
        {released ? 'empty CHI₃ stays behind' : 'CHI₃ carries three iodine atoms'}
      </text>
      <rect x={280} y={220} width={280} height={150} rx={60} fill="var(--surface)" stroke="var(--caution)" strokeWidth={3} strokeDasharray={released ? undefined : '8 8'} />
      <text x={420} y={206} textAnchor="middle" fontSize={16} fill="var(--fg-muted)">
        wound
      </text>
      {atoms.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={15} fill={HALOGEN_TONE.I} />
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize={16} fill="var(--surface)">
            I
          </text>
        </g>
      ))}
    </g>
  )
}

function Scene(props: SceneProps) {
  const { compound } = props
  switch (compound.id) {
    case 'chloroform':
      return <ChloroformScene light={props.light} bottle={props.bottle} fill={props.fill} />
    case 'carbon-tetrachloride':
    case 'freon-12':
      return <AtmosphereScene compound={compound} layer={props.layer} />
    case 'ddt':
      return <ChainScene level={props.level} />
    case 'dichloromethane':
      return <AirScene air={props.air} />
    case 'iodoform':
      return <IodineScene released={props.released} />
  }
}

function liveText(p: SceneProps): string {
  const c = p.compound
  switch (c.id) {
    case 'chloroform':
      return chloroformSummary({ light: p.light, bottle: p.bottle, fill: p.fill })
    case 'carbon-tetrachloride':
    case 'freon-12':
      return atmosphereSummary(c, p.layer)
    case 'ddt':
      return ddtSummary(p.level)
    case 'dichloromethane':
      return p.air === 'low' ? c.effects[0] : c.effects[1]
    case 'iodoform':
      return p.released
        ? 'Iodoform releases its free iodine, which is the part that kills microbes. The empty molecule stays behind.'
        : 'Iodoform keeps its iodine in the molecule until it is released.'
  }
}

export function PolyhalogenExplorer() {
  const [id, setId] = useState<PolyhalogenId>('chloroform')
  const [light, setLight] = useState(true)
  const [bottle, setBottle] = useState<'brown' | 'clear'>('brown')
  const [fill, setFill] = useState<'full' | 'half'>('full')
  const [layer, setLayer] = useState<AtmosphereLayer>('ground')
  const [level, setLevel] = useState<FoodChainLevel>(0)
  const [air, setAir] = useState<'low' | 'high'>('low')
  const [released, setReleased] = useState(false)

  const compound = findPolyhalogen(id)
  const graph = parseSmiles(compound.smiles)
  const frame = drawingFrame(graph, 1)
  const scale = Math.min(56, 500 / frame.bounds.width, 200 / frame.bounds.height)
  const props: SceneProps = { compound, light, bottle, fill, layer, level, air, released }
  const summary = liveText(props)

  return (
    <div className={styles.sim}>
      <SimulationControls>
        <label className={styles.select}>
          <span>Compound</span>
          <select value={id} onChange={(e) => setId(e.target.value as PolyhalogenId)}>
            {POLYHALOGEN_COMPOUNDS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.common}
              </option>
            ))}
          </select>
        </label>
        {compound.id === 'chloroform' && (
          <>
            <Toggle label="Light" checked={light} onChange={setLight} />
            <Segmented label="Bottle" options={BOTTLE_FILL} value={bottle} onChange={setBottle} />
            <Segmented label="Fill" options={FILL_OPTIONS} value={fill} onChange={setFill} />
          </>
        )}
        {(compound.id === 'carbon-tetrachloride' || compound.id === 'freon-12') && (
          <Segmented label="Where the molecule is" options={LAYER_OPTIONS} value={layer} onChange={setLayer} />
        )}
        {compound.id === 'ddt' && <Segmented
            label="Food chain level"
            options={LEVEL_OPTIONS}
            value={String(level) as '0' | '1' | '2'}
            onChange={(v) => setLevel(Number(v) as FoodChainLevel)}
          />}
        {compound.id === 'dichloromethane' && <Segmented label="Air level" options={AIR_OPTIONS} value={air} onChange={setAir} />}
        {compound.id === 'iodoform' && <Toggle label="Iodine released into the wound" checked={released} onChange={setReleased} />}
      </SimulationControls>

      <div className={styles.stage}>
        <svg className={styles.scene} viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label={`${compound.common}: structure and scene`}>
          <SkeletalFormula graph={graph} scale={scale} x={SVG_W / 2} y={105} />
          <g transform="translate(0 60)">
            <Scene {...props} />
          </g>
        </svg>
      </div>

      <div className={styles.info}>
        <h4 className={styles.name}>{compound.common}</h4>
        <p className={styles.formula}>
          {formulaUnicode(molecularFormula(graph))} · Name: {systematicName(compound)}
        </p>
        <div className={styles.columns}>
          <div>
            <h5 className={styles.heading}>Uses</h5>
            <ul className={styles.list}>
              {compound.uses.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className={styles.heading}>Effects</h5>
            <ul className={styles.list}>
              {compound.effects.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {summary}
      </p>
    </div>
  )
}
