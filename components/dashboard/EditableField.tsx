'use client';

import { useState } from 'react';
import ChangeRequestModal from './ChangeRequestModal';
import { Edit2, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { KbChangeRequest } from '@/types';

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
            {value || <span className="text-slate-300 italic">Boş</span>}
          </p>

          {/* Bekleyen istek varsa göster */}
          {pendingRequest && (
            <div className={`mt-2 inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg ${
              hasPending  ? 'bg-amber-50 text-amber-700' :
              isApproved  ? 'bg-emerald-50 text-emerald-700' :
              'bg-red-50 text-red-700'
            }`}>
              {hasPending  && <Clock className="w-3 h-3" />}
              {isApproved  && <CheckCircle className="w-3 h-3" />}
              {isRejected  && <XCircle className="w-3 h-3" />}
              {hasPending  && `Onay bekliyor → "${pendingRequest.new_value?.substring(0, 40)}${(pendingRequest.new_value?.length ?? 0) > 40 ? '…' : ''}"`}
              {isApproved  && 'Değişiklik onaylandı'}
              {isRejected  && `Reddedildi${pendingRequest.rejection_note ? `: ${pendingRequest.rejection_note}` : ''}`}
            </div>
          )}
        </div>

        {/* Düzenleme butonu */}
        {!hasPending && (
          <button
            onClick={() => setShowModal(true)}
            className="opacity-0 group-hover:opacity-100 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
          >
            <Edit2 className="w-3 h-3" />
            Öner
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
