'use client'

import {
  ConfigurationBoxes,
  DBlockStrip,
  SERIES_TONE,
  dBlockStripHeight,
  type SubshellConfig,
} from '@/components/vocab/dblock'
import { NCERT_ALLOY_FACTS } from '@/lib/chem/ncert-c12-unit4-tables'
import {
  APPLICATION_STEPS,
  copperPotentialLabel,
  metallicRadiusPm,
  overallEquation,
  titaniumIVdCount,
  zieglerRepresentative,
} from './applications-steps'

export interface DBlockApplicationsProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const STRIP_Y = 6
const ZONE_Y = STRIP_Y + dBlockStripHeight(false) + 14
/** Caption box position inside the zone. */
const CAPTION_Y = 292
const H = ZONE_Y + 366

const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const LINE = 'var(--border)'
const PANEL = 'var(--surface-raised)'

/** One tone per element, the same as in the other Sections (R6). Series tones for metals without a token. */
const METAL: Record<string, string> = {
  Fe: 'var(--metal-fe)',
  Ni: 'var(--metal-ni)',
  Cu: 'var(--metal-cu)',
  Ag: 'var(--metal-ag)',
  Zn: 'var(--metal-zn)',
  Au: 'var(--metal-generic)',
  Cr: SERIES_TONE['3d'],
  Mn: SERIES_TONE['3d'],
  Ti: SERIES_TONE['3d'],
  V: SERIES_TONE['3d'],
  Pd: SERIES_TONE['4d'],
}

function Caption({ text }: { text: string }) {
  return (
    <g>
      <rect x={10} y={CAPTION_Y} width={W - 20} height={66} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={24} y={CAPTION_Y + 22} fontSize={14} fill={MUTED}>
        Property that makes it work
      </text>
      <text x={24} y={CAPTION_Y + 48} fontSize={14} fill={INK}>
        {text}
      </text>
    </g>
  )
}

/** Step 1: an iron girder, a close-up of the lattice with Cr, Mn and Ni sites, and the radii from Table 4.2. */
function AlloyStep() {
  const cols = 6
  const rows = 4
  const sites = [
    { r: 0, c: 1, sym: 'Cr' },
    { r: 1, c: 4, sym: 'Mn' },
    { r: 3, c: 2, sym: 'Ni' },
  ]
  const alloy = new Map(sites.map((s) => [`${s.r},${s.c}`, s.sym]))
  const chips = ['Fe', 'Cr', 'Mn', 'Ni']
  return (
    <g>
      <rect x={36} y={60} width={218} height={16} fill={METAL.Fe} />
      <rect x={124} y={76} width={30} height={90} fill={METAL.Fe} />
      <rect x={36} y={166} width={218} height={16} fill={METAL.Fe} />
      <text x={145} y={206} fontSize={14} fill={INK} textAnchor="middle">
        steel girder
      </text>

      <rect x={290} y={18} width={276} height={180} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={304} y={40} fontSize={14} fill={INK}>
        iron lattice, close-up
      </text>
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => {
          const sym = alloy.get(`${r},${c}`)
          const cx = 316 + c * 40
          const cy = 72 + r * 36
          return (
            <g key={`${r}-${c}`}>
              <circle cx={cx} cy={cy} r={sym ? 15 : 13} fill={METAL[sym ?? 'Fe']} />
              {sym ? (
                <text x={cx} y={cy + 5} fontSize={13} fill={INK} textAnchor="middle">
                  {sym}
                </text>
              ) : null}
            </g>
          )
        })
      )}

      {chips.map((sym, i) => {
        const x = 20 + i * 138
        return (
          <g key={sym}>
            <circle cx={x + 8} cy={226} r={8} fill={METAL[sym]} />
            <text x={x + 22} y={231} fontSize={14} fill={INK}>
              {`${sym} ${metallicRadiusPm(sym)} pm`}
            </text>
          </g>
        )
      })}
      <path d="M20 250 V256 H560 V250" fill="none" stroke={MUTED} strokeWidth={1.5} />
      <text x={290} y={274} fontSize={14} fill={INK} textAnchor="middle">
        {`Each radius lies within about ${NCERT_ALLOY_FACTS.radiusSimilarityPercent} % of iron’s`}
      </text>
    </g>
  )
}

