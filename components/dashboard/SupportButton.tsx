'use client';

import { useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import SupportTicketModal from './SupportTicketModal';
import Link from 'next/link';

interface SupportButtonProps {
  openTicketCount?: number;
}

export default function SupportButton({ openTicketCount = 0 }: SupportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* Taleplerim linki */}
      <Link
        href="/dashboard/support"
        className="text-xs text-slate-400 hover:text-brand-600 transition-colors"
      >
        Taleplerim
        {openTicketCount > 0 && (
          <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 bg-amber-500 text-white text-xs font-bold rounded-full">
            {openTicketCount}
          </span>
        )}
      </Link>

      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-brand-600 hover:bg-brand-50 px-3 py-2 rounded-xl transition-colors border border-slate-200 hover:border-brand-200"
      >
        <LifeBuoy className="w-4 h-4" />
        <span>Destek</span>
      </button>

      {open && <SupportTicketModal onClose={() => setOpen(false)} />}
    </div>
  );
}
