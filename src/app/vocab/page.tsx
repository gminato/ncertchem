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
    </div>
  )
}
