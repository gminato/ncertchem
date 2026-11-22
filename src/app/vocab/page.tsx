import React from 'react'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { pageTitle } from '@/lib/brand'
import {
  VocabDefs,
  Electron,
  Nucleus,
  EnergyLevel,
  Photon,
  Label,
  ladderY,
  ladderLabels,
  joulesToEv,
  orbitLabelPosition,
  Atom,
  Molecule,
  ParticleBox,
  Vessel,
  SpectrumStrip,
  OrbitalBox,
  EMWave,
  EnergyLadder,
} from '@/components/vocab'
import { Stage3DLazy, OrbitalLobes3D } from '@/components/stage3d'
import { energyLevel } from '@/lib/chem/bohr'
import { PeriodicDemo } from '@/components/periodic'
import {
  LewisDiagram,
  MODiagram,
  MO_DIAGRAM_SIZE,
  OverlapDiagram,
  OVERLAP_SIZE,
  HybridOrbitals,
  HYBRID_SIZE,
  DipoleArrow,
  PotentialEnergyCurve,
  PE_CURVE_SIZE,
  Molecule3D,
  Molecule3DFallback,
  cameraForMolecule,
} from '@/components/molecule'
import {
  WATER_3D,
  METHANE_3D,
  SF4_3D,
  SF4_VIEW,
  CO3_LEWIS,
  NACL_BEFORE,
  NACL_AFTER,
  NACL_TRANSFER,
  O2_LEVELS,
  N2_LEVELS,
} from '@/components/molecule/fixture'

/** Balmer lines in the visible range, with their relative brightness. */
const HYDROGEN_LINES = [
  { nm: 656, intensity: 1 },
  { nm: 486, intensity: 0.85 },
  { nm: 434, intensity: 0.7 },
  { nm: 410, intensity: 0.6 },
]
import {
  SystemBoundary,
  PistonCylinder,
  PVDiagram,
  PV_SIZE,
  Calorimeter,
  CALORIMETER_SIZE,
  EnthalpyDiagram,
  ENTHALPY_SIZE,
  GibbsPlot,
  GIBBS_SIZE,
  EntropyBox,
  pathWork,
} from '@/components/thermo'
import {
  PV_EXPANSION,
  HESS_CARBON,
  GIBBS_CASES,
  PISTON_DEMO,
  NRT_300,
} from '@/components/thermo/fixture'
import {
  OxidationTag,
  ElectronTransfer,
  ONLadder,
  ReactionBeaker,
  DaniellCell,
  PotentialLadder,
  TitrationRig,
  HalfEquationCard,
  CR2O7_TAGS,
  MNO4_TAGS,
  S4O6_TAGS,
  NA_CL_TRANSFER_BASE,
  CL2_DISPROPORTIONATION_SPECIES,
  CL2_DISPROPORTIONATION_TRANSITIONS,
  TABLE_7_1_COUPLES,
  ZN_CU_HIGHLIGHT,
  FE_CR2O7_MID_BALANCE,
} from '@/components/redox'
import {
  SkeletalFormula,
  StructuralFormula,
  Wedge3D,
  WEDGE_SIZE,
  CurvedArrow,
  ResonanceSet,
  resonanceBounds,
  InductiveChain,
  IntermediateOrbital,
  INTERMEDIATE_SIZE,
  BondCleavage,
  BOND_CLEAVAGE_SIZE,
  FunctionalGroupBadge,
  skeletalBounds,
  skeletalFrame,
  structuralBounds,
  condensedBounds,
  viewBoxOf,
  TRIMETHYLPENTANE,
  TRIMETHYLPENTANE_CHAIN_ATOMS,
  TRIMETHYLPENTANE_CHAIN_BONDS,
  BUTANOIC_ACID,
  CHLOROTOLUENE,
  CYCLOHEXENE,
  PENTAN2OL,
  ACETATE_A,
  ACETATE_B,
  ACETATE_HYBRID,
  BENZENE_A,
  BENZENE_B,
  BENZENE_HYBRID,
  METHYL_BROMIDE,
  CHLORINE,
  NewmanProjection,
  NEWMAN_SIZE,
  SawhorseProjection,
  SAWHORSE_SIZE,
  TorsionalEnergyPlot,
  TORSIONAL_PLOT_SIZE,
  ReactionScheme,
  reactionSchemeSize,
  layoutReactionScheme,
  PiBondOrbitals,
  PI_VIEWBOX,
  BenzeneRing,
  BENZENE_RING_SIZE,
  BENZENE_LABELLED_SIZE,
  AreniumIon,
  areniumBounds,
  EASMechanism,
  EAS_MECHANISM_SIZE,
  AdditionMechanism,
  ADDITION_MECHANISM_SIZE,
  PolymerChain,
  POLYMER_CHAIN_SIZE,
  PROPENE,
  TWO_BROMOPROPANE,
  ONE_BROMOPROPANE,
  type SchemePath,
} from '@/components/organic'
import {
  SealedVessel,
  RateBars,
  EquilibriumCurves,
  IceTable,
  QKGauge,
  LeChatelierScale,
  PHScale,
  IonisationBeaker,
  BufferMeter,
  SolubilityBeaker,
} from '@/components/equilibrium'
import {
  WATER_VAPOUR_SPECIES,
  N2O4_SPECIES,
  H2_I2_PANELS,
  ICE_H2_I2,
  PH_MARKERS,
  AGCL_IONS,
} from '@/components/equilibrium/fixture'
import {
  DistillationRig,
  DISTILLATION_RIG_SIZE,
  SublimationSetup,
  SUBLIMATION_SETUP_SIZE,
  Crystallisation,
  CRYSTALLISATION_SIZE,
  SeparatingFunnel,
  SEPARATING_FUNNEL_SIZE,
  ChromatographyPlate,
  CHROMATOGRAPHY_PLATE_SIZE,
  ChromatographyColumn,
  CHROMATOGRAPHY_COLUMN_SIZE,
  TestTubeRack,
  TEST_TUBE_RACK_ROW_HEIGHT,
  FusionTube,
  FUSION_TUBE_SIZE,
  CombustionTrain,
  COMBUSTION_TRAIN_SIZE,
  DumasApparatus,
  DUMAS_APPARATUS_SIZE,
  KjeldahlSetup,
  KJELDAHL_SETUP_SIZE,
  CariusTube,
  CARIUS_TUBE_SIZE,
  TLC_SPOTS,
  PAPER_SPOTS,
  FUNNEL_LAYERS,
  COLUMN_BANDS,
  LASSAIGNE_TUBES,
  ReagentTest,
  REAGENT_TEST_SIZE,
  CarbideGenerator,
  CARBIDE_GENERATOR_SIZE,
} from '@/components/organic/lab'
import styles from './vocab.module.css'
import {
  Beaker,
  Electrode,
  SaltBridge,
  Voltmeter,
  Galvanometer,
  Wire,
  DcSource,
  Ion,
  GasBubbles,
  HydrogenElectrode,
  ConductivityCell,
  BatteryCutaway,
  type ElectrodeMaterial,
} from '@/components/vocab'
import { KineticsGallery } from '@/components/vocab/kinetics/KineticsGallery'

export const metadata: Metadata = {
  title: pageTitle('Visual Vocabulary'),
  description:
    'Design tokens and visual vocabulary specimen sheet for Class 11 and 12 chemistry.',
}

/** Formats a (negative) energy in eV as a magnitude, e.g. -13.6 -> "13.6". */
function formatEvMagnitude(ev: number): string {
  return Math.abs(ev).toPrecision(3)
}

/** Work in L atm, signed with a true minus sign, to one decimal place. */
function signedWork(w: number): string {
  return `−${Math.abs(w).toFixed(1)}`
}

const WORK_ONE_STEP = pathWork(PV_EXPANSION.oneStep)
const WORK_MANY_STEP = pathWork(PV_EXPANSION.manyStep)
const WORK_REVERSIBLE = pathWork(PV_EXPANSION.reversible)

/* Unit 8 organic structures: fixed geometry for the demos, computed once. */
const TMP_BOUNDS = skeletalBounds(TRIMETHYLPENTANE)
// Locants sit beside their own chain atom. Atom 4 (index 3) takes the free up-right side, clear of both bonds.
const TMP_LOCANTS = TRIMETHYLPENTANE_CHAIN_ATOMS.map((atom, i) => ({ atom, label: String(i + 1), angle: i === 3 ? -45 : undefined }))
const PENTANOL_FRAME = skeletalFrame(PENTAN2OL)
const PENTANOL_O = PENTANOL_FRAME.points[2]
const PENTANOL_BADGE = { x: PENTANOL_O.x + 120, y: PENTANOL_O.y }
const PENTANOL_BOUNDS = skeletalBounds(PENTAN2OL)
const CONDENSED_BOUNDS = condensedBounds(PENTAN2OL)
const STRUCTURAL_BOUNDS = structuralBounds(PENTAN2OL)
/* Bond length in px for the resonance sets: each contributor is about 200 px wide. */
const RESONANCE_SCALE = 72
const RESONANCE_CARBOXYLATE_BOUNDS = resonanceBounds([{ graph: ACETATE_A }, { graph: ACETATE_B }], { graph: ACETATE_HYBRID }, RESONANCE_SCALE, 84)
const RESONANCE_BENZENE_BOUNDS = resonanceBounds([{ graph: BENZENE_A }, { graph: BENZENE_B }], { graph: BENZENE_HYBRID }, RESONANCE_SCALE, 84)
const CLEAVAGE_VIEW = `${-BOND_CLEAVAGE_SIZE.width / 2} ${-BOND_CLEAVAGE_SIZE.height / 2} ${BOND_CLEAVAGE_SIZE.width} ${BOND_CLEAVAGE_SIZE.height}`
const ORBITAL_VIEW = `${-INTERMEDIATE_SIZE.width / 2} ${-INTERMEDIATE_SIZE.height / 2} ${INTERMEDIATE_SIZE.width} ${INTERMEDIATE_SIZE.height}`

/* Morph strip: the same molecule at five morph progress values, side by side. */
const MORPH_FRAMES = [0, 0.25, 0.5, 0.75, 1] as const
const MORPH_SPACING = STRUCTURAL_BOUNDS.width + 28
const MORPH_VIEW = `${STRUCTURAL_BOUNDS.x - 8} ${STRUCTURAL_BOUNDS.y - 8} ${(MORPH_FRAMES.length - 1) * MORPH_SPACING + STRUCTURAL_BOUNDS.width + 16} ${STRUCTURAL_BOUNDS.height + 52}`

/* Unit 9 hydrocarbons: reaction schemes and fixed positions for the demos. */
const PROPENE_HBR_SCHEME: SchemePath = [
  [{ formula: PROPENE, highlightAtoms: [1, 2] }, { formula: 'HBr' }],
  { reagents: 'HBr', conditions: 'no peroxide' },
  [
    { formula: TWO_BROMOPROPANE, tag: 'major', highlightAtoms: [1, 2] },
    { formula: ONE_BROMOPROPANE, tag: 'minor' },
  ],
]
const ETHYNE_STEPS: SchemePath = [
  [{ formula: 'H–C≡C–H' }],
  { reagents: 'H₂', conditions: 'Lindlar catalyst' },
  [{ formula: 'H₂C=CH₂' }],
  { reagents: 'H₂', conditions: 'Pt/Pd/Ni' },
  [{ formula: 'H₃C–CH₃' }],
]
/** Bond-length scales for the propene scheme: the largest that keeps it on one row fills most of the card. */
const PROPENE_SCALES = [60, 56, 52, 48] as const
const PROPENE_LAYOUT = layoutReactionScheme(PROPENE_HBR_SCHEME, 900, PROPENE_SCALES)

