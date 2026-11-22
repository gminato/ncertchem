import React from 'react'
import styles from '@/app/vocab/vocab.module.css'
import { ColourWheel } from './ColourWheel'
import { ConfigurationBoxes, type SubshellConfig } from './ConfigurationBoxes'
import { DBlockStrip, dBlockStripHeight } from './DBlockStrip'
import { SolutionColour, SOLUTION_COLOUR_HEIGHT } from './SolutionColour'
import { LabelSup, LabelSub } from '../Label'

/** Electron configurations as NCERT's Table 4.1 gives them for these atoms and ions. */
const CR: SubshellConfig[] = [
  { subshell: '3d', electrons: 5 },
  { subshell: '4s', electrons: 1 },
]
const CU: SubshellConfig[] = [
  { subshell: '3d', electrons: 10 },
  { subshell: '4s', electrons: 1 },
]
const FE: SubshellConfig[] = [
  { subshell: '3d', electrons: 6 },
  { subshell: '4s', electrons: 2 },
]
const FE2: SubshellConfig[] = [
  { subshell: '3d', electrons: 6 },
  { subshell: '4s', electrons: 0, removed: 2 },
]
const FE3: SubshellConfig[] = [
  { subshell: '3d', electrons: 5, removed: 1 },
  { subshell: '4s', electrons: 0, removed: 2 },
]
const LU: SubshellConfig[] = [
  { subshell: '4f', electrons: 14 },
  { subshell: '5d', electrons: 1 },
  { subshell: '6s', electrons: 2 },
]

const D_SERIES = ['Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn']

function Card({ heading, description, viewBox, children }: { heading: string; description: string; viewBox: string; children: React.ReactNode }) {
  return (
    <article className={`${styles.card} ${styles.cardWide}`}>
      <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
        <svg viewBox={viewBox} style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label={heading}>
          {children}
        </svg>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeading}>
          <span>{heading}</span>
        </div>
        <p className={styles.cardDescription}>{description}</p>
      </div>
    </article>
  )
}

/** One labelled configuration row: the caption sits above the boxes. */
function Row({ title, config, y, highlight }: { title: string; config: SubshellConfig[]; y: number; highlight?: { subshell: string; orbitals?: readonly number[] } }) {
  return (
    <g>
      <text x={300} y={y + 15} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
        {title}
      </text>
      <ConfigurationBoxes config={config} x={20} y={y + 28} width={560} highlight={highlight} />
    </g>
  )
}

/** Gap between a row's caption and the next caption, in SVG units. */
const ROW = 84

/** The d- and f-block figures of the Visual Vocabulary, in the order the Section pages use them. */
export function DBlockGallery() {
  return (
    <div className={styles.grid}>
      <Card
        heading="Configurations: the 4s electron leaves first"
        description="Boxes show one electron per orbital before any pairing, with the (n−1)d subshell to the left of ns. Chromium (3d⁵4s¹) and copper (3d¹⁰4s¹) are the exceptions: a half-filled or filled d set is especially stable."
        viewBox={`0 0 600 ${ROW * 2 + 70}`}
      >
        <Row title="Chromium, Cr: 3d⁵4s¹" config={CR} y={4} />
        <Row title="Copper, Cu: 3d¹⁰4s¹" config={CU} y={4 + ROW} />
        <Row title="Iron, Fe: 3d⁶4s²" config={FE} y={4 + 2 * ROW} />
      </Card>

      <Card
        heading="Ions: ghosted arrows are the electrons lost"
        description="Iron(II) loses its two 4s electrons first and keeps 3d⁶. Iron(III) then loses one 3d electron. The faded arrows mark where the lost electrons were."
        viewBox={`0 0 600 ${ROW + 70}`}
      >
        <Row title="Fe²⁺: [Ar]3d⁶" config={FE2} y={4} highlight={{ subshell: '4s' }} />
        <Row title="Fe³⁺: [Ar]3d⁵" config={FE3} y={4 + ROW} />
      </Card>

      <Card
        heading="Lutetium: the 4f shell fills before 5d"
        description="In the f-block the 4f subshell is full (4f¹⁴) before the 5d electron of lutetium appears. The seven 4f boxes are drawn at a smaller size so the row still fits."
        viewBox="0 0 600 104"
      >
        <Row title="Lutetium, Lu: 4f¹⁴5d¹6s²" config={LU} y={4} highlight={{ subshell: '5d' }} />
      </Card>

      <Card
        heading="The first transition series and the f-rows"
        description="Groups 3 to 12 in periods 4 to 7, tinted by series: 3d, 4d, 5d and 6d. The two f-rows hold the lanthanoids (4f) and actinoids (5f). Here the 3d series is emphasised."
        viewBox={`0 0 600 ${dBlockStripHeight(true) + 40}`}
      >
        <DBlockStrip x={14} y={6} showF highlight={D_SERIES} />
      </Card>

      <Card
        heading="Solutions: light passes through, and the colour is the one transmitted"
        description="Dilute aqua ions take their colours from Table 4.8. A solution absorbs part of the white light, and the light that gets through is the colour you see. Solid MnO₂ can settle out of permanganate solution as a brown deposit."
        viewBox={`0 0 600 ${SOLUTION_COLOUR_HEIGHT}`}
      >
        <SolutionColour x={8} y={0} width={190} ion="ti3" light label={<>Ti<LabelSup>3+</LabelSup>(aq)</>} />
        <SolutionColour x={202} y={0} width={190} ion="cu2" light label={<>Cu<LabelSup>2+</LabelSup>(aq)</>} />
        <SolutionColour x={396} y={0} width={190} ion="mno4" precipitate="mno2" label={<>MnO<LabelSub>4</LabelSub><LabelSup>−</LabelSup> + MnO₂</>} />
      </Card>

      <Card
        heading="Colour wheel: absorbed light and the colour seen"
        description="The absorbed sector is faded. The colour you see is the one directly opposite it on the wheel. An orange-absorbing solution looks blue."
        viewBox="0 0 600 220"
      >
        <ColourWheel cx={300} cy={110} radius={74} absorbed="orange" seen="blue" />
      </Card>
    </div>
  )
}
