'use client'

import {
  COORDINATION_APP_STEPS,
  FIELD_STRIP,
  applicationById,
  clampStep,
} from './applications-steps'
import type { ApplicationField } from '@/lib/chem/ncert-c12-unit5-s9-tables'

export interface CoordinationApplicationsProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 520
const H = 436
const STRIP_Y = 8
const STRIP_H = 34
const ZONE_Y = 54
const CAPTION_Y = 358
const CAPTION_H = 68

const INK = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const LINE = 'var(--border)'
const PANEL = 'var(--surface-raised)'
const SURFACE = 'var(--surface)'
const ACCENT = 'var(--accent)'
const ACCENT_SOFT = 'var(--accent-soft)'

function FieldStrip({ active }: { active: ApplicationField }) {
  const pad = 8
  const gap = 6
  const cellW = (W - 2 * pad - gap * (FIELD_STRIP.length - 1)) / FIELD_STRIP.length
  return (
    <g>
      {FIELD_STRIP.map((item, i) => {
        const x = pad + i * (cellW + gap)
        const on = item.id === active
        return (
          <g key={item.id}>
            <rect
              x={x}
              y={STRIP_Y}
              width={cellW}
              height={STRIP_H}
              rx={8}
              fill={on ? ACCENT_SOFT : PANEL}
              stroke={on ? ACCENT : LINE}
              strokeWidth={on ? 2 : 1.2}
            />
            <text
              x={x + cellW / 2}
              y={STRIP_Y + 22}
              textAnchor="middle"
              fontSize={15}
              fontWeight={on ? 700 : 500}
              fill={on ? ACCENT : MUTED}
            >
              {item.label}
            </text>
          </g>
        )
      })}
    </g>
  )
}

function CaptionBox({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <g>
      <rect
        x={8}
        y={CAPTION_Y}
        width={W - 16}
        height={CAPTION_H}
        rx={12}
        fill={PANEL}
        stroke={LINE}
        strokeWidth={1.5}
      />
      <text x={22} y={CAPTION_Y + 27} fontSize={15} fontWeight={600} fill={INK}>
        {line1}
      </text>
      <text x={22} y={CAPTION_Y + 51} fontSize={15} fill={MUTED}>
        {line2}
      </text>
    </g>
  )
}

