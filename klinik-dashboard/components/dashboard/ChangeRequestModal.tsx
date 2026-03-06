'use client';

import { useState, useTransition } from 'react';
import { submitChangeRequest } from '@/lib/actions/kb-actions';
import { X, Send, Loader2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface ChangeRequestModalProps {
  tableName: 'clinics' | 'services' | 'faqs';
  recordId: string;
  recordLabel: string;
  fieldName: string;
  fieldLabel: string;
  oldValue: string;
  onClose: () => void;
}

export default function ChangeRequestModal({
  tableName,
  recordId,
  recordLabel,
  fieldName,
  fieldLabel,
  oldValue,
  onClose,
}: ChangeRequestModalProps) {
  const [newValue, setNewValue] = useState(oldValue);
  const [changeNote, setChangeNote] = useState('');
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useTranslation();

  const isTextarea = oldValue.length > 80 || fieldName.includes('description') || fieldName.includes('answer');

  function handleSubmit() {
    if (newValue === oldValue) {
      setResult({ error: t.changeRequestModal.noChange });
      return;
    }

    const fd = new FormData();
    fd.set('table_name', tableName);
    fd.set('record_id', recordId);
    fd.set('record_label', recordLabel);
    fd.set('field_name', fieldName);
    fd.set('field_label', fieldLabel);
    fd.set('old_value', oldValue);
    fd.set('new_value', newValue);
    if (changeNote) fd.set('change_note', changeNote);

    startTransition(async () => {
      const res = await submitChangeRequest(fd);
      setResult(res);
      if (res.success) {
        setTimeout(onClose, 1500);
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-semibold text-slate-900">{t.changeRequestModal.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {recordLabel} → {fieldLabel}
            </p>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t.changeRequestModal.currentValue}
            </label>
            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm text-slate-600 border border-slate-200">
              {oldValue || <span className="text-slate-400 italic">{t.changeRequestModal.empty}</span>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t.changeRequestModal.newValue} <span className="text-red-500">*</span>
            </label>
            {isTextarea ? (
              <textarea
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900 resize-none"
              />
            ) : (
              <input
                type="text"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {t.changeRequestModal.changeReason}
            </label>
            <input
              type="text"
              value={changeNote}
              onChange={(e) => setChangeNote(e.target.value)}
              placeholder={t.changeRequestModal.changeReasonPlaceholder}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm"
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700">{t.changeRequestModal.warning}</p>
          </div>

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.success ? t.changeRequestModal.success : result.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} className="btn-ghost text-sm">
            {t.common.cancel}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !newValue || newValue === oldValue}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {t.changeRequestModal.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
