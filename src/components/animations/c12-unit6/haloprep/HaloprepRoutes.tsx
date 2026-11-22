'use client'

import type { ReactNode } from 'react'
import { SkeletalFormula, skeletalBounds } from '@/components/organic/SkeletalFormula'
import { drawingFrame } from '@/components/organic/frame'
import { HALOGEN_TONE, type Halogen } from '@/components/vocab/organic6/tones'
import { useReveal } from '@/components/animations/unit4/vbt/useStepTween'
import { parseSmiles } from '@/lib/chem/molecule-parse'
import type { MolGraph } from '@/lib/chem/molecule-graph'
import { HALOPREP_STEP_COUNT, SPECIES, speciesName } from './haloprep-steps'

export interface HaloprepRoutesProps {
  step: number
  reducedMotion: boolean
}

/** One drawing size for every Step: the panel is about 570 px, so 15-unit text renders at about 14 px. */
const W = 600
const H = 470
const BOND = 44
const TEXT = 15
const NAME = 16
const INK = 'var(--bond)'
const HALOGENS: readonly string[] = ['F', 'Cl', 'Br', 'I']

function isHalogen(element: string): element is Halogen {
  return HALOGENS.includes(element)
}

/** Halogen atoms in their shared tone: the drawing's own label is covered by a disc of that tone. */
function HalogenDiscs({ graph, scale, cx, cy }: { graph: MolGraph; scale: number; cx: number; cy: number }) {
  const { points } = drawingFrame(graph, scale)
  return (
    <>
      {graph.atoms.map((atom, i) => {
        if (!isHalogen(atom.element)) return null
        const p = points[i]
        return (
          <g key={`hal${i}`} transform={`translate(${cx + p.x}, ${cy + p.y})`} data-halogen={atom.element}>
            <circle r={0.34 * scale} fill={HALOGEN_TONE[atom.element]} />
            <text textAnchor="middle" dominantBaseline="central" fontSize={16} fill="var(--bg)">
              {atom.element}
            </text>
          </g>
        )
      })}
    </>
  )
}

/** A species drawn as a skeletal structure, centred on (cx, cy), with its IUPAC name under it. */
function Species({
  smiles,
  cx,
  cy,
  scale = BOND,
  tag,
  reveal = 1,
}: {
  smiles: string
  cx: number
  cy: number
  scale?: number
  tag?: string
  reveal?: number
}) {
  const graph = parseSmiles(smiles)
  const b = skeletalBounds(graph, scale)
  const top = cy + b.y
  const bottom = cy + b.y + b.height
  return (
    <g opacity={reveal}>
      <SkeletalFormula graph={graph} scale={scale} x={cx} y={cy} />
      <HalogenDiscs graph={graph} scale={scale} cx={cx} cy={cy} />
      {tag ? (
        <text x={cx} y={top - 12} textAnchor="middle" fontSize={TEXT} fill="var(--accent)">
          {tag}
        </text>
      ) : null}
      <text x={cx} y={bottom + 26} textAnchor="middle" fontSize={NAME} fill="var(--fg)">
        {speciesName(smiles)}
      </text>
    </g>
  )
}

/** A reaction arrow from x1 to x2 at height y, with a reagent above and a condition below. */
function Arrow({ x1, x2, y, above, below }: { x1: number; x2: number; y: number; above?: string; below?: string }) {
  const mid = (x1 + x2) / 2
  return (
    <g>
      <line x1={x1} y1={y} x2={x2 - 12} y2={y} stroke={INK} strokeWidth={2.4} />
      <polygon points={`${x2},${y} ${x2 - 13},${y - 7} ${x2 - 13},${y + 7}`} fill={INK} />
      {above ? (
        <text x={mid} y={y - 14} textAnchor="middle" fontSize={TEXT} fill="var(--fg)">
          {above}
        </text>
      ) : null}
      {below ? (
        <text x={mid} y={y + 24} textAnchor="middle" fontSize={TEXT} fill="var(--fg-muted)">
          {below}
        </text>
      ) : null}
    </g>
  )
}