/** Step 1: Colour reaction test tube + Ca2+/Mg2+ EDTA titration with stability bars. */
function AnalysisStep() {
  return (
    <g>
      {/* Left panel: Colour reaction */}
      <rect x={8} y={ZONE_Y} width={224} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={120} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={600} fill={INK}>
        Colour detection
      </text>

      {/* Dropper */}
      <rect x={110} y={ZONE_Y + 42} width={20} height={18} rx={4} fill={MUTED} />
      <path d="M115 114 L115 144 L120 156 L125 144 L125 114 Z" fill={SURFACE} stroke={MUTED} strokeWidth={1.5} />
      {/* Falling crimson drop */}
      <path d="M120 164 C114 173 114 181 120 181 C126 181 126 173 120 164 Z" fill="var(--blood-red)" />
      <text x={144} y={ZONE_Y + 76} fontSize={15} fill={MUTED}>
        DMG /
      </text>
      <text x={144} y={ZONE_Y + 96} fontSize={15} fill={MUTED}>
        ligand
      </text>

      {/* Test tube 1 */}
      <path
        d="M94 190 V272 A26 26 0 0 0 146 272 V190"
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2.5}
      />
      {/* Deep coloured complex liquid */}
      <path d="M97 228 V272 A23 23 0 0 0 143 272 V228 Z" fill="var(--blood-red)" opacity={0.72} />
      <ellipse cx={120} cy={228} rx={23} ry={5} fill="var(--blood-red)" opacity={0.9} />
      <line x1={90} y1={190} x2={150} y2={190} stroke="var(--glass-wall)" strokeWidth={3} strokeLinecap="round" />

      <text x={120} y={ZONE_Y + 272} textAnchor="middle" fontSize={15} fill={INK}>
        Pale ion to bright red
      </text>

      {/* Right panel: Water hardness titration with Na2EDTA */}
      <rect x={244} y={ZONE_Y} width={268} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={378} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={600} fill={INK}>
        Hardness titration
      </text>

      {/* Burette tip */}
      <rect x={286} y={ZONE_Y + 42} width={16} height={44} rx={2} fill={SURFACE} stroke="var(--glass-wall)" strokeWidth={1.8} />
      <line x1={280} y1={ZONE_Y + 70} x2={308} y2={ZONE_Y + 70} stroke={MUTED} strokeWidth={3} />
      <path d="M294 146 C290 153 290 159 294 159 C298 159 298 153 294 146 Z" fill={ACCENT} />
      <text x={314} y={ZONE_Y + 64} fontSize={15} fontWeight={600} fill={ACCENT}>
        Na₂EDTA
      </text>

      {/* Test tube 2 */}
      <path
        d="M272 174 V252 A22 22 0 0 0 316 252 V174"
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2.2}
      />
      <path d="M275 206 V252 A19 19 0 0 0 313 252 V206 Z" fill="var(--liquid)" />
      <circle cx={288} cy={230} r={5} fill="var(--ion-cation)" />
      <circle cx={302} cy={244} r={5} fill="var(--spec-green)" />
      <text x={294} y={ZONE_Y + 244} textAnchor="middle" fontSize={15} fill={INK}>
        Ca²⁺, Mg²⁺
      </text>

      {/* Two stability bars */}
      <text x={338} y={ZONE_Y + 114} fontSize={15} fontWeight={600} fill={INK}>
        Stability (K)
      </text>

      <text x={338} y={ZONE_Y + 140} fontSize={15} fill={INK}>
        Ca-EDTA (1st)
      </text>
      <rect x={338} y={ZONE_Y + 148} width={156} height={22} rx={6} fill={SURFACE} stroke={LINE} strokeWidth={1.2} />
      <rect x={338} y={ZONE_Y + 148} width={144} height={22} rx={6} fill="var(--ion-cation)" opacity={0.82} />

      <text x={338} y={ZONE_Y + 198} fontSize={15} fill={INK}>
        Mg-EDTA (2nd)
      </text>
      <rect x={338} y={ZONE_Y + 206} width={156} height={22} rx={6} fill={SURFACE} stroke={LINE} strokeWidth={1.2} />
      <rect x={338} y={ZONE_Y + 206} width={96} height={22} rx={6} fill="var(--spec-green)" opacity={0.82} />

      <text x={378} y={ZONE_Y + 272} textAnchor="middle" fontSize={15} fill={MUTED}>
        Higher K binds first
      </text>
    </g>
  )
}

