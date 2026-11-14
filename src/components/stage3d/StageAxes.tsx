'use client'

import { useEffect, useMemo, useState } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { Line } from '@react-three/drei'
import { useStageColors } from './stage-colors'

export interface StageAxesProps {
  /** Length of each axis in scene units. */
  length?: number
  /** Show the x, y and z letters at the tips of the axes. */
  labels?: boolean
}

const AXES = [
  { name: 'x', direction: [1, 0, 0] as const, rotation: [0, 0, -Math.PI / 2] as const },
  { name: 'y', direction: [0, 1, 0] as const, rotation: [0, 0, 0] as const },
  { name: 'z', direction: [0, 0, 1] as const, rotation: [Math.PI / 2, 0, 0] as const },
]

const LABEL_CANVAS = { width: 128, height: 64, fontPx: 46 }
/** Scene width of a label sprite. Its height follows the canvas aspect ratio. */
const LABEL_WIDTH = 0.44

/**
 * Draws a letter onto a canvas texture. The canvas is used instead of HTML so that
 * the label moves with the scene and needs no separate DOM. It is redrawn when the
 * theme colour or the UI font changes.
 */
function drawLabelTexture(text: string, color: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = LABEL_CANVAS.width
  canvas.height = LABEL_CANVAS.height
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const family =
      getComputedStyle(document.documentElement).getPropertyValue('--font-sans').trim() ||
      'sans-serif'
    ctx.font = `600 ${LABEL_CANVAS.fontPx}px ${family}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = color
    ctx.fillText(text, LABEL_CANVAS.width / 2, LABEL_CANVAS.height / 2 + 2)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

function AxisLetter({ text, color, position }: { text: string; color: string; position: [number, number, number] }) {
  // Fonts can finish loading after the first draw, so redraw once they are ready.
  const [fontRevision, setFontRevision] = useState(0)
  useEffect(() => {
    let alive = true
    void document.fonts?.ready.then(() => {
      if (alive) setFontRevision((r) => r + 1)
    })
    return () => {
      alive = false
    }
  }, [])

  const texture = useMemo(
    () => drawLabelTexture(text, color),
    // fontRevision is a deliberate trigger: the font can change after mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [text, color, fontRevision]
  )
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <sprite position={position} scale={[LABEL_WIDTH, (LABEL_WIDTH * LABEL_CANVAS.height) / LABEL_CANVAS.width, 1]}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  )
}

/**
 * Subtle x, y and z axes through the origin, with a small arrow head and a letter
 * at each tip. Put it inside a Stage3D.
 */
export function StageAxes({ length = 1.75, labels = true }: StageAxesProps) {
  const colors = useStageColors()
  const tip = 0.06

  return (
    <group>
      {AXES.map((axis) => {
        const end = axis.direction.map((c) => c * length) as [number, number, number]
        const letterAt = axis.direction.map((c) => c * (length + 0.26)) as [number, number, number]
        const headAt = axis.direction.map((c) => c * (length + tip * 0.6)) as [number, number, number]
        return (
          <group key={axis.name}>
            <Line points={[[0, 0, 0], end]} color={colors.fgSubtle} lineWidth={1} transparent opacity={0.7} />
            <mesh position={headAt} rotation={axis.rotation}>
              <coneGeometry args={[tip, tip * 2.4, 14]} />
              <meshBasicMaterial color={colors.fgSubtle} transparent opacity={0.8} />
            </mesh>
            {labels && <AxisLetter text={axis.name} color={colors.fgMuted} position={letterAt} />}
          </group>
        )
      })}
    </group>
  )
}
