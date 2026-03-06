'use client';

import { useState } from 'react';
import { triggerHandoff } from '@/lib/actions/handoff-actions';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface HandoffButtonProps {
  conversationId: string;
  alreadyHandedOff: boolean;
}

export default function HandoffButton({ conversationId, alreadyHandedOff }: HandoffButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(alreadyHandedOff);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  if (done) {
    return <span className="text-purple-600 font-medium text-xs">{t.handoffButton.done}</span>;
  }

  async function handleClick() {
    if (!confirm(t.handoffButton.confirm)) return;
    setLoading(true);
    setError('');
    const result = await triggerHandoff(conversationId);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setDone(true);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className="px-3 py-1.5 text-xs font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors whitespace-nowrap"
      >
        {loading ? t.handoffButton.sending : t.handoffButton.send}
      </button>
      {error && <p className="text-red-500 text-xs max-w-32">{error}</p>}
    </div>
  );
}
