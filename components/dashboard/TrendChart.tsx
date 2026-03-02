'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import type { DailyStat } from '@/types';

interface TrendChartProps {
  stats: DailyStat[];
}

export default function TrendChart({ stats }: TrendChartProps) {
  const data = [...stats]
    .reverse()
    .map((s) => ({
      date: format(parseISO(s.date), 'd MMM', { locale: tr }),
      'Yeni Konuşma': s.new_conversations,
      'Hot Lead': s.hot_leads,
      'Handoff': s.handed_off_leads,
    }));

  if (data.length === 0) {
    return (
      <div className="h-56 flex items-center justify-center text-slate-400 text-sm">
        Henüz yeterli veri yok
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradHot" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradHandoff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
            fontSize: 12,
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 16 }}
          iconType="circle"
          iconSize={8}
        />
        <Area type="monotone" dataKey="Yeni Konuşma" stroke="#0ea5e9" strokeWidth={2} fill="url(#gradConv)" dot={false} />
        <Area type="monotone" dataKey="Hot Lead" stroke="#ef4444" strokeWidth={2} fill="url(#gradHot)" dot={false} />
        <Area type="monotone" dataKey="Handoff" stroke="#8b5cf6" strokeWidth={2} fill="url(#gradHandoff)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
