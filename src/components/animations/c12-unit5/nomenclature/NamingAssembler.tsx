'use client'

import {
  ANION_LIGAND_ROWS,
  CHARGE_BALANCE_EXAMPLE,
  METAL_ENDING_PAIRS,
  NEUTRAL_SPECIAL_ROWS,
  namingStepId,
} from './naming-steps'

export interface NamingAssemblerProps {
  /** 0-based Step index from Scrolly. */
  step: number
  /** True when the Learner prefers reduced motion. */
  reducedMotion?: boolean
}

const W = 600
const H = 500

const TEXT = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const SURFACE = 'var(--surface)'
const RAISED = 'var(--surface-raised)'
const BORDER = 'var(--border)'
const METAL = 'var(--ox)'
const NEUTRAL = 'var(--accent)'
const ANION = 'var(--ion-anion)'
const CATION = 'var(--ion-cation)'
const SUCCESS = 'var(--success)'

function ArrowHead({ x, y, dir }: { x: number; y: number; dir: 'right' | 'down' }) {
  if (dir === 'right') {
    return <polygon points={`${x},${y} ${x - 10},${y - 5} ${x - 10},${y + 5}`} fill={MUTED} />
  }
  return <polygon points={`${x},${y} ${x - 5},${y - 10} ${x + 5},${y - 10}`} fill={METAL} />
}

/** Square bracket path of height h starting at (x, y). */
function SquareBracket({ x, y, h, side }: { x: number; y: number; h: number; side: 'left' | 'right' }) {
  const tick = side === 'left' ? 12 : -12
  const d = `M ${x + tick} ${y} L ${x} ${y} L ${x} ${y + h} L ${x + tick} ${y + h}`
  return <path d={d} fill="none" stroke={TEXT} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
}

function Tile({
  x,
  y,
  w,
  h,
  tone,
  dashed = false,
  opacity = 1,
  children,
}: {
  x: number
  y: number
  w: number
  h: number
  tone: string
  dashed?: boolean
  opacity?: number
  children: React.ReactNode
}) {
  return (
    <g opacity={opacity}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        fill={SURFACE}
        stroke={tone}
        strokeWidth={2}
        strokeDasharray={dashed ? '6 4' : undefined}
      />
      <rect x={x} y={y} width={w} height={h} rx={10} fill={tone} fillOpacity={0.14} />
      {children}
    </g>
  )
}

// ----- Step 1: The formula runs outward -----

function FormulaStep() {
  const rowY = 148
  const tileH = 92
  return (
    <g>
      <text x={W / 2} y={42} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
        Formula: [Co(NH₃)₄Cl₂]Cl
      </text>
      <text x={W / 2} y={70} textAnchor="middle" fontSize={16} fill={MUTED}>
        Coordination entity inside brackets, counter ion outside
      </text>

      <SquareBracket x={26} y={rowY - 12} h={tileH + 24} side="left" />

      <Tile x={44} y={rowY} w={94} h={tileH} tone={METAL}>
        <text x={91} y={rowY + 42} textAnchor="middle" fontSize={24} fontWeight={700} fill={TEXT}>
          Co
        </text>
        <text x={91} y={rowY + 72} textAnchor="middle" fontSize={16} fill={MUTED}>
          metal
        </text>
      </Tile>

      <Tile x={152} y={rowY} w={132} h={tileH} tone={NEUTRAL}>
        <text x={202} y={rowY + 42} textAnchor="middle" fontSize={22} fontWeight={700} fill={TEXT}>
          NH₃
        </text>
        <rect x={246} y={rowY + 12} width={28} height={28} rx={14} fill={NEUTRAL} />
        <text x={260} y={rowY + 32} textAnchor="middle" fontSize={16} fontWeight={700} fill="var(--accent-fg)">
          4
        </text>
        <text x={218} y={rowY + 72} textAnchor="middle" fontSize={16} fill={MUTED}>
          neutral
        </text>
      </Tile>

      <Tile x={298} y={rowY} w={116} h={tileH} tone={ANION}>
        <text x={342} y={rowY + 42} textAnchor="middle" fontSize={22} fontWeight={700} fill={TEXT}>
          Cl⁻
        </text>
        <rect x={376} y={rowY + 12} width={28} height={28} rx={14} fill={ANION} />
        <text x={390} y={rowY + 32} textAnchor="middle" fontSize={16} fontWeight={700} fill={SURFACE}>
          2
        </text>
        <text x={356} y={rowY + 72} textAnchor="middle" fontSize={16} fill={MUTED}>
          anion
        </text>
      </Tile>

      <SquareBracket x={428} y={rowY - 12} h={tileH + 24} side="right" />

      <Tile x={456} y={rowY} w={122} h={tileH} tone={ANION} dashed>
        <text x={517} y={rowY + 42} textAnchor="middle" fontSize={22} fontWeight={700} fill={TEXT}>
          Cl⁻
        </text>
        <text x={517} y={rowY + 72} textAnchor="middle" fontSize={16} fill={MUTED}>
          counter ion
        </text>
      </Tile>

      {/* Direction arrow below inner tiles */}
      <line x1={48} y1={288} x2={406} y2={288} stroke={MUTED} strokeWidth={2} />
      <ArrowHead x={414} y={288} dir="right" />
      <text x={230} y={322} textAnchor="middle" fontSize={17} fontWeight={600} fill={TEXT}>
        metal first, ligands outward
      </text>

      <rect x={44} y={362} width={512} height={86} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
      <text x={W / 2} y={394} textAnchor="middle" fontSize={16} fill={TEXT}>
        Square brackets enclose only the metal and its ligands.
      </text>
      <text x={W / 2} y={426} textAnchor="middle" fontSize={16} fill={MUTED}>
        Polyatomic ligands like (NH₃) take parentheses.
      </text>
    </g>
  )
}

