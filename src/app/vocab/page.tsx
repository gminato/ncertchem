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
} from '@/components/vocab'
import { energyLevel } from '@/lib/chem/bohr'
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
    </div>
  )
}