/** Step 2: a coin with Cu, Ag and Au tiles, and a beaker of dilute acid with Zn and Cu. */
function CoinStep() {
  const tiles = [
    { sym: 'Cu', x: 20 },
    { sym: 'Ag', x: 112 },
    { sym: 'Au', x: 204 },
  ]
  return (
    <g>
      <circle cx={150} cy={80} r={50} fill={METAL.Au} stroke={LINE} strokeWidth={3} />
      <circle cx={150} cy={80} r={38} fill="none" stroke={LINE} strokeWidth={1.5} />
      <text x={150} y={150} fontSize={14} fill={INK} textAnchor="middle">
        a coin
      </text>
      {tiles.map((t) => (
        <g key={t.sym}>
          <rect x={t.x} y={178} width={84} height={54} rx={6} fill={METAL[t.sym]} />
          <text x={t.x + 42} y={252} fontSize={14} fill={INK} textAnchor="middle">
            {t.sym}
          </text>
        </g>
      ))}

      <text x={330} y={40} fontSize={14} fill={INK}>
        {`E°(Cu²⁺/Cu) = ${copperPotentialLabel()}`}
      </text>
      <text x={330} y={62} fontSize={14} fill={MUTED}>
        the only positive 3d value
      </text>

      <rect x={352} y={168} width={166} height={94} fill="var(--ion-colourless)" />
      <path d="M350 120 V250 Q350 262 362 262 H508 Q520 262 520 250 V120" fill="none" stroke={MUTED} strokeWidth={3} />
      <rect x={390} y={150} width={16} height={100} rx={3} fill={METAL.Zn} />
      <rect x={444} y={160} width={24} height={90} rx={3} fill={METAL.Cu} />
      {[
        [398, 142, 3],
        [402, 130, 3.5],
        [396, 118, 3],
      ].map(([cx, cy, r]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill="none" stroke={MUTED} strokeWidth={1.5} />
      ))}
      <text x={435} y={284} fontSize={14} fill={MUTED} textAnchor="middle">
        dilute acid
      </text>
    </g>
  )
}

/** Step 3: a paint can with Ti⁴⁺ (empty d set) and a torch cell with MnO₂. */
function PaintTorchStep() {
  const config: SubshellConfig[] = [{ subshell: '3d', electrons: titaniumIVdCount() }]
  const boxWidth = 190
  const boxMax = 26
  return (
    <g>
      <rect x={24} y={74} width={226} height={160} rx={10} fill={PANEL} stroke={LINE} strokeWidth={2} />
      <rect x={24} y={64} width={226} height={14} rx={4} fill={LINE} />
      <text x={137} y={56} fontSize={14} fill={INK} textAnchor="middle">
        paint can
      </text>
      <text x={137} y={104} fontSize={16} fill={INK} textAnchor="middle">
        Ti⁴⁺
      </text>
      <ConfigurationBoxes config={config} x={137 - boxWidth / 2} y={116} width={boxWidth} maxSize={boxMax} />
      <text x={137} y={256} fontSize={14} fill={INK} textAnchor="middle">
        no d–d transition
      </text>

      <line x1={250} y1={154} x2={300} y2={154} stroke="var(--electron)" strokeWidth={2} strokeDasharray="4 4" />

      <rect x={300} y={74} width={112} height={160} rx={12} fill={PANEL} stroke={LINE} strokeWidth={2} />
      <rect x={314} y={62} width={84} height={14} rx={4} fill={LINE} />
      <text x={356} y={52} fontSize={14} fill={INK} textAnchor="middle">
        torch cell
      </text>
      <text x={356} y={108} fontSize={16} fill={INK} textAnchor="middle">
        MnO₂
      </text>
      {[
        [330, 140],
        [356, 164],
        [382, 140],
      ].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={11} fill={METAL.Mn} />
      ))}
      <text x={356} y={256} fontSize={14} fill={INK} textAnchor="middle">
        Mn changes oxidation state
      </text>
    </g>
  )
}

