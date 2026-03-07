'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/demo/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        router.push('/demo');
      } else {
        const data = await res.json();
        setError(data.error || 'Giriş başarısız.');
      }
    } catch {
      setError('Bir hata oluştu, tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-demo-bg"
      style={{
        backgroundImage: 'radial-gradient(circle, #1a2878 1px, transparent 1px)',
        backgroundSize: '28px 28px',
      }}
    >
      {/* Ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-demo-blue opacity-5 blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-demo-blue flex items-center justify-center shadow-[0_0_20px_rgba(35,61,255,0.5)]">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-demo-text tracking-tight">stoaix</span>
          </div>
          <p className="text-xs text-demo-muted uppercase tracking-widest">Demo Erişimi</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-demo-border bg-demo-card p-8 shadow-[0_0_40px_rgba(35,61,255,0.1)]">
          <h1 className="text-base font-semibold text-demo-text mb-6">Giriş Yap</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-demo-muted mb-1.5 uppercase tracking-wide">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                placeholder="ornek@email.com"
                className="w-full rounded-xl border border-demo-border bg-demo-bg px-3.5 py-2.5 text-sm text-demo-text placeholder-demo-muted focus:outline-none focus:border-demo-cyan focus:ring-1 focus:ring-demo-cyan transition disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-demo-muted mb-1.5 uppercase tracking-wide">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder="••••••••"
                className="w-full rounded-xl border border-demo-border bg-demo-bg px-3.5 py-2.5 text-sm text-demo-text placeholder-demo-muted focus:outline-none focus:border-demo-cyan focus:ring-1 focus:ring-demo-cyan transition disabled:opacity-50"
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-950/50 border border-red-800 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full rounded-xl bg-demo-blue hover:opacity-90 disabled:opacity-30 text-white py-2.5 text-sm font-semibold transition shadow-[0_0_20px_rgba(35,61,255,0.4)]"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
