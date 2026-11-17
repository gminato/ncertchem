import type { BlockCounts } from './section-blocks'

/** The fields of a Section that the Syllabus Map counts. */
export interface CountedSection extends BlockCounts {
  class: number
  unit: number
}

/** What one Unit, or the whole site, holds. */
export interface SyllabusStats extends BlockCounts {
  sections: number
}

function add(sections: readonly CountedSection[]): SyllabusStats {
  const total: SyllabusStats = { sections: 0, simulations: 0, animations: 0, checks: 0 }
  for (const section of sections) {
    total.sections += 1
    total.simulations += section.simulations
    total.animations += section.animations
    total.checks += section.checks
  }
  return total
}

/** Totals for one Unit. A Unit with no Sections yet gives zeros. */
export function unitStats(
  sections: readonly CountedSection[],
  cls: number,
  unit: number
): SyllabusStats {
  return add(sections.filter((s) => s.class === cls && s.unit === unit))
}

/** Totals for every Section on the site, with the number of Units that have at least one Section. */
export function siteStats(sections: readonly CountedSection[]): SyllabusStats & { units: number } {
  const units = new Set(sections.map((s) => `${s.class}-${s.unit}`)).size
  return { ...add(sections), units }
}