/** Step 2: Gold extraction via [Au(CN)2]- and Zn displacement. */
function GoldExtractionStep() {
  const gold = applicationById('gold')
  return (
    <g>
      <rect x={8} y={ZONE_Y} width={W - 16} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />

      {/* Input pill at top left */}
      <rect x={22} y={ZONE_Y + 14} width={154} height={34} rx={8} fill={SURFACE} stroke={ACCENT} strokeWidth={1.5} />
      <text x={99} y={ZONE_Y + 36} textAnchor="middle" fontSize={15} fontWeight={600} fill={ACCENT}>
        CN⁻ + O₂ + H₂O
      </text>
      <path d="M176 85 Q214 85 224 114" fill="none" stroke={ACCENT} strokeWidth={2.2} />
      <polygon points="224,118 218,108 230,109" fill={ACCENT} />

      {/* Central open-mouth reaction vessel with crushed ore */}
      <path
        d="M158 124 V248 Q158 264 174 264 H322 Q338 264 338 248 V124"
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2.8}
        strokeLinejoin="round"
      />
      <line x1={150} y1={124} x2={346} y2={124} stroke="var(--glass-wall)" strokeWidth={3.5} strokeLinecap="round" />

      {/* Liquid inside vessel */}
      <path d="M161 196 V248 Q161 260 174 260 H322 Q335 260 335 248 V196 Z" fill="var(--liquid)" />

      {/* Crushed ore bed on left of bottom */}
      <polygon points="168,258 182,242 200,248 216,240 230,258" fill="var(--neutron)" opacity={0.75} />
      {/* Gold speck in ore */}
      <circle cx={198} cy={244} r={7} fill="var(--agi-yellow)" stroke={INK} strokeWidth={1.2} />
      <text x={82} y={ZONE_Y + 196} textAnchor="middle" fontSize={15} fill={INK}>
        Crushed ore
      </text>
      <line x1={134} y1={ZONE_Y + 192} x2={176} y2={ZONE_Y + 192} stroke={MUTED} strokeWidth={1.4} />

      {/* Dissolved linear [Au(CN)2]- complex in solution */}
      <path d="M204 234 Q216 218 228 218" fill="none" stroke="var(--agi-yellow)" strokeWidth={2.2} strokeDasharray="4 3" />
      <line x1={232} y1={218} x2={280} y2={218} stroke={INK} strokeWidth={2.2} />
      <circle cx={232} cy={218} r={7} fill="var(--el-C)" />
      <circle cx={256} cy={218} r={9} fill="var(--agi-yellow)" stroke={INK} strokeWidth={1.2} />
      <circle cx={280} cy={218} r={7} fill="var(--el-C)" />
      <text x={236} y={ZONE_Y + 124} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        [Au(CN)₂]⁻
      </text>

      {/* Zinc strip lowered cleanly through open mouth on right side */}
      <rect x={302} y={106} width={18} height={124} rx={3} fill="var(--metal-zn)" stroke={INK} strokeWidth={1.2} />
      <text x={392} y={ZONE_Y + 76} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Zn strip
      </text>
      <line x1={322} y1={ZONE_Y + 72} x2={356} y2={ZONE_Y + 72} stroke={MUTED} strokeWidth={1.5} />

      {/* Pure solid gold deposit at bottom right */}
      <path d="M286 258 Q308 238 328 258 Z" fill="var(--agi-yellow)" stroke={INK} strokeWidth={1.2} />
      <text x={422} y={ZONE_Y + 196} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Solid Au(s)
      </text>
      <line x1={330} y1={ZONE_Y + 192} x2={372} y2={ZONE_Y + 192} stroke={MUTED} strokeWidth={1.4} />

      {/* Oxidation state & CN readout chips */}
      <rect x={22} y={ZONE_Y + 236} width={226} height={38} rx={8} fill={SURFACE} stroke={LINE} strokeWidth={1.4} />
      <text x={135} y={ZONE_Y + 260} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        {`Au oxidation state: +${gold.oxidationState}`}
      </text>
      <rect x={264} y={ZONE_Y + 236} width={234} height={38} rx={8} fill={SURFACE} stroke={LINE} strokeWidth={1.4} />
      <text x={381} y={ZONE_Y + 260} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        {`Coordination number: ${gold.coordinationNumber}`}
      </text>
    </g>
  )
}

