import { describe, it, expect } from 'vitest'
import {
  bandY,
  clamp01,
  coneHalfWidth,
  collectedFraction,
  frontY,
  layerOrder,
  liquidBandPath,
  liquidRectPath,
  liquidSurfaceY,
  mixAmount,
  partitionProgress,
  partitionTopFraction,
  rfFromDistances,
  seededRandom,
  spotY,
  splitCount,
} from './geometry'

describe('clamp and random', () => {
  it('clamps to [0, 1]', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(1.4)).toBe(1)
    expect(clamp01(0.3)).toBe(0.3)
  })

  it('gives the same sequence for the same seed', () => {
    const a = seededRandom(7)
    const b = seededRandom(7)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
    const c = seededRandom(8)
    expect(c()).not.toBe(seededRandom(7)())
  })
})

describe('chromatography placement (Rf)', () => {
  it('computes Rf from measured distances', () => {
    expect(rfFromDistances(4, 8)).toBe(0.5)
    expect(rfFromDistances(4, 0)).toBe(0)
  })

  it('places a spot at Rf times the solvent distance', () => {
    // Baseline at 260, solvent 200 px, front fully up (progress 1).
    expect(spotY(260, 0.5, 1, 200)).toBe(160)
    expect(spotY(260, 0.25, 1, 200)).toBe(210)
  })

  it('moves spots only as far as the front has risen', () => {
    expect(spotY(260, 0.5, 0.5, 200)).toBe(210)
    expect(spotY(260, 0.5, 0, 200)).toBe(260)
    expect(frontY(260, 0.5, 200)).toBe(160)
  })

  it('keeps every spot between the baseline and the front', () => {
    for (const rf of [0, 0.3, 0.7, 1]) {
      const y = spotY(260, rf, 1, 200)
      expect(y).toBeLessThanOrEqual(260)
      expect(y).toBeGreaterThanOrEqual(frontY(260, 1, 200))
    }
  })
})

describe('layer order by density', () => {
  it('puts the less dense liquid on top regardless of input order', () => {
    const order = layerOrder([
      { id: 'aqueous', density: 1.0 },
      { id: 'ether', density: 0.71 },
    ])
    expect(order.map((l) => l.id)).toEqual(['ether', 'aqueous'])
  })

  it('keeps input order for equal densities', () => {
    const order = layerOrder([
      { id: 'a', density: 1 },
      { id: 'b', density: 1 },
    ])
    expect(order.map((l) => l.id)).toEqual(['a', 'b'])
  })
})

describe('partition fractions', () => {
  it('is zero before any extraction', () => {
    expect(partitionTopFraction(3, 1, 1, 0)).toBe(0)
  })

  it('gives K/(K+1) after one equal-volume extraction', () => {
    expect(partitionTopFraction(3, 1, 1, 1)).toBeCloseTo(0.75, 10)
  })

  it('gets closer to full extraction with each wash', () => {
    const one = partitionTopFraction(3, 1, 1, 1)
    const two = partitionTopFraction(3, 1, 1, 2)
    const three = partitionTopFraction(3, 1, 1, 3)
    expect(two).toBeCloseTo(0.9375, 10)
    expect(three).toBeGreaterThan(two)
    expect(three).toBeLessThan(1)
    expect(one).toBeLessThan(two)
  })

  it('splits a count so the parts add up', () => {
    const { top, bottom } = splitCount(28, 0.75)
    expect(top + bottom).toBe(28)
    expect(top).toBe(21)
  })

  it('ramps partitioning in only after the shake is well under way', () => {
    expect(partitionProgress(0)).toBe(0)
    expect(partitionProgress(0.4)).toBe(0)
    expect(partitionProgress(1)).toBe(1)
    expect(mixAmount(0)).toBeCloseTo(0, 10)
    expect(mixAmount(0.5)).toBeCloseTo(1, 10)
    expect(mixAmount(1)).toBeCloseTo(0, 10)
  })
})

describe('liquid-level paths', () => {
  it('places the surface by level, with empty at the bottom', () => {
    expect(liquidSurfaceY(0, 0, 200)).toBe(200)
    expect(liquidSurfaceY(1, 0, 200)).toBe(0)
    expect(liquidSurfaceY(0.5, 0, 200)).toBe(100)
    expect(liquidSurfaceY(2, 0, 200)).toBe(0)
  })

  it('builds a closed rectangle from the bottom up to the level', () => {
    expect(liquidRectPath(0.5, 0, 100, 0, 200)).toBe('M0,100 H100 V200 H0 Z')
  })

  it('builds a band between two levels', () => {
    expect(liquidBandPath(0.25, 0.75, 0, 10, 0, 100)).toBe('M0,25 H10 V75 H0 Z')
  })
})

describe('column helpers', () => {
  it('moves a band down and stops it at the bottom on arrival', () => {
    expect(bandY(0, 100, 0.8, 0.4)).toBe(50)
    expect(bandY(0, 100, 0.8, 0.8)).toBe(100)
    expect(bandY(0, 100, 0.8, 1)).toBe(100)
  })

  it('collects only after a band has reached the bottom', () => {
    expect(collectedFraction(0.8, 0.8)).toBe(0)
    expect(collectedFraction(0.8, 0.9)).toBeCloseTo(0.4, 10)
    expect(collectedFraction(0.5, 1)).toBe(1)
  })

  it('narrows a cone linearly', () => {
    expect(coneHalfWidth(0, 0, 10, 100, 0)).toBe(10)
    expect(coneHalfWidth(50, 0, 10, 100, 0)).toBe(5)
    expect(coneHalfWidth(200, 0, 10, 100, 0)).toBe(0)
  })
})
