'use client';

import { useState, useTransition } from 'react';
import { submitSupportTicket } from '@/lib/actions/ticket-actions';
import { X, Send, Loader2, LifeBuoy, AlertTriangle, Lightbulb, Wrench } from 'lucide-react';

interface SupportTicketModalProps {
  onClose: () => void;
}

const categories = [
  {
    key: 'general',
    label: 'Genel Soru / Öneri',
    icon: Lightbulb,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
    activeColor: 'bg-blue-600 text-white border-blue-600',
  },
  {
    key: 'technical',
    label: 'Teknik Sorun',
    icon: Wrench,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    activeColor: 'bg-orange-600 text-white border-orange-600',
  },
  {
    key: 'kb_urgent',
    label: 'KB Güncelleme (Acil)',
    icon: AlertTriangle,
    color: 'text-red-600 bg-red-50 border-red-200',
    activeColor: 'bg-red-600 text-white border-red-600',
  },
] as const;

export default function SupportTicketModal({ onClose }: SupportTicketModalProps) {
  const [category, setCategory] = useState<'general' | 'technical' | 'kb_urgent'>('general');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit() {
    if (!subject.trim() || !description.trim()) {
      setResult({ error: 'Konu ve açıklama zorunludur' });
      return;
    }
    const fd = new FormData();
    fd.set('category', category);
    fd.set('subject', subject.trim());
    fd.set('description', description.trim());

    startTransition(async () => {
      const res = await submitSupportTicket(fd);
      setResult(res);
      if (res.success) setTimeout(onClose, 1800);
    });
  }

  const inputCls = "w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm text-slate-900";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center">
              <LifeBuoy className="w-4 h-4 text-brand-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Destek Talebi</h3>
              <p className="text-xs text-slate-400">Size en kısa sürede dönüş yapacağız</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {/* Kategori seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Kategori <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = category === cat.key;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setCategory(cat.key)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all ${
                      isActive ? cat.activeColor : cat.color + ' hover:opacity-80'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-center leading-tight">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Konu */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Konu <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={
                category === 'technical' ? 'ör: Dashboard açılmıyor' :
                category === 'kb_urgent' ? 'ör: Fiyat bilgisi acil güncellenmeli' :
                'ör: Yeni özellik önerisi'
              }
              className={inputCls}
            />
          </div>

          {/* Açıklama */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Açıklama <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Sorununuzu veya önerinizi detaylı açıklayın…"
              className={`${inputCls} resize-none`}
            />
          </div>

          {category === 'kb_urgent' && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-xs text-red-700 font-medium">
                🚨 Acil KB güncelleme talepleri öncelikli işleme alınır.
              </p>
            </div>
          )}

          {result && (
            <div className={`rounded-xl px-4 py-3 text-sm ${
              result.success
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {result.success ? '✓ Talebiniz alındı! En kısa sürede dönüş yapılacak.' : result.error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
          <button onClick={onClose} className="btn-ghost text-sm">İptal</button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !subject.trim() || !description.trim()}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