/** Step 3: Nickel purification via volatile [Ni(CO)4]. */
function NickelPurificationStep() {
  return (
    <g>
      <rect x={8} y={ZONE_Y} width={W - 16} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />

      {/* Connecting vapour tube behind vessels */}
      <path d="M122 136 V84 H398 V136" fill="none" stroke="var(--glass-wall)" strokeWidth={18} strokeLinejoin="round" />
      <path d="M122 136 V84 H398 V136" fill="none" stroke="var(--vapour)" strokeWidth={13} strokeLinejoin="round" />

      {/* Vapour [Ni(CO)4] pill centered on tube */}
      <rect x={198} y={ZONE_Y + 14} width={124} height={32} rx={8} fill={SURFACE} stroke={ACCENT} strokeWidth={1.5} />
      <text x={260} y={ZONE_Y + 36} textAnchor="middle" fontSize={16} fontWeight={700} fill={ACCENT}>
        [Ni(CO)₄]
      </text>

      {/* Process arrows placed cleanly in the open central space between vessels */}
      <line x1={212} y1={ZONE_Y + 94} x2={304} y2={ZONE_Y + 94} stroke={INK} strokeWidth={2.2} />
      <polygon points="308,148 299,143 299,153" fill={INK} />
      <text x={260} y={ZONE_Y + 84} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        forms
      </text>

      <line x1={212} y1={ZONE_Y + 148} x2={304} y2={ZONE_Y + 148} stroke="var(--heat)" strokeWidth={2.2} />
      <polygon points="308,202 299,197 299,207" fill="var(--heat)" />
      <text x={260} y={ZONE_Y + 138} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--heat)">
        decomposes
      </text>

      {/* Left vessel: warm formation */}
      <rect x={48} y={ZONE_Y + 82} width={148} height={138} rx={14} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2.5} />
      <text x={122} y={ZONE_Y + 106} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Heated vessel
      </text>

      {/* CO inlet pipe */}
      <line x1={16} y1={ZONE_Y + 150} x2={44} y2={ZONE_Y + 150} stroke={ACCENT} strokeWidth={3.5} />
      <polygon points="48,204 39,199 39,209" fill={ACCENT} />
      <text x={28} y={ZONE_Y + 136} textAnchor="middle" fontSize={15} fontWeight={600} fill={ACCENT}>
        CO
      </text>

      {/* Impure Ni lumps + impurities */}
      <polygon points="66,262 84,240 104,246 124,236 144,248 166,240 180,262" fill="var(--metal-ni)" stroke={INK} strokeWidth={1.2} />
      <circle cx={88} cy={254} r={4} fill="var(--neutron)" />
      <circle cx={120} cy={252} r={4} fill="var(--neutron)" />
      <circle cx={154} cy={254} r={4} fill="var(--neutron)" />

      {/* Gentle flame under left vessel */}
      <path d="M112 298 Q122 278 132 298 Q122 292 112 298 Z" fill="var(--flame)" />
      <text x={122} y={ZONE_Y + 268} textAnchor="middle" fontSize={15} fill={MUTED}>
        Impurities stay
      </text>

      {/* Right vessel: hotter decomposition */}
      <rect x={324} y={ZONE_Y + 82} width={148} height={138} rx={14} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2.5} />
      <text x={398} y={ZONE_Y + 106} textAnchor="middle" fontSize={15} fontWeight={600} fill="var(--heat)">
        Hotter vessel
      </text>

      {/* Bright pure Ni layer on inner wall */}
      <rect x={332} y={ZONE_Y + 118} width={13} height={92} rx={4} fill="var(--metal-ni)" stroke={INK} strokeWidth={1.2} />
      <rect x={451} y={ZONE_Y + 118} width={13} height={92} rx={4} fill="var(--metal-ni)" stroke={INK} strokeWidth={1.2} />
      <text x={398} y={ZONE_Y + 162} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        Pure Ni
      </text>
      <text x={398} y={ZONE_Y + 184} textAnchor="middle" fontSize={15} fill={MUTED}>
        on wall
      </text>

      {/* CO leaving */}
      <line x1={472} y1={ZONE_Y + 150} x2={500} y2={ZONE_Y + 150} stroke={ACCENT} strokeWidth={3.5} />
      <polygon points="504,204 495,199 495,209" fill={ACCENT} />
      <text x={490} y={ZONE_Y + 136} textAnchor="middle" fontSize={15} fontWeight={600} fill={ACCENT}>
        CO
      </text>

      {/* Stronger flames under right vessel */}
      <path d="M374 298 Q386 274 398 298 Q386 290 374 298 Z" fill="var(--heat)" />
      <path d="M398 298 Q410 274 422 298 Q410 290 398 298 Z" fill="var(--heat)" />
      <text x={398} y={ZONE_Y + 268} textAnchor="middle" fontSize={15} fill={MUTED}>
        Stronger heat
      </text>
    </g>
  )
}

