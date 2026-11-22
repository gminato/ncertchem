import { describe, expect, it } from 'vitest'
import { NCERT_AQUA_COLOURS } from '@/lib/chem/ncert-c12-unit4-tables'
import { aquaIonColour, complementaryColour, dElectronCount, isColourlessByConfig } from '@/lib/chem/dblock'
import { colourWheelSector } from '@/lib/chem/dblock-series-data'

describe('aqua-ion-colour-lab data path', () => {
  it('maps every Table 4.8 ion the lab offers to a wheel sector, or to no arrow when colourless', () => {
    for (const row of NCERT_AQUA_COLOURS) {
      const info = aquaIonColour(row.ion)
      if (info === null) continue
      const sector = colourWheelSector(info.colour)
      if (info.colour === 'colourless') {
        expect(sector).toBeNull()
      } else {
        expect(sector).not.toBeNull()
      }
    }
  })

  it('pairs the absorbed and seen sectors as opposites on the wheel', () => {
    expect(complementaryColour('blue')).toBe('orange')
    expect(complementaryColour('red')).toBe('green')
    expect(complementaryColour('yellow')).toBe('violet')
  })

  it('marks purple as the violet sector and pink as the red sector, both approximate', () => {
    expect(colourWheelSector('purple')).toEqual({ sector: 'violet', nearest: true })
    expect(colourWheelSector('pink')).toEqual({ sector: 'red', nearest: true })
  })

  it('takes Co³⁺ as blue and Co²⁺ as pink (R7), with the lib d counts', () => {
    expect(aquaIonColour('Co³⁺')?.colour).toBe('blue')
    expect(aquaIonColour('Co²⁺')?.colour).toBe('pink')
    expect(dElectronCount('Co', 3)).toBe(6)
    expect(dElectronCount('Co', 2)).toBe(7)
  })

  it('calls only d0 and d10 ions colourless', () => {
    expect(isColourlessByConfig(dElectronCount('Ti', 4))).toBe(true)
    expect(isColourlessByConfig(dElectronCount('Zn', 2))).toBe(true)
    expect(isColourlessByConfig(dElectronCount('Cu', 2))).toBe(false)
  })
})
