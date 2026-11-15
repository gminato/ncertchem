import type { PushStepSpec } from '@/lib/chem/arrow-push'

/**
 * The elementary steps of the arrow-pusher. Each one is drawn as its species, centred on the
 * origin of the stage (pixels at scale 50): one part at (0, 0), or a nucleophile on the left and an
 * electrophile on the right. Every structure is written in the lib's SMILES subset; the names and
 * arrows come from the lib (see arrow-push.ts).
 */
export const ARROW_PUSHER_STEPS: PushStepSpec[] = [
  {
    id: 'het-c-br',
    kind: 'heterolysis',
    title: 'Heterolysis of a C–Br bond',
    parts: [{ smiles: 'CC(C)Br', offset: { x: 0, y: 0 } }],
    bond: ['C', 'Br'],
  },
  {
    id: 'het-c-cl-tertiary',
    kind: 'heterolysis',
    title: 'Heterolysis of a C–Cl bond on a tertiary carbon',
    parts: [{ smiles: 'CC(C)(C)Cl', offset: { x: 0, y: 0 } }],
    bond: ['C', 'Cl'],
  },
  {
    id: 'het-c-cu',
    kind: 'heterolysis',
    title: 'Heterolysis of a C–Cu bond',
    parts: [{ smiles: 'CC[Cu]', offset: { x: 0, y: 0 } }],
    bond: ['C', 'Cu'],
  },
  {
    id: 'het-c-cl-primary',
    kind: 'heterolysis',
    title: 'Heterolysis of a C–Cl bond on a primary carbon',
    parts: [{ smiles: 'CC(C)CCl', offset: { x: 0, y: 0 } }],
    bond: ['C', 'Cl'],
  },
  {
    id: 'hom-c-br',
    kind: 'homolysis',
    title: 'Homolysis of a C–Br bond',
    parts: [{ smiles: 'CCCBr', offset: { x: 0, y: 0 } }],
    bond: ['C', 'Br'],
  },
  {
    id: 'hom-c-i-tertiary',
    kind: 'homolysis',
    title: 'Homolysis of a C–I bond on a tertiary carbon',
    parts: [{ smiles: 'CC(C)(C)I', offset: { x: 0, y: 0 } }],
    bond: ['C', 'I'],
  },
  {
    id: 'att-oh-tertiary',
    kind: 'attack',
    title: 'Hydroxide attacks a tertiary carbocation',
    parts: [
      { smiles: '[OH-]', offset: { x: -150, y: 0 } },
      { smiles: 'C[C+](C)C', offset: { x: 90, y: 0 } },
    ],
    nucleophile: { part: 0, element: 'O' },
    electrophile: { part: 1, element: 'C' },
  },
  {
    id: 'att-nh3-secondary',
    kind: 'attack',
    title: 'Ammonia attacks a secondary carbocation',
    parts: [
      { smiles: 'N', offset: { x: -150, y: 0 } },
      { smiles: 'C[CH+]C', offset: { x: 90, y: 0 } },
    ],
    nucleophile: { part: 0, element: 'N' },
    electrophile: { part: 1, element: 'C' },
  },
]
