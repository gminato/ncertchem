import { describe, expect, it } from 'vitest'
import { reactionQuotient, solveIce } from './equilibrium'
import {
  ARGON_AMOUNT,
  VOLUME_MAX,
  applyLabEvent,
  approachEpoch,
  compositionAt,
  constantAt,
  createLab,
  kUnit,
  labActions,
  labSystem,
  labSystems,
  lastEnd,
  seriesBetween,
  type LabSnapshot,
} from './le-chatelier-lab'

function settle(snap: LabSnapshot, event: Parameters<typeof applyLabEvent>[1]): LabSnapshot {
  return applyLabEvent(snap, event)
}

describe('systems and constants', () => {
  it('takes K for the Haber mixture at 500 K from the NCERT Kp of 3.6e-2, with Kc = Kp (RT)²', () => {
    const haber = labSystem('haber')
    expect(haber.anchorK).toBeCloseTo(3.6e-2 * (0.0831 * 500) ** 2, 1)
    expect(haber.anchorK).toBeCloseTo(62.15, 1)
  })

  it('takes ΔH for the Haber equation from the formation enthalpies of Table 5.2', () => {
    expect(labSystem('haber').deltaHkJ).toBeCloseTo(-92.22, 6)
  })

  it('takes K for N₂O₄ ⇌ 2NO₂ at 400 K from the NCERT Kp of 47.9, with Kc = Kp / RT', () => {
    expect(labSystem('n2o4').anchorK).toBeCloseTo(47.9 / (0.0831 * 400), 6)
    expect(labSystem('n2o4').deltaHkJ).toBe(57.2)
  })

  it('gives the Fe³⁺ system no enthalpy change, so its temperature is held fixed', () => {
    expect(labSystem('fe-scn').deltaHkJ).toBeNull()
    expect(() => constantAt(labSystem('fe-scn'), 310)).toThrow()
  })

  it('returns K at 550 K from the van \'t Hoff relation: 8.27 M⁻²', () => {
    expect(constantAt(labSystem('haber'), 550)).toBeCloseTo(8.27, 2)
  })

  it('names the unit of K from the net change in moles', () => {
    const units = labSystems().map((s) => kUnit(s))
    expect(units).toEqual(['M⁻²', 'M', 'M⁻¹'])
  })

  it('lists three systems, each with a reaction, species and starting amounts', () => {
    const systems = labSystems()
    expect(systems.map((s) => s.id)).toEqual(['haber', 'n2o4', 'fe-scn'])
    for (const s of systems) {
      expect(s.species.length).toBeGreaterThanOrEqual(2)
      expect(Object.keys(s.initial).sort()).toEqual(s.species.map((sp) => sp.id).sort())
    }
  })
})

describe('starting mixture', () => {
  it('settles at the solveIce equilibrium with Q = K', () => {
    const snap = createLab('haber')
    const haber = labSystem('haber')
    const eq = solveIce(haber.reaction, haber.initial, haber.anchorK, { basis: 'concentration' })
    expect(snap.settled.N2).toBeCloseTo(eq.equilibrium.N2, 9)
    expect(snap.settled.NH3).toBeCloseTo(1.604, 3)
    expect(reactionQuotient(haber.reaction, snap.settled)).toBeCloseTo(snap.k, 6)
  })

  it('ends its first relaxation at the settled state', () => {
    for (const id of ['haber', 'n2o4', 'fe-scn'] as const) {
      const snap = createLab(id)
      const last = snap.epochs[0].samples[snap.epochs[0].samples.length - 1].concentrations
      for (const key of Object.keys(snap.settled)) {
        expect(last[key]).toBeCloseTo(snap.settled[key], 5)
      }
    }
  })
})