/** Step 4: the V₂O₅ bed (SO₂ + O₂ → SO₃) above the PdCl₂ reactor (ethene → ethanal). */
function ReactorStep() {
  const contact = overallEquation('Contact process')
  const wacker = overallEquation('Wacker process')
  return (
    <g>
      <rect x={120} y={22} width={340} height={92} rx={12} fill={PANEL} stroke={LINE} strokeWidth={2} />
      {Array.from({ length: 7 }, (_, i) => (
        <circle key={i} cx={160 + i * 40} cy={86} r={11} fill={METAL.V} />
      ))}
      <path d="M190 62 Q230 40 270 62" fill="none" stroke="var(--electron)" strokeWidth={2} />
      <path d="M310 62 Q350 40 390 62" fill="none" stroke="var(--electron)" strokeWidth={2} />
      <text x={230} y={36} fontSize={14} fill="var(--electron)" textAnchor="middle">
        e⁻
      </text>
      <text x={350} y={36} fontSize={14} fill="var(--electron)" textAnchor="middle">
        e⁻
      </text>
      <line x1={24} y1={68} x2={118} y2={68} stroke={MUTED} strokeWidth={2} />
      <polygon points="118,62 126,68 118,74" fill={MUTED} />
      <text x={70} y={56} fontSize={14} fill={INK} textAnchor="middle">
        SO₂ + O₂
      </text>
      <line x1={462} y1={68} x2={556} y2={68} stroke={MUTED} strokeWidth={2} />
      <polygon points="548,62 556,68 548,74" fill={MUTED} />
      <text x={510} y={56} fontSize={14} fill={INK} textAnchor="middle">
        SO₃
      </text>
      <text x={290} y={130} fontSize={14} fill={MUTED} textAnchor="middle">
        Contact process, V₂O₅ bed
      </text>
      <text x={290} y={150} fontSize={16} fill={INK} textAnchor="middle">
        {contact}
      </text>

      <rect x={120} y={176} width={340} height={58} rx={12} fill={PANEL} stroke={LINE} strokeWidth={2} />
      {Array.from({ length: 5 }, (_, i) => (
        <circle key={i} cx={170 + i * 60} cy={205} r={10} fill={METAL.Pd} />
      ))}
      <line x1={24} y1={205} x2={118} y2={205} stroke={MUTED} strokeWidth={2} />
      <polygon points="118,199 126,205 118,211" fill={MUTED} />
      <text x={70} y={193} fontSize={14} fill={INK} textAnchor="middle">
        C₂H₄ + O₂
      </text>
      <line x1={462} y1={205} x2={556} y2={205} stroke={MUTED} strokeWidth={2} />
      <polygon points="548,199 556,205 548,211" fill={MUTED} />
      <text x={510} y={193} fontSize={14} fill={INK} textAnchor="middle">
        CH₃CHO
      </text>
      <text x={290} y={252} fontSize={14} fill={MUTED} textAnchor="middle">
        Wacker, PdCl₂: Pd(II) ⇄ Pd(0)
      </text>
      <text x={290} y={274} fontSize={16} fill={INK} textAnchor="middle">
        {wacker}
      </text>
    </g>
  )
}

