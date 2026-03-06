'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import NewServiceModal from './NewServiceModal';
import NewFaqModal from './NewFaqModal';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface KnowledgeActionsProps {
  type: 'service' | 'faq';
  clinicId: string;
  clinicName: string;
}

export default function KnowledgeActions({ type, clinicId, clinicName }: KnowledgeActionsProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-3 py-1.5 rounded-lg transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {type === 'service' ? t.knowledgeActions.suggestService : t.knowledgeActions.suggestFaq}
      </button>

      {open && type === 'service' && (
        <NewServiceModal
          clinicId={clinicId}
          clinicName={clinicName}
          onClose={() => setOpen(false)}
        />
      )}

      {open && type === 'faq' && (
        <NewFaqModal
          clinicId={clinicId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