describe('stresses and the lib', () => {
  it('adding N₂ gives Q = 17.6, runs forward, and partly opposes the stress', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'add', species: 'N2' })
    const record = after.last!
    expect(record.immediateQ).toBeCloseTo(17.6, 1)
    expect(record.direction).toBe('forward')
    expect(record.shift).toBe('right')
    expect(after.settled.N2).toBeGreaterThan(before.settled.N2)
    expect(after.settled.N2).toBeLessThan(before.settled.N2 + ARGON_AMOUNT)
    expect(after.settled.NH3).toBeGreaterThan(before.settled.NH3)
  })

  it('compressing to half the volume gives Q = K/4 and shifts forward for Haber', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'compress' })
    expect(after.volume).toBeCloseTo(0.5, 12)
    expect(after.last!.immediateQ).toBeCloseTo(before.k / 4, 9)
    expect(after.last!.direction).toBe('forward')
    expect(after.settled.NH3).toBeGreaterThan(before.settled.NH3 * 2 * 0.99)
  })

  it('expanding the N₂O₄ mixture shifts it towards NO₂, the side with more molecules', () => {
    const before = createLab('n2o4')
    const after = settle(before, { kind: 'expand' })
    expect(after.last!.direction).toBe('forward')
    expect(after.settled.NO2).toBeGreaterThan(before.settled.NO2 * 0.5)
  })

  it('argon at constant volume changes nothing and leaves Q equal to K', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'argon-constant-volume' })
    expect(after.argonMol).toBeCloseTo(ARGON_AMOUNT, 12)
    expect(after.volume).toBe(1)
    expect(after.last!.direction).toBe('at equilibrium')
    expect(after.last!.shift).toBe('none')
    for (const key of Object.keys(before.settled)) {
      expect(after.settled[key]).toBeCloseTo(before.settled[key], 12)
    }
  })

  it('argon at constant pressure expands the vessel and shifts Haber towards reactants', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'argon-constant-pressure' })
    expect(after.volume).toBeGreaterThan(1)
    expect(after.last!.direction).toBe('reverse')
    expect(after.settled.NH3).toBeLessThan(before.settled.NH3)
  })

  it('heating lowers K for Haber and shifts it towards reactants', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'heat' })
    expect(after.temperatureK).toBe(550)
    expect(after.k).toBeCloseTo(constantAt(labSystem('haber'), 550), 9)
    expect(after.k).toBeLessThan(before.k)
    expect(after.last!.direction).toBe('reverse')
    expect(after.settled.NH3).toBeLessThan(before.settled.NH3)
  })

  it('cooling raises K for Haber', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'cool' })
    expect(after.temperatureK).toBe(450)
    expect(after.k).toBeGreaterThan(before.k)
    expect(after.last!.direction).toBe('forward')
  })

  it('heating N₂O₄ ⇌ 2NO₂, an endothermic reaction, raises K and shifts towards NO₂', () => {
    const before = createLab('n2o4')
    const after = settle(before, { kind: 'heat' })
    expect(after.k).toBeGreaterThan(before.k)
    expect(after.last!.direction).toBe('forward')
    expect(after.settled.NO2).toBeGreaterThan(before.settled.NO2)
  })

  it('a catalyst leaves K and the composition unchanged, and speeds the approach', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'catalyst' })
    expect(after.catalysed).toBe(true)
    expect(after.k).toBe(before.k)
    expect(after.last!.direction).toBe('at equilibrium')
    for (const key of Object.keys(before.settled)) {
      expect(after.settled[key]).toBeCloseTo(before.settled[key], 12)
    }
  })

  it('a catalysed approach reaches 99 % of the final NH₃ sooner than an uncatalysed one', () => {
    const haber = labSystem('haber')
    const plain = approachEpoch('haber', false).samples
    const fast = approachEpoch('haber', true).samples
    const finalNh3 = haber.initial.N2 ? createLab('haber').settled.NH3 : 0
    const firstWithin = (samples: typeof plain) => samples.find((s) => Math.abs(s.concentrations.NH3 - finalNh3) <= 0.01 * finalNh3)!.time
    expect(firstWithin(fast)).toBeLessThan(firstWithin(plain))
  })

  it('the catalysed approach never overshoots the equilibrium, and no amount goes negative', () => {
    const final = createLab('haber').settled.NH3
    const catalysed = approachEpoch('haber', true).samples
    expect(Math.max(...catalysed.map((x) => x.concentrations.NH3))).toBeLessThanOrEqual(final * 1.001)
    const afterCatalyst = settle(settle(createLab('haber'), { kind: 'catalyst' }), { kind: 'heat' })
    for (const epoch of afterCatalyst.epochs) {
      for (const sample of epoch.samples) {
        for (const value of Object.values(sample.concentrations)) expect(value).toBeGreaterThanOrEqual(-1e-9)
      }
    }
  })

  it('removing a product shifts forward, and removing a reactant shifts in reverse', () => {
    const haber = createLab('haber')
    expect(settle(haber, { kind: 'remove', species: 'NH3' }).last!.direction).toBe('forward')
    expect(settle(haber, { kind: 'remove', species: 'N2' }).last!.direction).toBe('reverse')
  })

  it('removing Fe³⁺ from the aqueous mixture shifts it towards free Fe³⁺ and SCN⁻', () => {
    const fe = createLab('fe-scn')
    const after = settle(fe, { kind: 'remove', species: 'Fe3+' })
    expect(after.last!.direction).toBe('reverse')
    expect(after.settled['FeSCN2+']).toBeLessThan(fe.settled['FeSCN2+'])
  })

  it('every settled state after a stress satisfies Q = K', () => {
    let snap = createLab('haber')
    const events = [
      { kind: 'add', species: 'H2' } as const,
      { kind: 'compress' } as const,
      { kind: 'heat' } as const,
      { kind: 'argon-constant-pressure' } as const,
      { kind: 'cool' } as const,
      { kind: 'catalyst' } as const,
    ]
    for (const event of events) {
      snap = settle(snap, event)
      expect(reactionQuotient(labSystem('haber').reaction, snap.settled)).toBeCloseTo(snap.k, 5)
    }
  })

  it('refuses an action that is not enabled', () => {
    const fe = createLab('fe-scn')
    expect(() => applyLabEvent(fe, { kind: 'heat' })).toThrow(/not available/)
    expect(() => applyLabEvent(fe, { kind: 'compress' })).toThrow(/not available/)
  })
})

