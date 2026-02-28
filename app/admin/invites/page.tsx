'use client';

import { useState, useTransition, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Link2, Plus, Copy, Check, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Token {
  id: string;
  token: string;
  note: string | null;
  is_used: boolean;
  expires_at: string;
  created_at: string;
  used_at: string | null;
}

export default function AdminInvitesPage() {
  const supabase = createClient();
  const [tokens, setTokens] = useState<Token[]>([]);
  const [note, setNote] = useState('');
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState<string | null>(null);
  const [baseUrl, setBaseUrl] = useState('');

  useEffect(() => {
    setBaseUrl(window.location.origin);
    loadTokens();
  }, []);

  async function loadTokens() {
    const { data } = await supabase
      .from('invite_tokens')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setTokens(data ?? []);
  }

  function createToken() {
    startTransition(async () => {
      const { data } = await supabase.rpc('create_invite_token', { p_note: note || null });
      if (data?.success) {
        setNote('');
        loadTokens();
      }
    });
  }

  function copyLink(token: string) {
    const link = `${baseUrl}/register/${token}`;
    navigator.clipboard.writeText(link);
    setCopied(token);
    setTimeout(() => setCopied(null), 2000);
  }

  const activeTokens   = tokens.filter(t => !t.is_used && new Date(t.expires_at) > new Date());
  const expiredOrUsed  = tokens.filter(t =>  t.is_used || new Date(t.expires_at) <= new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link2 className="w-6 h-6 text-brand-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Davetiye Linkleri</h1>
          <p className="text-slate-500 text-sm mt-0.5">Her link tek kullanımlık, 7 gün geçerli</p>
        </div>
      </div>

      {/* Yeni link oluştur */}
      <div className="card p-5">
        <p className="text-sm font-semibold text-slate-700 mb-3">Yeni Davetiye Oluştur</p>
        <div className="flex gap-3">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Not ekle (ör: Dr. Ayşe Kaya / İstanbul)"
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            onKeyDown={e => e.key === 'Enter' && createToken()}
          />
          <button
            onClick={createToken}
            disabled={isPending}
            className="btn-primary flex items-center gap-2 text-sm px-5"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Oluştur
          </button>
        </div>
      </div>

      {/* Aktif tokenlar */}
      {activeTokens.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Aktif Davetiyeler ({activeTokens.length})
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {activeTokens.map(tok => (
              <div key={tok.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">
                    {tok.note ?? 'Adsız davetiye'}
                  </p>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {baseUrl}/register/{tok.token}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Son kullanım: {format(parseISO(tok.expires_at), "d MMM yyyy", { locale: tr })}
                  </p>
                </div>
                <button
                  onClick={() => copyLink(tok.token)}
                  className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl transition-all ${
                    copied === tok.token
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-100 hover:bg-brand-100 text-slate-600 hover:text-brand-700'
                  }`}
                >
                  {copied === tok.token
                    ? <><Check className="w-3.5 h-3.5" /> Kopyalandı</>
                    : <><Copy className="w-3.5 h-3.5" /> Linki Kopyala</>
                  }
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kullanılmış / süresi dolmuş */}
      {expiredOrUsed.length > 0 && (
        <div className="card overflow-hidden opacity-60">
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Kullanılmış / Süresi Dolmuş ({expiredOrUsed.length})
            </p>
          </div>
          <div className="divide-y divide-slate-50">
            {expiredOrUsed.slice(0, 10).map(tok => (
              <div key={tok.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0">
                  {tok.is_used
                    ? <CheckCircle className="w-4 h-4 text-slate-400" />
                    : <XCircle className="w-4 h-4 text-slate-300" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-500 truncate">{tok.note ?? 'Adsız'}</p>
                  <p className="text-xs text-slate-400">
                    {tok.is_used
                      ? `Kullanıldı: ${tok.used_at ? format(parseISO(tok.used_at), "d MMM yyyy", { locale: tr }) : '—'}`
                      : 'Süresi doldu'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tokens.length === 0 && (
        <div className="card p-16 text-center">
          <Link2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Henüz davetiye oluşturulmadı</p>
        </div>
      )}
    </div>
  );
}
