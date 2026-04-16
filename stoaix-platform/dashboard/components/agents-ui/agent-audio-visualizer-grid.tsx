'use client'

import { memo, useEffect, useMemo, useState } from 'react'
import { useMultibandTrackVolume } from '@livekit/components-react'
import type { TrackReference } from '@livekit/components-react'

// ─── Types ────────────────────────────────────────────────────────────────────

export type GridVisualState =
  | 'idle'
  | 'initializing'
  | 'listening'
  | 'thinking'
  | 'speaking'

interface AgentAudioVisualizerGridProps {
  state: GridVisualState
  audioTrack?: TrackReference
  size?: 'sm' | 'md' | 'lg'
  rowCount?: number
  columnCount?: number
  color?: string
}

// ─── Size Config ──────────────────────────────────────────────────────────────

const SIZE_CONFIG = {
  sm: { cell: 14, gap: 3 },
  md: { cell: 20, gap: 4 },
  lg: { cell: 26, gap: 5 },
}

// ─── Animation Interval ───────────────────────────────────────────────────────

const STATE_INTERVAL: Record<GridVisualState, number> = {
  idle:         400,
  initializing: 280,
  listening:    180,
  thinking:     65,
  speaking:     100, // unused — audio-reactive
}

// ─── Spiral order from center (Manhattan distance) ────────────────────────────

function buildSpiral(rows: number, cols: number): [number, number][] {
  const result: [number, number][] = []
  const maxDist = rows + cols
  const cr = Math.floor(rows / 2)
  const cc = Math.floor(cols / 2)
  for (let d = 0; d <= maxDist; d++) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (Math.abs(r - cr) + Math.abs(c - cc) === d) {
          result.push([r, c])
        }
      }
    }
  }
  return result
}

// ─── Grid Cell ────────────────────────────────────────────────────────────────

const GridCell = memo(function GridCell({
  active,
  color,
}: {
  active: boolean
  color: string
}) {
  return (
    <div
      style={{
        backgroundColor: active ? color : `${color}28`,
        transform: active ? 'scale(1.05)' : 'scale(0.72)',
        borderRadius: 4,
        transition: 'background-color 110ms ease, transform 110ms ease',
        willChange: 'transform, background-color',
      }}
    />
  )
})

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentAudioVisualizerGrid({
  state,
  audioTrack,
  size = 'md',
  rowCount = 5,
  columnCount = 5,
  color = '#6366f1',
}: AgentAudioVisualizerGridProps) {
  const cfg = SIZE_CONFIG[size]

  // Always call — pass undefined when not speaking to avoid issues
  const bands = useMultibandTrackVolume(
    state === 'speaking' ? audioTrack : undefined,
    { bands: rowCount, loPass: 80, hiPass: 600 },
  )

  const spiral = useMemo(
    () => buildSpiral(rowCount, columnCount),
    [rowCount, columnCount],
  )

  const [activeCoord, setActiveCoord] = useState<[number, number]>([
    Math.floor(rowCount / 2),
    Math.floor(columnCount / 2),
  ])

  // Animate for non-speaking states
  useEffect(() => {
    if (state === 'speaking') return

    const interval = STATE_INTERVAL[state]
    let idx = 0
    const id = setInterval(() => {
      setActiveCoord(spiral[idx % spiral.length])
      idx++
    }, interval)
    return () => clearInterval(id)
  }, [state, spiral])

  const grid = useMemo(() => {
    return Array.from({ length: rowCount }, (_, r) =>
      Array.from({ length: columnCount }, (_, c) => {
        if (state === 'speaking') {
          // Each row activates based on its frequency band volume
          const vol = bands[r] ?? 0
          return vol > 0.06
        }
        // Proximity-based: active cell + its direct neighbors
        const dist =
          Math.abs(r - activeCoord[0]) + Math.abs(c - activeCoord[1])
        return dist <= 1
      }),
    )
  }, [state, bands, activeCoord, rowCount, columnCount])

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnCount}, ${cfg.cell}px)`,
        gridTemplateRows: `repeat(${rowCount}, ${cfg.cell}px)`,
        gap: `${cfg.gap}px`,
      }}
    >
      {grid.flat().map((active, i) => (
        <GridCell key={i} active={active} color={color} />
      ))}
    </div>
  )
}