/** Step 4: Biological pigments (Chlorophyll Mg, Haemoglobin Fe, Vitamin B12 Co) + two enzymes. */
function LivingSystemsStep() {
  const cards = [
    { x: 8, title: 'Chlorophyll', metal: 'Mg', tone: 'var(--spec-green)', ring: 'var(--spec-green)', motif: 'leaf' as const },
    { x: 178, title: 'Haemoglobin', metal: 'Fe', tone: 'var(--blood-red)', ring: 'var(--blood-red)', motif: 'drop' as const },
    { x: 348, title: 'Vitamin B₁₂', metal: 'Co', tone: 'var(--accent)', ring: 'var(--accent)', motif: 'pill' as const },
  ]
  return (
    <g>
      {cards.map((c) => {
        const cx = c.x + 82
        const cy = ZONE_Y + 92
        return (
          <g key={c.title}>
            <rect x={c.x} y={ZONE_Y} width={164} height={206} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
            <text x={cx} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
              {c.title}
            </text>

            {/* Macrocyclic ligand ring with 4 donor N atoms */}
            <circle cx={cx} cy={cy} r={34} fill="none" stroke={c.ring} strokeWidth={3} opacity={0.6} />
            {[0, 90, 180, 270].map((deg) => {
              const rad = (deg * Math.PI) / 180
              const nx = cx + 34 * Math.cos(rad)
              const ny = cy + 34 * Math.sin(rad)
              return (
                <g key={deg}>
                  <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={MUTED} strokeWidth={1.6} strokeDasharray="3 3" />
                  <circle cx={nx} cy={ny} r={5.5} fill="var(--el-N)" />
                </g>
              )
            })}
            {/* Central metal sphere */}
            <circle cx={cx} cy={cy} r={16} fill={c.tone} stroke={SURFACE} strokeWidth={2} />
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize={15} fontWeight={700} fill="#FFFFFF">
              {c.metal}
            </text>

            {/* Biological icon next to metal label */}
            {c.motif === 'leaf' && (
              <g transform={`translate(${cx - 42} ${ZONE_Y + 150})`}>
                <path d="M4 22 C4 8 18 2 28 6 C26 18 16 26 4 22 Z" fill="var(--spec-green)" opacity={0.85} />
                <line x1={4} y1={22} x2={22} y2={10} stroke={SURFACE} strokeWidth={1.4} />
                <text x={36} y={20} fontSize={15} fill={INK}>
                  Leaf
                </text>
              </g>
            )}
            {c.motif === 'drop' && (
              <g transform={`translate(${cx - 46} ${ZONE_Y + 148})`}>
                <path d="M14 4 C6 16 6 24 14 24 C22 24 22 16 14 4 Z" fill="var(--blood-red)" />
                <text x={30} y={22} fontSize={15} fill={INK}>
                  Blood
                </text>
              </g>
            )}
            {c.motif === 'pill' && (
              <g transform={`translate(${cx - 48} ${ZONE_Y + 152})`}>
                <rect x={2} y={6} width={28} height={14} rx={7} fill={SURFACE} stroke={c.tone} strokeWidth={2} />
                <rect x={2} y={6} width={14} height={14} rx={7} fill={c.tone} />
                <text x={38} y={18} fontSize={15} fill={INK}>
                  B₁₂ pill
                </text>
              </g>
            )}
          </g>
        )
      })}

      {/* Two smaller enzyme cards below */}
      <rect x={8} y={ZONE_Y + 218} width={246} height={74} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={131} y={ZONE_Y + 246} textAnchor="middle" fontSize={16} fontWeight={600} fill={INK}>
        Carboxypeptidase A
      </text>
      <text x={131} y={ZONE_Y + 272} textAnchor="middle" fontSize={15} fill={MUTED}>
        Biological catalyst (enzyme)
      </text>

      <rect x={266} y={ZONE_Y + 218} width={246} height={74} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={389} y={ZONE_Y + 246} textAnchor="middle" fontSize={16} fontWeight={600} fill={INK}>
        Carbonic anhydrase
      </text>
      <text x={389} y={ZONE_Y + 272} textAnchor="middle" fontSize={15} fill={MUTED}>
        Biological catalyst (enzyme)
      </text>
    </g>
  )
}

