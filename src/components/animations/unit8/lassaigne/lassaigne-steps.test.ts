import { describe, expect, it } from 'vitest'
import {
  HALOGEN_PHOSPHORUS_TUBES,
  LASSAIGNE_TARGETS,
  NITROGEN_SULPHUR_TUBES,
  lassaigneTarget,
} from './lassaigne-steps'

describe('lassaigne targets', () => {
  it('has six Steps in the order of the bench: sample, fuse, plunge, extract, then the two racks', () => {
    expect(LASSAIGNE_TARGETS.map((t) => t.stage)).toEqual([
      'sample',
      'fuse',
      'plunge',
      'extract',
      'nitrogen-sulphur',
      'halogen-phosphorus',
    ])
  })

  it('clamps out-of-range and fractional Step indices', () => {
    expect(lassaigneTarget(-3).stage).toBe('sample')
    expect(lassaigneTarget(99).stage).toBe('halogen-phosphorus')
    expect(lassaigneTarget(1.4).stage).toBe('fuse')
  })

  it('keeps progress between 0 and 1', () => {
    for (const t of LASSAIGNE_TARGETS) {
      expect(t.progress).toBeGreaterThanOrEqual(0)
      expect(t.progress).toBeLessThanOrEqual(1)
    }
  })

  it('draws four tubes on each rack, with unique ids', () => {
    expect(NITROGEN_SULPHUR_TUBES.map((t) => t.id)).toHaveLength(4)
    expect(new Set(NITROGEN_SULPHUR_TUBES.map((t) => t.id)).size).toBe(4)
    expect(HALOGEN_PHOSPHORUS_TUBES.map((t) => t.label)).toEqual(['Cl', 'Br', 'I', 'P'])
  })
})
