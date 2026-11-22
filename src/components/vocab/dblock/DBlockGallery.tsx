import React from 'react'
import styles from '@/app/vocab/vocab.module.css'
import { ColourWheel } from './ColourWheel'
import { ConfigurationBoxes, type SubshellConfig } from './ConfigurationBoxes'
import { DBlockStrip, dBlockStripHeight } from './DBlockStrip'
import { SolutionColour, SOLUTION_COLOUR_HEIGHT } from './SolutionColour'
import { MetalLattice, latticeSize } from './MetalLattice'
import { Oxoanion, OXOANION_KINDS, oxoanionBounds } from './Oxoanion'
import { EnergyCycle, energyDomain, type EnergyStep } from './EnergyCycle'
import { MagnetBalance } from './MagnetBalance'
import { SERIES_TONE } from './tones'
import { Sub } from '@/components/animations/c12-unit1/ChemSvg'
import { electrodeCycle } from '@/lib/chem/dblock'

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

/** Table 4.4 data (NCERT p. 99) via the lib: [ΔaH, IE₁ + IE₂, ΔhydH], kJ mol⁻¹. */
function cycleOf(symbol: string): number[] {
  const c = electrodeCycle(symbol)
  return [c.atomisation, c.ie1PlusIe2, c.hydration]
}
const ZN_KJ = cycleOf('Zn')
const CU_KJ = cycleOf('Cu')
const ATOMISATION = <>Δ<Sub>a</Sub>H</>
const HYDRATION = <>Δ<Sub>hyd</Sub>H</>

/** Signed number with a true minus sign and thin grouping. */
function signed(v: number): string {
  const digits = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return `${v > 0 ? '+' : v < 0 ? '\u2212' : ''}${digits}`
}
function sumOf(values: number[]): number {
  return values.reduce((a, b) => a + b, 0)
}
const cycleDomain = energyDomain(ZN_KJ, CU_KJ)
const znSteps: EnergyStep[] = [
  { name: ATOMISATION, value: ZN_KJ[0], text: signed(ZN_KJ[0]) },
  { name: 'IE₁ + IE₂', value: ZN_KJ[1], text: signed(ZN_KJ[1]) },
  { name: HYDRATION, value: ZN_KJ[2], text: signed(ZN_KJ[2]) },
]
const cuSteps: EnergyStep[] = [
  { name: ATOMISATION, value: CU_KJ[0], text: signed(CU_KJ[0]) },
  { name: 'IE₁ + IE₂', value: CU_KJ[1], text: signed(CU_KJ[1]) },
  { name: HYDRATION, value: CU_KJ[2], text: signed(CU_KJ[2]) },
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
        <SolutionColour x={8} y={0} width={190} ion="ti3" light label="Ti³⁺(aq)" />
        <SolutionColour x={202} y={0} width={190} ion="cu2" light label="Cu²⁺(aq)" />
        <SolutionColour x={396} y={0} width={190} ion="mno4" precipitate="mno2" label="MnO₄⁻ + MnO₂(s)" />
      </Card>

      <Card
        heading="Colour wheel: absorbed light and the colour seen"
        description="The absorbed sector has a dashed outline. The colour you see is the one directly opposite it on the wheel. An orange-absorbing solution looks blue."
        viewBox="0 0 600 220"
      >
        <ColourWheel cx={300} cy={110} radius={74} absorbed="orange" seen="blue" />
      </Card>

      <Card
        heading="Interstitial and alloy lattices"
        description="A small atom such as carbon sits in a hole between metal atoms without breaking the lattice, which gives an interstitial compound. Atoms of similar size can instead take the place of metal atoms, which gives an alloy."
        viewBox="0 0 600 226"
      >
        <MetalLattice x={30} y={8} interstitial="C" tone={SERIES_TONE['3d']} />
        <text x={150} y={206} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          Carbon in titanium
        </text>
        <MetalLattice x={330} y={8} alloy={{ symbol: 'Cr', tone: 'var(--spec-orange)' }} tone={SERIES_TONE['3d']} />
        <text x={450} y={206} textAnchor="middle" fontSize={15} style={{ fill: 'var(--fg)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
          Chromium in iron
        </text>
      </Card>

      <Card
        heading="Oxoanions: four ions, four shapes"
        description="Chromate is tetrahedral. Dichromate is two tetrahedra sharing one bridging oxygen, so the Cr–O–Cr angle is bent. Permanganate is tetrahedral and purple; manganate, with one more electron, is green. The solution tint is the ion's colour."
        viewBox="0 0 600 384"
      >
        {OXOANION_KINDS.map((kind, i) => {
          const cx = i % 2 === 0 ? 150 : 450
          const cy = i < 2 ? 92 : 276
          const b = oxoanionBounds(kind)
          const originY = cy - (b.minY + b.maxY + 30) / 2
          return <Oxoanion key={kind} kind={kind} x={cx} y={originY} tint={kind} showOxidationState />
        })}
      </Card>

      <Card
        heading="Energy cycles on one scale"
        description="Each step is an arrow up for an endothermic change and down for an exothermic one. The two cycles share a single vertical scale, so the levels can be compared directly. Values for zinc and copper from NCERT Table 4.4: copper ends higher, which is why its electrode potential is positive."
        viewBox="0 0 600 250"
      >
        <EnergyCycle
          x={0}
          y={0}
          width={296}
          height={240}
          domain={cycleDomain}
          species={['Zn(s)', 'Zn(g)', 'Zn²⁺(g)', 'Zn²⁺(aq)']}
          steps={znSteps}
          net={{ name: 'Net', value: sumOf(ZN_KJ), text: signed(sumOf(ZN_KJ)) }}
        />
        <EnergyCycle
          x={304}
          y={0}
          width={296}
          height={240}
          domain={cycleDomain}
          species={['Cu(s)', 'Cu(g)', 'Cu²⁺(g)', 'Cu²⁺(aq)']}
          steps={cuSteps}
          net={{ name: 'Net', value: sumOf(CU_KJ), text: signed(sumOf(CU_KJ)) }}
        />
      </Card>

      <Card
        heading="Magnetic balance: the sign of the pull"
        description="A paramagnetic sample is pulled into the field and hangs lower; a diamagnetic sample is pushed out and rises. The dotted line marks where it hangs with no field. Both drawings are schematic."
        viewBox="0 0 600 282"
      >
        <MagnetBalance x={20} y={0} pull={-0.2} schematic />
        <MagnetBalance x={320} y={0} pull={0.8} schematic />
      </Card>
    </div>
  )
}