/** Step 5: Three industrial scenes (Wilkinson catalyst, smooth electroplating, hypo fixing). */
function IndustryStep() {
  return (
    <g>
      {/* Scene 1: Wilkinson catalyst */}
      <rect x={8} y={ZONE_Y} width={164} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={90} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        Wilkinson
      </text>
      <text x={90} y={ZONE_Y + 48} textAnchor="middle" fontSize={15} fill={ACCENT} fontWeight={600}>
        [(Ph₃P)₃RhCl]
      </text>

      {/* Reaction flask */}
      <path
        d="M74 120 V146 L42 204 Q38 214 48 214 H132 Q142 214 138 204 L106 146 V120"
        fill="var(--glass-fill)"
        stroke="var(--glass-wall)"
        strokeWidth={2.2}
      />
      <path d="M54 184 L44 204 Q41 210 50 210 H130 Q139 210 136 204 L126 184 Z" fill="var(--accent-soft)" />
      <text x={90} y={ZONE_Y + 148} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Rh catalyst
      </text>

      {/* Alkene -> Alkane */}
      <text x={90} y={ZONE_Y + 190} textAnchor="middle" fontSize={15} fill={INK}>
        Alkene + H₂
      </text>
      <line x1={90} y1={ZONE_Y + 198} x2={90} y2={ZONE_Y + 224} stroke={ACCENT} strokeWidth={2.2} />
      <polygon points="90,282 85,273 95,273" fill={ACCENT} />
      <text x={90} y={ZONE_Y + 252} textAnchor="middle" fontSize={16} fontWeight={600} fill="var(--spec-green)">
        Alkane
      </text>

      {/* Scene 2: Smooth electroplating */}
      <rect x={178} y={ZONE_Y} width={164} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={260} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        Electroplating
      </text>
      <text x={260} y={ZONE_Y + 48} textAnchor="middle" fontSize={15} fill={ACCENT} fontWeight={600}>
        [Ag(CN)₂]⁻
      </text>

      {/* Bath */}
      <rect x={196} y={ZONE_Y + 68} width={128} height={106} rx={8} fill="var(--liquid)" stroke="var(--glass-wall)" strokeWidth={2} />
      {/* Smooth coated bar */}
      <rect x={218} y={ZONE_Y + 86} width={22} height={74} rx={4} fill="var(--metal-cu)" />
      <rect x={214} y={ZONE_Y + 84} width={30} height={78} rx={5} fill="none" stroke="var(--metal-ag)" strokeWidth={5} />
      {/* Faint rough coat beside it */}
      <rect x={278} y={ZONE_Y + 90} width={18} height={68} rx={3} fill="var(--metal-cu)" opacity={0.4} />
      <path
        d="M275 144 L272 156 L277 168 L271 180 L276 192 L272 204 L276 212"
        fill="none"
        stroke="var(--metal-ag)"
        strokeWidth={4}
        opacity={0.55}
      />
      <text x={230} y={ZONE_Y + 202} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Smooth
      </text>
      <text x={294} y={ZONE_Y + 202} textAnchor="middle" fontSize={15} fill={MUTED}>
        Rough
      </text>
      <text x={260} y={ZONE_Y + 236} textAnchor="middle" fontSize={15} fill={MUTED}>
        Slow Ag⁺ release
      </text>
      <text x={260} y={ZONE_Y + 258} textAnchor="middle" fontSize={15} fill={MUTED}>
        gives even coat
      </text>

      {/* Scene 3: Photographic fixing with hypo */}
      <rect x={348} y={ZONE_Y} width={164} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={430} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        Hypo fixing
      </text>
      <text x={430} y={ZONE_Y + 48} textAnchor="middle" fontSize={15} fill={ACCENT} fontWeight={600}>
        [Ag(S₂O₃)₂]³⁻
      </text>

      {/* Tray of hypo */}
      <rect x={364} y={ZONE_Y + 68} width={132} height={106} rx={8} fill="var(--liquid)" stroke="var(--glass-wall)" strokeWidth={2} />
      {/* Film strip inside */}
      <rect x={376} y={ZONE_Y + 86} width={108} height={70} rx={4} fill={SURFACE} stroke={LINE} strokeWidth={1.5} />
      {/* Dark Ag grains stay */}
      {[392, 410, 424].map((x) => (
        <g key={x}>
          <circle cx={x} cy={ZONE_Y + 108} r={5.5} fill={INK} />
          <circle cx={x + 4} cy={ZONE_Y + 132} r={5.5} fill={INK} />
        </g>
      ))}
      {/* Pale AgBr grains dissolving away */}
      {[448, 466].map((x) => (
        <g key={x}>
          <circle cx={x} cy={ZONE_Y + 108} r={5} fill="var(--agbr-pale-yellow)" stroke={MUTED} strokeWidth={1} strokeDasharray="2 2" />
          <circle cx={x + 4} cy={ZONE_Y + 132} r={5} fill="var(--agbr-pale-yellow)" stroke={MUTED} strokeWidth={1} strokeDasharray="2 2" />
        </g>
      ))}
      <text x={430} y={ZONE_Y + 202} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Dark Ag stays
      </text>
      <text x={430} y={ZONE_Y + 230} textAnchor="middle" fontSize={15} fill={MUTED}>
        Pale AgBr
      </text>
      <text x={430} y={ZONE_Y + 252} textAnchor="middle" fontSize={15} fill={MUTED}>
        dissolves out
      </text>
    </g>
  )
}

