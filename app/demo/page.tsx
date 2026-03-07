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

  // Brain state
  const [stage, setStage] = useState<Stage>('GREETING');
  const [score, setScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<Record<string, number>>({});
  const [collectedData, setCollectedData] = useState<CollectedData>(
    initialSessionState().collectedData,
  );
  const [leadSignals, setLeadSignals] = useState<LeadSignals>(
    initialSessionState().leadSignals,
  );
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
          sessionState: {
            currentStage: stage,
            collectedData,
            leadSignals,
            currentScore: score,
          },
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
          content:
            lang === 'tr'
              ? 'Bir hata oluştu, lütfen tekrar deneyin.'
              : 'An error occurred, please try again.',
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-brand-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-brand-700">stoaix</span>
            <span className="text-xs bg-brand-100 text-brand-700 rounded-full px-2 py-0.5 font-medium">
              Demo
            </span>
          </div>
          <button
            onClick={() => setLang((l) => (l === 'tr' ? 'en' : 'tr'))}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 hover:bg-slate-50 transition font-medium"
          >
            {lang === 'tr' ? 'EN' : 'TR'}
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 flex flex-col gap-4">
        {/* Intro */}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-800">
            {lang === 'tr' ? 'AI Asistan Demo' : 'AI Assistant Demo'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {lang === 'tr'
              ? 'Gerçek klinik AI asistanıyla konuşun — sağ panelde canlı analiz görün.'
              : 'Chat with a real clinic AI — watch live analysis on the right.'}
          </p>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Chat */}
          <div
            className="flex-1 lg:max-w-[60%] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
            style={{ minHeight: '480px' }}
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
            className="lg:w-[38%] bg-slate-50 rounded-2xl border border-slate-100 p-4 overflow-y-auto"
            style={{ maxHeight: '600px' }}
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
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <DemoVoiceScenarios
            lang={lang}
            onInject={(msg) => setInput(msg)}
            onReset={handleReset}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-4 text-center">
        <p className="text-xs text-slate-400">
          {lang === 'tr'
            ? 'Bu demo, stoaix AI asistanının gerçek bir kliniğe nasıl entegre edildiğini göstermektedir.'
            : 'This demo shows how stoaix AI assistant integrates into a real clinic workflow.'}
        </p>
      </footer>
    </div>
  );
}