// ----- Step 2: The name runs inward -----

function NameStep() {
  const topY = 74
  const topH = 66
  const botY = 236
  const botH = 74
  return (
    <g>
      <text x={W / 2} y={38} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
        Formula order vs naming order
      </text>

      {/* Compact Formula Row */}
      <SquareBracket x={38} y={topY - 8} h={topH + 16} side="left" />
      <Tile x={54} y={topY} w={84} h={topH} tone={METAL}>
        <text x={96} y={topY + 40} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
          Co
        </text>
      </Tile>
      <Tile x={150} y={topY} w={122} h={topH} tone={NEUTRAL}>
        <text x={211} y={topY + 40} textAnchor="middle" fontSize={19} fontWeight={700} fill={TEXT}>
          (NH₃)₄
        </text>
      </Tile>
      <Tile x={284} y={topY} w={100} h={topH} tone={ANION}>
        <text x={334} y={topY + 40} textAnchor="middle" fontSize={19} fontWeight={700} fill={TEXT}>
          Cl₂
        </text>
      </Tile>
      <SquareBracket x={398} y={topY - 8} h={topH + 16} side="right" />
      <Tile x={426} y={topY} w={110} h={topH} tone={ANION} dashed>
        <text x={481} y={topY + 40} textAnchor="middle" fontSize={19} fontWeight={700} fill={TEXT}>
          Cl⁻
        </text>
      </Tile>

      {/* Curved arrow from Co tile to cobalt(III) tile */}
      <path
        d="M 96 144 C 96 212, 396 188, 396 226"
        fill="none"
        stroke={METAL}
        strokeWidth={2.6}
        strokeLinecap="round"
      />
      <ArrowHead x={396} y={232} dir="down" />
      <text x={286} y={172} textAnchor="middle" fontSize={16} fontWeight={600} fill={METAL}>
        metal moves to the end of the entity
      </text>

      {/* Name Row */}
      <Tile x={16} y={botY} w={156} h={botH} tone={NEUTRAL}>
        <text x={94} y={botY + 34} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
          tetraammine
        </text>
        <text x={94} y={botY + 58} textAnchor="middle" fontSize={16} fill={MUTED}>
          ligand 1
        </text>
      </Tile>
      <Tile x={182} y={botY} w={132} h={botH} tone={ANION}>
        <text x={248} y={botY + 34} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
          dichlorido
        </text>
        <text x={248} y={botY + 58} textAnchor="middle" fontSize={16} fill={MUTED}>
          ligand 2
        </text>
      </Tile>
      <Tile x={324} y={botY} w={144} h={botH} tone={METAL}>
        <text x={396} y={botY + 34} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
          cobalt(III)
        </text>
        <text x={396} y={botY + 58} textAnchor="middle" fontSize={16} fill={MUTED}>
          metal
        </text>
      </Tile>
      <Tile x={478} y={botY} w={106} h={botH} tone={ANION} dashed>
        <text x={531} y={botY + 34} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
          chloride
        </text>
        <text x={531} y={botY + 58} textAnchor="middle" fontSize={16} fill={MUTED}>
          anion
        </text>
      </Tile>

      {/* Direction arrow under name row */}
      <line x1={22} y1={346} x2={460} y2={346} stroke={MUTED} strokeWidth={2} />
      <ArrowHead x={468} y={346} dir="right" />
      <text x={245} y={378} textAnchor="middle" fontSize={17} fontWeight={600} fill={TEXT}>
        ligands first, metal last
      </text>

      <rect x={24} y={408} width={552} height={58} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
      <text x={W / 2} y={443} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
        tetraamminedichloridocobalt(III) chloride
      </text>
    </g>
  )
}

