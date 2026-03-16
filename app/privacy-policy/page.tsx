import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | stoaix',
  description: 'stoaix Privacy Policy and data handling information',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">1. Data Controller</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            stoaix ("we", "us", "our") is the data controller for personal data processed through the stoaix clinic management platform. We are committed to protecting your personal data in accordance with the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">2. What Data We Collect</h2>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li><strong>Clinic account data:</strong> Name, email address, phone number, clinic name and type, address</li>
            <li><strong>Professional data:</strong> Doctor names, credentials, years of experience, areas of expertise</li>
            <li><strong>Patient interaction data:</strong> WhatsApp/SMS conversation logs processed through our AI system (anonymised for analytics)</li>
            <li><strong>Usage data:</strong> Log data, IP addresses, browser type, pages visited</li>
            <li><strong>Cookie data:</strong> Session cookies, preference cookies (see our Cookie Policy)</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">3. Lawful Basis for Processing</h2>
          <p className="text-slate-600 text-sm leading-relaxed">We process your personal data on the following lawful bases:</p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li><strong>Contract performance:</strong> To provide you with the stoaix service</li>
            <li><strong>Legitimate interests:</strong> To improve our platform, prevent fraud, and ensure security</li>
            <li><strong>Consent:</strong> For marketing communications and non-essential cookies</li>
            <li><strong>Legal obligation:</strong> To comply with applicable laws and regulations</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">4. How We Use Your Data</h2>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li>To provide and operate the stoaix platform</li>
            <li>To train and configure AI assistant responses specific to your clinic</li>
            <li>To send service notifications and account updates</li>
            <li>To respond to support requests</li>
            <li>To improve platform features and performance</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">5. Data Sharing</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We do not sell your personal data. We share data only with trusted service providers necessary to deliver our service:
          </p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li><strong>Supabase:</strong> Database and authentication hosting</li>
            <li><strong>Anthropic:</strong> AI model processing (Claude API)</li>
            <li><strong>Vercel:</strong> Frontend hosting</li>
            <li><strong>GoHighLevel:</strong> CRM and messaging integration</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">6. Data Retention</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We retain your data for as long as your clinic account is active plus 12 months after account termination, unless a longer retention period is required by law. Conversation logs are retained for 24 months for analytics purposes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">7. Your Rights</h2>
          <p className="text-slate-600 text-sm leading-relaxed">Under UK GDPR, you have the right to:</p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li><strong>Access</strong> your personal data</li>
            <li><strong>Rectify</strong> inaccurate data</li>
            <li><strong>Erase</strong> your data ("right to be forgotten")</li>
            <li><strong>Restrict</strong> processing of your data</li>
            <li><strong>Data portability</strong> — receive your data in a machine-readable format</li>
            <li><strong>Object</strong> to processing based on legitimate interests</li>
            <li><strong>Withdraw consent</strong> at any time (where processing is based on consent)</li>
          </ul>
          <p className="text-slate-600 text-sm leading-relaxed mt-2">
            To exercise your rights, contact us at <strong>privacy@stoaix.com</strong>. You also have the right to lodge a complaint with the Information Commissioner's Office (ICO) at ico.org.uk.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">8. Security</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            We implement appropriate technical and organisational measures to protect your personal data, including encryption in transit (TLS) and at rest, access controls, and regular security reviews.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">9. Contact Us</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            For privacy-related queries, contact: <strong>privacy@stoaix.com</strong>
          </p>
        </section>

        <div className="pt-4 border-t border-slate-100 flex gap-6 text-sm">
          <Link href="/terms" className="text-brand-600 hover:underline">Terms of Service</Link>
          <Link href="/cookies" className="text-brand-600 hover:underline">Cookie Policy</Link>
          <Link href="/login" className="text-slate-400 hover:text-slate-600">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
