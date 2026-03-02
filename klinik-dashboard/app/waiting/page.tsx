'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Clock, LogOut } from 'lucide-react';

export default function WaitingPage() {
  const supabase = createClient();
  const [clinicName, setClinicName] = useState('');

  useEffect(() => {
    supabase.from('clinic_registrations').select('clinic_name').single()
      .then(({ data }) => { if (data) setClinicName(data.clinic_name); });
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-3">Başvurunuz İnceleniyor</h2>
        {clinicName && <p className="text-slate-500 text-sm mb-2 font-medium">{clinicName}</p>}
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Başvurunuz ekibimiz tarafından inceleniyor. Onaylandığında panel erişiminiz aktif olacak.
          Genellikle <strong>1 iş günü</strong> içinde dönüş yapılır.
        </p>
        <button
          onClick={() => supabase.auth.signOut().then(() => window.location.href = '/login')}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mx-auto transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Çıkış Yap
        </button>
      </div>
    </div>
  );
}