/** A small pill with an upward arrow: a gas that leaves the flask. */
function GasTag({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g>
      <rect x={x - 38} y={y - 15} width={76} height={30} rx={15} fill="var(--surface-raised)" stroke="var(--border)" />
      <text x={x} y={y + 5} textAnchor="middle" fontSize={TEXT} fill="var(--fg)">
        {`${label} ↑`}
      </text>
    </g>
  )
}

/** A beaker with a solid settled in its base. Only the solid's tone and label change. */
function Beaker({ cx, cy, solidTone, solidLabel }: { cx: number; cy: number; solidTone: string; solidLabel: string }) {
  const w = 210
  const h = 112
  const solidH = 34
  const left = cx - w / 2
  const top = cy - h / 2
  return (
    <g>
      <rect x={left} y={top} width={w} height={h} rx={20} fill="var(--surface)" stroke="var(--bond)" strokeWidth={2} />
      <rect x={left + 3} y={top + h - solidH - 3} width={w - 6} height={solidH} fill={solidTone} />
      <text x={left + w + 14} y={top + h - solidH / 2 + 3} dominantBaseline="central" fontSize={TEXT} fill="var(--fg)">
        {solidLabel} (solid)
      </text>
    </g>
  )
}

/** The panel's frame and the Step's title and caption, shared by every Step. */
function Frame({ title, captions, children }: { title: string; captions: readonly string[]; children: ReactNode }) {
  return (
    <>
      <text x={W / 2} y={36} textAnchor="middle" fontSize={19} fill="var(--fg)">
        {title}
      </text>
      {children}
      {captions.map((line, k) => (
        <text key={k} x={W / 2} y={H - 46 + k * 24} textAnchor="middle" fontSize={TEXT} fill="var(--fg-muted)">
          {line}
        </text>
      ))}
    </>
  )
}

/**
 * The haloalkane-routes Scrolly: six routes to one set of haloalkanes, one drawing per Step.
 * Structures come from the SMILES in haloprep-steps.ts; names are the namer's output.
 */
export function HaloprepRoutes({ step, reducedMotion }: HaloprepRoutesProps) {
  const index = Math.min(HALOPREP_STEP_COUNT - 1, Math.max(0, Math.round(step)))
  const reveal = useReveal(index, reducedMotion)
  const fade = Math.min(1, reveal)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={ALT[index]}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-step={index}
      data-testid="haloprep-visual"
    >
      <defs>
        <linearGradient id="haloprep-br-fade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" style={{ stopColor: HALOGEN_TONE.Br, stopOpacity: 1 }} />
          <stop offset="1" style={{ stopColor: HALOGEN_TONE.Br, stopOpacity: 0.04 }} />
        </linearGradient>
      </defs>
      {index === 0 ? <Step1 reveal={fade} /> : null}
      {index === 1 ? <Step2 reveal={fade} /> : null}
      {index === 2 ? <Step3 reveal={fade} /> : null}
      {index === 3 ? <Step4 reveal={fade} /> : null}
      {index === 4 ? <Step5 reveal={fade} /> : null}
      {index === 5 ? <Step6 reveal={fade} /> : null}
    </svg>
  )
}

const ALT = [
  'Butan-1-ol with thionyl chloride gives 1-chlorobutane; SO₂ and HCl escape as gases.',
  'Butane with chlorine in light gives a mixture of 1-chlorobutane and 2-chlorobutane.',
  'But-1-ene with HBr gives 2-bromobutane as the major product (Markovnikov).',
  'But-1-ene with bromine in CCl₄ gives 1,2-dibromobutane; the bromine colour fades.',
  'Finkelstein: 1-bromobutane with NaI in dry acetone gives 1-iodobutane and solid NaBr.',
  'Swarts: 1-bromobutane with AgF gives 1-fluorobutane and solid AgBr.',
]

