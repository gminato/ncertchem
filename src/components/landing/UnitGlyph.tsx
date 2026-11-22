import type { ReactNode } from 'react'

const NEUTRAL = 'var(--bond)'

/** The cells of the small periodic table: [column, row, block]. */
const TABLE_CELLS: readonly (readonly [number, number, 's' | 'p' | 'd'])[] = [
  [0, 0, 's'],
  [7, 0, 'p'],
  ...[1, 2, 3, 4].flatMap((row) => [
    [0, row, 's'] as const,
    [1, row, 's'] as const,
    [5, row, 'p'] as const,
    [6, row, 'p'] as const,
    [7, row, 'p'] as const,
  ]),
  ...[3, 4].flatMap((row) => [
    [2, row, 'd'] as const,
    [3, row, 'd'] as const,
    [4, row, 'd'] as const,
  ]),
]

const BLOCK_FILL = { s: 'var(--spot-1)', p: 'var(--spot-2)', d: 'var(--spot-3)' } as const

/** One small drawing per Class 11 Unit, in a 64 by 64 box. Each uses the site's colour tokens. */
const GLYPHS: Readonly<Record<number, ReactNode>> = {
  // Unit 1, Some Basic Concepts of Chemistry: a flask of solution.
  1: (
    <>
      <path d="M19.5 38H44.5L51 50Q52.5 54 48 54H16Q11.5 54 13 50Z" fill="var(--liquid)" />
      <path d="M19.5 38H44.5" stroke="var(--liquid-edge)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M26 10V26L13 50Q11.5 54 16 54H48Q52.5 54 51 50L38 26V10"
        fill="none"
        stroke={NEUTRAL}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M22.5 10H41.5" stroke={NEUTRAL} strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="24" cy="46.5" r="2.4" fill="var(--electron)" />
      <circle cx="33" cy="43.5" r="2.4" fill="var(--proton)" />
      <circle cx="40.5" cy="48" r="2.4" fill="var(--electron)" />
    </>
  ),
  // Unit 2, Structure of Atom: a nucleus, two orbits and two electrons.
  2: (
    <>
      <circle cx="32" cy="32" r="13" fill="none" stroke="var(--fg-subtle)" strokeWidth="1.4" opacity="0.7" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="var(--fg-subtle)" strokeWidth="1.4" opacity="0.7" />
      <circle cx="34.6" cy="33.6" r="4.6" fill="var(--neutron)" />
      <circle cx="30.2" cy="30.6" r="4.6" fill="var(--proton)" />
      <circle cx="41.96" cy="23.64" r="3.2" fill="var(--electron)" />
      <circle cx="11.22" cy="44" r="3.2" fill="var(--electron)" />
    </>
  ),
  // Unit 3, Classification of Elements: the s, d and p blocks of the periodic table.
  3: (
    <>
      {TABLE_CELLS.map(([col, row, block]) => (
        <rect
          key={`${col}-${row}`}
          x={4.25 + col * 7}
          y={15.25 + row * 7}
          width="5.5"
          height="5.5"
          rx="1.2"
          fill={BLOCK_FILL[block]}
        />
      ))}
    </>
  ),
  // Unit 4, Chemical Bonding: a bent water molecule with its two lone pairs.
  4: (
    <>
      <path d="M32 30L16.2 42.2M32 30L47.8 42.2" stroke={NEUTRAL} strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="16.2" cy="42.2" r="6.4" fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth="1" />
      <circle cx="47.8" cy="42.2" r="6.4" fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth="1" />
      <circle cx="32" cy="30" r="9.4" fill="var(--el-O)" />
      <circle cx="25.4" cy="16.8" r="1.7" fill="var(--lone-pair-edge)" />
      <circle cx="29.2" cy="15" r="1.7" fill="var(--lone-pair-edge)" />
      <circle cx="34.8" cy="15" r="1.7" fill="var(--lone-pair-edge)" />
      <circle cx="38.6" cy="16.8" r="1.7" fill="var(--lone-pair-edge)" />
    </>
  ),
  // Unit 5, Thermodynamics: heat goes into a gas, and the piston does work.
  5: (
    <>
      <path
        d="M17 16V48H47V16"
        fill="none"
        stroke={NEUTRAL}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="18.6" y="27" width="26.8" height="4.4" rx="1.2" fill="var(--fg-muted)" />
      <path d="M32 27V13" stroke="var(--work)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M32 6.5L27.4 13.6H36.6Z" fill="var(--work)" />
      <circle cx="24" cy="37" r="2" fill="var(--electron)" />
      <circle cx="33.5" cy="42.5" r="2" fill="var(--electron)" />
      <circle cx="40.5" cy="36.5" r="2" fill="var(--electron)" />
      <circle cx="26.5" cy="43.5" r="2" fill="var(--electron)" />
      <path
        d="M24 59q-2.6-1.8 0-3.6q2.6-1.8 0-3.6M32 59q-2.6-1.8 0-3.6q2.6-1.8 0-3.6M40 59q-2.6-1.8 0-3.6q2.6-1.8 0-3.6"
        fill="none"
        stroke="var(--heat)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
  // Unit 6, Equilibrium: the forward and reverse half-arrows.
  6: (
    <>
      <path
        d="M11 26H53L43.5 17.5"
        fill="none"
        stroke="var(--fwd)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M53 38H11L20.5 46.5"
        fill="none"
        stroke="var(--rev)"
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  // Unit 7, Redox Reactions: one atom passes an electron to another.
  7: (
    <>
      <circle cx="16" cy="42" r="10.5" fill="var(--ox)" />
      <circle cx="48" cy="42" r="10.5" fill="var(--red)" />
      <path d="M18 27Q32 7 44.2 25.4" fill="none" stroke="var(--e-arrow)" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M46 28L39.9 24.9L45.2 21.3Z" fill="var(--e-arrow)" />
      <circle cx="31.4" cy="17.2" r="3.4" fill="var(--electron)" stroke="var(--surface-raised)" strokeWidth="1.4" />
    </>
  ),
  // Unit 8, Organic Chemistry: tetrahedral carbon, with a wedge bond and a dashed bond.
  8: (
    <>
      <path d="M32 34V12M32 34L13 45" stroke={NEUTRAL} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M32 34L44.6 53.1L49.4 48.9Z" fill={NEUTRAL} />
      <path
        d="M38.3 36.9L38.9 33.5M41.5 37.9L42.3 33.7M44.7 39L45.7 33.8M48 40L49 34"
        stroke={NEUTRAL}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="32" cy="11" r="4.6" fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth="1" />
      <circle cx="12.4" cy="45.4" r="4.6" fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth="1" />
      <circle cx="47" cy="51" r="4.6" fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth="1" />
      <circle cx="53.4" cy="37.9" r="4.6" fill="var(--el-H)" stroke="var(--atom-rim)" strokeWidth="1" />
      <circle cx="32" cy="34" r="7.4" fill="var(--el-C)" />
    </>
  ),
  // Unit 9, Hydrocarbons: the benzene ring.
  9: (
    <>
      <path
        d="M32 11L50.2 21.5V42.5L32 53L13.8 42.5V21.5Z"
        fill="none"
        stroke="var(--sigma-bond)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="32" cy="32" r="11.5" fill="none" stroke="var(--pi-lobe)" strokeWidth="2.6" />
    </>
  ),
}

/** Small drawings for Class 12 Units, in a 64 by 64 box. */
const CLASS_12_GLYPHS: Readonly<Record<number, ReactNode>> = {
  // Class 12 Unit 1, Solutions: two chambers separated by a semipermeable membrane, with solute particles and rising vapour.
  1: (
    <>
      <rect x="10" y="26" width="21" height="26" rx="2" fill="var(--liquid)" />
      <rect x="33" y="18" width="21" height="34" rx="2" fill="var(--accent-soft)" />
      <path d="M10 26H31M33 18H54" stroke="var(--liquid-edge)" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M10 14V52H54V14"
        fill="none"
        stroke={NEUTRAL}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="32"
        y1="14"
        x2="32"
        y2="52"
        stroke="var(--accent)"
        strokeWidth="2.2"
        strokeDasharray="3.5 3"
      />
      <circle cx="40" cy="30" r="2.6" fill="var(--spot-2)" />
      <circle cx="47" cy="39" r="2.6" fill="var(--spot-2)" />
      <circle cx="39" cy="44" r="2.6" fill="var(--spot-2)" />
      <circle cx="20" cy="37" r="2.2" fill="var(--liquid-edge)" />
      <path d="M24 37H35" stroke="var(--fwd)" strokeWidth="2" strokeLinecap="round" />
      <path d="M37.5 37L33 34.4V39.6Z" fill="var(--fwd)" />
    </>
  ),
  // Class 12 Unit 2, Electrochemistry: a Daniell cell, two half-filled beakers with an arched salt bridge, electrodes and a small meter.
  2: (
    <>
      <path d="M8 22V52H26V22" fill="none" stroke={NEUTRAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M38 22V52H56V22" fill="none" stroke={NEUTRAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="9" y="36" width="16" height="15" rx="1" fill="var(--liquid)" />
      <rect x="39" y="36" width="16" height="15" rx="1" fill="var(--liquid)" />
      <path d="M17 36C17 8 47 8 47 36" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="17" y1="16" x2="17" y2="44" stroke="var(--metal-zn)" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="47" y1="16" x2="47" y2="44" stroke="var(--metal-cu)" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="32" cy="9" r="3.6" fill="none" stroke={NEUTRAL} strokeWidth="1.8" />
    </>
  ),
  // Class 12 Unit 3, Chemical Kinetics: a concentration falling against time, with a small stopwatch.
  3: (
    <>
      <path d="M10 14V52H54" fill="none" stroke={NEUTRAL} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M14 20C22 20 26 40 34 44S46 49 52 50"
        fill="none"
        stroke="var(--kin-reactant)"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <circle cx="44" cy="30" r="7" fill="var(--surface)" stroke={NEUTRAL} strokeWidth="2" />
      <line x1="44" y1="30" x2="44" y2="25.5" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="44" y1="30" x2="47.5" y2="30" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" />
      <line x1="44" y1="20" x2="44" y2="17" stroke={NEUTRAL} strokeWidth="2" strokeLinecap="round" />
    </>
  ),
}

export interface UnitGlyphProps {
  /** Class number, 11 or 12. Defaults to 11. */
  cls?: 11 | 12
  /** Unit number within the class. */
  unit: number
  className?: string
}

/** A small decorative drawing for a Unit. It is hidden from screen readers: the Unit title says the same. */
export function UnitGlyph({ cls = 11, unit, className }: UnitGlyphProps) {
  const glyph = cls === 12 ? CLASS_12_GLYPHS[unit] : GLYPHS[unit]
  if (!glyph) return null
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      {glyph}
    </svg>
  )
}
