'use client';

import { useState, useTransition } from 'react';
import { submitChangeRequest } from '@/lib/actions/kb-actions';
import { X, Send, Loader2, Plus } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageProvider';

interface NewServiceModalProps {
  clinicId: string;
  clinicName: string;
  onClose: () => void;
}

export default function NewServiceModal({ clinicId, clinicName, onClose }: NewServiceModalProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const { t } = useTranslation();

  const [form, setForm] = useState({
    service_key: '',
    display_name: '',
    category: '',
    description_for_ai: '',
    procedure_duration: '',
    anesthesia_type: '',
    recovery_time: '',
    final_result_time: '',
    pricing_response: '',
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    if (!form.display_name || !form.description_for_ai) {
      setResult({ error: t.newServiceModal.requiredError });
      return;
    }

    const newValueJson = JSON.stringify(form);

    const fd = new FormData();
    fd.set('table_name', 'services');
    fd.set('record_id', clinicId);
    fd.set('record_label', 'Yeni Hizmet');
    fd.set('field_name', '__new_service__');
    fd.set('field_label', `Yeni Hizmet: ${form.display_name}`);
    fd.set('old_value', '');
    fd.set('new_value', newValueJson);
    fd.set('change_note', `Yeni hizmet ekleme talebi: ${form.display_name}`);

    startTransition(async () => {
      const res = await submitChangeRequest(fd);
      setResult(res);
      if (res.success) setTimeout(onClose, 1800);
    });
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{t.newServiceModal.title}</h3>
              <p className="text-xs text-slate-400">{t.newServiceModal.subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.newServiceModal.serviceName} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => set('display_name', e.target.value)}
                placeholder={t.newServiceModal.serviceNamePlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.newServiceModal.serviceKey}
              </label>
              <input
                type="text"
                value={form.service_key}
                onChange={(e) => set('service_key', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                placeholder="ör: hair_transplant"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t.newServiceModal.category}
            </label>
            <input
              type="text"
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              placeholder="ör: saç_tedavisi"
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t.newServiceModal.aiDescription} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={form.description_for_ai}
              onChange={(e) => set('description_for_ai', e.target.value)}
              rows={4}
              placeholder={t.newServiceModal.aiDescriptionPlaceholder}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.newServiceModal.procedureDuration}
              </label>
              <input
                type="text"
                value={form.procedure_duration}
                onChange={(e) => set('procedure_duration', e.target.value)}
                placeholder={t.newServiceModal.procedureDurationPlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.newServiceModal.anesthesiaType}
              </label>
              <input
                type="text"
                value={form.anesthesia_type}
                onChange={(e) => set('anesthesia_type', e.target.value)}
                placeholder={t.newServiceModal.anesthesiaTypePlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.newServiceModal.recoveryTime}
              </label>
              <input
                type="text"
                value={form.recovery_time}
                onChange={(e) => set('recovery_time', e.target.value)}
                placeholder={t.newServiceModal.recoveryTimePlaceholder}
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                {t.newServiceModal.resultTimeline}
              </label>
              <input
                type="text"
                value={form.final_result_time}
                onChange={(e) => set('final_result_time', e.target.value)}
                placeholder={t.newServiceModal.resultTimelinePlaceholder}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              {t.newServiceModal.pricingResponse}
            </label>
            <textarea
              value={form.pricing_response}
              onChange={(e) => set('pricing_response', e.target.value)}
              rows={3}
              placeholder={t.newServiceModal.pricingResponsePlaceholder}
              className={`${inputCls} resize-none`}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700">{t.newServiceModal.warning}</p>
          </div>

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.success ? t.newServiceModal.success : result.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">{t.common.cancel}</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !form.display_name || !form.description_for_ai}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {t.newServiceModal.submit}
          </button>
        </div>
      </div>
    </div>
  );
}
