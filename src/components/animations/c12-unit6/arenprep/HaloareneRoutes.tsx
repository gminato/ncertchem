import { CurvedArrow, SkeletalFormula, drawingFrame, type SkeletalMark } from '@/components/organic'
import { HALOGEN_TONE } from '@/components/vocab/organic6/tones'
import { Sub, Sup } from '@/components/animations/c12-unit1/ChemSvg'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  BENZENE,
  BROMOBENZENE,
  CHLOROBENZENE,
  IODOBENZENE,
  ANILINE,
  ORTHO_CHLOROTOLUENE,
  PARA_CHLOROTOLUENE,
  SANDMEYER_ROUTES,
  TOLUENE,
  TOLUENE_ORTHO,
  TOLUENE_PARA,
  namedMolecule,
} from './arenprep-steps'

export interface HaloareneRoutesProps {
  step: number
  reducedMotion?: boolean
}

const VIEW_W = 580
const VIEW_H = 400

const graphs = new Map<string, MolGraph>()
function graphOf(smiles: string): MolGraph {
  let g = graphs.get(smiles)
  if (!g) {
    g = parseSmiles(smiles)
    graphs.set(smiles, g)
  }
  return g
}

/** Absolute position of atom `i` when the drawing of `smiles` is centred at (x, y). */
function atomAt(smiles: string, scale: number, x: number, y: number, i: number): { x: number; y: number } {
  const p = drawingFrame(graphOf(smiles), scale).points[i]
  return { x: x + p.x, y: y + p.y }
}

/** Index of the atom furthest right (or left) in the drawing, for arrows that start at a ring. */
function edgeAtom(smiles: string, scale: number, side: 'right' | 'left'): number {
  const pts = drawingFrame(graphOf(smiles), scale).points
  let best = 0
  pts.forEach((p, i) => {
    if (side === 'right' ? p.x > pts[best].x : p.x < pts[best].x) best = i
  })
  return best
}

interface MolProps {
  smiles: string
  x: number
  y: number
  scale: number
  locants?: readonly SkeletalMark[]
  overlay?: React.ReactNode
}

function Mol({ smiles, x, y, scale, locants, overlay }: MolProps) {
  return (
    <SkeletalFormula graph={graphOf(smiles)} x={x} y={y} scale={scale} locants={locants} overlay={overlay} />
  )
}

/** A reaction arrow with a filled head at each requested end. */
function Arrow({
  x1,
  y1,
  x2,
  y2,
  double = false,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  double?: boolean
}) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const head = (px: number, py: number, dx: number, dy: number) => {
    const bx = px - dx * 14
    const by = py - dy * 14
    return `M${px} ${py} L${bx - dy * 7} ${by + dx * 7} L${bx + dy * 7} ${by - dx * 7} Z`
  }
  return (
    <g fill="var(--fg-muted)" stroke="var(--fg-muted)" strokeWidth={3} strokeLinecap="round">
      <line x1={x1} y1={y1} x2={x2 - ux * 12} y2={y2 - uy * 12} />
      <path d={head(x2, y2, ux, uy)} />
      {double && <path d={head(x1, y1, -ux, -uy)} />}
    </g>
  )
}

/** A delta-plus or delta-minus label: δ with a real superscript sign. */
function Delta({ x, y, sign }: { x: number; y: number; sign: '+' | '−' }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={18}
      fill={sign === '+' ? 'var(--delta-plus)' : 'var(--delta-minus)'}
    >
      δ<Sup>{sign}</Sup>
    </text>
  )
}

function Label({
  x,
  y,
  children,
  size = 17,
  weight,
  fill = 'var(--fg)',
  anchor = 'middle',
}: {
  x: number
  y: number
  children: React.ReactNode
  size?: number
  weight?: number
  fill?: string
  anchor?: 'start' | 'middle' | 'end'
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight={weight} fill={fill}>
      {children}
    </text>
  )
}

/** Step 1: benzene, and chlorine on a Lewis acid, one chlorine pulled electron-poor. */
function ChlorineHelper() {
  const edge = edgeAtom(BENZENE, 40, 'right')
  const start = atomAt(BENZENE, 40, 120, 170, edge)
  return (
    <g>
      <Mol smiles={BENZENE} x={120} y={170} scale={40} />
      <Label x={200} y={178} size={26}>
        +
      </Label>
      <line x1={252} y1={170} x2={300} y2={170} stroke="var(--bond)" strokeWidth={3} />
      <text x={236} y={178} textAnchor="middle" fontSize={22} fill={HALOGEN_TONE.Cl}>
        Cl
      </text>
      <text x={316} y={178} textAnchor="middle" fontSize={22} fill={HALOGEN_TONE.Cl}>
        Cl
      </text>
      <Delta x={236} y={148} sign="+" />
      <Delta x={316} y={148} sign="−" />
      <Label x={276} y={92} size={18}>
        FeCl<Sub>3</Sub>
      </Label>
      <Label x={276} y={114} size={16} fill="var(--fg-muted)">
        catalyst
      </Label>
      <CurvedArrow from={{ x: start.x + 6, y: start.y - 18 }} to={{ x: 226, y: 150 }} bend={0.45} />
      <Mol smiles={CHLOROBENZENE} x={460} y={170} scale={40} />
      <Label x={290} y={282} size={18}>
        C<Sub>6</Sub>H<Sub>6</Sub> + Cl<Sub>2</Sub> → C<Sub>6</Sub>H<Sub>5</Sub>
        Cl + HCl
      </Label>
      <Label x={290} y={316} size={16} fill="var(--fg-muted)">
        the FeCl₃ catalyst returns to the flask
      </Label>
    </g>
  )
}

