import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import './globals.css';
import CookieConsent from '@/components/CookieConsent';

export const metadata: Metadata = {
  title: 'stoaix | Clinic Panel',
  description: 'AI Assistant Performance & Lead Tracking Panel',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = cookies().get('app_lang')?.value === 'en' ? 'en' : 'tr';

  return (
    <html lang={lang}>
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}
