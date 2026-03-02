'use client';

import { useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

/**
 * Supabase real-time subscription — tablo değişince sayfayı yeniler.
 * Server Component sayfalarıyla çalışır (router.refresh()).
 */
export function useRealtimeRefresh(
  tables: string[],
  clinicId: string,
  enabled = true
) {
  const router = useRouter();
  const supabase = createClient();

  const refresh = useCallback(() => {
    router.refresh();
  }, [router]);

  useEffect(() => {
    if (!enabled || !clinicId) return;

    const channels = tables.map((table) => {
      const channel = supabase
        .channel(`realtime-${table}-${clinicId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table,
            filter: `clinic_id=eq.${clinicId}`,
          },
          () => {
            refresh();
          }
        )
        .subscribe();

      return channel;
    });

    return () => {
      channels.forEach((ch) => supabase.removeChannel(ch));
    };
  }, [tables.join(','), clinicId, enabled, refresh]);
}
