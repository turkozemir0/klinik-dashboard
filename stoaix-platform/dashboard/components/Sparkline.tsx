interface Props {
  values: number[]
  color?: string
  width?: number
  height?: number
}

export default function Sparkline({ values, color = '#0ea5e9', width = 80, height = 24 }: Props) {
  if (values.length < 2) return null
  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const step = width / (values.length - 1)
  const pad = 2

  const points = values
    .map((v, i) => `${i * step},${pad + (height - 2 * pad) * (1 - (v - min) / range)}`)
    .join(' ')

  return (
    <svg width={width} height={height} className="flex-shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