/** Step 6: Medicine - chelate therapy removing toxic metals + cis-platin shrinking tumour. */
function MedicineStep() {
  return (
    <g>
      {/* Left main panel: Chelate therapy */}
      <rect x={8} y={ZONE_Y} width={332} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={174} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        Chelate therapy
      </text>

      {/* Clean geometric body outline on left of panel */}
      <circle cx={88} cy={ZONE_Y + 72} r={20} fill={SURFACE} stroke={MUTED} strokeWidth={2} />
      <path
        d="M56 152 Q56 134 88 134 Q120 134 120 152 L116 246 Q116 260 104 260 H72 Q60 260 60 246 Z"
        fill={SURFACE}
        stroke={MUTED}
        strokeWidth={2}
      />
      <text x={88} y={ZONE_Y + 232} textAnchor="middle" fontSize={15} fill={MUTED}>
        Toxic ions
      </text>

      {/* Toxic metal dots inside body */}
      <circle cx={78} cy={ZONE_Y + 116} r={7} fill="var(--blood-red)" />
      <circle cx={98} cy={ZONE_Y + 142} r={7} fill="var(--blood-red)" />
      <circle cx={84} cy={ZONE_Y + 174} r={7} fill="var(--blood-red)" />

      {/* Claw 1: D-penicillamine & desferrioxime B -> Cu, Fe */}
      <path d="M112 168 H154" stroke="var(--spec-green)" strokeWidth={2.2} />
      <polygon points="158,168 149,163 149,173" fill="var(--spec-green)" />
      {/* Claw shape gripping Cu/Fe dot */}
      <path d="M170 154 C162 160 162 176 170 182" fill="none" stroke="var(--spec-green)" strokeWidth={3.5} strokeLinecap="round" />
      <path d="M188 154 C196 160 196 176 188 182" fill="none" stroke="var(--spec-green)" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={179} cy={168} r={7} fill="var(--blood-red)" />
      <text x={204} y={ZONE_Y + 100} fontSize={15} fontWeight={600} fill={INK}>
        Cu, Fe
      </text>
      <text x={204} y={ZONE_Y + 120} fontSize={15} fill={MUTED}>
        D-penicillamine,
      </text>
      <text x={204} y={ZONE_Y + 140} fontSize={15} fill={MUTED}>
        desferrioxime B
      </text>

      {/* Claw 2: EDTA -> Pb */}
      <path d="M112 228 H154" stroke={ACCENT} strokeWidth={2.2} />
      <polygon points="158,228 149,223 149,233" fill={ACCENT} />
      <path d="M170 214 C162 220 162 236 170 242" fill="none" stroke={ACCENT} strokeWidth={3.5} strokeLinecap="round" />
      <path d="M188 214 C196 220 196 236 188 242" fill="none" stroke={ACCENT} strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={179} cy={228} r={7} fill="var(--blood-red)" />
      <text x={204} y={ZONE_Y + 170} fontSize={15} fontWeight={600} fill={INK}>
        Pb (lead)
      </text>
      <text x={204} y={ZONE_Y + 190} fontSize={15} fill={MUTED}>
        EDTA claw
      </text>

      <text x={174} y={ZONE_Y + 272} textAnchor="middle" fontSize={15} fill={INK}>
        Bound metal carried safely out
      </text>

      {/* Right side card: cis-platin */}
      <rect x={352} y={ZONE_Y} width={160} height={292} rx={12} fill={PANEL} stroke={LINE} strokeWidth={1.5} />
      <text x={432} y={ZONE_Y + 26} textAnchor="middle" fontSize={16} fontWeight={700} fill={INK}>
        cis-platin
      </text>

      {/* Square-planar cis-[Pt(NH3)2Cl2] diagram */}
      <line x1={404} y1={ZONE_Y + 64} x2={452} y2={ZONE_Y + 112} stroke={MUTED} strokeWidth={2} />
      <line x1={452} y1={ZONE_Y + 64} x2={404} y2={ZONE_Y + 112} stroke={MUTED} strokeWidth={2} />
      <circle cx={428} cy={ZONE_Y + 88} r={14} fill="var(--metal-pt)" stroke={INK} strokeWidth={1.5} />
      <text x={428} y={ZONE_Y + 94} textAnchor="middle" fontSize={15} fontWeight={700} fill={INK}>
        Pt
      </text>
      <circle cx={404} cy={ZONE_Y + 64} r={7.5} fill="var(--el-Cl)" />
      <circle cx={404} cy={ZONE_Y + 112} r={7.5} fill="var(--el-Cl)" />
      <circle cx={452} cy={ZONE_Y + 64} r={7.5} fill="var(--el-N)" />
      <circle cx={452} cy={ZONE_Y + 112} r={7.5} fill="var(--el-N)" />
      <text x={388} y={ZONE_Y + 69} textAnchor="end" fontSize={15} fill={INK}>
        Cl
      </text>
      <text x={388} y={ZONE_Y + 117} textAnchor="end" fontSize={15} fill={INK}>
        Cl
      </text>
      <text x={466} y={ZONE_Y + 69} fontSize={15} fill={INK}>
        NH₃
      </text>
      <text x={466} y={ZONE_Y + 117} fontSize={15} fill={INK}>
        NH₃
      </text>

      {/* Arrow to shrinking tumour */}
      <line x1={432} y1={ZONE_Y + 136} x2={432} y2={ZONE_Y + 174} stroke={ACCENT} strokeWidth={2.5} />
      <polygon points="432,232 426,222 438,222" fill={ACCENT} />

      {/* Outer dashed original contour + smaller inner tumour */}
      <path
        d="M402 252 C398 236 420 232 432 238 C448 232 468 242 462 260 C464 274 442 280 428 274 C412 280 398 268 402 252 Z"
        fill="none"
        stroke="var(--blood-red)"
        strokeWidth={1.8}
        strokeDasharray="4 3"
      />
      <path
        d="M418 254 C416 246 428 244 434 248 C442 246 450 252 446 260 C446 266 436 268 428 264 C420 266 416 260 418 254 Z"
        fill="var(--blood-red)"
        opacity={0.7}
      />
      <text x={432} y={ZONE_Y + 252} textAnchor="middle" fontSize={15} fontWeight={600} fill={INK}>
        Inhibits
      </text>
      <text x={432} y={ZONE_Y + 274} textAnchor="middle" fontSize={15} fill={MUTED}>
        tumour growth
      </text>
    </g>
  )
}

const DRAWINGS = [
  AnalysisStep,
  GoldExtractionStep,
  NickelPurificationStep,
  LivingSystemsStep,
  IndustryStep,
  MedicineStep,
] as const

/** Section 5.7 Scrolly: six Steps covering analysis, metallurgy, biology, industry and medicine. */
export function CoordinationApplications({ step, reducedMotion }: CoordinationApplicationsProps) {
  const index = clampStep(step)
  const current = COORDINATION_APP_STEPS[index]
  const Drawing = DRAWINGS[index]

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={`Applications of coordination compounds, step ${index + 1}: ${current.heading}`}
      style={{
        display: 'block',
        transition: reducedMotion ? 'none' : 'opacity 200ms ease',
      }}
    >
      <FieldStrip active={current.field} />
      <Drawing />
      <CaptionBox line1={current.captionLine1} line2={current.captionLine2} />
    </svg>
  )
}
