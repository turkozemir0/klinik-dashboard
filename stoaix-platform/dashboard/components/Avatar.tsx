const COLORS = [
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-amber-100 text-amber-700',
  'bg-emerald-100 text-emerald-700',
  'bg-rose-100 text-rose-700',
  'bg-indigo-100 text-indigo-700',
]

function hashName(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i++) {
    h = ((h << 5) - h + name.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '?').toUpperCase()
}

interface Props {
  name: string
  size?: number
  colorOverride?: string
}

export default function Avatar({ name, size = 32, colorOverride }: Props) {
  const color = colorOverride ?? COLORS[hashName(name) % COLORS.length]
  const initials = getInitials(name)
  const fontSize = size <= 24 ? 'text-[10px]' : size <= 32 ? 'text-xs' : 'text-sm'

  return (
    <div
      className={`rounded-full flex items-center justify-center font-semibold flex-shrink-0 ${color} ${fontSize}`}
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}
