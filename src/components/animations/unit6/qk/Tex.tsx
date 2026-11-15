'use client'

import { useMemo } from 'react'
import katex from 'katex'
import 'katex/contrib/mhchem'

/** A TeX or mhchem string rendered by KaTeX. Errors show the source in red rather than throwing. */
export function Tex({ tex, display = false, className }: { tex: string; display?: boolean; className?: string }) {
  const html = useMemo(() => katex.renderToString(tex, { throwOnError: false, displayMode: display }), [tex, display])
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
