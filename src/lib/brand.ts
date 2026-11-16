/** The two halves of the wordmark. The header sets them in two tones. */
export const BRAND_PARTS = ['NCERT', 'CHEM'] as const

/** The product name, as it appears in the header, the page titles and the footer. */
export const BRAND = BRAND_PARTS.join('')

/** The browser-tab title of an inner page, e.g. "Hydrocarbons · NCERTCHEM". */
export function pageTitle(title: string): string {
  return `${title} · ${BRAND}`
}