/** Step 5: iron, nickel and titanium surfaces that hold reactants (adsorption). */
function SurfaceStep() {
  const panels = [
    { x: 10, title: 'Fe surface', metal: 'Fe' },
    { x: 200, title: 'Ni surface', metal: 'Ni' },
    { x: 390, title: 'Ti surface', metal: 'Ti' },
  ]
  const haber = overallEquation('Haber process')
  const zieglerEq = zieglerRepresentative()
  return (
    <g>
      {panels.map((p) => (
        <g key={p.metal}>
          <rect x={p.x} y={14} width={180} height={198} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
          <text x={p.x + 90} y={38} fontSize={14} fill={INK} textAnchor="middle">
            {p.title}
          </text>
          {Array.from({ length: 6 }, (_, i) => (
            <circle key={i} cx={p.x + 18 + i * 28} cy={186} r={11} fill={METAL[p.metal]} />
          ))}
        </g>
      ))}

      {/* Fe: N₂ and H₂ adsorb, bonds weaken (glow), NH₃ leaves */}
      <circle cx={70} cy={186} r={20} fill="none" stroke="var(--electron)" strokeWidth={3} opacity={0.6} />
      <circle cx={114} cy={186} r={20} fill="none" stroke="var(--electron)" strokeWidth={3} opacity={0.6} />
      <line x1={40} y1={96} x2={52} y2={96} stroke={MUTED} strokeWidth={3} />
      <circle cx={40} cy={96} r={6} fill="var(--accent)" />
      <circle cx={52} cy={96} r={6} fill="var(--accent)" />
      <line x1={110} y1={96} x2={122} y2={96} stroke={MUTED} strokeWidth={3} />
      <circle cx={110} cy={96} r={6} fill={MUTED} />
      <circle cx={122} cy={96} r={6} fill={MUTED} />
      <line x1={50} y1={112} x2={64} y2={162} stroke={MUTED} strokeDasharray="4 4" />
      <line x1={120} y1={112} x2={112} y2={162} stroke={MUTED} strokeDasharray="4 4" />
      <line x1={150} y1={150} x2={160} y2={82} stroke={INK} strokeWidth={2} />
      <polygon points="160,82 156,92 166,92" fill={INK} />
      <text x={154} y={70} fontSize={14} fill={INK} textAnchor="middle">
        NH₃
      </text>

      {/* Ni: H₂ on the surface and a fat chain lying on it */}
      <circle cx={226 + 16} cy={164} r={5} fill={MUTED} />
      <circle cx={226 + 28} cy={164} r={5} fill={MUTED} />
      <polyline
        points="296,162 306,146 316,162 326,146 336,162 346,146 356,162"
        fill="none"
        stroke={MUTED}
        strokeWidth={5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Ti: ethene adds to a growing polythene chain */}
      <circle cx={466} cy={100} r={7} fill={MUTED} />
      <circle cx={482} cy={100} r={7} fill={MUTED} />
      <polyline
        points="496,172 506,158 516,172 526,158 536,172 546,158 556,172"
        fill="none"
        stroke={INK}
        strokeWidth={2.5}
        strokeLinejoin="round"
      />

      <text x={100} y={236} fontSize={14} fill={INK} textAnchor="middle">
        {haber}
      </text>
      <text x={290} y={236} fontSize={14} fill={INK} textAnchor="middle">
        H₂ and a fat chain on Ni
      </text>
      <text x={290} y={256} fontSize={13} fill={MUTED} textAnchor="middle">
        Ziegler, representative:
      </text>
      <text x={290} y={274} fontSize={14} fill={INK} textAnchor="middle">
        {zieglerEq}
      </text>
    </g>
  )
}

/** Step 6: AgBr grains in film; light turns exposed grains to dark silver. */
function FilmStep() {
  const cells = Array.from({ length: 3 }, (_, r) =>
    Array.from({ length: 10 }, (_, c) => ({ r, c, cx: 92 + c * 44, cy: 108 + r * 32, exposed: c < 4 }))
  ).flat()
  return (
    <g>
      <polygon points="40,30 240,30 214,62 66,62" fill="var(--db-beam)" opacity={0.4} />
      <text x={40} y={22} fontSize={14} fill={INK}>
        bright light
      </text>
      <rect x={40} y={66} width={500} height={150} rx={6} fill={PANEL} stroke={LINE} strokeWidth={2} />
      {Array.from({ length: 10 }, (_, i) => (
        <g key={i}>
          <rect x={56 + i * 48} y={72} width={20} height={8} fill="var(--surface)" />
          <rect x={56 + i * 48} y={200} width={20} height={8} fill="var(--surface)" />
        </g>
      ))}
      {cells.map((g) =>
        g.exposed ? (
          <circle key={`${g.r}-${g.c}`} cx={g.cx} cy={g.cy} r={7} fill={INK} opacity={0.85} />
        ) : (
          <circle key={`${g.r}-${g.c}`} cx={g.cx} cy={g.cy} r={6} fill={METAL.Ag} opacity={0.45} />
        )
      )}
      <text x={290} y={238} fontSize={14} fill={INK} textAnchor="middle">
        pale grains: AgBr
      </text>
      <text x={290} y={258} fontSize={14} fill={MUTED} textAnchor="middle">
        dark specks: silver metal (Ag)
      </text>
    </g>
  )
}

const DRAWINGS = [AlloyStep, CoinStep, PaintTorchStep, ReactorStep, SurfaceStep, FilmStep] as const

/** Section 11 Scrolly: a d-block strip lights up one application per Step, with its drawing and property. */
export function DBlockApplications({ step }: DBlockApplicationsProps) {
  const index = Math.min(Math.max(step, 0), APPLICATION_STEPS.length - 1)
  const current = APPLICATION_STEPS[index]
  const Drawing = DRAWINGS[index]
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Applications of d-block metals">
      <g transform={`translate(0 ${STRIP_Y})`}>
        <DBlockStrip x={4} y={0} highlight={[...current.highlight]} />
      </g>
      <g transform={`translate(0 ${ZONE_Y})`}>
        <Drawing />
        <Caption text={current.property} />
      </g>
    </svg>
  )
}
