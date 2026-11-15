'use client'

import { Label } from '@/components/vocab'
import { SkeletalFormula, subscriptDigits } from '@/components/organic'
import { Molecule3D, Molecule3DFallback, cameraForMolecule, type Molecule3DData } from '@/components/molecule'
import { Stage3DLazy } from '@/components/stage3d'
import { alkeneConfiguration, type AlkeneGeometry, type FamilyMember } from '@/lib/chem/isomer-families'
import { isomerSteps, type IsomerStep } from './isomer-steps'
import styles from './IsomerFamily.module.css'

export interface IsomerFamilyProps {
  step: number
  reducedMotion: boolean
}

const VIEW_WIDTH = 580
const VIEW_HEIGHT = 440
/** Pixels per bond, for the skeletal drawings. Chosen so a drawing fills its share of the panel. */
const CHAIN_SCALE = 46
const PAIR_SCALE = 80
const ROW_CENTRES = [88, 220, 352] as const
const PAIR_X = [148, 432] as const

const STEPS = isomerSteps()

/** Subscript digits in a condensed formula such as CH3CH2OH or CH3(CH2)3CH3. */
const subscripted = (text: string) => text.replace(/\d+/g, (d) => subscriptDigits(Number(d)))

/** Splits text into lines of at most `width` characters, at word boundaries. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word
    if (next.length > width && line) {
      lines.push(line)
      line = word
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** The shared fade-in class, dropped under reduced motion so the Step is shown at once. */
const enter = (reducedMotion: boolean) => (reducedMotion ? undefined : styles.enter)

/** Three chain isomers, one per row: the drawing with its parent chain shaded, and the name. */
function ChainRows({ step, rows, reducedMotion }: { step: number; rows: Extract<IsomerStep, { kind: 'chain' }>['rows']; reducedMotion: boolean }) {
  return (
    <g key={`chain-${step}`} className={enter(reducedMotion)} data-testid="isomer-chain">
      {rows.map((row, i) => {
        const y = ROW_CENTRES[i]
        return (
          <g key={row.member.name}>
            {i > 0 ? <line x1={40} x2={VIEW_WIDTH - 40} y1={y - 66} y2={y - 66} stroke="var(--fg-subtle)" strokeOpacity={0.25} /> : null}
            <SkeletalFormula
              graph={row.member.graph}
              scale={CHAIN_SCALE}
              x={120}
              y={y}
              highlightAtoms={row.chainAtoms}
              highlightBonds={row.chainBonds}
            />
            <Label x={300} y={y - 14} fontSize={20} fill="var(--fg)" fontWeight={600}>
              {row.member.name}
            </Label>
            <Label x={300} y={y + 12} fontSize={16} fill="var(--fg-muted)">
              {subscripted(row.member.condensed ?? '')}
            </Label>
            <Label x={300} y={y + 36} fontSize={15} fill="var(--fg-subtle)">
              {`longest chain: ${row.chainLength} carbons`}
            </Label>
          </g>
        )
      })}
    </g>
  )
}