/** Step 2: toluene with the ortho and para carbons marked, and the two products. */
function TolueneDoors() {
  const locants: SkeletalMark[] = [
    { atom: TOLUENE_ORTHO[0], label: 'o' },
    { atom: TOLUENE_ORTHO[1], label: 'o' },
    { atom: TOLUENE_PARA, label: 'p' },
  ]
  const ortho = namedMolecule(ORTHO_CHLOROTOLUENE).name
  const para = namedMolecule(PARA_CHLOROTOLUENE).name
  return (
    <g>
      <Mol smiles={TOLUENE} x={120} y={200} scale={40} locants={locants} />
      <Label x={120} y={96} size={16} fill="var(--fg-muted)">
        CH₃ pushes electrons into the ring
      </Label>
      <Label x={270} y={44} size={17}>
        Cl₂, FeCl₃, in the dark
      </Label>
      <Arrow x1={220} y1={180} x2={330} y2={112} />
      <Arrow x1={220} y1={222} x2={330} y2={290} />
      <Mol smiles={ORTHO_CHLOROTOLUENE} x={430} y={84} scale={40} />
      <Label x={430} y={172} size={18} weight={700}>
        ortho
      </Label>
      <Label x={430} y={194} size={16}>
        {ortho}
      </Label>
      <Mol smiles={PARA_CHLOROTOLUENE} x={430} y={290} scale={40} />
      <Label x={430} y={350} size={18} weight={700}>
        para
      </Label>
      <Label x={430} y={372} size={16}>
        {para}
      </Label>
    </g>
  )
}

/** Step 3: the two isomers separated by cooling and filtering. */
function Separation() {
  const lattice: Array<[number, number]> = []
  for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) lattice.push([118 + c * 14, 120 + r * 14])
  return (
    <g>
      <path
        d="M134 56 H166 V112 L204 262 Q210 296 176 296 H124 Q90 296 96 262 L134 112 Z"
        fill="var(--surface)"
        stroke="var(--bond)"
        strokeWidth={3}
      />
      <path d="M108 214 H192 L201 262 Q206 296 176 296 H124 Q90 296 99 262 Z" fill="var(--liquid)" />
      {lattice.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={9} height={9} rx={1.5} fill="var(--accent)" />
      ))}
      <Label x={150} y={336} size={16} fill="var(--fg-muted)">
        cool the mixture, then filter
      </Label>
      <Mol smiles={PARA_CHLOROTOLUENE} x={430} y={100} scale={40} />
      <Label x={430} y={160} size={17} weight={700}>
        para: solid first
      </Label>
      <Mol smiles={ORTHO_CHLOROTOLUENE} x={430} y={226} scale={40} />
      <Label x={430} y={316} size={17} weight={700}>
        ortho: stays liquid
      </Label>
    </g>
  )
}

/** Step 4: iodination is an equilibrium; nitric acid removes the HI. */
function IodineWalksBack() {
  return (
    <g>
      <Mol smiles={BENZENE} x={112} y={150} scale={34} />
      <Label x={186} y={158} size={24}>
        +
      </Label>
      <text x={226} y={158} textAnchor="middle" fontSize={22} fill={HALOGEN_TONE.I}>
        I
      </text>
      <line x1={234} y1={150} x2={254} y2={150} stroke="var(--bond)" strokeWidth={3} />
      <text x={262} y={158} textAnchor="middle" fontSize={22} fill={HALOGEN_TONE.I}>
        I
      </text>
      <Arrow x1={296} y1={150} x2={384} y2={150} double />
      <Label x={340} y={118} size={18}>
        HI
      </Label>
      <Mol smiles={IODOBENZENE} x={478} y={150} scale={40} />
      <rect
        x={232}
        y={250}
        width={136}
        height={42}
        rx={8}
        fill="var(--caution-soft)"
        stroke="var(--caution)"
      />
      <Label x={300} y={277} size={18}>
        HNO₃
      </Label>
      <CurvedArrow from={{ x: 300, y: 244 }} to={{ x: 336, y: 150 }} bend={-0.35} />
      <Label x={300} y={318} size={16} fill="var(--fg-muted)">
        oxidises HI to I₂
      </Label>
      <Label x={300} y={342} size={16} fill="var(--fg-muted)">
        the I₂ returns to the mixture
      </Label>
    </g>
  )
}

