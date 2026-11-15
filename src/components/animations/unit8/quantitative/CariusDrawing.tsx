import { Caption } from '@/components/organic/lab/primitives'

/** Native size of the drawing. Parents scale it with a transform. */
export const CARIUS_DRAWING_SIZE = { width: 300, height: 310 } as const

export interface CariusDrawingProps {
  /** 0 to 1: how much of the precipitate has settled in the bottom of the tube. */
  progress: number
  /** Fill colour of the precipitate, e.g. var(--agcl-white). */
  precipitateColor: string
  /** Caption under the drawing. */
  caption: string
  title?: string
}

/** The sealed tube: a hard glass tube with a rounded top. */
const TUBE_PATH = 'M130,58 Q130,40 150,40 Q170,40 170,58 V236 Q170,250 156,250 H144 Q130,250 130,236 Z'
/** The furnace box surrounds the lower part of the tube, from y 190 to y 272. */
const FURNACE = { x: 96, y: 190, width: 108, height: 82 }
/** Bore of the tube where the precipitate settles: it rises from y 240 by at most 84. */
const BORE = { x: 138, width: 24, bottom: 240, maxHeight: 84 }

/**
 * Carius' tube for a halogen, sulphur or phosphorus. The sealed tube passes through a furnace:
 * the furnace's back wall is behind the tube and a translucent front panel covers the lower
 * tube, so the tube reads as inside the furnace. The precipitate settles as `progress` rises.
 */
export function CariusDrawing({ progress, precipitateColor, caption, title }: CariusDrawingProps) {
  const p = Math.min(1, Math.max(0, progress))
  const height = BORE.maxHeight * p
  return (
    <g role="img" aria-label={title ?? 'Carius tube in a furnace'}>
      {/* Furnace back wall, drawn behind the tube */}
      <rect x={FURNACE.x} y={FURNACE.y} width={FURNACE.width} height={FURNACE.height} rx={12} fill="var(--surface-raised)" stroke="var(--glass)" strokeWidth={2} />

      <path d={TUBE_PATH} fill="var(--glass-fill)" stroke="var(--glass)" strokeWidth={3} strokeLinejoin="round" />
      <rect x={BORE.x} y={BORE.bottom - height} width={BORE.width} height={height} fill={precipitateColor} stroke="var(--glass)" strokeWidth={0.8} />

      {/* Furnace front panel: translucent, so the lower tube and precipitate show through */}
      <rect x={FURNACE.x} y={FURNACE.y} width={FURNACE.width} height={FURNACE.height} rx={12} fill="var(--glass-fill)" opacity={0.35} stroke="var(--glass)" strokeWidth={2} />
      <path d={`M${FURNACE.x + 16},${FURNACE.y + FURNACE.height - 10} H${FURNACE.x + FURNACE.width - 16}`} stroke="var(--flame)" strokeWidth={4} strokeLinecap="round" opacity={0.7} />
      <Caption x={FURNACE.x + FURNACE.width + 8} y={FURNACE.y + FURNACE.height / 2} size={14} anchor="start" fill="var(--fg-muted)">
        furnace
      </Caption>

      <Caption x={150} y={302} size={15} fill="var(--fg)">
        {caption}
      </Caption>
    </g>
  )
}
