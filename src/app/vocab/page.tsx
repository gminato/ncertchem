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
} from '@/components/vocab'
import styles from './vocab.module.css'

export const metadata: Metadata = {
  title: 'Visual Vocabulary · Chemistry, Revisited',
  description:
    'Design tokens and visual vocabulary specimen sheet for Class 11 and 12 chemistry.',
}

export default function VocabPage() {
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
                  e<Label.Sup>−</Label.Sup>
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Electron</span>
                <span className={styles.cardBadge}>--electron</span>
              </div>
              <p className={styles.cardDescription}>
                Solid particle with a soft radial halo. The halo luminosity expands dynamically
                in dark mode via <code>--glow-strength</code>.
              </p>
            </div>
          </article>

          {/* Card: Nucleus H (1p) */}
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
                  <Label.Sup>1</Label.Sup>H (1p)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Hydrogen Nucleus</span>
                <span className={styles.cardBadge}>1p, 0n</span>
              </div>
              <p className={styles.cardDescription}>
                Single proton rendered in warm coral-red (<code>--proton</code>) with subtle 3D
                specular highlight shading.
              </p>
            </div>
          </article>

          {/* Card: Nucleus He (2p 2n) */}
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
                  <Label.Sup>4</Label.Sup>He (2p, 2n)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Helium Nucleus</span>
                <span className={styles.cardBadge}>2p, 2n</span>
              </div>
              <p className={styles.cardDescription}>
                Deterministic 4-nucleon alpha cluster interleaving protons and warm-grey neutrons (
                <code>--neutron</code>).
              </p>
            </div>
          </article>

          {/* Card: Nucleus Li (3p 4n) */}
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
                  <Label.Sup>7</Label.Sup>Li (3p, 4n)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Lithium Nucleus</span>
                <span className={styles.cardBadge}>3p, 4n</span>
              </div>
              <p className={styles.cardDescription}>
                Dense deterministic sphere packing sorted back-to-front by depth for authentic
                depth without hydration discrepancies.
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
                  <Label.Sup>56</Label.Sup>Fe (count &gt; 20)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Heavy Nucleus</span>
                <span className={styles.cardBadge}>&gt; 20 nucleons</span>
              </div>
              <p className={styles.cardDescription}>
                Counts &gt; 20 automatically condense into a single shaded sphere with a warm
                ambient nuclear glow halo.
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
          {/* Card: 656 nm Red */}
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
                  H<Label.Sub>α</Label.Sub> · 656 nm (Red)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer H-Alpha</span>
                <span className={styles.cardBadge}>656 nm</span>
              </div>
              <p className={styles.cardDescription}>
                Longest visible hydrogen emission line with broad, gentle wiggles and deep crimson
                glow.
              </p>
            </div>
          </article>

          {/* Card: 486 nm Cyan */}
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
                  H<Label.Sub>β</Label.Sub> · 486 nm (Cyan)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer H-Beta</span>
                <span className={styles.cardBadge}>486 nm</span>
              </div>
              <p className={styles.cardDescription}>
                Vibrant cyan-blue line exhibiting medium-density oscillations.
              </p>
            </div>
          </article>

          {/* Card: 434 nm Blue */}
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
                  H<Label.Sub>γ</Label.Sub> · 434 nm (Blue)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer H-Gamma</span>
                <span className={styles.cardBadge}>434 nm</span>
              </div>
              <p className={styles.cardDescription}>
                Blue-violet emission with tighter oscillation frequencies.
              </p>
            </div>
          </article>

          {/* Card: 410 nm Violet */}
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
                  H<Label.Sub>δ</Label.Sub> · 410 nm (Violet)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Balmer H-Delta</span>
                <span className={styles.cardBadge}>410 nm</span>
              </div>
              <p className={styles.cardDescription}>
                Deep violet boundary wavelength rendered with tight spatial wiggles.
              </p>
            </div>
          </article>

          {/* Card: 121 nm UV (Dashed) */}
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
                Non-visible quantum below 380 nm rendered dashed using standardized neutral violet
                fallback (#7B61FF) and compact wiggles.
              </p>
            </div>
          </article>

          {/* Card: 1875 nm IR (Dashed) */}
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
                Non-visible quantum above 750 nm rendered dashed with standardized neutral rust
                fallback (#8B2E2E) and broad wiggles.
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
                <Label x={0} y={-30} fontSize={11}>
                  n=1
                </Label>
                <Label x={0} y={-54} fontSize={11} fill="var(--orbit-active)">
                  n=2 (active)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Bohr Orbits</span>
                <span className={styles.cardBadge}>variant=&quot;orbit&quot;</span>
              </div>
              <p className={styles.cardDescription}>
                Circular orbits with subtle resting strokes (<code>--orbit</code>). Active levels
                gain prominence and luminescence with <code>--orbit-active</code>.
              </p>
            </div>
          </article>

          {/* Card: Energy Ladder */}
          <article className={styles.card}>
            <div className={styles.cardCanvas}>
              <svg
                viewBox="-90 -70 180 140"
                className={styles.svgElement}
                role="img"
                aria-label="Energy levels ladder variant showing inactive and active horizontal rungs"
              >
                <VocabDefs />
                <EnergyLevel variant="ladder" width={130} y={35} active={false} />
                <Label x={-52} y={23} fontSize={11} textAnchor="start">
                  n=1 (−13.6 eV)
                </Label>

                <EnergyLevel variant="ladder" width={130} y={-5} active={true} />
                <Label x={-52} y={-17} fontSize={11} textAnchor="start" fill="var(--orbit-active)">
                  n=2 (−3.4 eV) [active]
                </Label>

                <EnergyLevel variant="ladder" width={130} y={-35} active={false} />
                <Label x={-52} y={-47} fontSize={11} textAnchor="start">
                  n=3 (−1.51 eV)
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Energy Ladder</span>
                <span className={styles.cardBadge}>variant=&quot;ladder&quot;</span>
              </div>
              <p className={styles.cardDescription}>
                Horizontal rungs for energy diagrams and spectroscopic transitions, supporting
                active highlighting.
              </p>
            </div>
          </article>
        </div>
      </section>

      {/* Composite Architecture Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Composite Composition</h2>
        <p className={styles.sectionSubtitle}>
          Full architectural demonstration: combining Nucleus, concentric Bohr EnergyLevels, an
          orbiting Electron, an emitted Photon packet, and small-caps Labels into one composite
          SVG.
        </p>

        <div className={styles.grid}>
          <article className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div className={`${styles.cardCanvas} ${styles.cardCanvasTall}`}>
              <svg
                viewBox="-200 -130 400 260"
                className={styles.svgElement}
                role="img"
                aria-label="Composite Bohr atom model featuring a central nucleus, three concentric orbits, an electron on n=2, and an emitted 486 nm photon"
              >
                <VocabDefs />

                {/* Concentric Bohr Orbits */}
                <EnergyLevel variant="orbit" r={40} active={false} />
                <EnergyLevel variant="orbit" r={78} active={true} />
                <EnergyLevel variant="orbit" r={116} active={false} />

                {/* Level Labels */}
                <Label x={0} y={-44} fontSize={11}>
                  n=1
                </Label>
                <Label x={0} y={-82} fontSize={11} fill="var(--orbit-active)">
                  n=2 (active state)
                </Label>
                <Label x={0} y={-120} fontSize={11}>
                  n=3
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
                <Label x={148} y={-82} fontSize={11} fill="var(--fg-muted)">
                  hν · 486 nm
                </Label>
              </svg>
            </div>
            <div className={styles.cardBody}>
              <div className={styles.cardHeading}>
                <span>Mini Composite Bohr Atom</span>
                <span className={styles.cardBadge}>Integrated Model</span>
              </div>
              <p className={styles.cardDescription}>
                Complete composition demonstrating seamless co-existence of all Visual
                Vocabulary elements within an SVG coordinate space. The electron is positioned on
                the active <code>n=2</code> level emitting a Balmer H-beta photon (486 nm) into free
                space.
              </p>
            </div>
          </article>
        </div>
      </section>
    </div>
  )
}
