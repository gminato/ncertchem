import { createContext, useContext } from 'react'

/**
 * Colours the 3D scene needs, read from the CSS tokens at runtime so that the
 * materials always match the theme. Three.js parses hex and rgb() values only,
 * so the tokens used here must stay opaque.
 */
export interface StageColors {
  orbitalPos: string
  orbitalNeg: string
  electron: string
  accent: string
  fg: string
  fgMuted: string
  fgSubtle: string
  surface: string
}

/** Token name for each colour. */
export const STAGE_TOKENS: Record<keyof StageColors, string> = {
  orbitalPos: '--orbital-pos',
  orbitalNeg: '--orbital-neg',
  electron: '--electron',
  accent: '--accent',
  fg: '--fg',
  fgMuted: '--fg-muted',
  fgSubtle: '--fg-subtle',
  surface: '--surface',
}

/** Light-theme values, used only if a token is missing (for example in tests). */
export const STAGE_FALLBACK: StageColors = {
  orbitalPos: '#E0653F',
  orbitalNeg: '#17938A',
  electron: '#2F6FEB',
  accent: '#2563EB',
  fg: '#1F2023',
  fgMuted: '#5C5B56',
  fgSubtle: '#8C8A82',
  surface: '#FFFFFF',
}

/** Reads the stage colours from a style declaration (usually getComputedStyle). */
export function stageColorsFrom(style: Pick<CSSStyleDeclaration, 'getPropertyValue'>): StageColors {
  const result = { ...STAGE_FALLBACK }
  for (const key of Object.keys(STAGE_TOKENS) as (keyof StageColors)[]) {
    const value = style.getPropertyValue(STAGE_TOKENS[key]).trim()
    if (value) result[key] = value
  }
  return result
}

export function sameStageColors(a: StageColors, b: StageColors): boolean {
  return (Object.keys(STAGE_TOKENS) as (keyof StageColors)[]).every((key) => a[key] === b[key])
}

/** Colours for the scene. Provided by Stage3D and read by every 3D child. */
export const StageColorsContext = createContext<StageColors>(STAGE_FALLBACK)

export function useStageColors(): StageColors {
  return useContext(StageColorsContext)
}
