import type { CSSProperties } from 'react'
import Link from 'next/link'
import { sections } from '#site/content'
import { Check } from '@/components/check/Check'
import { ContinueLink, type ContinueSection } from '@/components/progress/ContinueLink'
import { UnitCardProgress } from '@/components/progress/UnitCardProgress'
import { HeroAnimation } from '@/components/landing/HeroAnimation'
import { SimulationShowcase, type ShowcaseItem } from '@/components/landing/SimulationShowcase'
import { UnitGlyph } from '@/components/landing/UnitGlyph'
import { Hook } from '@/components/section/Hook'
import { LockIcon } from '@/components/ui/AccessBadge'
import { SiteHeader, Wordmark } from '@/components/ui/SiteHeader'
import { unitsForClass } from '@/content/units'
import { BRAND } from '@/lib/brand'
import { siteStats, unitStats } from '@/lib/syllabus-stats'
import styles from './page.module.css'

type SectionEntry = (typeof sections)[number]

/** The Section whose Hook, Animation and Simulation the home page borrows. */
const PILOT_SLUG = '2-4-bohr-model'

/** The Simulations offered on the home page, each with the Section it comes from. */
const SHOWCASE: readonly (Omit<ShowcaseItem, 'sectionLabel' | 'sectionHref'> & { slug: string })[] = [
  {
    name: 'hydrogen-spectrum',
    tab: 'Hydrogen spectrum',
    title: 'Hydrogen spectrum: build the series from the Bohr atom',
    prompt: 'Click two energy levels to choose where the electron falls from and where it lands, and see where the line appears.',
    slug: '2-4-bohr-model',
  },
  {
    name: 'vsepr-builder',
    tab: 'VSEPR builder',
    title: 'VSEPR builder: add pairs and watch the shape form',
    prompt: 'Add bonding pairs and lone pairs to the central atom, and watch the shape rearrange.',
    slug: '4-4-vsepr-theory',
  },
  {
    name: 'newman-rotor',
    tab: 'Newman rotor',
    title: 'Newman rotor: turn the back carbon of ethane',
    prompt: 'Drag the back carbon and follow the energy as the hydrogens line up and move apart.',
    slug: '9-2-4-conformations',
  },
]

/** A space that does not break, so "n = 3" stays on one line. */
const NBSP = '\u00a0'

/** The five parts of a Section, in the order a Learner meets them. */
const SECTION_PARTS: readonly { name: string; text: string }[] = [
  {
    name: 'Hook',
    text: 'A question or an odd observation from everyday life. It tells you what the Section is about to explain.',
  },
  {
    name: 'Animation',
    text: 'A drawing pinned beside the text. As you scroll, it moves one Step at a time, so you set the pace.',
  },
  {
    name: 'Simulation',
    text: 'A model that you control. Move a slider, add a reagent or turn a molecule, and the system responds.',
  },
  {
    name: 'Check',
    text: 'A short question inside the Section. You get two tries, then the explanation. Nothing is graded. Your answers are saved in your browser, or in your Account if you sign in.',
  },
  {
    name: 'Key Ideas',
    text: 'Three to five points at the end of every Section, to revise from.',
  },
]

function findSection(slug: string): SectionEntry {
  const section = sections.find((entry) => entry.slug === slug)
  if (!section) throw new Error(`The home page needs the Section "${slug}", and it does not exist.`)
  return section
}

