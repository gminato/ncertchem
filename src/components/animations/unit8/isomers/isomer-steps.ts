/**
 * The Steps of the isomer-family Scrolly (Section 8.6). Each Step names the molecules it shows
 * and the relation the lib gives between them. Pure data: the drawing components read it.
 */

import {
  but2eneGeometry,
  but2eneName,
  compareMembers,
  isomerFamily,
  type AlkeneConfiguration,
  type AlkeneGeometry,
  type FamilyId,
  type FamilyMember,
} from '@/lib/chem/isomer-families'
import type { IsomerRelation } from '@/lib/chem/isomers'
import { longestChain } from '@/components/organic/layout'

/** One Step: a list of chain isomers, a pair of molecules with their relation, or a 3D alkene. */
export type IsomerStep =
  | { kind: 'chain'; formula: FamilyId; rows: ChainRow[] }
  | { kind: 'pair'; formula: FamilyId; left: FamilyMember; right: FamilyMember; relation: IsomerRelation; phrase: string }
  | { kind: 'geometry'; config: AlkeneConfiguration; name: string; geometry: AlkeneGeometry }

/** One isomer of a chain set: the member, its parent-chain atoms and bonds, and the chain length. */
export interface ChainRow {
  member: FamilyMember
  chainAtoms: number[]
  chainBonds: number[]
  chainLength: number
}

/** The atoms of a chain and the bonds joining two atoms of it. */
export function chainHighlight(member: FamilyMember): { atoms: number[]; bonds: number[] } {
  const atoms = longestChain(member.graph)
  const inChain = new Set(atoms)
  const bonds = member.graph.bonds
    .map((b, i) => (inChain.has(b.a) && inChain.has(b.b) ? i : -1))
    .filter((i) => i >= 0)
  return { atoms, bonds }
}

function findMember(formula: FamilyId, name: string): FamilyMember {
  const member = isomerFamily(formula).members.find((m) => m.name === name)
  if (!member) throw new Error(`${name} is not in the ${formula} family`)
  return member
}

function pairStep(formula: FamilyId, leftName: string, rightName: string): IsomerStep {
  const left = findMember(formula, leftName)
  const right = findMember(formula, rightName)
  const { relation, phrase } = compareMembers(left, right)
  return { kind: 'pair', formula, left, right, relation, phrase }
}

/**
 * The six Steps: the three isomers of C₅H₁₂, longest chain first; then position, functional and
 * metamer pairs; then cis and trans but-2-ene in 3D.
 */
export function isomerSteps(): IsomerStep[] {
  const chainRows: ChainRow[] = isomerFamily('C5H12')
    .members.map((member) => {
      const { atoms, bonds } = chainHighlight(member)
      return { member, chainAtoms: atoms, chainBonds: bonds, chainLength: atoms.length }
    })
    .sort((a, b) => b.chainLength - a.chainLength)
  return [
    { kind: 'chain', formula: 'C5H12', rows: chainRows },
    pairStep('C3H8O', 'propan-1-ol', 'propan-2-ol'),
    pairStep('C2H6O', 'ethanol', 'methoxymethane'),
    pairStep('C4H10O', 'ethoxyethane', '1-methoxypropane'),
    { kind: 'geometry', config: 'cis', name: but2eneName('cis'), geometry: but2eneGeometry('cis') },
    { kind: 'geometry', config: 'trans', name: but2eneName('trans'), geometry: but2eneGeometry('trans') },
  ]
}
