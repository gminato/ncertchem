'use client'

import { SkeletalFormula, skeletalBounds } from '@/components/organic'
import { HALOGEN_TONE } from '@/components/vocab/organic6/tones'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import {
  DCM_EFFECTS,
  POLYHALO_MOLECULES as M,
  POLYHALO_STEP_LABELS,
  POLYHALO_TAGS,
} from './polyhalo-steps'

export interface PolyhaloGalleryProps {
  /** 0-based Step index from Scrolly. */
  step: number
  reducedMotion: boolean
}

const W = 580
const H = 400
const FG = 'var(--fg)'
const MUTED = 'var(--fg-muted)'
const ACCENT = 'var(--accent)'

/** Halogen labels take font-size = round(0.36 x scale): 40 keeps them at 14 px in the viewBox. */
const LABEL_SCALE = 40
const DDT_SCALE = 38

const G = {
  dcm: parseSmiles(M.dichloromethane),
  chcl3: parseSmiles(M.chloroform),
  chi3: parseSmiles(M.iodoform),
  ccl4: parseSmiles(M.carbonTetrachloride),
  freon: parseSmiles(M.freon12),
  phosgene: parseSmiles(M.phosgene),
  ddt: parseSmiles(M.ddt),
}

/** The largest scale at which the molecule fits `maxWidth`, capped at `maxScale`. */
function fitScale(g: MolGraph, maxWidth: number, maxScale: number): number {
  const w = skeletalBounds(g, 1).width
  return Math.min(maxScale, maxWidth / w)
}

function Mol({ g, x, y, scale }: { g: MolGraph; x: number; y: number; scale: number }) {
  return <SkeletalFormula graph={g} x={x} y={y} scale={scale} />
}

function Tag({ x, y, label, tone = ACCENT, width = 250 }: { x: number; y: number; label: string; tone?: string; width?: number }) {
  return (
    <g>
      <rect x={x} y={y} width={width} height={40} rx={10} fill="var(--surface-raised)" stroke={tone} strokeWidth={1.5} />
      <text x={x + 14} y={y + 25} fontSize={15} fill={FG}>
        {label}
      </text>
    </g>
  )
}

function Caption({ children, y = 382 }: { children: string; y?: number }) {
  return (
    <text x={20} y={y} fontSize={14} fill={MUTED}>
      {children}
    </text>
  )
}

function StepDichloromethane() {
  const s = fitScale(G.dcm, 220, 80)
  return (
    <g>
      <Mol g={G.dcm} x={150} y={150} scale={s} />
      <text x={150} y={240} textAnchor="middle" fontSize={15} fill={MUTED}>
        CH₂Cl₂
      </text>
      {POLYHALO_TAGS[0].map((t, i) => (
        <Tag key={t} x={320} y={40 + i * 54} label={t} />
      ))}
      {DCM_EFFECTS.map((e, i) => (
        <g key={e.heading}>
          <rect x={20 + i * 280} y={266} width={260} height={92} rx={12} fill="var(--surface-raised)" stroke="var(--border)" />
          <text x={36 + i * 280} y={294} fontSize={16} fontWeight={600} fill={FG}>
            {e.heading}
          </text>
          {e.lines.map((l, k) => (
            <text key={l} x={36 + i * 280} y={318 + k * 20} fontSize={14} fill={MUTED}>
              {l}
            </text>
          ))}
        </g>
      ))}
      <Caption>Two chlorines on one carbon. Effects depend on the level in air.</Caption>
    </g>
  )
}

function StepBrownBottle() {
  const s = LABEL_SCALE
  return (
    <g>
      <rect x={122} y={62} width={56} height={22} rx={4} fill={MUTED} />
      <rect x={122} y={84} width={56} height={34} rx={6} fill="var(--glass-amber)" />
      <rect x={74} y={118} width={152} height={226} rx={18} fill="var(--glass-amber)" />
      <rect x={88} y={136} width={124} height={112} rx={8} fill="var(--surface)" />
      <Mol g={G.chcl3} x={150} y={192} scale={s} />
      {POLYHALO_TAGS[1].map((t, i) => (
        <Tag key={t} x={300} y={110 + i * 56} label={t} />
      ))}
      <Caption>Brown, closed and full: no air inside, so nothing changes.</Caption>
    </g>
  )
}

