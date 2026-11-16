/**
 * The three laboratory preparations of benzene in Section 9.5.4, as mhchem strings, with a balance check.
 *
 * decarboxylateBenzoate() in hydrocarbon-reactions.ts writes the sodium salt of benzoic acid as C7H6O2Na, which
 * is not balanced against its other side (the salt is C7H5O2Na). Its equation is therefore not used here; the
 * test below counts the atoms of each equation from the formulas.
 */

/** Atom counts of a formula such as C7H5O2Na or Na2CO3 (element symbols with optional counts). */
export function atomCounts(formula: string): Record<string, number> {
  const counts: Record<string, number> = {}
  const re = /([A-Z][a-z]?)(\d*)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(formula)) !== null) {
    counts[m[1]] = (counts[m[1]] ?? 0) + (m[2] === '' ? 1 : Number(m[2]))
  }
  return counts
}

/** The atom counts of one side of an equation, each term with its coefficient (a leading number, default 1). */
export function sideCounts(side: string): Record<string, number> {
  const total: Record<string, number> = {}
  for (const term of side.split('+').map((t) => t.trim())) {
    const coef = /^(\d+)\s*(.*)$/.exec(term)
    const n = coef ? Number(coef[1]) : 1
    const f = coef ? coef[2] : term
    for (const [el, c] of Object.entries(atomCounts(f))) total[el] = (total[el] ?? 0) + n * c
  }
  return total
}

/** True when both sides of an equation "A + B -> C + D" have the same atoms. */
export function isAtomBalanced(equation: string): boolean {
  const [left, right] = equation.split('->').map((s) => s.trim())
  const l = sideCounts(left)
  const r = sideCounts(right)
  const els = new Set([...Object.keys(l), ...Object.keys(r)])
  return [...els].every((el) => (l[el] ?? 0) === (r[el] ?? 0))
}

/** Cyclic polymerisation of ethyne in a red-hot iron tube (NCERT 9.5.4 (i), from Section 9.4.4). */
export const CYCLIC_POLYMERISATION = '3C2H2 -> C6H6'
/** Decarboxylation of sodium benzoate with soda lime, heated (NCERT equation 9.70). */
export const BENZOATE_DECARBOXYLATION = 'C6H5COONa + NaOH -> C6H6 + Na2CO3'
/** Reduction of phenol with zinc dust (NCERT equation 9.71). */
export const PHENOL_REDUCTION = 'C6H5OH + Zn -> C6H6 + ZnO'
