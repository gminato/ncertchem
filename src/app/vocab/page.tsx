import React from 'react'
import type { Metadata } from 'next'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
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
import styles from './vocab.module.css'

export const metadata: Metadata = {
  title: 'Visual Vocabulary · Chemistry, Revisited',
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
    </div>
  )
}