function StepClearBottle() {
  const s = LABEL_SCALE
  return (
    <g>
      <path d="M 10 60 L 96 170" stroke="var(--glass-amber)" strokeWidth={18} strokeLinecap="round" opacity={0.6} />
      <text x={16} y={44} fontSize={15} fill={MUTED}>
        light
      </text>
      <rect x={126} y={110} width={48} height={24} rx={6} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      <rect x={84} y={128} width={132} height={216} rx={18} fill="var(--glass-fill)" stroke="var(--glass-wall)" strokeWidth={2} />
      <rect x={88} y={252} width={124} height={92} rx={12} fill="var(--liquid)" />
      <circle cx={150} cy={190} r={46} fill="var(--fg-subtle)" opacity={0.18} />
      <Mol g={G.phosgene} x={150} y={190} scale={s} />
      <Tag x={300} y={110} label="Extremely poisonous gas" tone="var(--caution)" width={260} />
      <rect x={350} y={170} width={120} height={170} rx={46} fill="none" stroke={MUTED} strokeWidth={2} />
      <ellipse cx={400} cy={230} rx={26} ry={18} fill="var(--caution)" opacity={0.85} />
      <ellipse cx={385} cy={282} rx={9} ry={14} fill="var(--caution)" opacity={0.85} />
      <ellipse cx={431} cy={282} rx={9} ry={14} fill="var(--caution)" opacity={0.85} />
      <line x1={426} y1={230} x2={486} y2={230} stroke={MUTED} strokeWidth={1} />
      <line x1={440} y1={282} x2={486} y2={282} stroke={MUTED} strokeWidth={1} />
      <text x={490} y={235} fontSize={14} fill={FG}>
        liver
      </text>
      <text x={490} y={287} fontSize={14} fill={FG}>
        kidneys
      </text>
      <Caption>Clear, half empty, light on: phosgene forms in the air space.</Caption>
    </g>
  )
}

function StepIodoform() {
  const s = LABEL_SCALE
  const I = HALOGEN_TONE.I
  return (
    <g>
      <Mol g={G.chi3} x={135} y={100} scale={s} />
      <rect x={40} y={190} width={190} height={100} rx={10} fill="var(--surface-raised)" stroke={MUTED} strokeWidth={2} />
      <rect x={56} y={206} width={158} height={70} rx={6} fill="none" stroke={MUTED} strokeDasharray="5 5" />
      <rect x={230} y={220} width={62} height={70} rx={8} fill="var(--surface-raised)" stroke={MUTED} strokeWidth={2} />
      <rect x={242} y={230} width={40} height={24} rx={3} fill="var(--glass-fill)" stroke="var(--glass-wall)" />
      <circle cx={85} cy={294} r={18} fill={FG} />
      <circle cx={255} cy={294} r={18} fill={FG} />
      <line x1={266} y1={250} x2={356} y2={250} stroke={MUTED} strokeWidth={2} strokeDasharray="6 5" />
      <polygon points="352,243 364,250 352,257" fill={MUTED} />
      <ellipse cx={470} cy={250} rx={82} ry={62} fill="var(--red)" opacity={0.16} stroke="var(--red)" strokeWidth={2} />
      <text x={470} y={336} textAnchor="middle" fontSize={15} fill={FG}>
        wound
      </text>
      <text x={470} y={172} textAnchor="middle" fontSize={15} fill={FG}>
        free iodine, I₂
      </text>
      {/* Iodine is set free as I₂ molecules: two bonded atoms each. */}
      {[
        [430, 238],
        [480, 268],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <line x1={cx} y1={cy} x2={cx + 30} y2={cy} stroke={I} strokeWidth={4} />
          {[cx, cx + 30].map((x) => (
            <g key={x}>
              <circle cx={x} cy={cy} r={15} fill={I} />
              <text x={x} y={cy + 5} textAnchor="middle" fontSize={14} fontWeight={600} fill="var(--accent-fg)">
                I
              </text>
            </g>
          ))}
        </g>
      ))}
      <text x={135} y={330} textAnchor="middle" fontSize={15} fill={MUTED}>
        CHI₃, empty van
      </text>
      <Caption>The molecule only carries the iodine, which kills microbes.</Caption>
    </g>
  )
}