function sectionHref(section: SectionEntry): string {
  return `/class-${section.class}/unit-${section.unit}/${section.slug}`
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

export default function Home() {
  const pilot = findSection(PILOT_SLUG)
  const totals = siteStats(sections)

  /** Every Section in book order, for "Continue" in the hero. */
  const continueSections: ContinueSection[] = [...sections]
    .sort((a, b) => a.class - b.class || a.unit - b.unit || a.order - b.order)
    .map((section) => ({
      slug: section.slug,
      checkNumbers: section.checkNumbers,
      href: sectionHref(section),
      section: section.section,
      title: section.title,
    }))

  const showcase: ShowcaseItem[] = SHOWCASE.map(({ slug, ...item }) => {
    const section = findSection(slug)
    return {
      ...item,
      sectionLabel: `Section ${section.section}: ${section.title}`,
      sectionHref: sectionHref(section),
    }
  })

  const stats: readonly { value: number; label: string }[] = [
    { value: totals.units, label: 'Units, all of Class 11' },
    { value: totals.sections, label: 'Sections' },
    { value: totals.animations, label: 'Animations' },
    { value: totals.simulations, label: 'Simulations' },
  ]

  return (
    <>
      <SiteHeader>
        <a href="#inside-a-section">Inside a Section</a>
        <a href="#simulations">Simulations</a>
        <a href="#syllabus">Syllabus Map</a>
      </SiteHeader>

      <main>
        <div className={styles.band}>
          <section className={styles.hero} aria-labelledby="hero-title">
            <div className={styles.heroText}>
              <p className={`${styles.eyebrow} ${styles.rise}`}>
                Class 11 and 12 Chemistry · Follows the NCERT syllabus
              </p>
              <h1 id="hero-title" className={`${styles.headline} ${styles.rise}`}>
                <em>See</em> the chemistry your textbook describes.
              </h1>
              <p className={`${styles.lede} ${styles.rise}`}>
                {BRAND} follows the NCERT syllabus Section by Section. Each Section becomes Animations you
                scroll through and Simulations you run yourself.
              </p>
              <div className={`${styles.ctaRow} ${styles.rise}`}>
                <ContinueLink sections={continueSections} className={`${styles.cta} ${styles.ctaPrimary}`} />
                <a href="#syllabus" className={`${styles.cta} ${styles.ctaSecondary}`}>
                  See the Syllabus Map
                </a>
              </div>
              <p className={`${styles.heroNote} ${styles.rise}`}>
                {plural(totals.freeSections, 'Free Section')} to explore without signing in. Nothing to install.
              </p>
            </div>

            <div className={`${styles.heroVisual} ${styles.rise}`}>
              <HeroAnimation sectionHref={sectionHref(pilot)} sectionLabel={`Section ${pilot.section}`} />
            </div>
          </section>
        </div>

        <section className={styles.stats} aria-label="What is on the site today">
          <dl className={styles.statsList}>
            {stats.map((stat) => (
              <div key={stat.label} className={styles.stat}>
                <dt className={styles.statLabel}>{stat.label}</dt>
                <dd className={styles.statValue}>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="inside-a-section" className={styles.section} aria-labelledby="inside-title">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>Inside a Section</p>
            <h2 id="inside-title" className={styles.sectionTitle}>
              Every Section has the same five parts
            </h2>
            <p className={styles.sectionLede}>
              The numbers match the textbook, so Section {pilot.section} here is Section {pilot.section} in
              the book. What changes is how the idea reaches you.
            </p>
          </header>

          <div className={styles.anatomy}>
            <ol className={styles.parts}>
              {SECTION_PARTS.map((part, index) => (
                <li key={part.name} className={styles.part}>
                  <span className={styles.partNumber} aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className={styles.partName}>{part.name}</h3>
                    <p className={styles.partText}>{part.text}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className={styles.samples}>
              <div className={styles.sample}>
                <p className={styles.sampleLabel}>The Hook of Section {pilot.section}</p>
                <Hook>
                  Pass an electric discharge through hydrogen gas and it glows a soft pinkish red. Send that
                  glow through a prism and you don&apos;t get a rainbow: you get a few sharp, separate lines
                  of colour. Why only those colours?
                </Hook>
              </div>

              <div className={styles.sample}>
                <p className={styles.sampleLabel}>A Check you can try now</p>
                <Check
                  n="home"
                  options={['Lyman', 'Balmer', 'Paschen', 'Brackett']}
                  answer={1}
                  explanation="Every fall that ends on n = 2 belongs to the Balmer series. Falls to n = 1 make the Lyman series, falls to n = 3 the Paschen series and falls to n = 4 the Brackett series."
                >
                  In the Animation at the top of this page, the electron falls from <em>n</em>
                  {NBSP}={NBSP}3 to <em>n</em>
                  {NBSP}={NBSP}2 and a red line appears. Which series does that line belong to?
                </Check>
              </div>
            </div>
          </div>
        </section>

        <section id="simulations" className={styles.section} aria-labelledby="simulations-title">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>Simulations</p>
            <h2 id="simulations-title" className={styles.sectionTitle}>
              Try one here
            </h2>
            <p className={styles.sectionLede}>
              These are the same Simulations that sit inside the Sections. Pick one and change something.
            </p>
          </header>

          <SimulationShowcase items={showcase} />
        </section>

        <section id="syllabus" className={styles.section} aria-labelledby="syllabus-title">
          <header className={styles.sectionHead}>
            <p className={styles.eyebrow}>Syllabus Map</p>
            <h2 id="syllabus-title" className={styles.sectionTitle}>
              Open the Unit you are studying
            </h2>
            <p className={styles.sectionLede}>
              Units and Sections carry the same numbers as the NCERT textbook, so you can move between the
              book and the site.
            </p>
          </header>

          {([11, 12] as const).map((cls) => {
            const units = unitsForClass(cls).map((info) => ({
              info,
              stats: unitStats(sections, cls, info.unit),
            }))
            const live = units.filter((entry) => entry.stats.sections > 0)
            const upcoming = units.filter((entry) => entry.stats.sections === 0)

            return (
              <div key={cls} className={styles.classBlock}>
                <div className={styles.classHead}>
                  <h3 className={styles.className}>Class {cls}</h3>
                  <p className={styles.classNote}>
                    {upcoming.length === 0
                      ? `All ${plural(live.length, 'Unit')} are ready`
                      : live.length === 0
                        ? 'Being written'
                        : `${plural(live.length, 'Unit')} ready, ${upcoming.length} being written`}
                  </p>
                </div>

                {live.length > 0 && (
                  <ol className={styles.unitGrid} aria-label={`Class ${cls} Units`}>
                    {live.map(({ info, stats: unit }) => (
                      <li key={info.unit}>
                        <Link href={`/class-${cls}/unit-${info.unit}`} className={styles.unitCard}>
                          <UnitGlyph unit={info.unit} className={styles.glyph} />
                          <span className={styles.unitText}>
                            <span className={styles.unitNumber}>Unit {info.unit}</span>
                            <span className={styles.unitTitle}>{info.title}</span>
                            {(unit.freeSections > 0 || unit.paidSections > 0) && (
                              <span className={styles.unitAccess}>
                                {unit.freeSections > 0 && (
                                  <span className={styles.unitFree} data-access="free">
                                    {unit.freeSections} Free
                                  </span>
                                )}
                                {unit.paidSections > 0 && (
                                  <span className={styles.unitPaid} data-access="paid">
                                    <LockIcon size={12} className={styles.unitLock} />
                                    {unit.paidSections} Paid
                                  </span>
                                )}
                              </span>
                            )}
                            <UnitCardProgress
                              className={styles.unitMeta}
                              sections={sections
                                .filter((s) => s.class === cls && s.unit === info.unit)
                                .map((s) => ({ slug: s.slug, checkNumbers: s.checkNumbers }))}
                            >
                              {plural(unit.sections, 'Section')} · {plural(unit.simulations, 'Simulation')}
                            </UnitCardProgress>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}

                {upcoming.length > 0 && (
                  <ol
                    className={styles.upcomingList}
                    aria-label={`Class ${cls} Units that are being written`}
                    style={{ '--rows': Math.ceil(upcoming.length / 2) } as CSSProperties}
                  >
                    {upcoming.map(({ info }) => (
                      <li key={info.unit} className={styles.upcoming}>
                        <span className={styles.upcomingNumber}>Unit {info.unit}</span>
                        <span className={styles.upcomingTitle}>{info.title}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )
          })}
        </section>

        <section className={styles.section} aria-label="For Teachers, and how the site sits beside the textbook">
          <div className={styles.notes}>
            <div className={styles.note}>
              <p className={styles.noteLabel}>For Teachers</p>
              <h2 className={styles.noteTitle}>Made to be projected</h2>
              <p className={styles.noteText}>
                Every Animation and Simulation fills the width of the page, and the site has a light and a
                dark theme, for a bright room or a dim one. It runs in the browser, so there is nothing to
                install.
              </p>
            </div>
            <div className={styles.note}>
              <p className={styles.noteLabel}>Beside your textbook</p>
              <h2 className={styles.noteTitle}>The book stays the reference</h2>
              <p className={styles.noteText}>
                Each Section names the NCERT Section it follows. The words and the drawings are written for
                this site, and nothing is copied from the textbook.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <p>
            <Wordmark className={styles.footerBrand} />
          </p>
          <nav aria-label="Footer links" className={styles.footerNav}>
            <Link href="/pricing">Pricing</Link>
          </nav>
        </div>
        <p>Follows the NCERT Chemistry syllabus for Classes 11 and 12.</p>
        <p>
          {BRAND} is an independent project. It is not affiliated with or endorsed by NCERT, the National
          Council of Educational Research and Training.
        </p>
      </footer>
    </>
  )
}