export default function VocabPage() {
  // Proportional hydrogen energy levels (converted from Joules to eV), n = 1..4
  const ladderEv = [1, 2, 3, 4].map((n) => joulesToEv(energyLevel(n)))
  const ladderBounds = { top: -46, bottom: 46, eMin: ladderEv[0], eMax: ladderEv[3] }
  const ladderRows = ladderEv.map((ev, i) => ({
    n: i + 1,
    ev,
    rungY: ladderY(ev, ladderBounds),
  }))
  // Rung labels sit to the right of each rung; close rungs are pushed apart.
  const ladderPlacement = ladderLabels(
    ladderRows.map((row) => ({ y: row.rungY })),
    13
  )

  // Orbit labels sit just outside each circle at the top, in the gap above it.
  const orbit1Label = orbitLabelPosition(0, 0, 30, -90, 8)
  const orbit2Label = orbitLabelPosition(0, 0, 54, -90, 8)

  // Hydrogen levels for the energy ladder card, in eV (negative: bound states).
  const hydrogenLevels = [1, 2, 3, 4].map((n) => ({
    n,
    ev: joulesToEv(energyLevel(n)),
  }))

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <header className={styles.header}>
        <div className={styles.headerText}>
          <span className={styles.eyebrow}>Design System · Class 11 &amp; 12</span>
          <h1 className={styles.title}>Visual Vocabulary</h1>
          <p className={styles.lead}>
            The single, fixed way each chemistry entity—electron, proton, neutron, nucleus,
            energy level, and photon packet—is drawn everywhere on the site. Refined for light
            editorial reading and luminous dark mode exploration.
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* Subatomic Entities Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Subatomic Particles &amp; Nuclei</h2>
        <p className={styles.sectionSubtitle}>
          Color-coded entities using semantic CSS custom properties: cool blue for electrons,
          warm coral-red for protons, and warm grey for neutrons.
        </p>

        <div className={styles.grid}>
          {/* Card: Electron */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-70 -60 140 120"
                className={styles.svgElement}
                role="img"
                aria-label="Electron specimen: solid cool blue particle with radial halo glow"
              >
                <VocabDefs />
                <Electron x={0} y={-8} size={14} />
                <Label x={0} y={32} fontSize={13}>
                  e⁻
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electron</span>
                <span className={styles.cardBadge}>--electron</span>
              </div>
              <p className={styles.cardDescription}>
                An electron drawn as a cool blue particle with a soft glow halo.
              </p>
            </div>
          </article>

          {/* Card: Nucleus H (1p, 0n) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-70 -60 140 120"
                className={styles.svgElement}
                role="img"
                aria-label="Hydrogen nucleus specimen with 1 proton"
              >
                <VocabDefs />
                <Nucleus protons={1} neutrons={0} x={0} y={-8} nucleonRadius={10} />
                <Label x={0} y={34} fontSize={13}>
                  ¹H (1p, 0n)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Hydrogen Nucleus</span>
                <span className={styles.cardBadge}>1p, 0n</span>
              </div>
              <p className={styles.cardDescription}>
                A single proton drawn in warm coral-red with a subtle highlight.
              </p>
            </div>
          </article>

          {/* Card: Nucleus He (2p, 2n) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-70 -60 140 120"
                className={styles.svgElement}
                role="img"
                aria-label="Helium nucleus alpha particle specimen with 2 protons and 2 neutrons"
              >
                <VocabDefs />
                <Nucleus protons={2} neutrons={2} x={0} y={-8} nucleonRadius={9} />
                <Label x={0} y={34} fontSize={13}>
                  ⁴He (2p, 2n)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Helium Nucleus</span>
                <span className={styles.cardBadge}>2p, 2n</span>
              </div>
              <p className={styles.cardDescription}>
                An alpha particle cluster of two protons and two warm-grey neutrons.
              </p>
            </div>
          </article>

          {/* Card: Nucleus Li (3p, 4n) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-70 -60 140 120"
                className={styles.svgElement}
                role="img"
                aria-label="Lithium nucleus specimen with 3 protons and 4 neutrons"
              >
                <VocabDefs />
                <Nucleus protons={3} neutrons={4} x={0} y={-8} nucleonRadius={8} />
                <Label x={0} y={34} fontSize={13}>
                  ⁷Li (3p, 4n)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Lithium Nucleus</span>
                <span className={styles.cardBadge}>3p, 4n</span>
              </div>
              <p className={styles.cardDescription}>
                A seven-nucleon cluster packed in depth with three protons and four neutrons.
              </p>
            </div>
          </article>

          {/* Card: Heavy Nucleus (> 20 nucleons) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-70 -60 140 120"
                className={styles.svgElement}
                role="img"
                aria-label="Heavy nucleus specimen showing unified shaded sphere for nucleon count greater than 20"
              >
                <VocabDefs />
                <Nucleus protons={26} neutrons={30} x={0} y={-8} />
                <Label x={0} y={34} fontSize={13}>
                  ⁵⁶Fe (count &gt; 20)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Heavy Nucleus</span>
                <span className={styles.cardBadge}>&gt; 20 nucleons</span>
              </div>
              <p className={styles.cardDescription}>
                A heavy nucleus with more than twenty nucleons drawn as a single shaded sphere with a nuclear glow.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Photons & Spectral Packets Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Photons &amp; Spectral Packets</h2>
        <p className={styles.sectionSubtitle}>
          Mathematical wave packets (Gaussian envelope × sine wave). The visual wavelength of the
          wiggle scales with physical wavelength, while spectral colors map via Dan Bruton’s
          algorithm. Non-visible wavelengths are drawn dashed.
        </p>

        <div className={styles.grid}>
          {/* Card: 656 nm Red (Hα) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-80 -50 160 100"
                className={styles.svgElement}
                role="img"
                aria-label="Photon wave packet at 656 nanometers, red visible light"
              >
                <VocabDefs />
                <Photon wavelengthNm={656} x={-60} y={-8} length={120} />
                <Label x={0} y={28} fontSize={12}>
                  H<Label.Sub>α</Label.Sub><tspan dy="-0.32em"> · 656 nm (Red)</tspan>
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer Hα</span>
                <span className={styles.cardBadge}>656 nm</span>
              </div>
              <p className={styles.cardDescription}>
                The 656 nm red Balmer alpha photon drawn as a gentle wave packet.
              </p>
            </div>
          </article>

          {/* Card: 486 nm Cyan (Hβ) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-80 -50 160 100"
                className={styles.svgElement}
                role="img"
                aria-label="Photon wave packet at 486 nanometers, cyan visible light"
              >
                <VocabDefs />
                <Photon wavelengthNm={486} x={-60} y={-8} length={120} />
                <Label x={0} y={28} fontSize={12}>
                  H<Label.Sub>β</Label.Sub><tspan dy="-0.32em"> · 486 nm (Cyan)</tspan>
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer Hβ</span>
                <span className={styles.cardBadge}>486 nm</span>
              </div>
              <p className={styles.cardDescription}>
                The 486 nm cyan Balmer beta photon drawn with medium-frequency oscillations.
              </p>
            </div>
          </article>

          {/* Card: 434 nm Blue (Hγ) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-80 -50 160 100"
                className={styles.svgElement}
                role="img"
                aria-label="Photon wave packet at 434 nanometers, blue violet visible light"
              >
                <VocabDefs />
                <Photon wavelengthNm={434} x={-60} y={-8} length={120} />
                <Label x={0} y={28} fontSize={12}>
                  H<Label.Sub>γ</Label.Sub><tspan dy="-0.32em"> · 434 nm (Blue)</tspan>
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer Hγ</span>
                <span className={styles.cardBadge}>434 nm</span>
              </div>
              <p className={styles.cardDescription}>
                The 434 nm blue Balmer gamma photon drawn with compact oscillations.
              </p>
            </div>
          </article>

          {/* Card: 410 nm Violet (Hδ) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-80 -50 160 100"
                className={styles.svgElement}
                role="img"
                aria-label="Photon wave packet at 410 nanometers, deep violet visible light"
              >
                <VocabDefs />
                <Photon wavelengthNm={410} x={-60} y={-8} length={120} />
                <Label x={0} y={28} fontSize={12}>
                  H<Label.Sub>δ</Label.Sub><tspan dy="-0.32em"> · 410 nm (Violet)</tspan>
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer Hδ</span>
                <span className={styles.cardBadge}>410 nm</span>
              </div>
              <p className={styles.cardDescription}>
                The 410 nm violet Balmer delta photon drawn with rapid oscillations.
              </p>
            </div>
          </article>

          {/* Card: 121 nm UV (Lyman-α) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-80 -50 160 100"
                className={styles.svgElement}
                role="img"
                aria-label="Photon wave packet at 121 nanometers, non-visible ultraviolet light rendered dashed"
              >
                <VocabDefs />
                <Photon wavelengthNm={121} x={-60} y={-8} length={120} />
                <Label x={0} y={28} fontSize={12}>
                  Lyman-α · 121 nm (UV)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Ultraviolet (Lyman-α)</span>
                <span className={styles.cardBadge}>Dashed · UV</span>
              </div>
              <p className={styles.cardDescription}>
                A 121 nm ultraviolet photon drawn as a dashed wave packet in violet.
              </p>
            </div>
          </article>

          {/* Card: 1875 nm IR (Paschen-α) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-80 -50 160 100"
                className={styles.svgElement}
                role="img"
                aria-label="Photon wave packet at 1875 nanometers, non-visible infrared light rendered dashed"
              >
                <VocabDefs />
                <Photon wavelengthNm={1875} x={-60} y={-8} length={120} />
                <Label x={0} y={28} fontSize={12}>
                  Paschen-α · 1875 nm (IR)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Infrared (Paschen-α)</span>
                <span className={styles.cardBadge}>Dashed · IR</span>
              </div>
              <p className={styles.cardDescription}>
                An 1875 nm infrared photon drawn as a dashed wave packet in rust.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Energy Levels Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Energy Levels</h2>
        <p className={styles.sectionSubtitle}>
          Two distinct visual projections: circular Bohr orbits for spatial atomic models and
          planar ladder diagrams for spectroscopic transitions.
        </p>

        <div className={styles.grid}>
          {/* Card: Bohr Orbits */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-90 -70 180 140"
                className={styles.svgElement}
                role="img"
                aria-label="Energy levels orbit variant showing inactive and active circular Bohr orbits"
              >
                <VocabDefs />
                <EnergyLevel variant="orbit" r={30} active={false} />
                <EnergyLevel variant="orbit" r={54} active={true} />
                {/* Labels sit in the gap just outside each orbit, centred above it */}
                <Label
                  x={orbit1Label.x}
                  y={orbit1Label.y}
                  fontSize={11}
                  textAnchor={orbit1Label.textAnchor}
                  halo
                >
                  <tspan fontStyle="italic">n</tspan> = 1
                </Label>
                <Label
                  x={orbit2Label.x}
                  y={orbit2Label.y}
                  fontSize={11}
                  textAnchor={orbit2Label.textAnchor}
                  fill="var(--orbit-active)"
                  halo
                >
                  <tspan fontStyle="italic">n</tspan> = 2 (active)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Bohr Orbits</span>
                <span className={styles.cardBadge}>variant=&quot;orbit&quot;</span>
              </div>
              <p className={styles.cardDescription}>
                Concentric circular paths showing electron orbits, highlighted when active.
              </p>
            </div>
          </article>

          {/* Card: Energy Ladder (Physically Proportional for Hydrogen n=1..4) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-95 -70 220 140"
                className={styles.svgElement}
                role="img"
                aria-label="Energy levels ladder variant showing proportionally spaced hydrogen levels n=1 to 4"
              >
                <VocabDefs />
                {ladderRows.map((row, i) => {
                  const place = ladderPlacement[i]
                  const isActive = row.n === 2
                  return (
                    <g key={row.n}>
                      <EnergyLevel
                        variant="ladder"
                        width={50}
                        x={-55}
                        y={row.rungY}
                        active={isActive}
                      />
                      {place.nudged && (
                        <line
                          x1={-30}
                          y1={row.rungY}
                          x2={-26}
                          y2={place.labelY}
                          strokeWidth={0.8}
                          style={{ stroke: 'var(--fg-subtle)' }}
                        />
                      )}
                      <Label
                        x={-24}
                        y={place.labelY}
                        fontSize={10.5}
                        textAnchor="start"
                        fill={isActive ? 'var(--orbit-active)' : 'var(--fg-muted)'}
                        halo
                      >
                        <tspan fontStyle="italic">n</tspan> = {row.n} (
                        {'\u2212'}
                        {formatEvMagnitude(row.ev)} eV){isActive ? ' [active]' : ''}
                      </Label>
                    </g>
                  )
                })}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Energy Ladder</span>
                <span className={styles.cardBadge}>variant=&quot;ladder&quot;</span>
              </div>
              <p className={styles.cardDescription}>
                Horizontal rungs spaced proportionally to energy levels, highlighted when active.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Putting it together Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Putting it together</h2>
        <p className={styles.sectionSubtitle}>
          Combining a nucleus, concentric Bohr orbits, an electron, and an emitted photon into a
          single diagram.
        </p>

        <div className={styles.grid}>
          <article className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-200 -140 400 280"
                className={styles.svgElement}
                role="img"
                aria-label="Composite Bohr atom model featuring a central nucleus, three concentric orbits, an electron on n=2, and an emitted 486 nm photon"
              >
                <VocabDefs />

                {/* Concentric Bohr Orbits */}
                <EnergyLevel variant="orbit" r={40} active={false} />
                <EnergyLevel variant="orbit" r={78} active={true} />
                <EnergyLevel variant="orbit" r={116} active={false} />

                {/* Level labels stacked above the atom, each centred just outside its orbit */}
                <Label
                  x={orbitLabelPosition(0, 0, 40, -90, 10).x}
                  y={orbitLabelPosition(0, 0, 40, -90, 10).y}
                  fontSize={11}
                  halo
                >
                  <tspan fontStyle="italic">n</tspan> = 1
                </Label>
                <Label
                  x={orbitLabelPosition(0, 0, 78, -90, 10).x}
                  y={orbitLabelPosition(0, 0, 78, -90, 10).y}
                  fontSize={11}
                  fill="var(--orbit-active)"
                  halo
                >
                  <tspan fontStyle="italic">n</tspan> = 2 (active)
                </Label>
                <Label
                  x={orbitLabelPosition(0, 0, 116, -90, 10).x}
                  y={orbitLabelPosition(0, 0, 116, -90, 10).y}
                  fontSize={11}
                  halo
                >
                  <tspan fontStyle="italic">n</tspan> = 3
                </Label>

                {/* Central Hydrogen Nucleus */}
                <Nucleus protons={1} neutrons={0} x={0} y={0} nucleonRadius={9} />

                {/* Orbiting Electron on n=2 */}
                <Electron x={78} y={0} size={11} />

                {/* Emitted Photon Packet escaping from the atom */}
                <Photon
                  wavelengthNm={486}
                  x1={86}
                  y1={-10}
                  x2={186}
                  y2={-65}
                  amplitude={7}
                />

                {/* Emitted Photon Annotation */}
                <Label x={128} y={-12} fontSize={11} fill="var(--fg-muted)" textAnchor="start" halo>
                  hν · 486 nm
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Composite Bohr Atom</span>
                <span className={styles.cardBadge}>Integrated Model</span>
              </div>
              <p className={styles.cardDescription}>
                A hydrogen atom with an electron in the active n = 2 orbit emitting a 486 nm photon.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Matter & molecules Section */}
      <section className={styles.section} id="matter" aria-labelledby="matter-heading">
        <h2 id="matter-heading" className={styles.sectionTitle}>
          Matter &amp; molecules
        </h2>
        <p className={styles.sectionSubtitle}>
          Atoms, molecules and the vessels that hold them. Each element keeps one colour and one
          size everywhere, and molecules are drawn with their true bond angles.
        </p>

        <div className={styles.grid}>
          {/* Card: Atoms */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-140 -50 280 100"
                className={styles.svgElement}
                role="img"
                aria-label="Six atoms in a row: hydrogen, carbon, nitrogen, oxygen, sodium and chlorine"
              >
                <VocabDefs />
                {[
                  { el: 'H', x: -110 },
                  { el: 'C', x: -66 },
                  { el: 'N', x: -22 },
                  { el: 'O', x: 22 },
                  { el: 'Na', x: 66 },
                  { el: 'Cl', x: 110 },
                ].map((a) => (
                  <g key={a.el}>
                    <Atom element={a.el} x={a.x} y={-6} />
                    <Label x={a.x} y={34} fontSize={13}>
                      {a.el}
                    </Label>
                  </g>
                ))}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Atoms</span>
                <span className={styles.cardBadge}>--el-*</span>
              </div>
              <p className={styles.cardDescription}>
                One harmonised colour per element. Hydrogen is the smallest sphere; sodium and
                chlorine are the largest.
              </p>
            </div>
          </article>

          {/* Card: Vessels (three variants in one canvas) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-150 -72 300 150"
                className={styles.svgElement}
                role="img"
                aria-label="Three vessels: a beaker 60 percent full, a conical flask 45 percent full, and a measuring cylinder 80 percent full"
              >
                <VocabDefs />
                <Vessel variant="beaker" level={0.6} x={-95} y={-2} width={64} height={96} graduated />
                <Vessel variant="flask" level={0.45} x={0} y={-2} width={72} height={96} />
                <Vessel variant="cylinder" level={0.8} x={95} y={0} width={46} height={104} graduated />
                <Label x={-95} y={66} fontSize={12}>
                  Beaker
                </Label>
                <Label x={0} y={66} fontSize={12}>
                  Flask
                </Label>
                <Label x={95} y={66} fontSize={12}>
                  Cylinder
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Vessels</span>
                <span className={styles.cardBadge}>Vessel</span>
              </div>
              <p className={styles.cardDescription}>
                A beaker, a conical flask and a measuring cylinder. Liquid fills from the base, and
                graduation marks are optional.
              </p>
            </div>
          </article>

          {/* Card: Diatomic gases (ball-and-stick) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-160 -40 320 92"
                className={styles.svgElement}
                role="img"
                aria-label="Four diatomic molecules in ball-and-stick style: H2, N2, O2 and Cl2"
              >
                <VocabDefs />
                {[
                  { f: 'H2', x: -120 },
                  { f: 'N2', x: -40 },
                  { f: 'O2', x: 40 },
                  { f: 'Cl2', x: 120 },
                ].map((m) => (
                  <g key={m.f}>
                    <Molecule formula={m.f} x={m.x} y={-4} scale={1.45} style="ball-and-stick" />
                    <Label x={m.x} y={36} fontSize={13}>
                      {m.f.replace(/\d/, '')}
                      <Label.Sub>2</Label.Sub>
                    </Label>
                  </g>
                ))}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Diatomic gases</span>
                <span className={styles.cardBadge}>Ball-and-stick</span>
              </div>
              <p className={styles.cardDescription}>
                Two identical atoms joined by a bond. Double and triple bonds are drawn as parallel
                bonds.
              </p>
            </div>
          </article>

          {/* Card: Particles in a box (full width) */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="0 0 560 220"
                className={styles.svgElement}
                role="img"
                aria-label="A glass box holding water, carbon dioxide, nitrogen, methane, oxygen, ammonia, and a sodium, a chlorine and a hydrogen atom"
              >
                <VocabDefs />
                <ParticleBox
                  x={20}
                  y={10}
                  width={520}
                  height={200}
                  items={[
                    { kind: 'molecule', formula: 'H2O', x: 84, y: 66, scale: 1.2 },
                    { kind: 'molecule', formula: 'CO2', x: 196, y: 52, style: 'ball-and-stick', scale: 1.3 },
                    { kind: 'molecule', formula: 'N2', x: 306, y: 46, scale: 1.2 },
                    { kind: 'molecule', formula: 'CH4', x: 426, y: 74, scale: 1.2 },
                    { kind: 'molecule', formula: 'O2', x: 112, y: 152, style: 'ball-and-stick', scale: 1.4 },
                    { kind: 'molecule', formula: 'NH3', x: 252, y: 150, style: 'ball-and-stick', scale: 1.4 },
                    { kind: 'atom', element: 'Na', x: 368, y: 148 },
                    { kind: 'atom', element: 'Cl', x: 430, y: 142 },
                    { kind: 'atom', element: 'H', x: 486, y: 172 },
                  ]}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Particles in a container</span>
                <span className={styles.cardBadge}>ParticleBox</span>
              </div>
              <p className={styles.cardDescription}>
                Molecules and atoms drawn inside a glassy wall. Each particle is clipped to the box,
                so the container reads as a single system.
              </p>
            </div>
          </article>

          {/* Card: Compounds (space-filling) */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-160 -64 320 124"
                className={styles.svgElement}
                role="img"
                aria-label="Four compounds in space-filling style: water, ammonia, methane and carbon dioxide"
              >
                <VocabDefs />
                {[
                  { f: 'H2O', x: -120 },
                  { f: 'NH3', x: -40 },
                  { f: 'CH4', x: 40 },
                  { f: 'CO2', x: 120 },
                ].map((m) => (
                  <g key={m.f}>
                    <Molecule formula={m.f} x={m.x} y={-6} style="space-filling" />
                    <Label x={m.x} y={44} fontSize={9}>
                      {m.f.split('').map((ch, i) =>
                        /\d/.test(ch) ? (
                          <Label.Sub key={i}>{ch}</Label.Sub>
                        ) : (
                          <React.Fragment key={i}>{ch}</React.Fragment>
                        )
                      )}
                    </Label>
                  </g>
                ))}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Compounds</span>
                <span className={styles.cardBadge}>Space-filling</span>
              </div>
              <p className={styles.cardDescription}>
                Water is bent at 104.5 degrees and methane is tetrahedral. Neighbouring spheres
                overlap slightly to show how the atoms pack together.
              </p>
            </div>
          </article>

          {/* Card: Ionic pair and HCl */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-160 -40 320 92"
                className={styles.svgElement}
                role="img"
                aria-label="Sodium chloride as a ball-and-stick ion pair, sodium chloride space-filling, and hydrogen chloride space-filling"
              >
                <VocabDefs />
                <Molecule formula="NaCl" x={-100} y={-4} scale={1.4} style="ball-and-stick" />
                <Molecule formula="NaCl" x={0} y={-4} style="space-filling" />
                <Molecule formula="HCl" x={100} y={-4} style="space-filling" />
                <Label x={-100} y={36} fontSize={13}>
                  NaCl
                </Label>
                <Label x={0} y={36} fontSize={13}>
                  NaCl
                </Label>
                <Label x={100} y={36} fontSize={13}>
                  HCl
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Ion pair and HCl</span>
                <span className={styles.cardBadge}>Na · Cl</span>
              </div>
              <p className={styles.cardDescription}>
                Sodium chloride is drawn as an ion pair with no bond line. Hydrogen chloride is a
                covalent molecule.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Light, spectra and electrons */}
      <section className={styles.section} id="light-spectra" aria-labelledby="light-spectra-heading">
        <h2 id="light-spectra-heading" className={styles.sectionTitle}>
          Light, spectra and electrons
        </h2>
        <p className={styles.sectionSubtitle}>
          How light carries energy, how atoms emit and absorb it, and how electrons fill their
          orbitals. Spectra use the same wavelength colours as the photons above.
        </p>

        <div className={styles.grid}>
          {/* Card: Spectra (three strips in one canvas) */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="0 0 640 262"
                className={styles.svgElement}
                role="img"
                aria-label="Three visible-spectrum strips from 380 to 750 nanometres: an emission spectrum with bright lines, an absorption spectrum with dark lines, and a continuous spectrum"
              >
                <VocabDefs idPrefix="spectra" />
                {(
                  [
                    { label: 'Emission', y: 52, mode: 'emission' },
                    { label: 'Absorption', y: 130, mode: 'absorption' },
                    { label: 'Continuous', y: 208, mode: 'continuous' },
                  ] as const
                ).map((row) => (
                  <g key={row.mode}>
                    <Label x={8} y={row.y + 7} textAnchor="start" fontSize={15} fill="var(--fg)">
                      {row.label}
                    </Label>
                    <SpectrumStrip
                      x={150}
                      y={row.y}
                      width={450}
                      height={14}
                      mode={row.mode}
                      lines={HYDROGEN_LINES}
                      idPrefix={`spectra-${row.mode}`}
                    />
                  </g>
                ))}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Spectra</span>
                <span className={styles.cardBadge}>SpectrumStrip</span>
              </div>
              <p className={styles.cardDescription}>
                Emission shows bright lines on a dim track. Absorption shows dark lines cut into a
                bright rainbow. A continuous spectrum has no lines at all.
              </p>
            </div>
          </article>

          {/* Card: Box-and-arrow configurations */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-12 -10 176 180"
                className={styles.svgElement}
                role="img"
                aria-label="Three subshells in box-and-arrow notation: 1s with a pair, 2p with three parallel spins (correct), and 2p with a paired electron before the other boxes are filled (violation, outlined)"
              >
                <VocabDefs />
                <OrbitalBox x={0} y={4} label="1s" orbitals={[{ up: true, down: true }]} />
                <OrbitalBox
                  x={0}
                  y={62}
                  label="2p"
                  orbitals={[
                    { up: true, down: false },
                    { up: true, down: false },
                    { up: true, down: false },
                  ]}
                />
                <OrbitalBox
                  x={0}
                  y={120}
                  label="2p"
                  state="violation"
                  orbitals={[
                    { up: true, down: true },
                    { up: true, down: false },
                    { up: false, down: false },
                  ]}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Box and arrow</span>
                <span className={styles.cardBadge}>OrbitalBox</span>
              </div>
              <p className={styles.cardDescription}>
                Each box is one orbital and each arrow one electron: up for spin +½, down for
                −½. Hund&rsquo;s rule fills every box once before pairing. The outlined row breaks
                it.
              </p>
            </div>
          </article>

          {/* Card: Electromagnetic wave */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="0 0 320 170"
                className={styles.svgElement}
                role="img"
                aria-label="An electromagnetic wave: an electric field in blue swings up and down, a magnetic field in violet swings in depth, both in phase, along an axis that points to the right"
              >
                <VocabDefs />
                <Label x={10} y={16} textAnchor="start" fontSize={12} fill="var(--accent)">
                  E · electric
                </Label>
                <Label x={10} y={32} textAnchor="start" fontSize={12} fill="var(--field-b)">
                  B · magnetic
                </Label>
                <EMWave x={16} y={96} length={284} wavelength={118} amplitude={34} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electromagnetic wave</span>
                <span className={styles.cardBadge}>E ⊥ B</span>
              </div>
              <p className={styles.cardDescription}>
                The electric and magnetic fields swing in step, at right angles to each other and to
                the direction the wave travels.
              </p>
            </div>
          </article>

          {/* Card: Energy ladder for hydrogen */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-8 -22 220 160"
                className={styles.svgElement}
                role="img"
                aria-label="Hydrogen energy ladder with levels n = 1 to 4 spaced in proportion to energy; n = 2 is active"
              >
                <VocabDefs />
                <EnergyLadder
                  levels={hydrogenLevels.map((level) => ({
                    label: (
                      <>
                        <tspan fontStyle="italic">n</tspan> = {level.n} ({'−'}
                        {formatEvMagnitude(level.ev)} eV)
                      </>
                    ),
                    energy: level.ev,
                  }))}
                  top={0}
                  bottom={128}
                  rungLeft={0}
                  rungRight={56}
                  labelX={66}
                  minLabelGap={14}
                  fontSize={12}
                  activeIndex={1}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Energy ladder</span>
                <span className={styles.cardBadge}>EnergyLadder</span>
              </div>
              <p className={styles.cardDescription}>
                Hydrogen&rsquo;s levels crowd together as n grows. Labels that would overlap are
                nudged apart and joined to their rung by a leader line.
              </p>
            </div>
          </article>

          {/* Card: 3D orbital specimen (full width) */}
          <article className={`${styles.card} ${styles.wide}`}>
            <Stage3DLazy
              label="Orbitals (3D): a translucent p-type lobe pair, coral and teal, with x, y and z axes. Drag to rotate."
              fallback={
                <svg viewBox="-96 -130 192 260" role="img" aria-label="Flat drawing of a p-type lobe pair: a coral lobe above a teal lobe">
                  <line
                    x1={-110}
                    x2={110}
                    y1={0}
                    y2={0}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    style={{ stroke: 'var(--fg-subtle)' }}
                  />
                  <ellipse cx={0} cy={-58} rx={42} ry={62} style={{ fill: 'var(--orbital-pos)', opacity: 0.8 }} />
                  <ellipse cx={0} cy={58} rx={42} ry={62} style={{ fill: 'var(--orbital-neg)', opacity: 0.8 }} />
                </svg>
              }
            >
              <OrbitalLobes3D />
            </Stage3DLazy>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Orbitals (3D)</span>
                <span className={styles.cardBadge}>Stage3D</span>
              </div>
              <p className={styles.cardDescription}>
                A placeholder p-type lobe pair in translucent coral and teal, with x, y and z axes.
                Drag to rotate and scroll to zoom. It stops turning once you interact, and it stays
                still when reduced motion is on.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Periodic table and trends */}
      <section className={styles.section} id="periodic" aria-labelledby="periodic-heading">
        <h2 id="periodic-heading" className={styles.sectionTitle}>
          Periodic table and trends
        </h2>
        <p className={styles.sectionSubtitle}>
          The table arranges elements by atomic number, and the same shape explains their
          properties. Blocks shade the s, p, d and f orbitals. Heatmaps and trend lines show how a
          property changes across a period, and the dips are where the orbital picture explains
          the data.
        </p>
        <article className={`${styles.card} ${styles.wide}`}>
          <div className={styles.cardBody}>
            <PeriodicDemo />
          </div>
        </article>
      </section>

      {/* Bonds and molecules */}
      <section className={styles.section} id="bonding" aria-labelledby="bonding-heading">
        <h2 id="bonding-heading" className={styles.sectionTitle}>
          Bonds and molecules
        </h2>
        <p className={styles.sectionSubtitle}>
          Shapes and bonds in 3D, electron-dot structures, molecular orbitals and how atomic
          orbitals overlap to form bonds. Lone pairs, bond angles and orbital phases use the same
          colours everywhere on the site.
        </p>

        <div className={styles.grid}>
          {/* Card: H2O in 3D */}
          <article className={styles.card}>
            <Stage3DLazy
              cameraPosition={cameraForMolecule(WATER_3D)}
              label="Water molecule (3D): oxygen with two hydrogens at 104.5 degrees and two lone pairs. Drag to rotate."
              fallback={<Molecule3DFallback {...WATER_3D} showSymbols />}
            >
              <Molecule3D {...WATER_3D} showSymbols />
            </Stage3DLazy>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Water</span>
                <span className={styles.cardBadge}>104.5°</span>
              </div>
              <p className={styles.cardDescription}>
                Two lone pairs on oxygen push the hydrogens together, so water is bent rather than
                linear.
              </p>
            </div>
          </article>

          {/* Card: CH4 in 3D */}
          <article className={styles.card}>
            <Stage3DLazy
              cameraPosition={cameraForMolecule(METHANE_3D)}
              label="Methane molecule (3D): carbon at the centre of a regular tetrahedron of four hydrogens. Drag to rotate."
              fallback={<Molecule3DFallback {...METHANE_3D} />}
            >
              <Molecule3D {...METHANE_3D} />
            </Stage3DLazy>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Methane</span>
                <span className={styles.cardBadge}>109.5°</span>
              </div>
              <p className={styles.cardDescription}>
                Four equal bonding pairs point to the corners of a tetrahedron, so every H–C–H angle
                is 109.5°.
              </p>
            </div>
          </article>

          {/* Card: SF4 in 3D */}
          <article className={styles.card}>
            <Stage3DLazy
              cameraPosition={cameraForMolecule(SF4_3D, 0.8, SF4_VIEW)}
              label="Sulphur tetrafluoride (3D): a see-saw with the lone pair in an equatorial position. Drag to rotate."
              fallback={<Molecule3DFallback {...SF4_3D} />}
            >
              <Molecule3D {...SF4_3D} />
            </Stage3DLazy>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Sulphur tetrafluoride</span>
                <span className={styles.cardBadge}>See-saw</span>
              </div>
              <p className={styles.cardDescription}>
                The lone pair takes an equatorial spot, where it is furthest from the bonding pairs.
                The two axial fluorines bend away from it.
              </p>
            </div>
          </article>

          {/* Card: CO3 2- Lewis structure with formal charges */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-118 -112 236 204"
                className={styles.svgElement}
                role="img"
                aria-label="Lewis structure of the carbonate ion: carbon bonded to one oxygen by a double bond and to two oxygens by single bonds, with formal charges, octet counts and brackets carrying a 2 minus charge"
              >
                <VocabDefs />
                <LewisDiagram
                  atoms={CO3_LEWIS.atoms}
                  bonds={CO3_LEWIS.bonds}
                  brackets={CO3_LEWIS.brackets}
                  fontSize={20}
                  dotRadius={2.5}
                  lonePairRadius={12}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Carbonate ion</span>
                <span className={styles.cardBadge}>Lewis · CO₃²⁻</span>
              </div>
              <p className={styles.cardDescription}>
                Each atom has eight electrons around it. The circled signs are formal charges, and
                the two single-bonded oxygens each carry one of the two negative charges.
              </p>
            </div>
          </article>

          {/* Card: Ionic transfer, Na and Cl (full width) */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="0 0 620 180"
                className={styles.svgElement}
                role="img"
                aria-label="Electron transfer: a sodium atom with one electron and a chlorine atom with seven give the electron to chlorine, giving a sodium ion and a chloride ion in brackets with an octet"
              >
                <VocabDefs />
                <g>
                  <LewisDiagram
                    x={150}
                    y={100}
                    atoms={NACL_BEFORE.atoms}
                    bonds={[]}
                    transfer={NACL_TRANSFER}
                    colourByOrigin
                    fontSize={22}
                    dotRadius={3.4}
                    lonePairRadius={12}
                  />
                </g>
                <Label x={312} y={100} fontSize={30} fill="var(--fg-muted)">
                  →
                </Label>
                <LewisDiagram
                  x={470}
                  y={100}
                  atoms={NACL_AFTER.atoms}
                  bonds={[]}
                  brackets={NACL_AFTER.brackets}
                  colourByOrigin
                  fontSize={22}
                  dotRadius={3.4}
                  lonePairRadius={12}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electron transfer</span>
                <span className={styles.cardBadge}>Na · Cl</span>
              </div>
              <p className={styles.cardDescription}>
                Sodium gives its outer electron to chlorine. The electron keeps its colour, so the
                chloride ion shows where it came from, and the pair becomes an ion pair.
              </p>
            </div>
          </article>

          {/* Card: O2 molecular orbitals (unmixed) */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={styles.moCanvas}>
              <svg
                viewBox={`0 0 ${MO_DIAGRAM_SIZE.width} ${MO_DIAGRAM_SIZE.height}`}
                className={styles.svgElement}
                role="img"
                aria-label="Molecular orbital diagram of oxygen: sigma 2p lies below pi 2p; the two pi star orbitals each hold one electron, so O2 is paramagnetic with bond order 2"
              >
                <VocabDefs />
                <MODiagram
                  mixing={false}
                  levels={O2_LEVELS}
                  highlight={['π*2p']}
                  elementA="O"
                  elementB="O"
                  bondOrder="2"
                  magnetism="paramagnetic"
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Oxygen MO</span>
                <span className={styles.cardBadge}>Unmixed</span>
              </div>
              <p className={styles.cardDescription}>
                In O₂ the σ2p orbital sits below the π2p pair. The two electrons in the π*2p orbitals
                stay unpaired, which is why oxygen is attracted to a magnet.
              </p>
            </div>
          </article>

          {/* Card: N2 molecular orbitals (mixed) */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={styles.moCanvas}>
              <svg
                viewBox={`0 0 ${MO_DIAGRAM_SIZE.width} ${MO_DIAGRAM_SIZE.height}`}
                className={styles.svgElement}
                role="img"
                aria-label="Molecular orbital diagram of nitrogen: pi 2p lies below sigma 2p; all electrons are paired, so N2 is diamagnetic with bond order 3"
              >
                <VocabDefs />
                <MODiagram
                  mixing
                  levels={N2_LEVELS}
                  highlight={['π2p', 'σ2p']}
                  elementA="N"
                  elementB="N"
                  bondOrder="3"
                  magnetism="diamagnetic"
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Nitrogen MO</span>
                <span className={styles.cardBadge}>Mixed</span>
              </div>
              <p className={styles.cardDescription}>
                s–p mixing lifts σ2p above the π2p pair. Every electron is paired, so N₂
                has bond order 3 and is diamagnetic.
              </p>
            </div>
          </article>

          {/* Overlap cards */}
          {(
            [
              { kind: 'ss', phase: 'positive', title: 's–s overlap', badge: 'σ', text: 'Two spherical s orbitals overlap along the line joining their nuclei, and the overlap is positive.' },
              { kind: 'sp', phase: 'positive', title: 's–p overlap', badge: 'σ', text: 'An s orbital meets the lobe of a p orbital that faces it. Like signs overlap positively.' },
              { kind: 'pp-sigma', phase: 'positive', title: 'p–p head-on', badge: 'σ', text: 'Two p lobes pointing at each other form a σ bond along the axis.' },
              { kind: 'pp-sigma', phase: 'negative', title: 'p–p head-on, out of phase', badge: 'σ*', text: 'Opposite signs face each other, so the overlap is negative. This is the antibonding case.' },
              { kind: 'pp-pi', phase: 'positive', title: 'p–p side-on', badge: 'π', text: 'Parallel p orbitals overlap sideways, above and below the axis, to form a π bond.' },
              { kind: 'sp', phase: 'zero', title: 's–p side-on', badge: '0', text: 'An s orbital approaching from the side meets equal positive and negative lobes, so the net overlap is zero.' },
            ] as const
          ).map((o) => (
            <article key={`${o.kind}-${o.phase}`} className={styles.card}>
              <div className={styles.cardCanvas}>
                <svg
                  viewBox={`0 0 ${OVERLAP_SIZE.width} ${OVERLAP_SIZE.height}`}
                  className={styles.svgElement}
                  role="img"
                  aria-label={`${o.title}: overlap of two orbitals, ${o.phase} overlap`}
                >
                  <VocabDefs />
                  <OverlapDiagram kind={o.kind} phase={o.phase} separation={0.45} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>{o.title}</span>
                  <span className={styles.cardBadge}>{o.badge}</span>
                </div>
                <p className={styles.cardDescription}>{o.text}</p>
              </div>
            </article>
          ))}

          {/* Hybrid orbitals */}
          {(
            [
              { kind: 'sp', title: 'sp hybrids', badge: 'Linear', text: 'One s and one p mix into two sp hybrids that point in opposite directions, 180° apart.' },
              { kind: 'sp2', title: 'sp² hybrids', badge: 'Trigonal', text: 'One s and two p orbitals give three sp² hybrids, in one plane 120° apart.' },
              { kind: 'sp3', title: 'sp³ hybrids', badge: 'Tetrahedral', text: 'One s and three p orbitals give four sp³ hybrids that point to the corners of a tetrahedron.' },
            ] as const
          ).map((h) => (
            <article key={h.kind} className={styles.card}>
              <div className={styles.cardCanvas}>
                <svg
                  viewBox={`0 0 ${HYBRID_SIZE.width} ${HYBRID_SIZE.height}`}
                  className={styles.svgElement}
                  role="img"
                  aria-label={`${h.title}: an s orbital and p orbitals mix to make hybrid lobes`}
                >
                  <VocabDefs />
                  <HybridOrbitals kind={h.kind} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>{h.title}</span>
                  <span className={styles.cardBadge}>{h.badge}</span>
                </div>
                <p className={styles.cardDescription}>{h.text}</p>
              </div>
            </article>
          ))}

          {/* Card: dipole arrow */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-100 -40 200 80"
                className={styles.svgElement}
                role="img"
                aria-label="Bond dipole of hydrogen chloride: an arrow from the hydrogen end, marked delta plus with a crossed tail, to the chlorine end, marked delta minus"
              >
                <VocabDefs />
                <DipoleArrow from={{ x: -58, y: 0 }} to={{ x: 58, y: 0 }} />
                <Label x={-58} y={26} fontSize={13} fill="var(--fg)">
                  H
                </Label>
                <Label x={58} y={26} fontSize={13} fill="var(--fg)">
                  Cl
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Bond dipole</span>
                <span className={styles.cardBadge}>δ+ → δ−</span>
              </div>
              <p className={styles.cardDescription}>
                The arrow points from the δ+ end to the δ− end. Its crossed tail marks the positive
                end, so the arrow reads as a direction of electron pull.
              </p>
            </div>
          </article>

          {/* Card: potential energy curve (H2) */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox={`0 0 ${PE_CURVE_SIZE.width} ${PE_CURVE_SIZE.height}`}
                className={styles.svgElement}
                role="img"
                aria-label="Potential energy curve for two hydrogen atoms: energy falls as the atoms approach, reaches a minimum at 74 picometres and rises steeply when they come closer"
              >
                <VocabDefs />
                <PotentialEnergyCurve />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Forming H₂</span>
                <span className={styles.cardBadge}>Energy minimum</span>
              </div>
              <p className={styles.cardDescription}>
                Energy falls as the hydrogen atoms approach, to a minimum at the bond length. Pushing
                them closer than that costs energy quickly.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Energy and thermodynamics */}
      <section className={styles.section} id="thermo" aria-labelledby="thermo-heading">
        <h2 id="thermo-heading" className={styles.sectionTitle}>
          Energy and thermodynamics
        </h2>
        <p className={styles.sectionSubtitle}>
          Systems and their boundaries, the work a gas does, heat measured in calorimeters, enthalpy
          diagrams and the Gibbs energy that decides whether a change happens. Heat is always warm
          and work is always cool.
        </p>

        <div className={styles.grid}>
          {/* Card: system types */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-280 -96 560 200"
                className={styles.svgElement}
                role="img"
                aria-label="Three systems in their surroundings: an open system exchanges matter and energy through gaps in its walls, a closed system exchanges only energy through a solid wall, and an isolated system, behind a double insulated wall, exchanges neither"
              >
                <SystemBoundary kind="open" matter="both" heat="in" particles={10} animated x={-180} y={-8} width={110} height={80} margin={34} />
                <SystemBoundary kind="closed" heat="out" work="in" particles={10} animated x={0} y={-8} width={110} height={80} margin={34} />
                <SystemBoundary kind="isolated" particles={10} x={180} y={-8} width={110} height={80} margin={34} />
                <Label x={-180} y={88} fontSize={13} fill="var(--fg)">Open: matter and energy</Label>
                <Label x={0} y={88} fontSize={13} fill="var(--fg)">Closed: energy only</Label>
                <Label x={180} y={88} fontSize={13} fill="var(--fg)">Isolated: neither</Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>System and surroundings</span>
                <span className={styles.cardBadge}>Open · Closed · Isolated</span>
              </div>
              <p className={styles.cardDescription}>
                An open system trades matter and energy through gaps in its walls. A closed system
                trades only energy: warm waves are heat, and the piston bar is work. An isolated
                system, like a thermos, trades neither.
              </p>
            </div>
          </article>

          {/* Card: piston at two volumes, with weights */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-190 -200 380 236"
                className={styles.svgElement}
                role="img"
                aria-label="Two gas cylinders at 300 kelvin with frictionless pistons: the left has a small volume under four weights, the right a large volume under one weight"
              >
                <VocabDefs />
                <PistonCylinder
                  x={-92}
                  y={0}
                  volume={PISTON_DEMO.compressed.volume}
                  externalPressure={PISTON_DEMO.compressed.externalPressure}
                  particles={14}
                  seed={5}
                />
                <PistonCylinder
                  x={92}
                  y={0}
                  volume={PISTON_DEMO.expanded.volume}
                  externalPressure={PISTON_DEMO.expanded.externalPressure}
                  particles={14}
                  seed={5}
                />
                <Label x={-92} y={22} fontSize={13} fill="var(--fg)">
                  small V, <tspan className="sym">p</tspan>
                  <Label.Sub>ext</Label.Sub> = 4 atm
                </Label>
                <Label x={92} y={22} fontSize={13} fill="var(--fg)">
                  large V, <tspan className="sym">p</tspan>
                  <Label.Sub>ext</Label.Sub> = 1 atm
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Piston at two volumes</span>
                <span className={styles.cardBadge}>
                  <span className="sym">pV</span> = <span className="sym">nRT</span>
                </span>
              </div>
              <p className={styles.cardDescription}>
                At a fixed temperature, a heavier load pushes the gas into a smaller volume. The same
                particles fill less space, so they strike the piston more often.
              </p>
            </div>
          </article>

          {/* Card: PV diagram, one-step vs many-step vs reversible */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox={`0 0 ${PV_SIZE.width} ${PV_SIZE.height}`}
                className={styles.svgElement}
                role="img"
                aria-label="p–V diagram of one mole of gas at 300 kelvin expanding from 2 to 10 litres: a single step does the least work, four steps do more, and the reversible isotherm does the most, shaded as the work area"
              >
                <VocabDefs />
                <PVDiagram
                  nRT={NRT_300}
                  shade="reversible"
                  series={[
                    {
                      id: 'reversible',
                      points: PV_EXPANSION.reversible,
                      tone: 'fg',
                      label: (
                        <>
                          reversible, <tspan className="sym">w</tspan> = {signedWork(WORK_REVERSIBLE)} L atm
                        </>
                      ),
                    },
                    {
                      id: 'many',
                      points: PV_EXPANSION.manyStep,
                      tone: 'accent',
                      label: (
                        <>
                          four steps, <tspan className="sym">w</tspan> = {signedWork(WORK_MANY_STEP)} L atm
                        </>
                      ),
                    },
                    {
                      id: 'one',
                      points: PV_EXPANSION.oneStep,
                      tone: 'heat',
                      label: (
                        <>
                          one step, <tspan className="sym">w</tspan> = {signedWork(WORK_ONE_STEP)} L atm
                        </>
                      ),
                    },
                  ]}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Work on a p–V diagram</span>
                <span className={styles.cardBadge}>2 L → 10 L, 300 K</span>
              </div>
              <p className={styles.cardDescription}>
                Work is the area under the path. A single large step against the final pressure does
                the least work. Many small steps do more, and the reversible isotherm, shaded here,
                does the most.
              </p>
            </div>
          </article>

          {/* Card: bomb calorimeter (constant volume) */}
          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox={`${-CALORIMETER_SIZE.width / 2} -128 ${CALORIMETER_SIZE.width} 262`}
                className={styles.svgElement}
                role="img"
                aria-label="Bomb calorimeter: a steel bomb in a water bath with ignition wires and a stirrer. The reaction glows and the thermometer reads a rise of 2.4 kelvin"
              >
                <VocabDefs />
                <Calorimeter variant="bomb" tempRise={2.4} scaleMax={10} glow />
                <Label x={0} y={122} fontSize={13} fill="var(--fg)">
                  <tspan className="sym">ΔT</tspan> = +2.4 K
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Bomb calorimeter</span>
                <span className={styles.cardBadge}>Constant V</span>
              </div>
              <p className={styles.cardDescription}>
                The reaction happens inside a rigid steel bomb in a water bath. The heat it releases
                warms the water, and the thermometer reads the rise. The volume is fixed, so the
                heat measured is <span className="sym">q</span>
                <sub>v</sub>.
              </p>
            </div>
          </article>

          {/* Card: coffee-cup calorimeter (constant pressure) */}
          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox={`${-CALORIMETER_SIZE.width / 2} -128 ${CALORIMETER_SIZE.width} 262`}
                className={styles.svgElement}
                role="img"
                aria-label="Coffee-cup calorimeter: nested insulated cups with a lid, a thermometer and a stirrer. The thermometer reads a rise of 1.2 kelvin"
              >
                <VocabDefs />
                <Calorimeter variant="coffee-cup" tempRise={1.2} scaleMax={10} />
                <Label x={0} y={122} fontSize={13} fill="var(--fg)">
                  <tspan className="sym">ΔT</tspan> = +1.2 K
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Coffee-cup calorimeter</span>
                <span className={styles.cardBadge}>Constant p</span>
              </div>
              <p className={styles.cardDescription}>
                Nested cups open to the air keep the pressure constant. The heat measured this way is
                the enthalpy change, <span className="sym">ΔH</span>.
              </p>
            </div>
          </article>

          {/* Card: Hess cycle */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox={`0 0 ${ENTHALPY_SIZE.width} ${ENTHALPY_SIZE.height}`}
                className={styles.svgElement}
                role="img"
                aria-label="Hess cycle for carbon: burning directly to carbon dioxide releases 393.5 kilojoules per mole. Burning through carbon monoxide releases 110.5, then 283.0, which add to the same total"
              >
                <VocabDefs />
                <EnthalpyDiagram
                  columns={3}
                  levels={[
                    { id: 'C', label: 'C(s) + O₂(g)', H: 0, span: [0, 2] },
                    { id: 'CO', label: 'CO(g) + ½ O₂(g)', H: HESS_CARBON.carbonMonoxide, span: [1, 3] },
                    { id: 'CO2', label: 'CO₂(g)', H: HESS_CARBON.direct, span: [0, 3] },
                  ]}
                  steps={[
                    { id: 'direct', from: 'C', to: 'CO2', column: 0, dH: HESS_CARBON.direct, name: 'ΔH₁', route: 'direct' },
                    { id: 'to-co', from: 'C', to: 'CO', column: 1, dH: HESS_CARBON.carbonMonoxide, name: 'ΔH₂', route: 'two-step' },
                    { id: 'to-co2', from: 'CO', to: 'CO2', column: 2, dH: HESS_CARBON.monoxideToDioxide, name: 'ΔH₃', route: 'two-step' },
                  ]}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Hess cycle: carbon to CO₂</span>
                <span className={styles.cardBadge}>
                  <span className="sym">ΔH</span>₁ = <span className="sym">ΔH</span>₂ + <span className="sym">ΔH</span>₃
                </span>
              </div>
              <p className={styles.cardDescription}>
                Enthalpy is a state function, so the direct route and the route through carbon monoxide
                reach the same total. The two steps of the second route add up to the single direct step.
              </p>
            </div>
          </article>

          {/* Cards: the four Gibbs cases, in one row */}
          <div className={`${styles.wide} ${styles.quadGrid}`}>
          {(
            [
              {
                key: 'always',
                title: 'Always spontaneous',
                badge: 'All T',
                text: 'ΔH < 0 and ΔS > 0. Both terms favour the change, so ΔG is negative at every temperature.',
                data: GIBBS_CASES.always,
              },
              {
                key: 'never',
                title: 'Never spontaneous',
                badge: 'No T',
                text: 'ΔH > 0 and ΔS < 0. Both terms oppose the change, so ΔG stays positive at every temperature.',
                data: GIBBS_CASES.never,
              },
              {
                key: 'lowT',
                title: 'Spontaneous below Tc',
                badge: 'Low T',
                text: 'ΔH < 0 and ΔS < 0. The enthalpy term wins at low temperature. Above the crossover, the TΔS term takes over.',
                data: GIBBS_CASES.lowT,
              },
              {
                key: 'highT',
                title: 'Spontaneous above Tc',
                badge: 'High T',
                text: 'ΔH > 0 and ΔS > 0. The entropy term wins at high temperature. Below the crossover, the enthalpy cost is too large.',
                data: GIBBS_CASES.highT,
              },
            ] as const
          ).map((g) => (
            <article key={g.key} className={styles.card}>
              <div className={styles.cardCanvas}>
                <svg
                  viewBox={`0 0 ${GIBBS_SIZE.width} ${GIBBS_SIZE.height}`}
                  className={styles.svgElement}
                  role="img"
                  aria-label={`ΔG against temperature for ${g.data.label}: ${g.title.toLowerCase()}. The line crosses zero at the crossover temperature, where the shading changes sides`}
                >
                  <VocabDefs />
                  <GibbsPlot dH={g.data.dH} dS={g.data.dS} tMin={200} tMax={1200} temperature={298} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>{g.title}</span>
                  <span className={styles.cardBadge}>{g.badge}</span>
                </div>
                <p className={styles.cardDescription}>{g.text}</p>
              </div>
            </article>
          ))}
          </div>

          {/* Card: entropy, solid to liquid to gas */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-345 -96 690 210"
                className={styles.svgElement}
                role="img"
                aria-label="Three boxes of the same particles: in the solid they sit on an ordered lattice, in the liquid they are packed but disordered, and in the gas they are scattered across the whole box"
              >
                <VocabDefs />
                <EntropyBox x={-330} y={-80} state={0} />
                <EntropyBox x={-100} y={-80} state={1} />
                <EntropyBox x={130} y={-80} state={2} />
                <Label x={-230} y={98} fontSize={13} fill="var(--fg)">Solid</Label>
                <Label x={0} y={98} fontSize={13} fill="var(--fg)">Liquid</Label>
                <Label x={230} y={98} fontSize={13} fill="var(--fg)">Gas</Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Entropy: order to disorder</span>
                <span className={styles.cardBadge}>
                  <span className="sym">S</span> rises
                </span>
              </div>
              <p className={styles.cardDescription}>
                The same particles, in three states. Going from solid to liquid to gas, each particle
                gains more arrangements, so the entropy <span className="sym">S</span> increases.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Redox and electrochemistry */}
      <section className={styles.section} id="redox" aria-labelledby="redox-heading">
        <h2 id="redox-heading" className={styles.sectionTitle}>
          Redox and electrochemistry
        </h2>
        <p className={styles.sectionSubtitle}>
          Oxidation numbers, electron transfer along curved trajectories, disproportionation ladders,
          direct beaker displacement, the Daniell galvanic cell, the electrochemical series, and
          self-indicating redox titrations. Oxidation is warm electron loss; reduction is cool electron gain.
        </p>

        <div className={styles.grid}>
          {/* Card 1: Oxidation-number tags */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-280 -60 560 110"
                className={styles.svgElement}
                role="img"
                aria-label="Oxidation number tags above atoms in Cr2O7 2-, MnO4 -, and S4O6 2-"
              >
                <OxidationTag formula="Cr2O7" charge="2−" tags={CR2O7_TAGS} x={-180} y={-4} />
                <OxidationTag formula="MnO4" charge="−" tags={MNO4_TAGS} x={0} y={-4} />
                <OxidationTag formula="S4O6" charge="2−" tags={S4O6_TAGS} x={180} y={-4} />
                <Label x={-180} y={42} fontSize={13} fill="var(--fg-muted)">Dichromate</Label>
                <Label x={0} y={42} fontSize={13} fill="var(--fg-muted)">Permanganate</Label>
                <Label x={180} y={42} fontSize={13} fill="var(--fg-muted)">Tetrathionate</Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Oxidation-number tags</span>
                <span className={styles.cardBadge}>Cr₂O₇²⁻ · MnO₄⁻ · S₄O₆²⁻</span>
              </div>
              <p className={styles.cardDescription}>
                Badges sit cleanly above atoms without colliding with subscripts or charges.
                Negative values use a true minus sign (U+2212), and fractional numbers like +2.5 on sulfur
                reflect resonance-averaged structures.
              </p>
            </div>
          </article>

          {/* Card 2: Electron transfer arc */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-480 -95 960 215"
                className={styles.svgElement}
                role="img"
                aria-label="Electron transfer from sodium to chlorine at progress 0, 0.5, and 1"
              >
                <ElectronTransfer
                  {...NA_CL_TRANSFER_BASE}
                  progress={0}
                  donorCaption="Oxidation: Na"
                  acceptorCaption="Reduction: Cl"
                  x={-320}
                  y={-10}
                />
                <ElectronTransfer
                  {...NA_CL_TRANSFER_BASE}
                  progress={0.5}
                  donorCaption="Na → Na⁺ + e⁻"
                  acceptorCaption="Cl + e⁻ → Cl⁻"
                  x={0}
                  y={-10}
                />
                <ElectronTransfer
                  {...NA_CL_TRANSFER_BASE}
                  progress={1}
                  donorCaption="Na⁺ cation"
                  acceptorCaption="Cl⁻ anion"
                  x={320}
                  y={-10}
                />
                <Label x={-320} y={88} fontSize={14} fill="var(--fg-muted)">Progress 0: neutral atoms</Label>
                <Label x={0} y={88} fontSize={14} fill="var(--fg-muted)">Progress 0.5: <tspan className="sym">e</tspan>⁻ in transit</Label>
                <Label x={320} y={88} fontSize={14} fill="var(--fg-muted)">Progress 1: ions formed</Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electron transfer along an arc</span>
                <span className={styles.cardBadge}>Na + Cl → Na⁺ + Cl⁻</span>
              </div>
              <p className={styles.cardDescription}>
                Electrons travel along a flight arc from donor to acceptor. The donor ring turns warm amber (--ox)
                and gains a positive charge; the acceptor ring turns cool indigo (--red) and gains a negative charge.
              </p>
            </div>
          </article>

          {/* Card 3: ONLadder for Cl2 disproportionation */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="0 0 360 380"
                className={styles.svgElement}
                role="img"
                aria-label="Oxidation number ladder showing disproportionation of chlorine in alkali"
              >
                <ONLadder
                  species={CL2_DISPROPORTIONATION_SPECIES}
                  transitions={CL2_DISPROPORTIONATION_TRANSITIONS}
                  progress={1}
                  range={[-3, 3]}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Oxidation-number ladder</span>
                <span className={styles.cardBadge}>Cl₂ disproportionation</span>
              </div>
              <p className={styles.cardDescription}>
                Species placed on a vertical number line. In alkaline solution, elemental chlorine at 0
                simultaneously oxidises up to hypochlorite (+1) and reduces down to chloride (−1).
              </p>
            </div>
          </article>

          {/* Card 4: Reaction beaker Zn in Cu2+ */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-270 -130 540 270"
                className={styles.svgElement}
                role="img"
                aria-label="Zinc strip in copper sulfate solution at start and after reaction"
              >
                <ReactionBeaker
                  solutionTint="var(--sol-cu)"
                  tintStrength={1}
                  stripMetal="Zn"
                  coating={0}
                  progress={0}
                  x={-135}
                  y={-5}
                />
                <ReactionBeaker
                  solutionTint="var(--sol-cu)"
                  tintStrength={0.10}
                  stripMetal="Zn"
                  coating={0.85}
                  progress={1}
                  x={135}
                  y={-5}
                />
                <Label x={-135} y={118} fontSize={13} fill="var(--fg)">Initial: Zn in blue Cu²⁺</Label>
                <Label x={135} y={118} fontSize={13} fill="var(--fg)">After: Cu coating, solution fades</Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Direct redox reaction in a beaker</span>
                <span className={styles.cardBadge}>Zn(s) + Cu²⁺(aq) → Zn²⁺(aq) + Cu(s)</span>
              </div>
              <p className={styles.cardDescription}>
                Zinc dipped into copper sulfate. Direct surface electron transfer dissolves zinc into solution,
                deposits metallic copper onto the strip, and discharges the blue Cu²⁺ tint.
              </p>
            </div>
          </article>

          {/* Card 5: Daniell cell switched off and on */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasRedoxHero}`}>
              <svg
                viewBox="-480 -148 960 375"
                className={styles.svgElement}
                role="img"
                aria-label="Daniell cell switched off at 0 V and switched on at 1.10 V"
              >
                <DaniellCell
                  switchOn={false}
                  progress={0}
                  voltage="0.00 V"
                  zincMass={0.9}
                  copperMass={0.2}
                  solutionTint={0.9}
                  x={-235}
                  y={0}
                />
                <DaniellCell
                  switchOn={true}
                  progress={0.65}
                  voltage="1.10 V"
                  zincMass={0.4}
                  copperMass={0.8}
                  solutionTint={0.35}
                  x={235}
                  y={0}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Daniell cell: indirect electron transfer</span>
                <span className={styles.cardBadge}>1.10 V · Zn | Zn²⁺ || Cu²⁺ | Cu</span>
              </div>
              <p className={styles.cardDescription}>
                Separating half-cells with a salt bridge forces electrons through an external wire from Zn to Cu,
                generating a 1.10 <span className="sym">V</span> potential. Anions migrate through the agar bridge
                towards the anode to keep solutions neutral.
              </p>
            </div>
          </article>

          {/* Card 6: Potential ladder */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasRedoxHero}`}>
              <svg
                viewBox="0 0 760 460"
                className={styles.svgElement}
                role="img"
                aria-label="Standard electrode potential ladder Table 7.1 with Zn and Cu highlighted"
              >
                <PotentialLadder
                  couples={TABLE_7_1_COUPLES}
                  highlight={ZN_CU_HIGHLIGHT}
                  range={[-1.75, 1.45]}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Standard reduction potentials (Table 7.1)</span>
                <span className={styles.cardBadge}>
                  <span className="sym">E</span>°cell = +1.10 <span className="sym">V</span>
                </span>
              </div>
              <p className={styles.cardDescription}>
                Couples arranged by standard reduction potential <span className="sym">E</span>°.
                A couple higher on the ladder spontaneously oxidises one lower down, yielding the cell potential
                <span className="sym"> E</span>°cell = +1.10 <span className="sym">V</span> for Zn and Cu.
              </p>
            </div>
          </article>

          {/* Card 7: Titration rig */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasRedoxHero}`}>
              <svg
                viewBox="-480 -225 960 475"
                className={styles.svgElement}
                role="img"
                aria-label="Redox titration rig with KMnO4 burette and conical flask at 0.0 mL, 19.4 mL, and 20.0 mL endpoint"
              >
                <TitrationRig
                  addedMl={0}
                  dropping={false}
                  endPoint={false}
                  subLabel="0.0 mL: Clear Fe²⁺ analyte"
                  x={-310}
                  y={0}
                />
                <TitrationRig
                  addedMl={19.4}
                  dropping={true}
                  endPoint={false}
                  subLabel="19.4 mL: Droplet in transit"
                  x={0}
                  y={0}
                />
                <TitrationRig
                  addedMl={20.0}
                  dropping={false}
                  endPoint={true}
                  subLabel="20.0 mL: Pink endpoint"
                  x={310}
                  y={0}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Redox titration: KMnO₄ endpoint</span>
                <span className={styles.cardBadge}>Burette · Flask · White tile</span>
              </div>
              <p className={styles.cardDescription}>
                Graduated burette with meniscus reading, stopcock, and conical flask over a white tile.
                Permanganate acts as a self-indicator: the first unconsumed drop of MnO₄⁻ imparts a permanent
                faint pink tint to the solution.
              </p>
            </div>
          </article>

          {/* Card 8: HalfEquationCard */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <HalfEquationCard
              oxHalf={FE_CR2O7_MID_BALANCE.oxHalf}
              redHalf={FE_CR2O7_MID_BALANCE.redHalf}
              overallEquation={FE_CR2O7_MID_BALANCE.overallEquation}
            />
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Ion-electron half-reaction method</span>
                <span className={styles.cardBadge}>Fe²⁺ + Cr₂O₇²⁻ mid-balance</span>
              </div>
              <p className={styles.cardDescription}>
                Mass and charge tallies for each half-reaction. An unbalanced electron count chip immediately
                flags the multiplier needed (× 6 on iron) before the two half-equations can be added.
              </p>
            </div>
          </article>
        </div>
      </section>
      {/* Equilibrium */}
      <section className={styles.section} id="equilibrium" aria-labelledby="equilibrium-heading">
        <h2 id="equilibrium-heading" className={styles.sectionTitle}>
          Equilibrium
        </h2>
        <p className={styles.sectionSubtitle}>
          Sealed vessels, forward and reverse rates, concentration curves from both sides, the ICE bookkeeping,
          the Q and K gauge, Le Chatelier&apos;s balance, the pH scale, ionisation, buffers and solubility.
          Forward reactions are teal and reverse reactions are rose.
        </p>

        <div className={styles.grid}>
          {/* Card 1: water in a sealed flask */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 360 286" className={styles.svgElement} role="img" aria-label="Water in a sealed flask: vapour above the liquid, with evaporation and condensation arrows at the surface">
                <SealedVessel
                  species={WATER_VAPOUR_SPECIES}
                  counts={[22, 26]}
                  liquid
                  exchange="evaporation"
                  gauge={{ fraction: 0.4, label: <tspan className="sym">p</tspan> }}
                  seed={4}
                  title="Water in a sealed flask"
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Liquid and vapour in a sealed flask</span>
                <span className={styles.cardBadge}>H₂O(l) ⇌ H₂O(g)</span>
              </div>
              <p className={styles.cardDescription}>
                Molecules leave the liquid and return to it at the surface. The forward and reverse arrows are equal
                once the vapour pressure is reached, and the dial stops moving.
              </p>
            </div>
          </article>

          {/* Card 2: N2O4 and NO2 */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 360 286" className={styles.svgElement} role="img" aria-label="Brown NO2 and colourless N2O4 in a sealed flask at equilibrium">
                <SealedVessel
                  species={N2O4_SPECIES}
                  counts={[16, 12]}
                  gauge={{ fraction: 0.6, label: <tspan className="sym">p</tspan> }}
                  seed={9}
                  title="N2O4 and NO2 in a sealed flask"
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Gas-phase equilibrium</span>
                <span className={styles.cardBadge}>N₂O₄ ⇌ 2NO₂</span>
              </div>
              <p className={styles.cardDescription}>
                Both gases stay in the flask. The brown colour of NO₂ shows how far the reaction has gone, and the
                pressure gauge reads the total.
              </p>
            </div>
          </article>

          {/* Card 3: forward and reverse rates */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 1080 172" className={styles.svgElement} role="img" aria-label="Forward and reverse rate bars at progress 0, 0.5 and 1. The bars become equal at equilibrium">
                <RateBars progress={0} x={0} y={0} />
                <RateBars progress={0.5} x={360} y={0} />
                <RateBars progress={1} x={720} y={0} />
                <Label x={180} y={160} fontSize={14} fill="var(--fg-muted)">Start: forward only</Label>
                <Label x={540} y={160} fontSize={14} fill="var(--fg-muted)">Midway: rates converging</Label>
                <Label x={900} y={160} fontSize={14} fill="var(--fg-muted)">Equilibrium: rates equal</Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Forward and reverse rates</span>
                <span className={styles.cardBadge}>Forward = reverse at equilibrium</span>
              </div>
              <p className={styles.cardDescription}>
                Both bars share one fixed scale. The forward rate starts high and the reverse rate starts at zero.
                They meet at the same value, and the net change in composition stops.
              </p>
            </div>
          </article>

          {/* Card 4: concentration curves from both sides */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasRedoxHero}`}>
              <svg viewBox="0 0 640 300" className={styles.svgElement} role="img" aria-label="H2, I2 and HI concentrations against time, approached from reactants and from products, converging to the same equilibrium">
                <EquilibriumCurves panels={H2_I2_PANELS} timeMax={10} concMax={2} progress={1} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Approaching equilibrium from both sides</span>
                <span className={styles.cardBadge}>H₂ + I₂ ⇌ 2HI</span>
              </div>
              <p className={styles.cardDescription}>
                Starting from reactants, H₂ and I₂ fall while HI rises. Starting from HI, the curves run the other way.
                Both approaches flatten onto the same levels, shaded as equilibrium reached.
              </p>
            </div>
          </article>

          {/* Card 5: ICE table mid-reveal */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <IceTable
                species={ICE_H2_I2.species}
                initial={ICE_H2_I2.initial}
                change={ICE_H2_I2.change}
                equilibrium={ICE_H2_I2.equilibrium}
                rowNotes={ICE_H2_I2.rowNotes}
                revealStep={2}
                caption="H₂ + I₂ ⇌ 2HI, mol L⁻¹"
              />
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>ICE table, mid-reveal</span>
                <span className={styles.cardBadge}>Initial and change shown</span>
              </div>
              <p className={styles.cardDescription}>
                Rows appear in order: initial, change, then equilibrium. The row being filled in is highlighted, so
                the Learner follows the bookkeeping one step at a time.
              </p>
            </div>
          </article>

          {/* Card 6 and 7: Q and K */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 560 180" className={styles.svgElement} role="img" aria-label="Q below K on a log scale: the reaction proceeds forward">
                <QKGauge K={50} Q={0.02} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Reaction quotient below K</span>
                <span className={styles.cardBadge}>Q &lt; K</span>
              </div>
              <p className={styles.cardDescription}>
                Q sits left of K on a log scale, so the reaction runs forward until Q climbs to K. K = 50 lies in the
                middle zone, where both reactants and products are significant.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 560 180" className={styles.svgElement} role="img" aria-label="Q above K on a log scale: the reaction proceeds in reverse">
                <QKGauge K={50} Q={5000} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Reaction quotient above K</span>
                <span className={styles.cardBadge}>Q &gt; K</span>
              </div>
              <p className={styles.cardDescription}>
                With Q to the right of K, the reverse reaction takes over. The arrow always points from Q towards K.
              </p>
            </div>
          </article>

          {/* Card 8: Le Chatelier balance */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 740 262" className={styles.svgElement} role="img" aria-label="Balance for N2 + 3H2 and 2NH3: balanced at equilibrium on the left, tilted towards the reactants when nitrogen is added on the right">
                <LeChatelierScale reactantLabel="N₂ + 3H₂" productLabel="2NH₃" stress="none" x={0} y={0} />
                <LeChatelierScale reactantLabel="N₂ + 3H₂" productLabel="2NH₃" stress="add-reactant" progress={0} x={380} y={0} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Le Chatelier: adding a reactant</span>
                <span className={styles.cardBadge}>Stress, then shift</span>
              </div>
              <p className={styles.cardDescription}>
                Adding nitrogen loads the reactant pan, and the balance tips. The equilibrium shifts towards products,
                which partly levels the beam again.
              </p>
            </div>
          </article>

          {/* Card 9: pH scale */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 640 214" className={styles.svgElement} role="img" aria-label="pH scale from 0 to 14 with a pointer at pH 6 and common substances marked">
                <PHScale pH={6} markers={PH_MARKERS} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>The pH scale and the indicator gradient</span>
                <span className={styles.cardBadge}>pH = −log[H⁺]</span>
              </div>
              <p className={styles.cardDescription}>
                The pointer reads pH on the universal-indicator gradient, and the second axis reads [H⁺] on a log scale.
                Common substances sit where they are typically found.
              </p>
            </div>
          </article>

          {/* Card 10: ionisation */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 500 252" className={styles.svgElement} role="img" aria-label="Weak acid beaker with 1.3 percent ionised, and strong acid beaker fully ionised">
                <IonisationBeaker fractionIonised={0.013} x={0} y={0} title="Weak acid, α about 0.013" />
                <IonisationBeaker fractionIonised={1} x={260} y={0} title="Strong acid, α = 1" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Weak and strong acids</span>
                <span className={styles.cardBadge}>α ≈ 0.013 · α = 1</span>
              </div>
              <p className={styles.cardDescription}>
                Hollow circles are undissociated HA. Filled pairs are H₃O⁺ and A⁻. A weak acid keeps most molecules
                intact, and a strong acid ionises them all.
              </p>
            </div>
          </article>

          {/* Card 11: buffer meter */}
          <article className={`${styles.card} ${styles.wideHalf}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 420 236" className={styles.svgElement} role="img" aria-label="Water and buffer meters after the same strong acid addition: water drops to pH 3.0, the buffer stays near 4.6">
                <BufferMeter added={1} pHWater={3} pHBuffer={4.6} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Buffer against water</span>
                <span className={styles.cardBadge}>Same drops, two liquids</span>
              </div>
              <p className={styles.cardDescription}>
                The same amount of strong acid is added to water and to a buffer. The water needle swings far, and the
                buffer needle barely moves.
              </p>
            </div>
          </article>

          {/* Card 12: solubility */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="0 0 740 262" className={styles.svgElement} role="img" aria-label="Saturated silver chloride solution in three states: Q below Ksp, Q equal to Ksp, and Q above Ksp">
                <SolubilityBeaker ionCounts={AGCL_IONS(4, 4)} qVsKsp="below" solidAmount={0.25} x={0} y={0} />
                <SolubilityBeaker ionCounts={AGCL_IONS(6, 6)} qVsKsp="equal" solidAmount={0.5} x={250} y={0} />
                <SolubilityBeaker ionCounts={AGCL_IONS(9, 9)} qVsKsp="above" solidAmount={0.8} x={500} y={0} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Solubility product: Q against Ksp</span>
                <span className={styles.cardBadge}>AgCl(s) ⇌ Ag⁺(aq) + Cl⁻(aq)</span>
              </div>
              <p className={styles.cardDescription}>
                Below Ksp, the solid dissolves. At Ksp the solution is saturated and both arrows balance. Above Ksp,
                ions leave the solution and the solid grows.
              </p>
            </div>
          </article>
        </div>
      </section>
      {/* Organic laboratory */}
      <section className={styles.section} id="organic" aria-labelledby="organic-heading">
        <h2 id="organic-heading" className={styles.sectionTitle}>
          Organic structures
        </h2>
        <p className={styles.sectionSubtitle}>
          Bond-line drawings with 120° zig-zags and regular rings, the three written forms of one molecule and
          their morph, wedge and dash for tetrahedral carbon, curved arrows for electron movement, resonance
          contributors with their hybrid, the inductive pull of a chlorine, carbocation, carbanion and radical
          orbitals, and bond cleavage both ways.
        </p>

        <div className={styles.grid}>
          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(TMP_BOUNDS, 8)} className={styles.svgElement} role="img" aria-label="Bond-line formula of 2,2,4-trimethylpentane with the parent chain highlighted and numbered 1 to 5">
                <SkeletalFormula
                  graph={TRIMETHYLPENTANE}
                  highlightAtoms={TRIMETHYLPENTANE_CHAIN_ATOMS}
                  highlightBonds={TRIMETHYLPENTANE_CHAIN_BONDS}
                  locants={TMP_LOCANTS}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Skeletal formula: 2,2,4-trimethylpentane</span>
                <span className={styles.cardBadge}>C₈H₁₈</span>
              </div>
              <p className={styles.cardDescription}>
                Carbons are the corners of the zig-zag, hydrogens are implicit. The parent chain is washed in
                yellow and numbered from the end nearest the first branch.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(skeletalBounds(BUTANOIC_ACID), 8)} className={styles.svgElement} role="img" aria-label="Bond-line formula of butanoic acid with a carbonyl oxygen and an OH group">
                <SkeletalFormula graph={BUTANOIC_ACID} showLonePairs />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Butanoic acid</span>
                <span className={styles.cardBadge}>CH₃CH₂CH₂COOH</span>
              </div>
              <p className={styles.cardDescription}>
                Oxygen is red. The double bond to oxygen is centred on its axis, and the hydroxyl reads OH with
                its lone pairs shown.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(skeletalBounds(CHLOROTOLUENE), 8)} className={styles.svgElement} role="img" aria-label="Bond-line formula of 4-chlorotoluene: a benzene ring with a methyl group and a chlorine para to each other">
                <SkeletalFormula graph={CHLOROTOLUENE} showLonePairs />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Substituted benzene</span>
                <span className={styles.cardBadge}>4-chlorotoluene</span>
              </div>
              <p className={styles.cardDescription}>
                A regular hexagon with its double bonds drawn inside the ring. Substituents leave radially, and the
                chlorine is green.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(skeletalBounds(CYCLOHEXENE), 8)} className={styles.svgElement} role="img" aria-label="Bond-line formula of cyclohexene with its double bond inside the ring">
                <SkeletalFormula graph={CYCLOHEXENE} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Cyclohexene</span>
                <span className={styles.cardBadge}>Ring with one C=C</span>
              </div>
              <p className={styles.cardDescription}>
                Rings are regular polygons with bonds of one length. The double bond is offset inside the ring.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(STRUCTURAL_BOUNDS, 4)} className={styles.svgElement} role="img" aria-label="Complete structural formula of pentan-2-ol with every carbon, oxygen and hydrogen drawn on a grid">
                <StructuralFormula graph={PENTAN2OL} mode="complete" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Complete structural formula</span>
                <span className={styles.cardBadge}>Pentan-2-ol</span>
              </div>
              <p className={styles.cardDescription}>
                Every atom and bond on a grid, as in the textbook. Each hydrogen is a bond of its own.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(CONDENSED_BOUNDS, 4)} className={styles.svgElement} role="img" aria-label="Condensed structural formula of pentan-2-ol: CH3 CH(OH) CH2 CH2 CH3">
                <StructuralFormula graph={PENTAN2OL} mode="condensed" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Condensed structural formula</span>
                <span className={styles.cardBadge}>CH₃CH(OH)CH₂CH₂CH₃</span>
              </div>
              <p className={styles.cardDescription}>
                The same molecule in one line. The group in brackets stays on its carbon.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(PENTANOL_BOUNDS, 8)} className={styles.svgElement} role="img" aria-label="Bond-line formula of pentan-2-ol">
                <StructuralFormula graph={PENTAN2OL} mode="bond-line" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Bond-line formula</span>
                <span className={styles.cardBadge}>Pentan-2-ol</span>
              </div>
              <p className={styles.cardDescription}>
                Carbons and their hydrogens disappear, leaving the zig-zag skeleton and the labelled oxygen.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(STRUCTURAL_BOUNDS, 4)} className={styles.svgElement} role="img" aria-label="Pentan-2-ol halfway through the morph: the hydrogens have slid into their carbons and the chain is still straight">
                <StructuralFormula graph={PENTAN2OL} morph={0.5} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Morph: complete to bond-line</span>
                <span className={styles.cardBadge}>Halfway</span>
              </div>
              <p className={styles.cardDescription}>
                First the hydrogens slide into their carbons, then the chain bends into its zig-zag. The bounds stay
                fixed so the card does not jump.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasWide}`}>
              <svg viewBox={MORPH_VIEW} className={styles.svgElement} role="img" aria-label="Pentan-2-ol at five morph progress values, 0, 0.25, 0.5, 0.75 and 1: hydrogens fold into their carbons first, carbon letters ghost, then the chain bends into its zig-zag">
                {MORPH_FRAMES.map((t, i) => (
                  <g key={t}>
                    <StructuralFormula graph={PENTAN2OL} morph={t} x={i * MORPH_SPACING} />
                    <text x={i * MORPH_SPACING + STRUCTURAL_BOUNDS.x + STRUCTURAL_BOUNDS.width / 2} y={STRUCTURAL_BOUNDS.y + STRUCTURAL_BOUNDS.height + 26} textAnchor="middle" fontSize={15} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">
                      t = {t}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Morph in five frames</span>
                <span className={styles.cardBadge}>t = 0 → 1</span>
              </div>
              <p className={styles.cardDescription}>
                Read left to right. Hydrogens fold into their carbons, the carbon letters ghost but the chain stays
                visible at halfway, and then the chain bends into its zig-zag.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={`${-WEDGE_SIZE.width / 2} ${-WEDGE_SIZE.height / 2 - 24} ${WEDGE_SIZE.width} ${WEDGE_SIZE.height + 48}`} className={styles.svgElement} role="img" aria-label="Tetrahedral carbon drawn with two bonds in the plane, one wedge towards the viewer and one dash away">
                <Wedge3D />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Wedge and dash</span>
                <span className={styles.cardBadge}>Tetrahedral C</span>
              </div>
              <p className={styles.cardDescription}>
                Two bonds lie in the page, one wedge comes towards you and one dash goes away. The three-dimensional
                view of the same molecule follows.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <Stage3DLazy
              cameraPosition={cameraForMolecule(METHANE_3D)}
              label="Methane molecule (3D): carbon at the centre of a regular tetrahedron of four hydrogens. Drag to rotate."
              fallback={<Molecule3DFallback {...METHANE_3D} />}
            >
              <Molecule3D {...METHANE_3D} />
            </Stage3DLazy>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Tetrahedral carbon in 3D</span>
                <span className={styles.cardBadge}>Stage3D</span>
              </div>
              <p className={styles.cardDescription}>
                The wedge and the dash are the two bonds that point out of the page. Drag to see the tetrahedron.
              </p>
            </div>
          </article>

          {/* Curved arrows on real bonds: heterolysis of C-Br, homolysis of Cl-Cl */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasWide}`}>
              <svg viewBox="-420 -160 840 320" className={styles.svgElement} role="img" aria-label="Left: a full-head curved arrow from the C-Br bond to bromine, heterolysis of CH3Br. Right: two fishhook arrows from the Cl-Cl bond to each chlorine, homolysis of Cl2.">
                <g transform="translate(-210, 0)">
                  <SkeletalFormula
                    graph={METHYL_BROMIDE}
                    scale={84}
                    showLonePairs
                    overlay={
                      <g>
                        <text x={-50} y={0} textAnchor="end" dominantBaseline="central" fontSize={22} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">H₃C</text>
                        <CurvedArrow from={{ x: 0, y: -6 }} to={{ x: 42, y: -34 }} bend={0.4} kind="pair" />
                      </g>
                    }
                  />
                  <text x={0} y={112} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">CH₃–Br: heterolysis</text>
                  <text x={0} y={136} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">full arrow: the pair goes to Br</text>
                </g>
                <g transform="translate(210, 0)">
                  <SkeletalFormula
                    graph={CHLORINE}
                    scale={84}
                    showLonePairs
                    overlay={
                      <g>
                        <CurvedArrow from={{ x: 0, y: -6 }} to={{ x: -42, y: -36 }} bend={0.4} kind="radical" />
                        <CurvedArrow from={{ x: 0, y: -6 }} to={{ x: 42, y: -36 }} bend={-0.4} kind="radical" />
                      </g>
                    }
                  />
                  <text x={0} y={112} textAnchor="middle" fontSize={16} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">Cl–Cl: homolysis</text>
                  <text x={0} y={136} textAnchor="middle" fontSize={14} fontWeight={500} fontFamily="var(--font-sans)" fill="var(--fg-muted)">two fishhooks: one electron each</text>
                </g>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Curved arrows on real bonds</span>
                <span className={styles.cardBadge}>Pair · one electron</span>
              </div>
              <p className={styles.cardDescription}>
                A full head moves an electron pair from the bond to an atom, as C–Br breaks into CH₃⁺ and Br⁻. Two
                fishhooks each carry one electron, as the Cl–Cl bond breaks into two chlorine radicals.
              </p>
            </div>
          </article>

          {/* Resonance: acetate, with the electron shift on contributor A only */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasWide}`}>
              <svg viewBox={viewBoxOf(RESONANCE_CARBOXYLATE_BOUNDS, 10)} className={styles.svgElement} role="img" aria-label="Acetate ion: two resonance forms joined by a double-headed arrow, curved arrows on the first form showing the electron shift, and the resonance hybrid below with each C-O bond solid plus dashed and a partial negative charge next to each oxygen">
                <ResonanceSet
                  scale={RESONANCE_SCALE}
                  contributors={[
                    {
                      graph: ACETATE_A,
                      arrows: [
                        { from: { lonePair: 3 }, to: { bond: [1, 3] }, bend: 0.45 },
                        { from: { bond: [1, 2], t: 0.5 }, to: { atom: 2 }, bend: 0.45 },
                      ],
                    },
                    { graph: ACETATE_B },
                  ]}
                  hybrid={{
                    graph: ACETATE_HYBRID,
                    partialBonds: [1, 2],
                    partialCharges: [
                      { atom: 2, label: 'δ−' },
                      { atom: 3, label: 'δ−' },
                    ],
                  }}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Resonance: the acetate ion</span>
                <span className={styles.cardBadge}>CH₃COO⁻</span>
              </div>
              <p className={styles.cardDescription}>
                The negative charge moves between the two oxygens. The forms are joined by a double-headed arrow. In
                the hybrid each C–O bond is a solid line plus a dashed one, so each bond is 1½, and δ− sits by each
                oxygen.
              </p>
            </div>
          </article>

          {/* Resonance: benzene, with the hybrid as a hexagon and an inscribed circle */}
          <article className={`${styles.card} ${styles.wide}`}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasWide}`}>
              <svg viewBox={viewBoxOf(RESONANCE_BENZENE_BOUNDS, 10)} className={styles.svgElement} role="img" aria-label="Benzene: two Kekule forms joined by a double-headed arrow, and the resonance hybrid as a hexagon with an inscribed circle">
                <ResonanceSet
                  scale={RESONANCE_SCALE}
                  contributors={[{ graph: BENZENE_A }, { graph: BENZENE_B }]}
                  hybrid={{ graph: BENZENE_HYBRID, innerCircles: true }}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Resonance: benzene</span>
                <span className={styles.cardBadge}>C₆H₆</span>
              </div>
              <p className={styles.cardDescription}>
                Two Kekulé forms with the same skeleton. The real molecule is their hybrid: a hexagon whose six
                electrons spread evenly round the inscribed circle.
              </p>
            </div>
          </article>

          {/* Inductive effect: arrows on the bonds, charges fading with distance */}
          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox="-250 -50 500 150" className={styles.svgElement} role="img" aria-label="Inductive effect in 1-chlorobutane: arrows on the sigma bonds point towards chlorine, and the carbon charges fade with distance: delta plus next to chlorine, then delta delta plus, then delta delta delta plus">
                <InductiveChain
                  nodes={[
                    { label: 'Cl' },
                    { label: 'CH₂', charge: 'δ+', chargeOpacity: 1 },
                    { label: 'CH₂', charge: 'δδ+', chargeOpacity: 0.6 },
                    { label: 'CH₂', charge: 'δδδ+', chargeOpacity: 0.3 },
                    { label: 'CH₃' },
                  ]}
                  spacing={84}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Inductive effect (−I) in 1-chlorobutane</span>
                <span className={styles.cardBadge}>CH₃CH₂CH₂CH₂Cl</span>
              </div>
              <p className={styles.cardDescription}>
                Each σ bond carries an arrow towards chlorine. The carbon next to Cl is δ+, and the charge fades with
                each bond further along the chain.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={ORBITAL_VIEW} className={styles.svgElement} role="img" aria-label="Carbocation: a planar sp2 carbon with an empty p orbital drawn as dashed lobes">
                <IntermediateOrbital kind="carbocation" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Carbocation</span>
                <span className={styles.cardBadge}>sp², empty p</span>
              </div>
              <p className={styles.cardDescription}>
                Planar, with an empty p orbital above and below the plane. It is ready to accept an electron pair.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={ORBITAL_VIEW} className={styles.svgElement} role="img" aria-label="Carbanion: a pyramidal sp3 carbon with a lone pair of two electrons">
                <IntermediateOrbital kind="carbanion" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Carbanion</span>
                <span className={styles.cardBadge}>sp³, lone pair</span>
              </div>
              <p className={styles.cardDescription}>
                Pyramidal, with the lone pair in an sp³ orbital pointing away from the three bonds.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={ORBITAL_VIEW} className={styles.svgElement} role="img" aria-label="Free radical: a planar sp2 carbon with one electron in the p orbital">
                <IntermediateOrbital kind="radical" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Free radical</span>
                <span className={styles.cardBadge}>sp², one electron</span>
              </div>
              <p className={styles.cardDescription}>
                Planar, with a single electron in the p orbital. Radicals pair up with their neighbours.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={ORBITAL_VIEW} className={styles.svgElement} role="img" aria-label="Hyperconjugation in the ethyl cation: a C-H bond of the neighbouring methyl carbon, aligned with the empty p orbital, is highlighted and an arrow pushes it into the p orbital">
                <IntermediateOrbital kind="hyperconjugation" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Hyperconjugation</span>
                <span className={styles.cardBadge}>σ C–H → empty p</span>
              </div>
              <p className={styles.cardDescription}>
                In H₃C–CH₂⁺ a C–H bond of the methyl group lies along the empty p orbital and lends its electron density
                to it, which stabilises the cation.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={CLEAVAGE_VIEW} className={styles.svgElement} role="img" aria-label="Homolytic cleavage of CH3-Br: the faded bond splits into two radicals, shown with fishhook arrows">
                <BondCleavage kind="homolytic" left="CH₃" right="Br" progress={1} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Homolytic cleavage</span>
                <span className={styles.cardBadge}>Two radicals</span>
              </div>
              <p className={styles.cardDescription}>
                Each atom takes one electron of the bond, so two radicals form. The faint line shows the bond that
                was broken.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={CLEAVAGE_VIEW} className={styles.svgElement} role="img" aria-label="Heterolytic cleavage of CH3-Br: the pair moves to bromine, giving a CH3 cation and a bromide anion">
                <BondCleavage kind="heterolytic" left="CH₃" right="Br" progress={1} anionSide="right" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Heterolytic cleavage</span>
                <span className={styles.cardBadge}>Cation and anion</span>
              </div>
              <p className={styles.cardDescription}>
                One full arrow moves the bonding pair to the more electronegative atom, leaving CH₃⁺ and Br⁻.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg viewBox={viewBoxOf(PENTANOL_BOUNDS, 40)} className={styles.svgElement} role="img" aria-label="Pentan-2-ol with a chip marking the alcohol group at the oxygen">
                <SkeletalFormula
                  graph={PENTAN2OL}
                  showLonePairs
                  overlay={
                    <FunctionalGroupBadge label="–OH  alcohol" x={PENTANOL_BADGE.x} y={PENTANOL_BADGE.y} anchor={PENTANOL_O} />
                  }
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Functional group badge</span>
                <span className={styles.cardBadge}>–OH alcohol</span>
              </div>
              <p className={styles.cardDescription}>
                A chip names the group and points at the atom that carries it, so the learner finds the functional
                group in the drawing.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} id="organic-lab" aria-labelledby="organic-lab-heading">
        <h2 id="organic-lab-heading" className={styles.sectionTitle}>
          Organic laboratory
        </h2>
        <p className={styles.sectionSubtitle}>
          Purification and analysis apparatus: distillation, sublimation, recrystallisation, extraction,
          chromatography, Lassaigne&apos;s tests, and the estimation of carbon, hydrogen, nitrogen and halogens.
          Liquid levels, temperatures and progress are all props, so each drawing can be animated.
        </p>

        <div className={styles.grid}>
          {/* Card 1: simple distillation */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 420 }}>
              <svg viewBox={`0 0 ${DISTILLATION_RIG_SIZE.width} ${DISTILLATION_RIG_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Simple distillation with a round-bottom flask, condenser and receiver">
                <DistillationRig mode="simple" flaskLevel={0.6} receiverLevel={0.3} temperature={78} progress={0.6} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Simple distillation</span>
                <span className={styles.cardBadge}>Boiling points 25 K apart</span>
              </div>
              <p className={styles.cardDescription}>
                The mixture boils in the flask and the vapour is condensed in the Liebig condenser. The thermometer bulb
                sits at the side-arm, so it reads the temperature of the vapour leaving the flask.
              </p>
            </div>
          </article>

          {/* Card 2: fractional distillation */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 420 }}>
              <svg viewBox={`0 0 ${DISTILLATION_RIG_SIZE.width} ${DISTILLATION_RIG_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Fractional distillation with a packed column and a vapour front climbing it">
                <DistillationRig mode="fractional" flaskLevel={0.6} receiverLevel={0.2} temperature={66} progress={0.7} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Fractional distillation</span>
                <span className={styles.cardBadge}>Packed column</span>
              </div>
              <p className={styles.cardDescription}>
                Each climb up the packing condenses and re-evaporates the vapour. The more volatile component reaches the
                top first, so liquids that boil a few kelvin apart still separate.
              </p>
            </div>
          </article>

          {/* Card 3: reduced pressure */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 420 }}>
              <svg viewBox={`0 0 ${DISTILLATION_RIG_SIZE.width} ${DISTILLATION_RIG_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Distillation under reduced pressure with a vacuum line and a pressure gauge">
                <DistillationRig mode="reduced-pressure" flaskLevel={0.6} receiverLevel={0.3} temperature={92} progress={0.6} pressureLabel="12 mmHg" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Vacuum distillation</span>
                <span className={styles.cardBadge}>Lower pressure, lower boiling point</span>
              </div>
              <p className={styles.cardDescription}>
                Lowering the pressure lowers the boiling point, so heat-sensitive liquids distil without decomposing. The
                vacuum is drawn from the receiver end, and the gauge reads the pressure.
              </p>
            </div>
          </article>

          {/* Card 4: steam distillation */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 420 }}>
              <svg viewBox={`0 0 ${DISTILLATION_RIG_SIZE.width} ${DISTILLATION_RIG_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Steam distillation with a steam generator feeding the mixture flask">
                <DistillationRig mode="steam" flaskLevel={0.6} flaskColor="var(--precipitate)" receiverLevel={0.3} temperature={98} progress={0.5} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Steam distillation</span>
                <span className={styles.cardBadge}>Below 100 °C</span>
              </div>
              <p className={styles.cardDescription}>
                A volatile oil that does not mix with water boils together with it below 100 °C, because the two vapour
                pressures add up to one atmosphere. Steam carries the oil over without scorching it.
              </p>
            </div>
          </article>

          {/* Card 5: sublimation */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${SUBLIMATION_SETUP_SIZE.width} ${SUBLIMATION_SETUP_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Sublimation: solid heated in a dish under an inverted funnel, with crystals forming on the funnel">
                <SublimationSetup progress={0.8} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Sublimation</span>
                <span className={styles.cardBadge}>Solid to vapour to solid</span>
              </div>
              <p className={styles.cardDescription}>
                The solid passes straight into vapour and condenses as pure crystals on the cool funnel. Non-volatile
                impurities stay behind in the dish.
              </p>
            </div>
          </article>

          {/* Cards 6 and 7: recrystallisation, two stages */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${CRYSTALLISATION_SIZE.width} ${CRYSTALLISATION_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Hot saturated solution cooling in a beaker, with crystals growing on the floor">
                <Crystallisation stage="cooling" progress={0.9} temperature={60} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Recrystallisation: cooling</span>
                <span className={styles.cardBadge}>Hot to cold</span>
              </div>
              <p className={styles.cardDescription}>
                A hot saturated solution holds more solute than it can keep at room temperature. As it cools, the excess
                comes out as crystals, and the soluble impurities stay in the solution.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${CRYSTALLISATION_SIZE.width} ${CRYSTALLISATION_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Filtration of crystals through filter paper in a funnel, with filtrate collecting in a conical flask">
                <Crystallisation stage="filtration" progress={0.7} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Recrystallisation: filtration</span>
                <span className={styles.cardBadge}>Crystals on paper</span>
              </div>
              <p className={styles.cardDescription}>
                The crystals are separated on filter paper. The filtrate keeps the soluble impurities, and the crystals
                left on the paper are the purified product.
              </p>
            </div>
          </article>

          {/* Cards 8 and 9: separating funnel before and after shaking */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 360 }}>
              <svg viewBox={`0 0 ${SEPARATING_FUNNEL_SIZE.width} ${SEPARATING_FUNNEL_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Separating funnel before shaking: the solute stays in the aqueous layer and the ether layer floats on top">
                <SeparatingFunnel layers={FUNNEL_LAYERS} partition={3} extraction={2} shake={0} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Separating funnel: before shaking</span>
                <span className={styles.cardBadge}>Less dense on top</span>
              </div>
              <p className={styles.cardDescription}>
                The ether layer floats on top because it is less dense, whichever layer was added first. All the solute
                is still in the aqueous layer.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 360 }}>
              <svg viewBox={`0 0 ${SEPARATING_FUNNEL_SIZE.width} ${SEPARATING_FUNNEL_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Separating funnel after shaking and two extractions: the solute has partitioned into the ether layer">
                <SeparatingFunnel layers={FUNNEL_LAYERS} partition={3} extraction={2} shake={1} drain={0} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Separating funnel: after shaking</span>
                <span className={styles.cardBadge}>K = 3, two extractions</span>
              </div>
              <p className={styles.cardDescription}>
                Shaking and venting share the solute between the layers by its partition ratio K. Each extraction with fresh
                solvent takes more of it into the top layer. Then the stopcock drains the lower layer.
              </p>
            </div>
          </article>

          {/* Card 10: TLC with the Rf overlay */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${CHROMATOGRAPHY_PLATE_SIZE.width} ${CHROMATOGRAPHY_PLATE_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Thin-layer chromatogram with three spots at Rf 0.22, 0.50 and 0.78, and a measuring overlay for spot B">
                <ChromatographyPlate kind="tlc" spots={TLC_SPOTS} progress={1} measure measureSpot={1} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Thin-layer chromatography</span>
                <span className={styles.cardBadge}>Rf = 0.50 for spot B</span>
              </div>
              <p className={styles.cardDescription}>
                Each spot moves Rf times as far as the solvent front. Measure the spot and the front from the origin, and
                the ratio gives Rf, which is the same for any length of run.
              </p>
            </div>
          </article>

          {/* Card 11: paper chromatography */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${CHROMATOGRAPHY_PLATE_SIZE.width} ${CHROMATOGRAPHY_PLATE_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Paper chromatography strip with two spots moving up from the origin">
                <ChromatographyPlate kind="paper" spots={PAPER_SPOTS} progress={0.85} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Paper chromatography</span>
                <span className={styles.cardBadge}>Strip in a solvent jar</span>
              </div>
              <p className={styles.cardDescription}>
                The water held in the paper is the stationary phase. The solvent rises up the strip and carries each
                component at its own rate.
              </p>
            </div>
          </article>

          {/* Card 12: column chromatography */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 380 }}>
              <svg viewBox={`0 0 ${CHROMATOGRAPHY_COLUMN_SIZE.width} ${CHROMATOGRAPHY_COLUMN_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Column chromatography: three bands moving down the adsorbent, with fractions collected below">
                <ChromatographyColumn bands={COLUMN_BANDS} progress={0.8} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Column chromatography</span>
                <span className={styles.cardBadge}>Fractions F1 to F3</span>
              </div>
              <p className={styles.cardDescription}>
                Weakly adsorbed components move down the column faster. Each fraction is collected in its own tube as its
                band reaches the bottom.
              </p>
            </div>
          </article>

          {/* Card 13: Lassaigne's test tubes */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 480 }}>
              <svg viewBox={`0 0 360 ${2 * TEST_TUBE_RACK_ROW_HEIGHT}`} className={styles.svgElement} role="img" aria-label="Eight test tubes of Lassaigne's tests: Prussian blue for N, blood red for N and S, violet with nitroprusside and black PbS for S, white AgCl, pale yellow AgBr and yellow AgI for the halogens, and yellow phosphomolybdate for P">
                <TestTubeRack tubes={LASSAIGNE_TUBES} progress={1} columns={4} spacing={88} width={360} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Lassaigne&apos;s tests</span>
                <span className={styles.cardBadge}>One colour per element</span>
              </div>
              <p className={styles.cardDescription}>
                Prussian blue shows N, and blood red shows thiocyanate from N and S. Violet with nitroprusside and black PbS
                show S. White, pale yellow and yellow silver halides show Cl, Br and I. Yellow phosphomolybdate shows P.
              </p>
            </div>
          </article>

          {/* Card 14: sodium fusion */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 320 }}>
              <svg viewBox={`0 0 ${FUSION_TUBE_SIZE.width} ${FUSION_TUBE_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Sodium fusion: the ignition tube is plunged into water in a china dish">
                <FusionTube stage="plunge" progress={0.5} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Sodium fusion</span>
                <span className={styles.cardBadge}>Na + compound, heat, plunge</span>
              </div>
              <p className={styles.cardDescription}>
                Sodium converts N, S and the halogens into ionic NaCN, Na₂S and NaX. The hot tube is plunged into water,
                and the extract is then tested for each element.
              </p>
            </div>
          </article>

          {/* Card 15: combustion train */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 300 }}>
              <svg viewBox={`0 0 ${COMBUSTION_TRAIN_SIZE.width} ${COMBUSTION_TRAIN_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Liebig combustion train: oxygen through a hot CuO tube, a calcium chloride U-tube and potash bulbs with their mass gains">
                <CombustionTrain progress={0.7} h2oGain="+0.36 g" co2Gain="+1.32 g" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Carbon and hydrogen: Liebig</span>
                <span className={styles.cardBadge}>CaCl₂ for H₂O, KOH for CO₂</span>
              </div>
              <p className={styles.cardDescription}>
                Carbon burns to CO₂ and hydrogen to H₂O. The U-tube and the potash bulbs gain mass in exactly those
                products, so the two gains give the percentages of hydrogen and carbon.
              </p>
            </div>
          </article>

          {/* Card 16: Dumas */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${DUMAS_APPARATUS_SIZE.width} ${DUMAS_APPARATUS_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Dumas apparatus: CO2 sweeps the sample over hot CuO, and nitrogen collects in a nitrometer over KOH">
                <DumasApparatus volume={0.55} volumeLabel="18.2 mL" progress={0.6} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Nitrogen: Dumas</span>
                <span className={styles.cardBadge}>N₂ over KOH</span>
              </div>
              <p className={styles.cardDescription}>
                The sample burns over hot CuO in a stream of CO₂, so all its nitrogen leaves as N₂. KOH in the nitrometer
                absorbs the CO₂, and the volume of gas gives the percentage of nitrogen.
              </p>
            </div>
          </article>

          {/* Card 17: Kjeldahl */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${KJELDAHL_SETUP_SIZE.width} ${KJELDAHL_SETUP_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Kjeldahl setup at the titration stage: standard acid in the receiver turns at the end point as the burette delivers NaOH">
                <KjeldahlSetup stage="titrate" titrantMl={18.4} endPoint />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Nitrogen: Kjeldahl</span>
                <span className={styles.cardBadge}>Back-titration</span>
              </div>
              <p className={styles.cardDescription}>
                Digestion turns the nitrogen into ammonium sulphate. Distillation with alkali drives NH₃ into a known excess
                of standard acid, and the acid left over is titrated with NaOH.
              </p>
            </div>
          </article>

          {/* Card 18: Carius */}
          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 340 }}>
              <svg viewBox={`0 0 ${CARIUS_TUBE_SIZE.width} ${CARIUS_TUBE_SIZE.height}`} className={styles.svgElement} role="img" aria-label="Carius tube: a sealed tube heated in a furnace, with a silver halide precipitate settled at the bottom">
                <CariusTube stage="settle" progress={1} precipitateColor="var(--agcl-white)" precipitateLabel="AgCl" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Halogens: Carius</span>
                <span className={styles.cardBadge}>AgX, filtered and weighed</span>
              </div>
              <p className={styles.cardDescription}>
                Fuming nitric acid oxidises the sample in a sealed tube, and the halogen is precipitated as the silver halide.
                The solid is filtered, washed and weighed to give the percentage of halogen.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} id="hydrocarbons" aria-labelledby="hydrocarbons-heading">
        <h2 id="hydrocarbons-heading" className={styles.sectionTitle}>
          Hydrocarbons
        </h2>
        <p className={styles.sectionSubtitle}>
          Conformations of ethane as Newman and sawhorse projections beside its torsional energy curve, reaction
          schemes, σ and π bonding in ethene, ethyne and benzene, the three Kekulé styles of the ring,
          electrophilic substitution and addition with their carbocations, free-radical chain steps, addition
          polymerisation, and the unsaturation tests and the carbide generator of the laboratory.
        </p>

        <div className={styles.grid}>
          {[0, 30, 60].map((angle) => (
            <article key={`conf-${angle}`} className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
                <div className={styles.panes}>
                  {/* The Newman circle is ~141 px across at this size, and its H labels ~28 px. */}
                  <svg viewBox={`${-NEWMAN_SIZE.width / 2} ${-NEWMAN_SIZE.height / 2} ${NEWMAN_SIZE.width} ${NEWMAN_SIZE.height}`} style={{ width: 436, height: 436 }} role="img" aria-label={`Newman projection of ethane at ${angle} degrees`}>
                    <NewmanProjection dihedral={angle} />
                  </svg>
                  <svg viewBox={`0 0 ${SAWHORSE_SIZE.width} ${SAWHORSE_SIZE.height}`} style={{ width: 320, height: 320 * SAWHORSE_SIZE.height / SAWHORSE_SIZE.width }} role="img" aria-label={`Sawhorse projection of ethane at ${angle} degrees`}>
                    <SawhorseProjection dihedral={angle} x={SAWHORSE_SIZE.width / 2} y={SAWHORSE_SIZE.height / 2} />
                  </svg>
                  <svg viewBox={`0 0 ${TORSIONAL_PLOT_SIZE.width} ${TORSIONAL_PLOT_SIZE.height}`} style={{ width: 300, height: 300 * TORSIONAL_PLOT_SIZE.height / TORSIONAL_PLOT_SIZE.width }} role="img" aria-label={`Energy against dihedral angle with the marker at ${angle} degrees`}>
                    <TorsionalEnergyPlot dihedral={angle} />
                  </svg>
                </div>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>Ethane at {angle}°</span>
                  <span className={styles.cardBadge}>{angle === 0 ? 'Eclipsed' : angle === 60 ? 'Staggered' : 'Between the two'}</span>
                </div>
                <p className={styles.cardDescription}>
                  Looking down the C–C bond, the front carbon is the point and the back carbon the circle. The marker on the energy curve moves
                  with the same angle, and the barrier between the eclipsed and staggered forms is 12.5 kJ mol⁻¹.
                </p>
              </div>
            </article>
          ))}

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              {/* The viewBox is fitted to the scheme's own width, so the structures fill most of the card. */}
              <svg viewBox={`0 0 ${PROPENE_LAYOUT.width} ${Math.ceil(PROPENE_LAYOUT.height)}`} className={styles.drawFull} style={{ width: '84%' }} role="img" aria-label="Propene reacts with HBr to give 2-bromopropane as the major product and 1-bromopropane as the minor product">
                <ReactionScheme sequence={PROPENE_HBR_SCHEME} maxWidth={900} scales={PROPENE_SCALES} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Propene + HBr</span>
                <span className={styles.cardBadge}>Markovnikov</span>
              </div>
              <p className={styles.cardDescription}>
                The π bond of the alkene reacts, and the hydrogen goes to the carbon that already carries more hydrogens. The major product is 2-bromopropane.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              <svg viewBox={`0 0 ${reactionSchemeSize(ETHYNE_STEPS, 900).width} ${reactionSchemeSize(ETHYNE_STEPS, 900).height}`} className={styles.drawFit} role="img" aria-label="Ethyne is reduced to ethene and then to ethane in two steps">
                <ReactionScheme sequence={ETHYNE_STEPS} maxWidth={900} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Two steps, one reagent family</span>
                <span className={styles.cardBadge}>A → B → C</span>
              </div>
              <p className={styles.cardDescription}>
                Each step adds one molecule of hydrogen. Lindlar&apos;s catalyst stops at the alkene; nickel goes on to the alkane.
              </p>
            </div>
          </article>

          {[0, 1, 2].map((i) => {
            const pv = 1
            const mono = (['ethene', 'ethyne', 'benzene'] as const)[i]
            return (
              <article key={`pi-${mono}`} className={`${styles.card} ${styles.cardWide}`}>
                <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
                  <div className={styles.panes}>
                    {/* Each state fills about 45% of the card width, side by side. */}
                    <svg viewBox={`${PI_VIEWBOX[mono].x} ${PI_VIEWBOX[mono].y} ${PI_VIEWBOX[mono].width} ${PI_VIEWBOX[mono].height}`} style={{ width: '45%', height: 'auto' }} role="img" aria-label={`${mono} π orbitals before the lobes merge`}>
                      <PiBondOrbitals molecule={mono} merge={0} />
                    </svg>
                    <svg viewBox={`${PI_VIEWBOX[mono].x} ${PI_VIEWBOX[mono].y} ${PI_VIEWBOX[mono].width} ${PI_VIEWBOX[mono].height}`} style={{ width: '45%', height: 'auto' }} role="img" aria-label={`${mono} π orbitals after the lobes merge`}>
                      <PiBondOrbitals molecule={mono} merge={pv} />
                    </svg>
                  </div>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.cardHeading}>
                    <span>{mono === 'ethene' ? 'Ethene: one π bond' : mono === 'ethyne' ? 'Ethyne: two π bonds' : 'Benzene: six delocalised electrons'}</span>
                    <span className={styles.cardBadge}>{mono === 'ethene' ? 'sp² · 120°' : mono === 'ethyne' ? 'sp · 180°' : 'sp² · 120°'}</span>
                  </div>
                  <p className={styles.cardDescription}>
                    {mono === 'ethene' && 'Each carbon has three sp² hybrids in the plane, and the p orbital left over overlaps sideways above and below the plane.'}
                    {mono === 'ethyne' && 'Each carbon has two sp hybrids along the axis, and two p orbitals that give two π clouds at right angles, forming a cylinder.'}
                    {mono === 'benzene' && 'The six p orbitals overlap all round the ring, giving one doughnut of electrons above and below the plane.'}
                  </p>
                </div>
              </article>
            )
          })}

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 240 }}>
              <div className={styles.panes}>
                {(['kekule', 'kekule', 'hexagon', 'kekule'] as const).map((variant, i) => (
                  <svg key={`ring-${i}`} viewBox={`${-BENZENE_RING_SIZE.width / 2} ${-BENZENE_RING_SIZE.height / 2} ${BENZENE_RING_SIZE.width} ${BENZENE_RING_SIZE.height}`} style={{ width: i === 3 ? 150 : 210, height: i === 3 ? 150 : 210 }} role="img" aria-label={['Kekulé form A of benzene', 'Kekulé form B of benzene', 'Benzene drawn as a hexagon with an inscribed circle', 'Benzene mid-way between Kekulé forms A and B'][i]}>
                    <BenzeneRing variant={variant} kekuleMix={i === 0 ? 0 : i === 3 ? 0.5 : 1} />
                  </svg>
                ))}
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Benzene: three drawings, one molecule</span>
                <span className={styles.cardBadge}>Kekulé A · B · hexagon · mid-state</span>
              </div>
              <p className={styles.cardDescription}>
                The two Kekulé forms differ only in where the double bonds sit, and neither is real. The hexagon with its inscribed circle
                shows the delocalised six electrons.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              <svg viewBox={`${-BENZENE_LABELLED_SIZE.width / 2} ${-BENZENE_LABELLED_SIZE.height / 2} ${BENZENE_LABELLED_SIZE.width} ${BENZENE_LABELLED_SIZE.height}`} className={styles.drawFit} role="img" aria-label="4-chlorotoluene:chlorine at position 1 and methyl at position 4, with the other positions labelled ortho, meta or para to chlorine">
                <BenzeneRing
                  variant="hexagon"
                  substituents={[
                    { position: 1, label: 'Cl' },
                    { position: 4, label: 'CH₃' },
                  ]}
                  relativeTo={1}
                />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Disubstituted ring: o, m, p</span>
                <span className={styles.cardBadge}>4-chlorotoluene</span>
              </div>
              <p className={styles.cardDescription}>
                Positions next to the chlorine are ortho, two away meta, and opposite it para. The methyl sits para to the chlorine.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              <svg viewBox={`${-areniumBounds('NO2').width / 2} ${-areniumBounds('NO2').height / 2} ${areniumBounds('NO2').width} ${areniumBounds('NO2').height}`} className={styles.drawFit} role="img" aria-label="The σ-complex of nitration: an sp³ carbon with H and NO₂, the positive charge shared over five ring carbons">
                <AreniumIon electrophile="NO2" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>σ-complex (arenium ion)</span>
                <span className={styles.cardBadge}>Positive charge shared</span>
              </div>
              <p className={styles.cardDescription}>
                The ring carbon that is attacked becomes sp³. The positive charge is spread over the other five carbons, drawn here as the dashed horseshoe.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              <svg viewBox={`${-areniumBounds('NO2', true).width / 2} ${-areniumBounds('NO2', true).height / 2} ${areniumBounds('NO2', true).width} ${areniumBounds('NO2', true).height}`} className={styles.drawFit} role="img" aria-label="The three resonance contributors of the σ-complex, with the positive charge on the ortho and para carbons">
                <AreniumIon electrophile="NO2" contributors />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>σ-complex: three contributors</span>
                <span className={styles.cardBadge}>Ortho and para</span>
              </div>
              <p className={styles.cardDescription}>
                The charge can sit only on the carbons ortho or para to the attacked carbon, never on the one that carries the electrophile.
              </p>
            </div>
          </article>

          {[0.3, 0.65, 1].map((pr, i) => (
            <article key={`eas-${i}`} className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
                <svg viewBox={`0 0 ${EAS_MECHANISM_SIZE.width} ${EAS_MECHANISM_SIZE.height}`} className={styles.drawFit} role="img" aria-label={`Nitration of benzene, stage ${i + 1} of 3`}>
                  <EASMechanism progress={pr} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>Nitration of benzene: stage {i + 1} of 3</span>
                  <span className={styles.cardBadge}>Electrophilic substitution</span>
                </div>
                <p className={styles.cardDescription}>
                  {i === 0 && 'Nitronium ion, NO₂⁺, is attacked by the π electrons of benzene, and the first curved arrow shows the pair moving to nitrogen.'}
                  {i === 1 && 'The σ-complex keeps the sp³ carbon with its H and NO₂. The arrows show the C–H electrons re-forming the ring and a base taking H⁺.'}
                  {i === 2 && 'Once the base has removed H⁺, the π system is complete again and nitrobenzene is formed.'}
                </p>
              </div>
            </article>
          ))}

          {(['markovnikov', 'anti-markovnikov'] as const).map((kind, i) => (
            <article key={`add-${kind}`} className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
                <svg viewBox={`0 0 ${ADDITION_MECHANISM_SIZE.width} ${ADDITION_MECHANISM_SIZE.height}`} className={styles.drawFit} role="img" aria-label={i === 0 ? 'Markovnikov addition of HBr to propene through the 2° carbocation' : 'Addition of HBr to propene through the 1° carbocation, the minor path'}>
                  <AdditionMechanism mode="ionic" branch={i === 0 ? 'major' : 'minor'} progress={1} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>{i === 0 ? 'Markovnikov: the 2° carbocation' : 'The minor path: the 1° carbocation'}</span>
                  <span className={styles.cardBadge}>{i === 0 ? 'Major' : 'Minor'}</span>
                </div>
                <p className={styles.cardDescription}>
                  {i === 0
                    ? 'H⁺ adds to the terminal carbon, so the positive charge lands on the middle carbon, which holds two alkyl groups. Br⁻ then attacks it.'
                    : 'Adding H⁺ to the middle carbon would leave the charge on a primary carbon, which is far less stable, so little of this product forms.'}
                </p>
              </div>
            </article>
          ))}

          {(['initiation', 'propagation', 'termination', 'peroxide'] as const).map((st) => (
            <article key={`rad-${st}`} className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
                <svg viewBox={`0 0 ${ADDITION_MECHANISM_SIZE.width} ${ADDITION_MECHANISM_SIZE.height}`} className={styles.drawFit} role="img" aria-label={`Free-radical ${st} step drawn with fishhook arrows`}>
                  <AdditionMechanism mode="radical" step={st} progress={1} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>{st === 'peroxide' ? 'Peroxide effect' : `Free-radical ${st}`}</span>
                  <span className={styles.cardBadge}>Fishhook arrows</span>
                </div>
                <p className={styles.cardDescription}>
                  {st === 'initiation' && 'Light breaks the weakest bond in the halogen, and each atom keeps one electron.'}
                  {st === 'propagation' && 'Each radical reacts with a molecule and produces another radical, so the chain carries on.'}
                  {st === 'termination' && 'When two radicals meet they pair up and the chain ends.'}
                  {st === 'peroxide' && 'With peroxides, Br• adds to the terminal carbon first, which gives the more stable secondary radical. That is why HBr adds the other way.'}
                </p>
              </div>
            </article>
          ))}

          {(['ethene', 'propene', 'ethyne'] as const).map((mono, i) => (
            <article key={`poly-${mono}`} className={`${styles.card} ${styles.cardWide}`}>
              <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
                <svg viewBox={`0 0 ${POLYMER_CHAIN_SIZE.width} ${POLYMER_CHAIN_SIZE.height}`} className={styles.drawFit} role="img" aria-label={`${mono} monomers joining into a chain with the repeat unit bracketed`}>
                  <PolymerChain monomer={mono} progress={1} />
                </svg>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.cardHeading}>
                  <span>Addition polymer: {mono === 'ethene' ? 'polythene' : mono === 'propene' ? 'polypropene' : 'polyacetylene'}</span>
                  <span className={styles.cardBadge}>n monomers</span>
                </div>
                <p className={styles.cardDescription}>
                  {i === 0 && 'The double bonds open, and each monomer joins the next through the electrons that were in the π bond.'}
                  {i === 1 && 'Propene joins through the same double bond, leaving a methyl group on every second carbon of the chain.'}
                  {i === 2 && 'Ethyne has two π bonds, and each unit keeps one double bond in the chain.'}
                </p>
              </div>
            </article>
          ))}

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              <div className={styles.panes}>
                <svg viewBox={`0 0 ${REAGENT_TEST_SIZE.width * 2 + 40} ${REAGENT_TEST_SIZE.height + 34}`} style={{ width: 480, height: 264 }} role="img" aria-label="Bromine water with an alkene, before and after: red-brown turns colourless">
                  <text x={(REAGENT_TEST_SIZE.width * 2 + 40) / 2} y={20} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">Bromine water + alkene: before / after</text>
                  <g transform="translate(0, 34)">
                    <ReagentTest reagent="bromine" progress={0} label="before" />
                    <g transform={`translate(${REAGENT_TEST_SIZE.width + 40}, 0)`}>
                      <ReagentTest reagent="bromine" progress={1} label="after" />
                    </g>
                  </g>
                </svg>
                <svg viewBox={`0 0 ${REAGENT_TEST_SIZE.width * 2 + 40} ${REAGENT_TEST_SIZE.height + 34}`} style={{ width: 480, height: 264 }} role="img" aria-label="Baeyer reagent with an alkene, before and after: purple turns colourless, with brown MnO₂">
                  <text x={(REAGENT_TEST_SIZE.width * 2 + 40) / 2} y={20} textAnchor="middle" dominantBaseline="central" fontSize={17} fontWeight={600} fontFamily="var(--font-sans)" fill="var(--fg)">Baeyer&apos;s reagent + alkene: before / after</text>
                  <g transform="translate(0, 34)">
                    <ReagentTest reagent="baeyer" progress={0} label="before" />
                    <g transform={`translate(${REAGENT_TEST_SIZE.width + 40}, 0)`}>
                      <ReagentTest reagent="baeyer" progress={1} label="after" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Unsaturation: bromine water and Baeyer&apos;s reagent</span>
                <span className={styles.cardBadge}>Before · after</span>
              </div>
              <p className={styles.cardDescription}>
                Bromine water is red-brown and loses its colour as it adds across a double bond. Baeyer&apos;s reagent is purple, and it turns brown with MnO₂ as the alkene is oxidised.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-6) var(--space-4)' }}>
              <svg viewBox={`0 0 ${CARBIDE_GENERATOR_SIZE.width} ${CARBIDE_GENERATOR_SIZE.height}`} className={styles.drawFit} role="img" aria-label="Ethyne from calcium carbide: water drips onto CaC2 and ethyne bubbles out into water">
                <CarbideGenerator progress={0.6} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Ethyne from calcium carbide</span>
                <span className={styles.cardBadge}>Water on carbide</span>
              </div>
              <p className={styles.cardDescription}>
                Water is dripped onto calcium carbide, which gives ethyne and calcium hydroxide. The ethyne is collected over water.
              </p>
            </div>
          </article>
        </div>
      </section>
      <section className={styles.section} id="electrochem" aria-labelledby="electrochem-heading">
        <h2 id="electrochem-heading" className={styles.sectionTitle}>
          Electrochemistry
        </h2>
        <p className={styles.sectionSubtitle}>
          The electrodes, half-cells, salt bridge, meters and wires of electrochemistry, drawn with the same parts everywhere: a Daniell cell
          with its voltmeter and electron flow, an electrolytic cell, the standard hydrogen electrode, a conductivity cell, each electrode
          material, and a battery cut open.
        </p>

        <div className={styles.grid}>
          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
              <svg viewBox="0 0 600 400" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Daniell cell: zinc anode and copper cathode joined by a salt bridge, with a voltmeter reading 1.10 volts and electrons flowing from zinc to copper">
                <Wire
                  corners={[{ x: 125, y: 130 }, { x: 125, y: 44 }, { x: 475, y: 44 }, { x: 475, y: 130 }]}
                  t={0.35}
                  electrons
                  dots={6}
                  direction="forward"
                />
                <Voltmeter x={300} y={96} width={170} height={84} value={1.1} range={[0, 3]} caption="" decimals={2} unit="V" />
                <Beaker x={40} y={200} width={170} height={160} level={0.72} tint="clear" label="ZnSO₄(aq)" />
                <Beaker x={390} y={200} width={170} height={160} level={0.72} tint="blue" label="CuSO₄(aq)" />
                <SaltBridge start={{ x: 150, y: 292 }} finish={{ x: 430, y: 292 }} apex={190} t={0.2} cationsTo="to" />
                <Electrode x={125} top={130} length={170} material="zn" thinning={0.35} polarity={'−'} role="anode" />
                <Electrode x={475} top={130} length={170} material="cu" plating={0.4} polarity="+" role="cathode" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Daniell cell</span>
                <span className={styles.cardBadge}>1.10 V</span>
              </div>
              <p className={styles.cardDescription}>
                Zinc dissolves at the anode and copper is plated at the cathode. Electrons pass through the wire from zinc to copper, and the
                salt bridge keeps both solutions neutral. The voltmeter reads the cell potential as 1.10 V.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
              <svg viewBox="0 0 600 400" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Electrolytic cell of copper sulphate with a DC supply: copper is deposited at the cathode and oxygen is evolved at the anode">
                <Wire corners={[{ x: 45, y: 134 }, { x: 45, y: 100 }, { x: 345, y: 100 }, { x: 345, y: 150 }]} t={0.1} electrons dots={4} direction="reverse" />
                <Wire corners={[{ x: 95, y: 134 }, { x: 240, y: 134 }, { x: 240, y: 150 }]} t={0.1} electrons dots={3} direction="forward" />
                <DcSource x={20} y={150} width={100} height={64} voltage={6} label="DC supply" />
                <Beaker x={150} y={190} width={260} height={170} level={0.72} tint="blue" label="CuSO₄(aq)" />
                <Electrode x={240} top={150} length={190} material="pt" plating={0.6} depositMaterial="cu" polarity={'−'} role="cathode" />
                <Electrode x={345} top={150} length={190} material="pt" polarity="+" role="anode" />
                <GasBubbles x={345} y={330} width={20} height={150} count={4} t={0.3} formula="O2" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electrolytic cell</span>
                <span className={styles.cardBadge}>Driven by 6.0 V</span>
              </div>
              <p className={styles.cardDescription}>
                The supply pushes electrons into the cathode, where copper ions are reduced, and draws them from the anode, where water is
                oxidised to oxygen. The electron dots run in the direction the supply drives them.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
              <svg viewBox="0 0 260 300" style={{ width: '100%', maxWidth: 300, height: 'auto' }} role="img" aria-label="Standard hydrogen electrode: platinised platinum foil in 1 molar hydrogen ions, with hydrogen gas at 1 bar">
                <HydrogenElectrode x={40} y={70} width={180} height={200} t={0.4} label="1 M H⁺(aq)" gasLabel="H₂ (1 bar)" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Standard hydrogen electrode</span>
                <span className={styles.cardBadge}>0.00 V</span>
              </div>
              <p className={styles.cardDescription}>
                Platinised platinum sits in 1 M H⁺ with hydrogen at 1 bar. It is the zero of the electrode potential scale.
              </p>
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
              <svg viewBox="0 0 260 240" style={{ width: '100%', maxWidth: 300, height: 'auto' }} role="img" aria-label="Conductivity cell: two parallel platinum plates of area A, a distance l apart">
                <ConductivityCell x={20} y={50} width={220} height={150} tint="blue" />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Conductivity cell</span>
                <span className={styles.cardBadge}>Cell constant l/A</span>
              </div>
              <p className={styles.cardDescription}>
                Two platinum plates of area A stand l apart in the solution. The cell constant l/A converts a measured resistance into conductivity.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
              <svg viewBox="0 0 600 220" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Electrode materials: zinc, copper, silver, lead, lead dioxide, platinum, iron, magnesium, nickel, cadmium and graphite">
                {[
                  ['zn', 'Zn'], ['cu', 'Cu'], ['ag', 'Ag'], ['pb', 'Pb'], ['pbo2', 'PbO₂'], ['pt', 'Pt'],
                  ['fe', 'Fe'], ['mg', 'Mg'], ['ni', 'Ni'], ['cd', 'Cd'], ['graphite', 'C'],
                ].map(([m, label], i) => (
                  <g key={m}>
                    <Electrode x={28 + i * 53.6} top={40} length={120} width={18} material={m as ElectrodeMaterial} />
                    <text x={28 + i * 53.6} y={196} textAnchor="middle" fontSize={15} fill="var(--fg-muted)">{label}</text>
                  </g>
                ))}
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electrode materials</span>
              </div>
              <p className={styles.cardDescription}>
                Each metal keeps its own colour everywhere it appears. Graphite is the inert electrode used where no metal is wanted.
              </p>
            </div>
          </article>

          <article className={`${styles.card} ${styles.cardWide}`}>
            <div className={styles.cardCanvas} style={{ height: 'auto', padding: 'var(--space-4)' }}>
              <svg viewBox="0 0 600 260" style={{ width: '100%', maxWidth: 600, height: 'auto' }} role="img" aria-label="Parts of a cell: a cut-open battery, an ion, a gas column, a galvanometer and a current arrow">
                <BatteryCutaway x={40} y={30} width={140} height={200} shape="can">
                  <Electrode x={110} top={70} length={150} width={16} material="graphite" />
                  <rect x={70} y={150} width={80} height={60} fill="var(--precipitate)" />
                </BatteryCutaway>
                <Ion x={250} y={60} formula="Zn" charge="2+" kind="cation" />
                <Ion x={250} y={110} formula="SO4" charge="2-" kind="anion" />
                <Ion x={250} y={160} formula="K" charge="+" kind="cation" />
                <Ion x={250} y={210} formula="Cl" charge="-" kind="anion" />
                <GasBubbles x={330} y={230} width={50} height={160} count={5} t={0.5} formula="H2" />
                <Galvanometer x={490} y={120} width={190} height={130} value={0.4} range={[-1, 1]} digital={false} />
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>The parts</span>
              </div>
              <p className={styles.cardDescription}>
                The same ions, gas bubbles, cut-away battery and zero-centred galvanometer used in every section above.
              </p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.section} id="kinetics" aria-labelledby="kinetics-heading">
        <h2 id="kinetics-heading" className={styles.sectionTitle}>
          Chemical kinetics
        </h2>
        <p className={styles.sectionSubtitle}>
          The plots, energy profiles, molecules and instruments of chemical kinetics, drawn with one set of parts: the same concentration
          axes, energy levels, distribution curves, particles and meters in every section.
        </p>

        <KineticsGallery />
      </section>
    </div>
  )
}