/** Two molecules side by side, with the relation the lib gives them. */
function PairDrawing({
  step,
  left,
  right,
  relation,
  phrase,
  reducedMotion,
}: {
  step: number
  left: FamilyMember
  right: FamilyMember
  relation: string
  phrase: string
  reducedMotion: boolean
}) {
  const [kind, ...rest] = phrase.split(': ')
  const description = rest.join(': ')
  const lines = wrap(description, 54)
  const members = [left, right]
  return (
    <g key={`pair-${step}`} className={enter(reducedMotion)} data-testid="isomer-pair" data-relation={relation}>
      <Label x={VIEW_WIDTH / 2} y={58} fontSize={24} fill="var(--fg)" fontWeight={600} textAnchor="middle">
        {kind.charAt(0).toUpperCase() + kind.slice(1)}
      </Label>
      {lines.map((line, i) => (
        <Label key={line} x={VIEW_WIDTH / 2} y={392 + i * 22} fontSize={16} fill="var(--fg-muted)" textAnchor="middle">
          {line}
        </Label>
      ))}
      <line x1={VIEW_WIDTH / 2} x2={VIEW_WIDTH / 2} y1={96} y2={300} stroke="var(--fg-subtle)" strokeOpacity={0.3} />
      {members.map((m, i) => (
        <g key={m.name}>
          <SkeletalFormula graph={m.graph} scale={PAIR_SCALE} x={PAIR_X[i]} y={186} />
          <Label x={PAIR_X[i]} y={300} fontSize={20} fill="var(--fg)" fontWeight={600} textAnchor="middle">
            {m.name}
          </Label>
          <Label x={PAIR_X[i]} y={326} fontSize={16} fill="var(--fg-muted)" textAnchor="middle">
            {subscripted(m.condensed ?? '')}
          </Label>
        </g>
      ))}
    </g>
  )
}

/** A 3D cis or trans but-2-ene, with its name and the test the lib applies. */
function Geometry3D({
  step,
  config,
  name,
  geometry,
  reducedMotion,
}: {
  step: number
  config: 'cis' | 'trans'
  name: string
  geometry: AlkeneGeometry
  reducedMotion: boolean
}) {
  const data: Molecule3DData = {
    atoms: geometry.atoms.map((a) => ({ id: a.id, element: a.element, position: a.position })),
    bonds: geometry.bonds.map((b) => ({ a: b.a, b: b.b, order: b.order })),
  }
  const camera = cameraForMolecule(data, 1.25)
  const detected = alkeneConfiguration(geometry)
  const caption =
    config === 'cis'
      ? 'Both CH₃ groups sit on the same side of the C=C bond.'
      : 'The CH₃ groups sit on opposite sides of the C=C bond.'
  return (
    <div key={`geo-${step}`} className={`${styles.geometry} ${enter(reducedMotion) ?? ''}`} data-testid="isomer-geometry" data-config={detected}>
      <Stage3DLazy
        key={config}
        label={`${name} in 3D, drag to turn it`}
        fallback={<Molecule3DFallback {...data} />}
        cameraPosition={camera}
        hint="Drag to turn"
      >
        <Molecule3D {...data} />
      </Stage3DLazy>
      <p className={styles.caption}>
        {name}: {caption}
      </p>
    </div>
  )
}

/**
 * The isomer-family Scrolly visual. Steps 1 to 3 show a chain set and two pairs as drawings with
 * the lib's names and relations. Steps 4 and 5 show cis and trans but-2-ene in 3D, the one
 * stereoisomer pair this Section draws. Each Step fades in; under reduced motion it is shown at once.
 */
export function IsomerFamily({ step, reducedMotion }: IsomerFamilyProps) {
  const index = Math.min(STEPS.length - 1, Math.max(0, Math.round(step)))
  const active = STEPS[index]

  if (active.kind === 'geometry') {
    return (
      <div className={styles.panel} data-testid="isomer-family" data-step={index}>
        <Geometry3D step={index} config={active.config} name={active.name} geometry={active.geometry} reducedMotion={reducedMotion} />
      </div>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      role="img"
      aria-label={
        active.kind === 'chain'
          ? `The three ${active.formula} isomers: ${active.rows.map((r) => r.member.name).join(', ')}`
          : `${active.left.name} and ${active.right.name}: ${active.phrase}`
      }
      style={{ width: '100%', height: 'auto', display: 'block' }}
      data-testid="isomer-family"
      data-step={index}
    >
      {active.kind === 'chain' ? (
        <ChainRows step={index} rows={active.rows} reducedMotion={reducedMotion} />
      ) : (
        <PairDrawing
          step={index}
          left={active.left}
          right={active.right}
          relation={active.relation}
          phrase={active.phrase}
          reducedMotion={reducedMotion}
        />
      )}
    </svg>
  )
}