function StepStratosphere() {
  const sCl4 = LABEL_SCALE
  const sFreon = LABEL_SCALE
  return (
    <g>
      <rect x={0} y={40} width={W} height={110} fill="var(--accent-soft)" opacity={0.25} />
      <text x={20} y={62} fontSize={15} fill={MUTED}>
        stratosphere
      </text>
      <rect x={0} y={86} width={236} height={12} fill={ACCENT} opacity={0.8} />
      <rect x={236} y={92} width={64} height={3} fill={ACCENT} opacity={0.8} />
      <rect x={300} y={86} width={280} height={12} fill={ACCENT} opacity={0.8} />
      <text x={330} y={122} fontSize={14} fill={MUTED}>
        ozone band, thinning
      </text>
      {[250, 268, 286].map((x) => (
        <line key={x} x1={x} y1={6} x2={x} y2={200} stroke="var(--spec-violet)" strokeWidth={2} strokeDasharray="6 6" />
      ))}
      <text x={20} y={200} fontSize={14} fill={MUTED}>
        troposphere
      </text>
      <rect x={0} y={350} width={W} height={50} fill="var(--surface)" />
      <Mol g={G.ccl4} x={130} y={266} scale={sCl4} />
      <Mol g={G.freon} x={300} y={266} scale={sFreon} />
      <text x={130} y={344} textAnchor="middle" fontSize={15} fill={FG}>
        CCl₄
      </text>
      <text x={300} y={344} textAnchor="middle" fontSize={15} fill={FG}>
        CCl₂F₂
      </text>
      <line x1={130} y1={206} x2={130} y2={166} stroke={MUTED} strokeWidth={2} strokeDasharray="6 5" />
      <line x1={300} y1={206} x2={300} y2={166} stroke={MUTED} strokeWidth={2} strokeDasharray="6 5" />
      <circle cx={470} cy={230} r={22} fill="var(--accent-soft)" stroke={ACCENT} strokeWidth={1.5} />
      <text x={470} y={236} textAnchor="middle" fontSize={15} fill={FG}>
        Cl•
      </text>
      <text x={470} y={270} textAnchor="middle" fontSize={14} fill={MUTED}>
        radical starts a chain
      </text>
      <Caption y={384}>Both pass the lower layers unchanged, then reach the stratosphere.</Caption>
    </g>
  )
}

const FAT_DROPLETS: readonly (readonly [number, number])[] = [
  [90, 318], [150, 340], [210, 312], [270, 344], [330, 316], [400, 340], [460, 314], [510, 338],
  [230, 286], [380, 286], [480, 284],
]

function StepDdt() {
  return (
    <g>
      <Mol g={G.ddt} x={290} y={124} scale={DDT_SCALE} />
      <rect x={40} y={256} width={500} height={110} rx={40} fill="var(--caution-soft)" stroke="var(--caution)" strokeWidth={2} />
      <text x={60} y={284} fontSize={15} fill={MUTED}>
        fatty tissue
      </text>
      {FAT_DROPLETS.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={12} fill="var(--caution)" opacity={0.45} />
      ))}
      <Caption>Not broken down, so it stays and builds up. Banned in the United States in 1973.</Caption>
    </g>
  )
}

const STEPS = [StepDichloromethane, StepBrownBottle, StepClearBottle, StepIodoform, StepStratosphere, StepDdt]

export function PolyhaloGallery({ step }: PolyhaloGalleryProps) {
  const Visual = STEPS[Math.max(0, Math.min(step, STEPS.length - 1))]
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label={POLYHALO_STEP_LABELS[step] ?? POLYHALO_STEP_LABELS[0]}
      style={{ display: 'block' }}
    >
      <Visual />
    </svg>
  )
}