// ----- Step 3: Sorting ignores the count -----

const STRIP_LETTERS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', '...', 'z']
const ACTIVE_LETTERS = new Set(['a', 'c', 'e'])

function SortingStep() {
  const stripX = (i: number) => 46 + i * 64
  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
        Sorting ignores the count
      </text>

      {/* Alphabet strip */}
      <rect x={20} y={54} width={560} height={48} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
      {STRIP_LETTERS.map((ch, i) => {
        const cx = stripX(i)
        const active = ACTIVE_LETTERS.has(ch)
        return (
          <g key={ch}>
            {active && (
              <circle
                cx={cx}
                cy={78}
                r={17}
                fill={ch === 'a' ? NEUTRAL : ch === 'c' ? ANION : SUCCESS}
                fillOpacity={0.22}
                stroke={ch === 'a' ? NEUTRAL : ch === 'c' ? ANION : SUCCESS}
                strokeWidth={2}
              />
            )}
            <text
              x={cx}
              y={84}
              textAnchor="middle"
              fontSize={17}
              fontWeight={active ? 700 : 500}
              fill={active ? TEXT : MUTED}
            >
              {ch}
            </text>
          </g>
        )
      })}

      {/* Pair 1: ammine (a) before chlorido (c) */}
      <line x1={stripX(0)} y1={102} x2={110} y2={132} stroke={NEUTRAL} strokeWidth={1.8} strokeDasharray="4 4" />
      <line x1={stripX(2)} y1={102} x2={296} y2={132} stroke={ANION} strokeWidth={1.8} strokeDasharray="4 4" />

      <Tile x={24} y={134} w={172} h={74} tone={NEUTRAL}>
        <rect x={44} y={152} width={28} height={30} rx={6} fill={NEUTRAL} />
        <text x={58} y={173} textAnchor="middle" fontSize={18} fontWeight={700} fill="var(--accent-fg)">
          a
        </text>
        <text x={78} y={173} fontSize={18} fontWeight={700} fill={TEXT}>
          mmine
        </text>
        <text x={110} y={198} textAnchor="middle" fontSize={16} fill={MUTED}>
          lands on "a"
        </text>
      </Tile>

      <Tile x={210} y={134} w={174} h={74} tone={ANION}>
        <rect x={230} y={152} width={28} height={30} rx={6} fill={ANION} />
        <text x={244} y={173} textAnchor="middle" fontSize={18} fontWeight={700} fill={SURFACE}>
          c
        </text>
        <text x={264} y={173} fontSize={18} fontWeight={700} fill={TEXT}>
          hlorido
        </text>
        <text x={297} y={198} textAnchor="middle" fontSize={16} fill={MUTED}>
          lands on "c"
        </text>
      </Tile>

      {/* Ignored chips panel */}
      <rect
        x={402}
        y={128}
        width={176}
        height={86}
        rx={10}
        fill={RAISED}
        stroke={BORDER}
        strokeWidth={1.4}
        strokeDasharray="5 4"
      />
      <rect x={418} y={142} width={68} height={30} rx={15} fill={SURFACE} stroke={BORDER} opacity={0.65} />
      <text x={452} y={163} textAnchor="middle" fontSize={16} fill={MUTED} opacity={0.75}>
        tetra
      </text>
      <rect x={498} y={142} width={56} height={30} rx={15} fill={SURFACE} stroke={BORDER} opacity={0.65} />
      <text x={526} y={163} textAnchor="middle" fontSize={16} fill={MUTED} opacity={0.75}>
        di
      </text>
      <text x={490} y={200} textAnchor="middle" fontSize={16} fill={MUTED}>
        ignored for sorting
      </text>

      <text x={24} y={236} fontSize={16} fontWeight={600} fill={MUTED}>
        Pair 1: tetraammine vs dichlorido (a before c)
      </text>

      {/* Pair 2: dichlorido (c) before bis(ethane-1,2-diamine) (e) */}
      <text x={24} y={280} fontSize={16} fontWeight={600} fill={MUTED}>
        Pair 2: dichlorido vs bis(ethane-1,2-diamine)
      </text>

      <Tile x={24} y={292} w={172} h={80} tone={ANION}>
        <text x={110} y={316} textAnchor="middle" fontSize={16} fill={MUTED} opacity={0.7}>
          (di ignored)
        </text>
        <rect x={46} y={326} width={28} height={30} rx={6} fill={ANION} />
        <text x={60} y={347} textAnchor="middle" fontSize={18} fontWeight={700} fill={SURFACE}>
          c
        </text>
        <text x={80} y={347} fontSize={18} fontWeight={700} fill={TEXT}>
          hlorido
        </text>
      </Tile>

      <line x1={206} y1={332} x2={244} y2={332} stroke={MUTED} strokeWidth={2} />
      <ArrowHead x={252} y={332} dir="right" />

      <Tile x={262} y={292} w={316} h={80} tone={SUCCESS}>
        <text x={420} y={316} textAnchor="middle" fontSize={16} fill={MUTED} opacity={0.7}>
          (bis ignored)
        </text>
        <rect x={282} y={326} width={28} height={30} rx={6} fill={SUCCESS} />
        <text x={296} y={347} textAnchor="middle" fontSize={18} fontWeight={700} fill={SURFACE}>
          e
        </text>
        <text x={316} y={347} fontSize={18} fontWeight={700} fill={TEXT}>
          thane-1,2-diamine
        </text>
      </Tile>

      <rect x={24} y={404} width={552} height={62} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
      <text x={W / 2} y={432} textAnchor="middle" fontSize={16} fill={TEXT}>
        Sort on "a" before "c", and "c" before "e".
      </text>
      <text x={W / 2} y={456} textAnchor="middle" fontSize={16} fill={MUTED}>
        Multiplying prefixes (di, tri, tetra, bis, tris) never change the order.
      </text>
    </g>
  )
}

