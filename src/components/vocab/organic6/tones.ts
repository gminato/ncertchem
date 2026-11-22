/**
 * Shared colour roles for Class 12 Unit 6 drawings. A halogen, a role or a hybridisation always
 * takes the same token, in every Section's Scrolly and Simulation. Tokens only, never raw hex.
 */

export type Halogen = 'F' | 'Cl' | 'Br' | 'I'

export const HALOGEN_TONE: Readonly<Record<Halogen, string>> = {
  F: 'var(--el-F)',
  Cl: 'var(--el-Cl)',
  Br: 'var(--el-Br)',
  I: 'var(--el-I)',
}

const HALOGEN_NAME: Readonly<Record<Halogen, string>> = {
  F: 'fluorine',
  Cl: 'chlorine',
  Br: 'bromine',
  I: 'iodine',
}

/** The symbol ('Br') or the name ('bromine') of a halogen, for labels and text summaries. */
export function halogenLabel(h: Halogen, form: 'symbol' | 'name' = 'symbol'): string {
  return form === 'symbol' ? h : HALOGEN_NAME[h]
}

export type OrganicRole =
  | 'nucleophile'
  | 'leavingGroup'
  | 'electrophilicCarbon'
  | 'base'
  | 'betaHydrogen'
  | 'sp3'
  | 'sp2'

export const ROLE_TONE: Readonly<Record<OrganicRole, string>> = {
  nucleophile: 'var(--lone-pair)',
  leavingGroup: 'var(--ox)',
  electrophilicCarbon: 'var(--delta-plus)',
  base: 'var(--base)',
  betaHydrogen: 'var(--success)',
  sp3: 'var(--accent)',
  sp2: 'var(--orbital-neg)',
}
