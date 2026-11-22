'use client'

import type { ReactNode } from 'react'
import { PlotFrame } from '@/components/vocab'
import { SkeletalFormula } from '@/components/organic'
import { HALOGEN_TONE, type Halogen } from '@/components/vocab/organic6'
import {
  BROMOBUTANES,
  DICHLOROBENZENES,
  FAMILY_LABEL,
  HALIDE_STEP_COUNT,
  LAYERING_LIQUIDS,
  SOLVENT_HALOALKANE,
  alkylBpGroups,
  isGasAtRoomTemperature,
} from './halide-physical-steps'

export interface HalidePhysicalProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 486

/** A plot window in SVG units. Data values map onto it linearly, y up. */
interface Frame {
  x: number
  y: number
  width: number
  height: number
  xMax: number
  yMax: number
}

interface Bar {
  /** Centre of the bar in data x (same units as frame.xMax). */
  cx: number
  bpK: number
  fill: string
  gas: boolean
}

const BP_FRAME: Frame = { x: 72, y: 36, width: 480, height: 300, xMax: 480, yMax: 400 }
const BP_STRIP: Frame = { x: 72, y: 236, width: 480, height: 150, xMax: 480, yMax: 440 }
const DCB_FRAME: Frame = { x: 72, y: 236, width: 480, height: 150, xMax: 480, yMax: 540 }
const BAR_WIDTH = 20
const GROUP_WIDTH = 160
const SLOT_WIDTH = 30
const ROOM_TEMP_K = 298

/** Map data x to SVG x inside a frame. */
function sx(f: Frame, v: number): number {
  return f.x + (v / f.xMax) * f.width
}

/** Map data y (K or other units) to SVG y inside a frame. */
function sy(f: Frame, v: number): number {
  return f.y + f.height - (v / f.yMax) * f.height
}

function Text({ x, y, anchor = 'middle', muted = false, children }: {
  x: number
  y: number
  anchor?: 'start' | 'middle' | 'end'
  muted?: boolean
  children: ReactNode
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={14} fill={muted ? 'var(--fg-muted)' : 'var(--fg)'}>
      {children}
    </text>
  )
}

