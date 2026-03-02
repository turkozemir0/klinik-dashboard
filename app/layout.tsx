import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Klinik Panel',
  description: 'AI Asistan Performans & Lead Takip Paneli',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
