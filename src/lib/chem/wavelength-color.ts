export interface SpectralColor {
  r: number
  g: number
  b: number
  visible: boolean
}

/** Fallback neutral color for ultraviolet (< 380 nm): #7B61FF */
const UV_FALLBACK: SpectralColor = {
  r: 123,
  g: 97,
  b: 255,
  visible: false,
}

/** Fallback neutral color for infrared (> 750 nm): #8B2E2E */
const IR_FALLBACK: SpectralColor = {
  r: 139,
  g: 46,
  b: 46,
  visible: false,
}

const GAMMA = 0.8

/**
 * Converts a wavelength in nanometers (nm) to an RGB representation (0–255 ints).
 *
 * Uses Dan Bruton's piecewise spectral approximation with intensity falloff
 * at the visible boundaries (380–420 nm and 700–750 nm).
 *
 * Outside the visible range (380–750 nm inclusive), returns `visible: false`
 * with neutral fallback colors (#7B61FF for UV, #8B2E2E for IR).
 *
 * @param nm Wavelength in nanometers
 */
export function wavelengthToRgb(nm: number): SpectralColor {
  if (nm < 380) {
    return { ...UV_FALLBACK }
  }
  if (nm > 750) {
    return { ...IR_FALLBACK }
  }

  let r = 0
  let g = 0
  let b = 0

  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / (440 - 380)
    g = 0.0
    b = 1.0
  } else if (nm >= 440 && nm < 490) {
    r = 0.0
    g = (nm - 440) / (490 - 440)
    b = 1.0
  } else if (nm >= 490 && nm < 510) {
    r = 0.0
    g = 1.0
    b = -(nm - 510) / (510 - 490)
  } else if (nm >= 510 && nm < 580) {
    r = (nm - 510) / (580 - 510)
    g = 1.0
    b = 0.0
  } else if (nm >= 580 && nm < 645) {
    r = 1.0
    g = -(nm - 645) / (645 - 580)
    b = 0.0
  } else {
    // 645 <= nm <= 750
    r = 1.0
    g = 0.0
    b = 0.0
  }

  // Intensity falloff near vision limits: 380–420 and 700–750 nm
  let factor = 1.0
  if (nm >= 380 && nm < 420) {
    factor = 0.3 + 0.7 * (nm - 380) / (420 - 380)
  } else if (nm > 700 && nm <= 750) {
    factor = 0.3 + 0.7 * (750 - nm) / (750 - 700)
  }

  const adjust = (channel: number): number => {
    if (channel <= 0) return 0
    return Math.round(255 * Math.pow(channel * factor, GAMMA))
  }

  return {
    r: adjust(r),
    g: adjust(g),
    b: adjust(b),
    visible: true,
  }
}

/**
 * Returns an `rgb(...)` CSS color string for a given wavelength in nanometers.
 *
 * @param nm Wavelength in nanometers
 */
export function wavelengthToCss(nm: number): string {
  const { r, g, b } = wavelengthToRgb(nm)
  return `rgb(${r}, ${g}, ${b})`
}