/** Bars inside a PlotFrame. Gas bars are outlined; liquid and solid bars are filled. */
function Bars({ frame, bars, width }: { frame: Frame; bars: readonly Bar[]; width: number }) {
  const base = sy(frame, 0)
  return (
    <g>
      {bars.map((b, i) => {
        const left = sx(frame, b.cx - width / 2)
        const barWidth = (width / frame.xMax) * frame.width
        const top = sy(frame, b.bpK)
        const label = String(b.bpK)
        const labelWidth = label.length * 9 + 6
        const labelX = left + barWidth / 2
        return (
          <g key={i}>
            <rect
              x={left}
              y={top}
              width={barWidth}
              height={base - top}
              fill={b.gas ? 'var(--surface)' : b.fill}
              stroke={b.gas ? b.fill : 'none'}
              strokeWidth={2.4}
            />
            {/* A background behind the value breaks any guide line that runs through it. */}
            <rect x={labelX - labelWidth / 2} y={top - 19} width={labelWidth} height={16} rx={3} fill="var(--surface)" />
            <text
              x={left + barWidth / 2}
              y={top - 6}
              textAnchor="middle"
              fontSize={14}
              fill="var(--fg)"
              stroke="var(--surface)"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {b.bpK}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function Chart({ frame, yTicks, yTitle, children }: {
  frame: Frame
  yTicks: number[]
  yTitle: ReactNode
  children: ReactNode
}) {
  return (
    <PlotFrame
      x={frame.x}
      y={frame.y}
      width={frame.width}
      height={frame.height}
      domain={{ xMin: 0, xMax: frame.xMax, yMin: 0, yMax: frame.yMax }}
      xTicks={[]}
      yTicks={yTicks}
      yTitle={yTitle}
      grid={false}
    >
      {children}
    </PlotFrame>
  )
}

/** Step 1: boiling points of the methyl, ethyl and n-propyl halides, with the parent alkanes. */
function ClimbingBars() {
  const groups = alkylBpGroups()
  const bars: Bar[] = []
  const labels: ReactNode[] = []
  const base = sy(BP_FRAME, 0)
  groups.forEach((group, g) => {
    const slots = [
      { bpK: group.parent.bpK, fill: 'var(--fg-muted)', gas: true, halogen: null as Halogen | null },
      ...group.halides.map((h) => ({ bpK: h.bpK, fill: HALOGEN_TONE[h.halogen], gas: isGasAtRoomTemperature(h.bpK), halogen: h.halogen })),
    ]
    slots.forEach((slot, i) => {
      const cx = g * GROUP_WIDTH + 20 + SLOT_WIDTH * i
      bars.push({ cx, bpK: slot.bpK, fill: slot.fill, gas: slot.gas })
      if (slot.halogen) {
        labels.push(
          <Text key={`h-${g}-${i}`} x={sx(BP_FRAME, cx)} y={base + 18}>
            {slot.halogen}
          </Text>
        )
      }
    })
    const left = BP_FRAME.x + g * GROUP_WIDTH
    labels.push(
      <Text key={`p-${g}`} x={left + GROUP_WIDTH / 2} y={base + 44} muted>
        {group.parent.unicode} (parent)
      </Text>,
      <Text key={`f-${g}`} x={left + GROUP_WIDTH / 2} y={base + 64}>
        {FAMILY_LABEL[group.alkyl]}
      </Text>
    )
  })
  return (
    <g>
      <Text x={W / 2} y={24}>Boiling point / K for each halide and its parent</Text>
      <Chart frame={BP_FRAME} yTicks={[0, 100, 200, 300, 400]} yTitle="b.p. / K">
        <line
          x1={BP_FRAME.x}
          x2={BP_FRAME.x + BP_FRAME.width}
          y1={sy(BP_FRAME, ROOM_TEMP_K)}
          y2={sy(BP_FRAME, ROOM_TEMP_K)}
          stroke="var(--accent)"
          strokeWidth={2}
          strokeDasharray="6 5"
        />
        <Bars frame={BP_FRAME} bars={bars} width={BAR_WIDTH} />
        <text x={BP_FRAME.x + 6} y={sy(BP_FRAME, ROOM_TEMP_K) - 6} fontSize={14} fill="var(--accent)">
          298 K
        </text>
      </Chart>
      {labels}
      <Text x={W / 2} y={428} muted>Outlined bar: gas at 298 K. Filled bar: liquid or solid.</Text>
      <Text x={W / 2} y={450} muted>Grey: parent alkane. Standard data, not NCERT printed values.</Text>
    </g>
  )
}

/** A skeletal formula with its name under it, centred on x. */
function MoleculeCard({ x, graph, names }: {
  x: number
  graph: Parameters<typeof SkeletalFormula>[0]['graph']
  names: readonly string[]
}) {
  return (
    <g>
      <SkeletalFormula graph={graph} scale={40} x={x} y={110} />
      {names.map((line, i) => (
        <Text key={line} x={x} y={180 + i * 20}>
          {line}
        </Text>
      ))}
    </g>
  )
}

const BROMOBUTANE_NAMES: readonly (readonly string[])[] = [
  ['1-bromobutane'],
  ['2-bromobutane'],
  ['2-bromo-2-methyl', 'propane'],
]
const CARD_X = [98, 290, 482] as const
/** Step 3 cards sit further from the y-axis so the leftmost bar label clears it. */
const DCB_CARD_X = [140, 312, 484] as const

/** Step 2: three C₄H₉Br isomers, the bars falling as the shape gets more compact. */
function ShapeBars() {
  const compactX = CARD_X[2]
  return (
    <g>
      <Text x={W / 2} y={28}>Three isomers, all C₄H₉Br</Text>
      {BROMOBUTANES.map((b, i) => (
        <MoleculeCard key={b.smiles} x={CARD_X[i]} graph={b.graph} names={BROMOBUTANE_NAMES[i]} />
      ))}
      <ellipse
        cx={compactX}
        cy={110}
        rx={96}
        ry={56}
        fill="none"
        stroke="var(--fg-muted)"
        strokeWidth={1.5}
        strokeDasharray="4 4"
      />
      <Chart frame={BP_STRIP} yTicks={[0, 200, 400]} yTitle="b.p. / K">
        <Bars
          frame={BP_STRIP}
          width={44}
          bars={BROMOBUTANES.map((b, i) => ({ cx: CARD_X[i] - BP_STRIP.x, bpK: b.bpK, fill: HALOGEN_TONE.Br, gas: false }))}
        />
      </Chart>
      <Text x={W / 2} y={428} muted>Branching lowers the boiling point: the compact isomer boils lowest.</Text>
      <Text x={W / 2} y={450} muted>NCERT printed boiling points.</Text>
    </g>
  )
}

/** Step 3: the dichlorobenzene isomers, boiling points close, melting point highest for para. */
function PackingBars() {
  return (
    <g>
      <Text x={W / 2} y={22}>Dichlorobenzenes: b.p. and m.p. / K</Text>
      {DICHLOROBENZENES.map((d, i) => (
        <g key={d.smiles}>
          <Text x={DCB_CARD_X[i]} y={48} muted>{d.isomer}</Text>
          <SkeletalFormula graph={d.graph} scale={40} x={DCB_CARD_X[i]} y={118} />
          <Text x={DCB_CARD_X[i]} y={198}>{d.name.toLowerCase()}</Text>
        </g>
      ))}
      <Chart frame={DCB_FRAME} yTicks={[0, 250, 500]} yTitle="temperature / K">
        <Bars
          frame={DCB_FRAME}
          width={22}
          bars={DICHLOROBENZENES.flatMap((d, i) => [
            { cx: DCB_CARD_X[i] - DCB_FRAME.x - 12, bpK: d.bpK, fill: 'var(--fg-muted)', gas: false },
            { cx: DCB_CARD_X[i] - DCB_FRAME.x + 12, bpK: d.mpK, fill: 'var(--accent)', gas: false },
          ])}
        />
      </Chart>
      <Text x={W / 2} y={428} muted>Left bar: boiling point. Right bar: melting point.</Text>
      <Text x={W / 2} y={450} muted>The para isomer packs best, so it melts highest.</Text>
    </g>
  )
}

/** A Table 6.3 liquid layer: a stronger tone than water, with a darker edge so each layer reads. */
const LIQUID_LAYER = { fill: 'var(--accent)', fillOpacity: 0.3, stroke: 'var(--accent)', strokeWidth: 1.5 } as const

/** One test tube with water and one Table 6.3 liquid, which sinks or floats. */
function Tube({ cx, unicode, printed, floats }: {
  cx: number
  unicode: string
  printed: string
  floats: boolean
}) {
  const x0 = cx - 26
  const x1 = cx + 26
  const top = 70
  const bottom = 330
  const waterTop = 150
  const wall = `M ${x0} ${top} L ${x0} ${bottom - 26} A 26 26 0 0 0 ${x1} ${bottom - 26} L ${x1} ${top}`
  const waterPath = `M ${x0 + 2} ${waterTop} L ${x0 + 2} ${bottom - 28} A 24 24 0 0 0 ${x1 - 2} ${bottom - 28} L ${x1 - 2} ${waterTop} Z`
  const sinkTop = bottom - 72
  const sinkPath = `M ${x0 + 2} ${sinkTop} L ${x0 + 2} ${bottom - 28} A 24 24 0 0 0 ${x1 - 2} ${bottom - 28} L ${x1 - 2} ${sinkTop} Z`
  return (
    <g>
      <path d={`${wall} Z`} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      <path d={waterPath} fill="var(--accent-soft)" />
      {floats ? (
        <rect x={x0 + 2} y={waterTop - 50} width={x1 - x0 - 4} height={50} {...LIQUID_LAYER} />
      ) : (
        <path d={sinkPath} {...LIQUID_LAYER} />
      )}
      <path d={`${wall}`} fill="none" stroke="var(--glass-wall)" strokeWidth={2} />
      <Text x={cx} y={356}>{unicode}</Text>
      <Text x={cx} y={376}>{printed}</Text>
      <Text x={cx} y={396} muted>{floats ? 'floats' : 'sinks'}</Text>
    </g>
  )
}

/** Step 4: Table 6.3 liquids dropped into water, with their densities. */
function LayeringTubes() {
  return (
    <g>
      <Text x={W / 2} y={28}>Water: 1.00 g mL⁻¹. Liquids: density in g mL⁻¹</Text>
      {LAYERING_LIQUIDS.map((liquid, i) => (
        <Tube
          key={liquid.ce}
          cx={56 + 96 * i}
          unicode={liquid.unicode}
          printed={liquid.printed}
          floats={liquid.floats}
        />
      ))}
      <Text x={W / 2} y={438} muted>Liquids that sink lie under the water; n-C₃H₇Cl floats on it.</Text>
      <Text x={W / 2} y={460} muted>Densities from NCERT Table 6.3.</Text>
    </g>
  )
}

const LATTICE = [
  [44, 120], [140, 120], [236, 120],
  [44, 200], [140, 200], [236, 200],
  [44, 280], [140, 280], [236, 280],
] as const
const CENTRE = 4

/** Water (or solvent) molecules on a grid, with the haloalkane at the centre. */
function Lattice({ x0, hbond }: { x0: number; hbond: boolean }) {
  const cells = LATTICE.map(([px, py]) => [px + x0, py] as const)
  const near = (a: number, b: number) => {
    const [ax, ay] = LATTICE[a]
    const [bx, by] = LATTICE[b]
    return (Math.abs(ax - bx) === 96 && ay === by) || (ax === bx && Math.abs(ay - by) === 80)
  }
  const pairs: Array<[number, number]> = []
  for (let a = 0; a < LATTICE.length; a++) {
    for (let b = a + 1; b < LATTICE.length; b++) {
      if (a !== CENTRE && b !== CENTRE && near(a, b)) pairs.push([a, b])
    }
  }
  const contacts = [1, 3, 5, 7]
  return (
    <g>
      {pairs.map(([a, b]) => (
        <line
          key={`${a}-${b}`}
          x1={cells[a][0]}
          y1={cells[a][1]}
          x2={cells[b][0]}
          y2={cells[b][1]}
          stroke={hbond ? 'var(--accent)' : 'var(--fg-subtle)'}
          strokeWidth={hbond ? 1.8 : 1.2}
          strokeDasharray={hbond ? '5 4' : undefined}
        />
      ))}
      {contacts.map((c) => (
        <line
          key={`c-${c}`}
          x1={cells[CENTRE][0]}
          y1={cells[CENTRE][1]}
          x2={cells[c][0]}
          y2={cells[c][1]}
          stroke="var(--fg-muted)"
          strokeWidth={hbond ? 1.2 : 2}
          strokeDasharray={hbond ? '2 4' : undefined}
        />
      ))}
      {cells.map(([cx, cy], i) =>
        i === CENTRE ? null : (
          <circle
            key={`m-${i}`}
            cx={cx}
            cy={cy}
            r={11}
            fill={hbond ? 'var(--accent-soft)' : 'var(--surface)'}
            stroke={hbond ? 'var(--accent)' : 'var(--fg-muted)'}
            strokeWidth={1.5}
          />
        )
      )}
      {/* A background card lifts the haloalkane above the contact lines that meet its cell. */}
      <rect
        x={cells[CENTRE][0] - 58}
        y={cells[CENTRE][1] - 34}
        width={116}
        height={68}
        rx={10}
        fill="var(--surface)"
        stroke="var(--fg-subtle)"
        strokeWidth={1}
      />
      <SkeletalFormula graph={SOLVENT_HALOALKANE.graph} scale={40} x={cells[CENTRE][0]} y={cells[CENTRE][1]} />
    </g>
  )
}

/** Step 5: the haloalkane in water (weaker new contacts) and in an organic solvent (equal contacts). */
function BreakingBonds() {
  return (
    <g>
      <Text x={140} y={40}>In water</Text>
      <Text x={440} y={40}>In an organic solvent</Text>
      <line x1={290} x2={290} y1={60} y2={300} stroke="var(--fg-subtle)" strokeWidth={1} />
      <Lattice x0={0} hbond />
      <Lattice x0={300} hbond={false} />
      <Text x={140} y={334}>Hydrogen bonds break;</Text>
      <Text x={140} y={356}>the new contacts are weaker.</Text>
      <Text x={440} y={334}>Attractions of equal</Text>
      <Text x={440} y={356}>strength: the liquids mix.</Text>
      <Text x={W / 2} y={440} muted>Dashed lines: hydrogen bonds between water molecules.</Text>
      <Text x={W / 2} y={462} muted>Schematic: no numbers are implied.</Text>
    </g>
  )
}

const STEP_TITLES: readonly string[] = [
  'Boiling points climb from methyl to propyl and from F to I, above each parent alkane',
  'Compact isomers boil lower',
  'Para dichlorobenzene melts highest',
  'Dense liquids sink in water, n-propyl chloride floats',
  'Haloalkanes dissolve only slightly in water',
]

export function HalidePhysical({ step }: HalidePhysicalProps) {
  const index = Math.min(Math.max(0, step), HALIDE_STEP_COUNT - 1)
  let drawing: ReactNode
  switch (index) {
    case 0:
      drawing = <ClimbingBars />
      break
    case 1:
      drawing = <ShapeBars />
      break
    case 2:
      drawing = <PackingBars />
      break
    case 3:
      drawing = <LayeringTubes />
      break
    default:
      drawing = <BreakingBonds />
  }
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={STEP_TITLES[index]}>
      {drawing}
    </svg>
  )
}
