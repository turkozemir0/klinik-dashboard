'use client';

import { useState, useTransition } from 'react';
import { submitChangeRequest } from '@/lib/actions/kb-actions';
import { X, Send, Loader2, Plus, Trash2 } from 'lucide-react';

interface NewFaqModalProps {
  clinicId: string;
  onClose: () => void;
}

export default function NewFaqModal({ clinicId, onClose }: NewFaqModalProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [patterns, setPatterns] = useState(['', '']);
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('');

  function addPattern() {
    setPatterns((p) => [...p, '']);
  }

  function removePattern(i: number) {
    setPatterns((p) => p.filter((_, idx) => idx !== i));
  }

  function updatePattern(i: number, val: string) {
    setPatterns((p) => p.map((v, idx) => (idx === i ? val : v)));
  }

  function handleSubmit() {
    const validPatterns = patterns.filter((p) => p.trim());
    if (validPatterns.length === 0 || !answer.trim()) {
      setResult({ error: 'En az bir soru kalıbı ve cevap zorunludur' });
      return;
    }

    const newValueJson = JSON.stringify({
      question_patterns: validPatterns,
      answer: answer.trim(),
      category: category.trim() || 'genel',
    });

    const fd = new FormData();
    fd.set('table_name', 'faqs');
    fd.set('record_id', clinicId);           // Yeni kayıt → clinic_id
    fd.set('record_label', 'Yeni SSS');
    fd.set('field_name', '__new_faq__');     // Özel işaret
    fd.set('field_label', `Yeni SSS: ${validPatterns[0]}`);
    fd.set('old_value', '');
    fd.set('new_value', newValueJson);
    fd.set('change_note', `Yeni SSS ekleme talebi`);

    startTransition(async () => {
      const res = await submitChangeRequest(fd);
      setResult(res);
      if (res.success) setTimeout(onClose, 1800);
    });
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-100 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Yeni SSS Talebi</h3>
              <p className="text-xs text-slate-400">Onaylandıktan sonra sisteme eklenecek</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Soru kalıpları */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Soru Kalıpları <span className="text-red-500">*</span>
              </label>
              <button
                onClick={addPattern}
                className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Ekle
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-3">
              Hastanın bu soruyu nasıl sorabileceğine dair farklı ifadeler yazın.
            </p>
            <div className="space-y-2">
              {patterns.map((p, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={p}
                    onChange={(e) => updatePattern(i, e.target.value)}
                    placeholder={i === 0 ? "ör: fiyat nedir" : "ör: ne kadar tutar"}
                    className={inputCls}
                  />
                  {patterns.length > 1 && (
                    <button
                      onClick={() => removePattern(i)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Cevap */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Cevap <span className="text-red-500">*</span>
            </label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="AI asistanın bu soruya vereceği cevap…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Kategori
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="ör: fiyat, medikal, genel"
              className={inputCls}
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs text-amber-700">
              ⚠️ Bu talep onay sürecine gönderilecek. Yönetici onayladıktan sonra sisteme eklenecek.
            </p>
          </div>

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.success ? '✓ Talebiniz gönderildi! Onay sonrası eklenecek.' : result.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">İptal</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || patterns.filter(p => p.trim()).length === 0 || !answer.trim()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Talep Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