describe('actions for each system', () => {
  it('enables every gas action for Haber at its starting state', () => {
    const actions = labActions(createLab('haber'))
    expect(actions.every((a) => a.enabled)).toBe(true)
  })

  it('disables pressure, temperature and inert actions for the aqueous mixture, with a reason', () => {
    const actions = labActions(createLab('fe-scn'))
    const off = actions.filter((a) => !a.enabled).map((a) => a.id)
    expect(off).toEqual(expect.arrayContaining(['compress', 'expand', 'heat', 'cool', 'argon-volume', 'argon-pressure']))
    expect(actions.find((a) => a.id === 'heat')!.reason).toMatch(/enthalpy/)
  })

  it('stops the piston at its highest and lowest positions', () => {
    let snap = createLab('n2o4')
    snap = settle(snap, { kind: 'expand' })
    expect(snap.volume).toBe(2)
    expect(labActions(snap).find((a) => a.id === 'expand')!.enabled).toBe(false)
    expect(VOLUME_MAX).toBe(2)
  })

  it('disables a catalyst once one is in the vessel', () => {
    const snap = settle(createLab('haber'), { kind: 'catalyst' })
    expect(labActions(snap).find((a) => a.id === 'catalyst')!.enabled).toBe(false)
  })
})

describe('timelines', () => {
  it('starts each stress when the previous relaxation ends', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'add', species: 'N2' })
    expect(after.epochs[1].startTime).toBe(lastEnd(before))
    expect(after.epochs[1].endTime).toBe(lastEnd(before) + 10)
  })

  it('shows the jump at a stress, with the composition continuous across the boundary', () => {
    const before = createLab('haber')
    const after = settle(before, { kind: 'compress' })
    const t = after.epochs[1].startTime
    const settledBefore = compositionAt(after, t - 1e-9)
    const jumped = after.epochs[1].samples[0].concentrations
    expect(settledBefore.N2).toBeCloseTo(before.settled.N2, 6)
    expect(jumped.N2).toBeCloseTo(before.settled.N2 * 2, 6)
  })

  it('interpolates within a relaxation and returns the settled state after it', () => {
    const snap = createLab('haber')
    const mid = compositionAt(snap, 5)
    expect(mid.NH3).toBeGreaterThan(0)
    expect(mid.NH3).toBeLessThan(snap.settled.NH3 + 1e-6)
    expect(compositionAt(snap, 100)).toEqual(snap.settled)
  })

  it('returns a series that starts and ends at the requested times', () => {
    const snap = settle(createLab('haber'), { kind: 'add', species: 'N2' })
    const points = seriesBetween(snap, 'N2', 0, 12)
    expect(points[0][0]).toBe(0)
    expect(points[points.length - 1][0]).toBe(12)
    const times = points.map((p) => p[0])
    expect([...times].sort((a, b) => a - b)).toEqual(times)
  })
})

describe('every epoch converges before its last sample is pinned', () => {
  // The last sample is pinned to the exact equilibrium. If the kinetics have not converged by then,
  // the curve visibly jumps (the Fe–SCN complex once leapt from 0.13 to 0.166 M).
  for (const id of ['haber', 'n2o4', 'fe-scn'] as const) {
    for (const catalysed of [false, true]) {
      it(`${id}${catalysed ? ' (catalysed)' : ''}: second-to-last sample within 1 % of the end`, () => {
        const epoch = approachEpoch(id, catalysed)
        const n = epoch.samples.length
        const end = epoch.samples[n - 1].concentrations
        const before = epoch.samples[n - 2].concentrations
        for (const sp of Object.keys(end)) {
          expect(Math.abs(before[sp] - end[sp])).toBeLessThanOrEqual(0.01 * Math.max(...Object.values(end)))
        }
      })
    }
  }
})