// ----- Step 4: Ligand names change by charge -----

function ChargeNamesStep() {
  const colW = 266
  const leftX = 22
  const rightX = 312
  const startY = 104
  const rowPitch = 68

  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
        Ligand names change by charge
      </text>

      {/* Left Column: Anions */}
      <rect x={leftX} y={56} width={colW} height={328} rx={12} fill={ANION} fillOpacity={0.08} stroke={ANION} strokeWidth={1.8} />
      <text x={leftX + colW / 2} y={84} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
        Anionic: end in -o
      </text>
      {ANION_LIGAND_ROWS.map((row, i) => {
        const y = startY + i * rowPitch
        return (
          <g key={row.fullName}>
            <rect x={leftX + 12} y={y} width={colW - 24} height={54} rx={8} fill={SURFACE} stroke={BORDER} strokeWidth={1} />
            <text x={leftX + 26} y={y + 33} fontSize={17} fontWeight={700} fill={ANION}>
              {row.formulaDisplay}
            </text>
            <text x={leftX + 116} y={y + 33} fontSize={17} fill={TEXT}>
              {row.stem}
              <tspan fontWeight={700} fill={ANION}>
                {row.ending}
              </tspan>
            </text>
          </g>
        )
      })}

      {/* Right Column: Special Neutrals */}
      <rect x={rightX} y={56} width={colW} height={328} rx={12} fill={NEUTRAL} fillOpacity={0.08} stroke={NEUTRAL} strokeWidth={1.8} />
      <text x={rightX + colW / 2} y={84} textAnchor="middle" fontSize={17} fontWeight={700} fill={TEXT}>
        Neutral: 4 special names
      </text>
      {NEUTRAL_SPECIAL_ROWS.map((row, i) => {
        const y = startY + i * rowPitch
        return (
          <g key={row.name}>
            <rect x={rightX + 12} y={y} width={colW - 24} height={54} rx={8} fill={SURFACE} stroke={BORDER} strokeWidth={1} />
            <text x={rightX + 28} y={y + 33} fontSize={17} fontWeight={700} fill={NEUTRAL}>
              {row.formulaDisplay}
            </text>
            <text x={rightX + 116} y={y + 33} fontSize={17} fontWeight={700} fill={TEXT}>
              {row.name}
            </text>
          </g>
        )
      })}

      {/* Bottom Note */}
      <rect x={22} y={404} width={556} height={74} rx={10} fill={RAISED} stroke={BORDER} strokeWidth={1} />
      <text x={W / 2} y={434} textAnchor="middle" fontSize={16} fontWeight={600} fill={TEXT}>
        Aqua, ammine, carbonyl and nitrosyl are the four special neutral names.
      </text>
      <text x={W / 2} y={462} textAnchor="middle" fontSize={16} fill={MUTED}>
        Other neutral ligands (such as ethane-1,2-diamine) keep their usual names.
      </text>
    </g>
  )
}

