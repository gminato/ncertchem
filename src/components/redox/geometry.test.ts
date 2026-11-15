import { describe, it, expect } from 'vitest'
import {
  clamp01,
  formatSignedNumber,
  formatTrueMinus,
  resolveBadgePositions,
  onLadderY,
  potentialLadderY,
  curvedArrowPath,
  spontaneousBracketGeometry,
  electronArcPoint,
  electronArcPath,
  staggeredElectronPoints,
  parseColor,
  interpolateRgb,
  parseChemicalFormula,
} from './geometry'

describe('Redox geometry helpers', () => {
  describe('clamp01, formatSignedNumber, formatTrueMinus', () => {
    it('clamps values cleanly to [0, 1]', () => {
      expect(clamp01(-0.5)).toBe(0)
      expect(clamp01(0)).toBe(0)
      expect(clamp01(0.42)).toBe(0.42)
      expect(clamp01(1)).toBe(1)
      expect(clamp01(1.5)).toBe(1)
    })

    it('formats positive and negative numbers with true minus U+2212', () => {
      expect(formatSignedNumber(6)).toBe('+6')
      expect(formatSignedNumber(-2)).toBe('−2')
      expect(formatSignedNumber(0)).toBe('0')
      expect(formatTrueMinus('2-')).toBe('2−')
      expect(formatTrueMinus('MnO4-')).toBe('MnO4−')
    })
  })

  describe('Badge placement without overlap', () => {
    it('leaves already separated badges alone', () => {
      const badges = [
        { id: 'Cr', targetX: 20, width: 24 },
        { id: 'O', targetX: 80, width: 24 },
      ]
      const placed = resolveBadgePositions(badges, 4)
      expect(placed[0].x).toBe(20)
      expect(placed[1].x).toBe(80)
      expect(placed[0].nudged).toBe(false)
      expect(placed[1].nudged).toBe(false)
    })

    it('pushes overlapping badges apart symmetrically without colliding', () => {
      const badges = [
        { id: 'A', targetX: 50, width: 30 },
        { id: 'B', targetX: 52, width: 30 },
      ]
      const minGap = 6
      const placed = resolveBadgePositions(badges, minGap)

      // Required distance between centers = 15 + 15 + 6 = 36
      const dist = placed[1].x - placed[0].x
      expect(dist).toBeGreaterThanOrEqual(35.9)
      expect(placed[0].nudged).toBe(true)
      expect(placed[1].nudged).toBe(true)
      // Symmetric displacement around initial midpoint 51
      const midpoint = (placed[0].x + placed[1].x) / 2
      expect(Math.abs(midpoint - 51)).toBeLessThan(0.01)
    })

    it('handles 3 clustered badges and preserves order', () => {
      const badges = [
        { id: '1', targetX: 40, width: 20 },
        { id: '2', targetX: 45, width: 20 },
        { id: '3', targetX: 50, width: 20 },
      ]
      const placed = resolveBadgePositions(badges, 4)
      expect(placed[0].x).toBeLessThan(placed[1].x)
      expect(placed[1].x).toBeLessThan(placed[2].x)
      expect(placed[1].x - placed[0].x).toBeGreaterThanOrEqual(23.9)
      expect(placed[2].x - placed[1].x).toBeGreaterThanOrEqual(23.9)
    })
  })

  describe('Ladder placement (ON and Potential)', () => {
    it('maps oxidation numbers so higher ON is at top', () => {
      const options = { top: 20, bottom: 220, onMin: -3, onMax: 7 }
      // -3 -> bottom (220)
      expect(onLadderY(-3, options)).toBe(220)
      // +7 -> top (20)
      expect(onLadderY(7, options)).toBe(20)
      // 0 -> exactly 70% from top or 30% from bottom (220 - 0.3 * 200 = 160)
      expect(onLadderY(0, options)).toBe(160)
      // +2 -> halfway between -3 and 7? (-3 to 7 is span 10; 0 to 2 is 5/10)
      expect(onLadderY(2, options)).toBe(120)
    })

    it('maps standard reduction potential so more positive is at top', () => {
      const options = { top: 30, bottom: 330, eMin: -3.0, eMax: 3.0 }
      // +3.0 V -> top (30)
      expect(potentialLadderY(3.0, options)).toBe(30)
      // -3.0 V -> bottom (330)
      expect(potentialLadderY(-3.0, options)).toBe(330)
      // 0.0 V -> exactly midpoint (180)
      expect(potentialLadderY(0.0, options)).toBe(180)
    })
  })

  describe('Arrow paths and bracket geometry', () => {
    it('creates curved arrow paths with specified horizontal deflection', () => {
      const from = { x: 100, y: 50 }
      const to = { x: 100, y: 150 }
      const path = curvedArrowPath(from, to, 30)
      expect(path).toBe('M 100 50 Q 130 100 100 150')
    })

    it('creates spontaneous reaction bracket spanning cathode to anode', () => {
      const cathodeY = 100
      const anodeY = 240
      const bracket = spontaneousBracketGeometry(cathodeY, anodeY, 150, 20)
      expect(bracket.bracketPath).toContain('M 150 100')
      expect(bracket.bracketPath).toContain('L 170 100')
      expect(bracket.bracketPath).toContain('L 150 240')
      expect(bracket.labelY).toBe(170)
      expect(bracket.labelX).toBe(180)
    })
  })

  describe('Electron path points along arc', () => {
    const donor = { x: 50, y: 100 }
    const acceptor = { x: 250, y: 100 }
    const arcHeight = 60

    it('starts at donor at t=0 and ends at acceptor at t=1', () => {
      const start = electronArcPoint(donor, acceptor, arcHeight, 0)
      expect(start.x).toBeCloseTo(50)
      expect(start.y).toBeCloseTo(100)

      const end = electronArcPoint(donor, acceptor, arcHeight, 1)
      expect(end.x).toBeCloseTo(250)
      expect(end.y).toBeCloseTo(100)
    })

    it('peaks at halfway point with expected height', () => {
      const mid = electronArcPoint(donor, acceptor, arcHeight, 0.5)
      expect(mid.x).toBeCloseTo(150)
      // Quad bezier mid y = 0.25*100 + 0.5*(100-60) + 0.25*100 = 25 + 20 + 25 = 70
      expect(mid.y).toBeCloseTo(70)
    })

    it('generates smooth arc path string', () => {
      const path = electronArcPath(donor, acceptor, arcHeight)
      expect(path).toBe('M 50 100 Q 150 40 250 100')
    })

    it('staggers multiple electrons along arc', () => {
      const electrons = staggeredElectronPoints(donor, acceptor, arcHeight, 3, 0.5, 0.1)
      expect(electrons.length).toBe(3)
      expect(electrons[0].x).toBeLessThan(electrons[1].x)
      expect(electrons[1].x).toBeLessThan(electrons[2].x)
    })
  })

  describe('Colour interpolation', () => {
    it('interpolates RGB values between hex colors', () => {
      const black = '#000000'
      const white = '#ffffff'
      expect(interpolateRgb(black, white, 0)).toBe('rgba(0, 0, 0, 1)')
      expect(interpolateRgb(black, white, 1)).toBe('rgba(255, 255, 255, 1)')
      expect(interpolateRgb(black, white, 0.5)).toBe('rgba(128, 128, 128, 1)')
    })

    it('handles CSS token fallbacks in test environment', () => {
      const cu = 'var(--sol-cu)'
      const parsed = parseColor(cu)
      expect(parsed.r).toBe(30)
      expect(parsed.g).toBe(136)
      expect(parsed.b).toBe(229)

      const mixed = interpolateRgb('var(--sol-cu)', '#ffffff', 0.5)
      expect(mixed).toBe('rgba(143, 196, 242, 1)')
    })
  })

  describe('Chemical formula parser', () => {
    it('parses Cr2O7, MnO4, S4O6 correctly', () => {
      expect(parseChemicalFormula('Cr2O7')).toEqual([
        { element: 'Cr', count: '2', index: 0 },
        { element: 'O', count: '7', index: 1 },
      ])
      expect(parseChemicalFormula('MnO4')).toEqual([
        { element: 'Mn', count: undefined, index: 0 },
        { element: 'O', count: '4', index: 1 },
      ])
      expect(parseChemicalFormula('S4O6')).toEqual([
        { element: 'S', count: '4', index: 0 },
        { element: 'O', count: '6', index: 1 },
      ])
    })
  })
})
