'use client';

import { useState } from 'react';
import DemoChatWidget from '@/components/demo/DemoChatWidget';
import DemoAiBrainPanel from '@/components/demo/DemoAiBrainPanel';
import DemoVoiceScenarios from '@/components/demo/DemoVoiceScenarios';
import {
  initialSessionState,
  type Stage,
  type CollectedData,
  type LeadSignals,
} from '@/lib/demo/claude-demo';
import type { Lang } from '@/lib/i18n/messages';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function DemoPage() {
  const [lang, setLang] = useState<Lang>('tr');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const [stage, setStage] = useState<Stage>('GREETING');
  const [score, setScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({});
  const [collectedData, setCollectedData] = useState<CollectedData>(initialSessionState().collectedData);
  const [leadSignals, setLeadSignals] = useState<LeadSignals>(initialSessionState().leadSignals);
  const [handoffRecommended, setHandoffRecommended] = useState(false);
  const [replyGuidance, setReplyGuidance] = useState('');

  async function handleSend(msgOverride?: string) {
    const text = (msgOverride ?? input).trim();
    if (!text || loading) return;

    const userMsg: Message = { role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/demo/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: messages,
          lang,
          sessionState: { currentStage: stage, collectedData, leadSignals, currentScore: score },
        }),
      });

      if (!res.ok) throw new Error('API error');
      const data = await res.json();

      setMessages([...updatedMessages, { role: 'assistant', content: data.reply }]);
      setStage(data.stage);
      setScore(data.score);
      setScoreBreakdown(data.scoreBreakdown || {});
      setCollectedData(data.collectedData);
      setLeadSignals(data.leadSignals);
      setHandoffRecommended(data.handoffRecommended);
      setReplyGuidance(data.replyGuidance || '');
    } catch {
      setMessages([
        ...updatedMessages,
        {
          role: 'assistant',
          content: lang === 'tr' ? 'Bir hata oluştu, tekrar deneyin.' : 'An error occurred, please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    const s = initialSessionState();
    setMessages([]);
    setInput('');
    setStage('GREETING');
    setScore(0);
    setScoreBreakdown({});
    setCollectedData(s.collectedData);
    setLeadSignals(s.leadSignals);
    setHandoffRecommended(false);
    setReplyGuidance('');
  }

  return (
    <div
      className="min-h-screen bg-demo-bg text-demo-text flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(circle, #1a2878 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Ambient glow orbs */}
      <div className="fixed top-0 left-1/4 w-96 h-96 rounded-full bg-demo-blue opacity-[0.04] blur-3xl pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-demo-cyan opacity-[0.04] blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="border-b border-demo-border bg-demo-bg/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-demo-blue flex items-center justify-center shadow-[0_0_14px_rgba(35,61,255,0.5)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-base font-bold text-demo-text tracking-tight">stoaix</span>
            <span className="hidden sm:flex items-center gap-1 text-[10px] border border-demo-border text-demo-muted rounded-full px-2.5 py-1 uppercase tracking-widest">
              <span className="w-1 h-1 rounded-full bg-demo-cyan animate-pulse_dot" />
              {lang === 'tr' ? 'Canlı Demo' : 'Live Demo'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/demo/voice"
              className="flex items-center gap-1.5 text-xs border border-demo-border rounded-lg px-2.5 py-1.5 text-demo-muted hover:text-demo-cyan hover:border-demo-cyan transition font-medium"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                />
              </svg>
              {lang === 'tr' ? 'Sesli Demo' : 'Voice Demo'}
            </a>
            <button
              onClick={() => setLang(l => l === 'tr' ? 'en' : 'tr')}
              className="text-xs border border-demo-border rounded-lg px-2.5 py-1.5 text-demo-muted hover:text-demo-text hover:border-demo-cyan transition font-medium"
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-6xl mx-auto w-full px-4 pt-10 pb-6 text-center">
        <div className="inline-flex items-center gap-2 border border-demo-border rounded-full px-3 py-1.5 mb-5 bg-demo-card">
          <span className="w-1.5 h-1.5 rounded-full bg-demo-cyan animate-pulse_dot" />
          <span className="text-[10px] text-demo-muted uppercase tracking-widest">
            {lang === 'tr' ? 'Gerçek klinik verisiyle çalışıyor' : 'Powered by real clinic data'}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-demo-text mb-3 leading-tight">
          {lang === 'tr' ? (
            <>AI Asistan <span className="text-demo-cyan">canlı</span> görüyor.</>
          ) : (
            <>AI Assistant sees you <span className="text-demo-cyan">live.</span></>
          )}
        </h1>
        <p className="text-sm text-demo-muted max-w-lg mx-auto">
          {lang === 'tr'
            ? 'Hasta mesaj gönderirken yapay zeka aynı anda niyeti, aciliyeti ve lead skorunu hesaplıyor.'
            : 'As the patient types, the AI simultaneously calculates intent, urgency, and lead score.'}
        </p>

        {/* Stats row */}
        <div className="flex justify-center gap-8 mt-8">
          {[
            { value: '7',    label: lang === 'tr' ? 'Konuşma Aşaması'   : 'Conv. Stages'    },
            { value: '100',  label: lang === 'tr' ? 'Puan Skalası'       : 'Score Scale'     },
            { value: '< 2s', label: lang === 'tr' ? 'Analiz Süresi'      : 'Analysis Time'   },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-xl font-bold text-demo-cyan">{value}</p>
              <p className="text-[10px] text-demo-muted uppercase tracking-wide mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 pb-6 flex flex-col gap-4">
        {/* Two columns */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chat */}
          <div
            className="flex-1 lg:max-w-[60%] rounded-2xl border border-demo-border overflow-hidden"
            style={{
              minHeight: '500px',
              boxShadow: '0 0 40px rgba(35,61,255,0.08)',
            }}
          >
            <DemoChatWidget
              messages={messages}
              input={input}
              loading={loading}
              lang={lang}
              onInputChange={setInput}
              onSend={() => handleSend()}
            />
          </div>

          {/* Brain panel */}
          <div
            className="lg:w-[38%] rounded-2xl border border-demo-border bg-demo-card/50 p-4 overflow-y-auto"
            style={{
              maxHeight: '620px',
              boxShadow: '0 0 40px rgba(35,61,255,0.08)',
            }}
          >
            <DemoAiBrainPanel
              stage={stage}
              score={score}
              scoreBreakdown={scoreBreakdown}
              collectedData={collectedData}
              leadSignals={leadSignals}
              handoffRecommended={handoffRecommended}
              replyGuidance={replyGuidance}
              lang={lang}
            />
          </div>
        </div>

        {/* Scenarios */}
        <div
          className="rounded-2xl border border-demo-border bg-demo-card/50 p-5"
          style={{ boxShadow: '0 0 40px rgba(35,61,255,0.08)' }}
        >
          <DemoVoiceScenarios
            lang={lang}
            onInject={(msg) => setInput(msg)}
            onReset={handleReset}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-demo-border py-5 text-center">
        <p className="text-[11px] text-demo-muted">
          {lang === 'tr'
            ? 'stoaix — AI destekli klinik satış asistanı · panel.stoaix.com'
            : 'stoaix — AI-powered clinic sales assistant · panel.stoaix.com'}
        </p>
      </footer>
    </div>
  );
}