/** Step 5: fluorine route crossed out, with a burst at the ring and no product. */
function FluorineCrossed() {
  const burst: string[] = []
  for (let k = 0; k < 24; k++) {
    const r = k % 2 === 0 ? 92 : 74
    const a = (k / 24) * Math.PI * 2
    burst.push(`${(140 + Math.cos(a) * r).toFixed(1)},${(190 + Math.sin(a) * r).toFixed(1)}`)
  }
  return (
    <g>
      <polygon points={burst.join(' ')} fill="none" stroke="var(--caution)" strokeWidth={2.5} />
      <Mol smiles={BENZENE} x={140} y={190} scale={38} />
      <Arrow x1={230} y1={190} x2={362} y2={190} />
      <text x={420} y={198} textAnchor="middle" fontSize={24} fill={HALOGEN_TONE.F}>
        F
      </text>
      <line x1={434} y1={190} x2={470} y2={190} stroke="var(--bond)" strokeWidth={3} />
      <text x={484} y={198} textAnchor="middle" fontSize={24} fill={HALOGEN_TONE.F}>
        F
      </text>
      <g stroke="var(--red)" strokeWidth={7} strokeLinecap="round">
        <line x1={268} y1={150} x2={326} y2={228} />
        <line x1={326} y1={150} x2={268} y2={228} />
      </g>
      <Label x={290} y={320} size={24} weight={700} fill="var(--red)">
        Not made this way
      </Label>
      <Label x={290} y={352} size={16} fill="var(--fg-muted)">
        fluorine reacts too violently to control
      </Label>
    </g>
  )
}

/** Step 6: aniline to the diazonium salt, then three routes to the haloarene. */
function SandmeyerChain() {
  // The ipso carbon is atom 0 of benzene; the N2+ label sits just outside it.
  const ipso = drawingFrame(graphOf(BENZENE), 34).points[0]
  const diazonium = (
    <text x={ipso.x * 1.7} y={ipso.y * 1.7 + 6} textAnchor="middle" fontSize={17} fill="var(--fg)">
      N<Sub>2</Sub>
      <Sup>+</Sup>
    </text>
  )
  const rows = [80, 190, 300]
  const tags: Array<[number, number]> = [
    [352, 106],
    [354, 166],
    [352, 272],
  ]
  return (
    <g>
      <Mol smiles={ANILINE} x={92} y={190} scale={40} />
      <Label x={180} y={132} size={16} fill="var(--fg-muted)">
        HCl, NaNO₂
      </Label>
      <Label x={180} y={152} size={16} fill="var(--fg-muted)">
        cold
      </Label>
      <Arrow x1={184} y1={190} x2={222} y2={190} />
      <Mol smiles={BENZENE} x={268} y={190} scale={34} overlay={diazonium} />
      <Label x={268} y={250} size={16}>
        diazonium salt
      </Label>
      {SANDMEYER_ROUTES.map((route, i) => {
        const y = rows[i]
        const [tx, ty] = tags[i]
        return (
          <g key={route.reagent}>
            <Arrow x1={352} y1={190} x2={410} y2={y} />
            <Label x={tx} y={ty} size={16} fill="var(--fg)" anchor={i === 1 ? 'end' : 'middle'}>
              {route.reagent}
            </Label>
            <Mol smiles={route.product} x={470} y={y} scale={40} />
            <Label x={470} y={y + 52} size={15}>
              {namedMolecule(route.product).name}
            </Label>
          </g>
        )
      })}
      <Label x={290} y={384} size={16} fill="var(--fg-muted)">
        each route releases N₂ gas
      </Label>
    </g>
  )
}

const STEP_DRAWINGS = [
  ChlorineHelper,
  TolueneDoors,
  Separation,
  IodineWalksBack,
  FluorineCrossed,
  SandmeyerChain,
]

/** The Section 5 Scrolly visual: one static drawing per Step (no tween, so reduced motion changes nothing). */
export function HaloareneRoutes({ step }: HaloareneRoutesProps) {
  const index = Math.min(Math.max(Math.round(step), 0), STEP_DRAWINGS.length - 1)
  const Drawing = STEP_DRAWINGS[index]
  return (
    <svg viewBox={`0 0 ${VIEW_W} ${VIEW_H}`} width="100%" role="img" aria-label="Haloarene routes drawing">
      <Drawing />
    </svg>
  )
}
