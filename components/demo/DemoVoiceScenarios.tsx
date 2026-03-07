'use client';

import type { Lang } from '@/lib/i18n/messages';

interface Props {
  lang: Lang;
  onInject: (message: string) => void;
  onReset: () => void;
}

const scenarios = {
  tr: [
    {
      title: 'Saç Ekimi',
      icon: '💇',
      desc: 'Fiyat ve süreç merak ediyor',
      message: 'Merhaba, saç ekimi hakkında bilgi almak istiyorum. Fiyatlar nasıl?',
    },
    {
      title: 'Burun Estetiği',
      icon: '✨',
      desc: 'Ön görüşme almak istiyor',
      message: 'Burun estetiği yaptırmayı düşünüyorum. Doktorunuzla nasıl görüşebilirim?',
    },
    {
      title: 'Acil Randevu',
      icon: '⚡',
      desc: 'Hemen randevu, yüksek niyet',
      message: 'Merhaba, en kısa sürede randevu almam gerekiyor. Yarın müsait misiniz?',
    },
    {
      title: 'Fiyat Karşılaştırma',
      icon: '🔍',
      desc: 'Birkaç kliniği karşılaştırıyor',
      message: 'Diğer kliniklerle karşılaştırma yapıyorum. Fiyatlarınız ne kadar?',
    },
  ],
  en: [
    {
      title: 'Hair Transplant',
      icon: '💇',
      desc: 'Asking about pricing & process',
      message: "Hello, I'd like to know more about hair transplants. What are the prices like?",
    },
    {
      title: 'Rhinoplasty',
      icon: '✨',
      desc: 'Wants a consultation',
      message: "I'm thinking about rhinoplasty. How can I arrange to speak with your doctor?",
    },
    {
      title: 'Urgent Appointment',
      icon: '⚡',
      desc: 'High-intent, needs it now',
      message: "Hi, I need an appointment as soon as possible. Are you available tomorrow?",
    },
    {
      title: 'Price Research',
      icon: '🔍',
      desc: 'Comparing multiple clinics',
      message: "I'm comparing a few clinics. How much do your procedures cost?",
    },
  ],
};

export default function DemoVoiceScenarios({ lang, onInject, onReset }: Props) {
  const isEN = lang === 'en';
  const items = scenarios[lang];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700">
          {isEN ? 'Try a Scenario' : 'Senaryo Dene'}
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-slate-400 hover:text-slate-600 transition"
        >
          {isEN ? 'Reset chat' : 'Sohbeti sıfırla'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((s) => (
          <button
            key={s.title}
            onClick={() => onInject(s.message)}
            className="text-left rounded-xl border border-slate-200 bg-white hover:border-brand-400 hover:shadow-sm p-3 transition group"
          >
            <span className="text-xl block mb-1.5">{s.icon}</span>
            <p className="text-xs font-semibold text-slate-700 group-hover:text-brand-700">{s.title}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