// ----- Step 5: Oxidation state by charge balance -----

function ChargeBalanceStep() {
  const ex = CHARGE_BALANCE_EXAMPLE
  const unitH = 32
  const baseLine = 304

  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
        Charge balance: {ex.formula}
      </text>

      {/* Left: 4 K+ tiles */}
      <text x={102} y={70} textAnchor="middle" fontSize={16} fontWeight={600} fill={CATION}>
        4 K⁺ = +4
      </text>
      {Array.from({ length: ex.counterCount }).map((_, i) => {
        const y = baseLine - (i + 1) * (unitH + 4)
        return (
          <g key={`k-${i}`}>
            <rect x={42} y={y} width={120} height={unitH} rx={6} fill={CATION} fillOpacity={0.18} stroke={CATION} strokeWidth={1.6} />
            <text x={102} y={y + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill={TEXT}>
              K⁺ (+1)
            </text>
          </g>
        )
      })}
      <text x={102} y={332} textAnchor="middle" fontSize={16} fontWeight={600} fill={TEXT}>
        entity is 4−
      </text>

      {/* Middle: 6 CN- tiles */}
      <text x={298} y={70} textAnchor="middle" fontSize={16} fontWeight={600} fill={ANION}>
        6 CN⁻ = −6
      </text>
      {Array.from({ length: ex.ligandCount }).map((_, i) => {
        const y = baseLine - (i + 1) * (unitH + 4)
        return (
          <g key={`cn-${i}`}>
            <rect x={236} y={y} width={124} height={unitH} rx={6} fill={ANION} fillOpacity={0.18} stroke={ANION} strokeWidth={1.6} />
            <text x={298} y={y + 22} textAnchor="middle" fontSize={16} fontWeight={700} fill={TEXT}>
              CN⁻ (−1)
            </text>
          </g>
        )
      })}
      <text x={298} y={332} textAnchor="middle" fontSize={16} fill={MUTED}>
        ligands total −6
      </text>

      {/* Right: Fe tile filling the +2 gap */}
      <text x={494} y={70} textAnchor="middle" fontSize={16} fontWeight={600} fill={METAL}>
        Fe = +{ex.metalState}
      </text>
      {/* Dashed reference guide showing the 4-unit entity target */}
      <line x1={408} y1={baseLine - 4 * (unitH + 4)} x2={576} y2={baseLine - 4 * (unitH + 4)} stroke={MUTED} strokeWidth={1.4} strokeDasharray="4 4" />
      <Tile x={432} y={baseLine - 6 * (unitH + 4)} w={124} h={2 * (unitH + 4) - 4} tone={METAL}>
        <text x={494} y={baseLine - 5 * (unitH + 4) - 4} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
          Fe (+2)
        </text>
        <text x={494} y={baseLine - 4 * (unitH + 4) - 16} textAnchor="middle" fontSize={16} fill={MUTED}>
          fills the gap
        </text>
      </Tile>
      <text x={494} y={332} textAnchor="middle" fontSize={16} fill={MUTED}>
        oxidation state II
      </text>

      {/* Running total line */}
      <rect x={92} y={356} width={416} height={44} rx={22} fill={RAISED} stroke={BORDER} strokeWidth={1.4} />
      <text x={W / 2} y={384} textAnchor="middle" fontSize={18} fontWeight={700} fill={TEXT}>
        +2 − 6 = −4  (matches 4 K⁺)
      </text>

      {/* Level balance bar at zero */}
      <line x1={64} y1={444} x2={536} y2={444} stroke={SUCCESS} strokeWidth={4} strokeLinecap="round" />
      <polygon points="300,446 286,472 314,472" fill={SUCCESS} />
      <text x={128} y={432} textAnchor="middle" fontSize={16} fontWeight={600} fill={CATION}>
        +4 (counter ions)
      </text>
      <text x={472} y={432} textAnchor="middle" fontSize={16} fontWeight={600} fill={ANION}>
        −4 (entity)
      </text>
      <text x={W / 2} y={492} textAnchor="middle" fontSize={16} fontWeight={700} fill={SUCCESS}>
        whole salt balanced at 0
      </text>
    </g>
  )
}

