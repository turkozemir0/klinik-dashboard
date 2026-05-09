import type { Metadata } from 'next'
import { Inter, Manrope } from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'stoaix Dashboard',
  description: 'stoaix AI Platform Dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = cookies().get('lang')?.value === 'en' ? 'en' : 'tr'
  return (
    <html lang={lang} className={`${inter.variable} ${manrope.variable}`}>
      <body className="min-h-screen font-sans text-slate-900">{children}</body>
    </html>
  )
}
