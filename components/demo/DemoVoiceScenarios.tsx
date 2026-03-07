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
      icon: '💇',
      title: 'Saç Ekimi',
      desc: 'Fiyat ve süreç merak ediyor',
      message: 'Merhaba, saç ekimi hakkında bilgi almak istiyorum. Fiyatlar nasıl?',
    },
    {
      icon: '✨',
      title: 'Burun Estetiği',
      desc: 'Ön görüşme almak istiyor',
      message: 'Burun estetiği yaptırmayı düşünüyorum. Doktorunuzla nasıl görüşebilirim?',
    },
    {
      icon: '⚡',
      title: 'Acil Randevu',
      desc: 'Hemen randevu, yüksek niyet',
      message: 'Merhaba, en kısa sürede randevu almam gerekiyor. Yarın müsait misiniz?',
    },
    {
      icon: '🔍',
      title: 'Fiyat Karşılaştırma',
      desc: 'Birkaç kliniği karşılaştırıyor',
      message: 'Diğer kliniklerle karşılaştırma yapıyorum. Fiyatlarınız ne kadar?',
    },
  ],
  en: [
    {
      icon: '💇',
      title: 'Hair Transplant',
      desc: 'Asking about price & process',
      message: "Hello, I'd like to know more about hair transplants. What are the prices?",
    },
    {
      icon: '✨',
      title: 'Rhinoplasty',
      desc: 'Wants a consultation',
      message: "I'm thinking about rhinoplasty. How can I speak with your doctor?",
    },
    {
      icon: '⚡',
      title: 'Urgent Appointment',
      desc: 'High-intent, needs it now',
      message: "Hi, I need an appointment as soon as possible. Are you free tomorrow?",
    },
    {
      icon: '🔍',
      title: 'Price Research',
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[10px] text-demo-muted uppercase tracking-widest mb-0.5">
            {isEN ? 'Simulate a patient' : 'Hasta simüle et'}
          </p>
          <h3 className="text-sm font-bold text-demo-text">
            {isEN ? 'Try a Scenario' : 'Senaryo Dene'}
          </h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-demo-muted hover:text-demo-text border border-demo-border rounded-lg px-3 py-1.5 transition"
        >
          {isEN ? 'Reset' : 'Sıfırla'}
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {items.map((s) => (
          <button
            key={s.title}
            onClick={() => onInject(s.message)}
            className="group text-left rounded-xl border border-demo-border bg-demo-card hover:border-demo-cyan p-3.5 transition-all duration-200"
            style={{ transition: 'border-color 0.2s, box-shadow 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 16px rgba(66,194,213,0.15)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
          >
            <span className="text-2xl block mb-2">{s.icon}</span>
            <p className="text-xs font-bold text-demo-text group-hover:text-demo-cyan transition-colors">
              {s.title}
            </p>
            <p className="text-[10px] text-demo-muted mt-1 leading-snug">{s.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
