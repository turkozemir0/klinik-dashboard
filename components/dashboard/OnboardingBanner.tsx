'use client';

import Link from 'next/link';
import { AlertCircle, ArrowRight, X } from 'lucide-react';
import { useState } from 'react';

interface OnboardingBannerProps {
  completionPct: number;
  missingItems: string[];
}

export default function OnboardingBanner({ completionPct, missingItems }: OnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
      <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
        <AlertCircle className="w-5 h-5 text-amber-600" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
          <p className="text-sm font-semibold text-amber-900">
            Kurulum %{completionPct} tamamlandı
          </p>
          <div className="flex-1 max-w-32 h-1.5 bg-amber-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
        <p className="text-xs text-amber-700">
          Eksik: {missingItems.join(' · ')}
        </p>
      </div>

      <Link
        href="/onboarding"
        className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-2 rounded-xl transition-colors flex-shrink-0"
      >
        Kurulumu Tamamla
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>

      <button
        onClick={() => setDismissed(true)}
        className="text-amber-400 hover:text-amber-600 transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