function Step1({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="Alcohol and thionyl chloride"
      captions={['SO₂ and HCl leave as gases.', 'The liquid chloroalkane stays behind in the flask.']}
    >
      <Species smiles={SPECIES.butanol} cx={125} cy={200} tag="1° alcohol" />
      <Arrow x1={215} x2={335} y={200} above="SOCl₂" />
      <Species smiles={SPECIES.chlorobutane} cx={455} cy={200} reveal={reveal} />
      <GasTag x={270} y={112} label="SO₂" />
      <GasTag x={370} y={112} label="HCl" />
    </Frame>
  )
}

function Step2({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="Alkane and chlorine in light"
      captions={['A mixture of isomeric chloroalkanes, hard to separate.', 'The yield of any one of them is low.']}
    >
      <Species smiles={SPECIES.butane} cx={115} cy={200} />
      <g stroke="var(--spec-yellow)" strokeWidth={2.4} strokeLinecap="round">
        <line x1={205} y1={140} x2={200} y2={156} />
        <line x1={230} y1={134} x2={230} y2={152} />
        <line x1={255} y1={140} x2={260} y2={156} />
      </g>
      <Arrow x1={190} x2={285} y={200} above="Cl₂" below="light (hν)" />
      <Species smiles={SPECIES.chlorobutane} cx={435} cy={132} reveal={reveal} />
      <Species smiles={SPECIES.chlorobutaneSecondary} cx={435} cy={282} reveal={reveal} />
      <GasTag x={235} y={290} label="HCl" />
    </Frame>
  )
}

function Step3({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="Alkene and hydrogen bromide"
      captions={['H goes to the CH₂ end, which already has more hydrogens.', 'Br goes to the middle carbon: the major product.']}
    >
      <Species smiles={SPECIES.butene} cx={125} cy={200} />
      <Arrow x1={210} x2={330} y={200} above="Hδ⁺–Brδ⁻" />
      <Species smiles={SPECIES.bromobutaneSecondary} cx={455} cy={200} tag="major (Markovnikov)" reveal={reveal} />
    </Frame>
  )
}

function Step4({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="Alkene and bromine in solvent"
      captions={['One Br adds to each carbon of the C=C.', 'The reddish-brown colour disappears: a test for a double bond.']}
    >
      <Species smiles={SPECIES.butene} cx={125} cy={200} />
      <Arrow x1={210} x2={330} y={200} above="Br₂ in CCl₄" />
      <rect x={210} y={214} width={120} height={14} rx={7} fill="url(#haloprep-br-fade)" />
      <text x={270} y={250} textAnchor="middle" fontSize={TEXT} fill="var(--fg-muted)">
        Br₂ is used up
      </text>
      <Species smiles={SPECIES.dibromobutane} cx={455} cy={200} tag="colourless" reveal={reveal} />
    </Frame>
  )
}

function Step5({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="Finkelstein exchange"
      captions={['NaBr is insoluble in dry acetone and settles out.', 'Removing it pulls the reaction forward (Le Chatelier).']}
    >
      <Species smiles={SPECIES.bromobutane} cx={120} cy={150} />
      <Arrow x1={228} x2={318} y={150} above="NaI" below="dry acetone" />
      <Species smiles={SPECIES.iodobutane} cx={425} cy={150} reveal={reveal} />
      <Beaker cx={300} cy={335} solidTone="var(--precipitate)" solidLabel="NaBr" />
    </Frame>
  )
}

function Step6({ reveal }: { reveal: number }) {
  return (
    <Frame
      title="Swarts exchange"
      captions={['AgBr is insoluble and stays in the flask.', 'Hg₂F₂, CoF₂ and SbF₃ are also used for this exchange.']}
    >
      <Species smiles={SPECIES.bromobutane} cx={120} cy={150} />
      <Arrow x1={228} x2={318} y={150} above="AgF" />
      <Species smiles={SPECIES.fluorobutane} cx={425} cy={150} reveal={reveal} />
      <Beaker cx={300} cy={335} solidTone="var(--agbr-pale-yellow)" solidLabel="AgBr" />
    </Frame>
  )
}
