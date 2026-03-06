'use client';

import { useState } from 'react';
import ChangeRequestModal from './ChangeRequestModal';
import { Edit2, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { KbChangeRequest } from '@/types';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface EditableFieldProps {
  tableName: 'clinics' | 'services' | 'faqs';
  recordId: string;
  recordLabel: string;
  fieldName: string;
  fieldLabel: string;
  value: string;
  pendingRequest?: KbChangeRequest;
}

export function EditableField({
  tableName,
  recordId,
  recordLabel,
  fieldName,
  fieldLabel,
  value,
  pendingRequest,
}: EditableFieldProps) {
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  const hasPending = pendingRequest?.status === 'pending';
  const isApproved = pendingRequest?.status === 'approved';
  const isRejected = pendingRequest?.status === 'rejected';

  return (
    <>
      <div className="group flex items-start justify-between gap-3 py-3 border-b border-slate-50 last:border-0">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
            {fieldLabel}
          </p>
          <p className="text-sm text-slate-800 whitespace-pre-wrap">
            {value || <span className="text-slate-300 italic">{t.editableField.empty}</span>}
          </p>

          {pendingRequest && (
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
              hasPending  ? 'bg-amber-50 text-amber-700' :
              isApproved  ? 'bg-emerald-50 text-emerald-700' :
              'bg-red-50 text-red-700'
            }`}>
              {hasPending  && <Clock className="w-3 h-3" />}
              {isApproved  && <CheckCircle className="w-3 h-3" />}
              {isRejected  && <XCircle className="w-3 h-3" />}
              {hasPending  && t.editableField.pendingApproval(
                `${pendingRequest.new_value?.substring(0, 40) ?? ''}${(pendingRequest.new_value?.length ?? 0) > 40 ? '…' : ''}`
              )}
              {isApproved  && t.editableField.changeApproved}
              {isRejected  && t.editableField.rejected(pendingRequest.rejection_note ?? '')}
            </div>
          )}
        </div>

        {!hasPending && (
          <button
            onClick={() => setShowModal(true)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
          >
            <Edit2 className="w-3 h-3" />
            {t.editableField.suggest}
          </button>
        )}
      </div>

      {showModal && (
        <ChangeRequestModal
          tableName={tableName}
          recordId={recordId}
          recordLabel={recordLabel}
          fieldName={fieldName}
          fieldLabel={fieldLabel}
          oldValue={value}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
