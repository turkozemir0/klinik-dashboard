'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { DailyTrend } from '@/lib/types'

interface Props {
  data: DailyTrend[]
}

export default function TrendChart({ data }: Props) {
  const formatted = data.map(d => ({
    ...d,
    date: new Date(d.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={formatted} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
          labelStyle={{ fontWeight: 600 }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          formatter={(value) => {
            const map: Record<string, string> = {
              conversations: 'Konuşma',
              hot_leads: 'Hot Lead',
              handoffs: 'Handoff',
            }
            return map[value] || value
          }}
        />
        <Line type="monotone" dataKey="conversations" stroke="#4f70e6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="hot_leads" stroke="#ef4444" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="handoffs" stroke="#f59e0b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