// ----- Step 6: Cation or anion decides the ending -----

function MetalEndingStep() {
  const [iron, silver] = METAL_ENDING_PAIRS
  return (
    <g>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
        Cation or anion decides the ending
      </text>

      {/* Iron pair */}
      <Tile x={22} y={62} w={264} h={164} tone={CATION}>
        <rect x={230} y={76} width={42} height={30} rx={15} fill={CATION} />
        <text x={251} y={97} textAnchor="middle" fontSize={16} fontWeight={700} fill={SURFACE}>
          2+
        </text>
        <text x={154} y={134} textAnchor="middle" fontSize={21} fontWeight={700} fill={TEXT}>
          {iron.cationFormula}
        </text>
        <text x={154} y={172} textAnchor="middle" fontSize={16} fill={MUTED}>
          cation: plain element name
        </text>
        <text x={154} y={204} textAnchor="middle" fontSize={19} fontWeight={700} fill={CATION}>
          {iron.cationLabel}
        </text>
      </Tile>

      <Tile x={314} y={62} w={264} h={164} tone={ANION}>
        <rect x={522} y={76} width={42} height={30} rx={15} fill={ANION} />
        <text x={543} y={97} textAnchor="middle" fontSize={16} fontWeight={700} fill={SURFACE}>
          4−
        </text>
        <text x={446} y={134} textAnchor="middle" fontSize={21} fontWeight={700} fill={TEXT}>
          {iron.anionFormula}
        </text>
        <text x={446} y={172} textAnchor="middle" fontSize={16} fill={MUTED}>
          anion: Latin stem + -ate
        </text>
        <text x={446} y={204} textAnchor="middle" fontSize={19} fontWeight={700} fill={ANION}>
          {iron.anionLabel}
        </text>
      </Tile>

      <rect x={110} y={242} width={380} height={38} rx={19} fill={RAISED} stroke={BORDER} strokeWidth={1.2} />
      <text x={W / 2} y={267} textAnchor="middle" fontSize={16} fontWeight={600} fill={TEXT}>
        Ending changes; Roman numeral stays ({iron.roman})
      </text>

      {/* Silver pair */}
      <Tile x={22} y={300} w={264} h={118} tone={CATION}>
        <text x={154} y={340} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
          {silver.cationFormula}
        </text>
        <text x={154} y={372} textAnchor="middle" fontSize={16} fill={MUTED}>
          cation
        </text>
        <text x={154} y={400} textAnchor="middle" fontSize={18} fontWeight={700} fill={CATION}>
          {silver.cationLabel}
        </text>
      </Tile>

      <Tile x={314} y={300} w={264} h={118} tone={ANION}>
        <text x={446} y={340} textAnchor="middle" fontSize={20} fontWeight={700} fill={TEXT}>
          {silver.anionFormula}
        </text>
        <text x={446} y={372} textAnchor="middle" fontSize={16} fill={MUTED}>
          anion
        </text>
        <text x={446} y={400} textAnchor="middle" fontSize={18} fontWeight={700} fill={ANION}>
          {silver.anionLabel}
        </text>
      </Tile>

      <text x={W / 2} y={460} textAnchor="middle" fontSize={16} fill={MUTED}>
        Neutral entities keep the plain metal name, just like cations.
      </text>
    </g>
  )
}

export function NamingAssembler({ step, reducedMotion = false }: NamingAssemblerProps) {
  const id = namingStepId(step)
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Nomenclature of coordination compounds: formula order, naming order, alphabetical sorting, ligand charge endings, oxidation state charge balance, and cation versus anion metal endings"
      style={{
        display: 'block',
        transition: reducedMotion ? 'none' : 'opacity 200ms ease-out',
      }}
    >
      {id === 'formula' && <FormulaStep />}
      {id === 'name' && <NameStep />}
      {id === 'sorting' && <SortingStep />}
      {id === 'charge-names' && <ChargeNamesStep />}
      {id === 'charge-balance' && <ChargeBalanceStep />}
      {id === 'metal-ending' && <MetalEndingStep />}
    </svg>
  )
}
