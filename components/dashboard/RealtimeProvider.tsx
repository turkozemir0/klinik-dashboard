'use client';

import { useRealtimeRefresh } from '@/lib/hooks/useRealtimeRefresh';

const REALTIME_TABLES = ['conversations', 'handoff_logs', 'daily_stats', 'messages'];

interface RealtimeProviderProps {
  clinicId: string;
}

/**
 * Bu component sadece real-time subscription'ı açar.
 * Herhangi bir UI render etmez — layout içine koyulur.
 * Tablo değişince Next.js router.refresh() çağırır,
 * Server Component verileri otomatik yenilenir.
 */
export default function RealtimeProvider({ clinicId }: RealtimeProviderProps) {
  useRealtimeRefresh(REALTIME_TABLES, clinicId, true);
  return null;
}
