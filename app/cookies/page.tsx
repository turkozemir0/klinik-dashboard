import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | stoaix',
  description: 'stoaix Cookie Policy',
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Cookie Policy</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">What Are Cookies?</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience. We use cookies in accordance with the UK GDPR and the Privacy and Electronic Communications Regulations (PECR).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Cookies We Use</h2>

          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Essential Cookies</h3>
              <p className="text-xs text-slate-500 mb-3">These cookies are necessary for the website to function. They cannot be disabled.</p>
              <table className="w-full text-xs text-slate-600">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-2 font-semibold">Name</th>
                    <th className="pb-2 font-semibold">Purpose</th>
                    <th className="pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody className="space-y-1">
                  <tr>
                    <td className="py-1 font-mono">sb-*</td>
                    <td className="py-1">Supabase authentication session</td>
                    <td className="py-1">Session / 7 days</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-mono">app_lang</td>
                    <td className="py-1">Your language preference (TR/EN)</td>
                    <td className="py-1">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-slate-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-slate-700 mb-1">Preference Cookies</h3>
              <p className="text-xs text-slate-500 mb-3">These cookies remember your preferences to personalise your experience.</p>
              <table className="w-full text-xs text-slate-600">
                <thead>
                  <tr className="text-left text-slate-400">
                    <th className="pb-2 font-semibold">Name</th>
                    <th className="pb-2 font-semibold">Purpose</th>
                    <th className="pb-2 font-semibold">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 font-mono">cookie_consent</td>
                    <td className="py-1">Records your cookie consent decision</td>
                    <td className="py-1">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Managing Cookies</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            You can control and delete cookies through your browser settings. Most browsers allow you to:
          </p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li>View what cookies are stored and delete them individually</li>
            <li>Block third-party cookies</li>
            <li>Block all cookies from specific sites</li>
            <li>Block all cookies from all sites</li>
            <li>Delete all cookies when you close your browser</li>
          </ul>
          <p className="text-slate-600 text-sm leading-relaxed mt-2">
            Please note that blocking essential cookies will affect the functionality of the stoaix platform, including your ability to log in.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Third-Party Services</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We use Supabase for authentication and database services. Supabase may set its own cookies as part of the authentication process. These are governed by <a href="https://supabase.com/privacy" className="text-brand-600 hover:underline" target="_blank" rel="noopener noreferrer">Supabase's Privacy Policy</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            If you have questions about our use of cookies, contact us at <strong>privacy@stoaix.com</strong>.
          </p>
        </section>

        <div className="pt-4 border-t border-slate-100 flex gap-6 text-sm">
          <Link href="/privacy-policy" className="text-brand-600 hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
          <Link href="/login" className="text-slate-400 hover:text-slate-600">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
