import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | stoaix',
  description: 'stoaix Terms of Service',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-16 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 p-10 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Terms of Service</h1>
          <p className="text-slate-500 text-sm mt-2">Last updated: March 2026</p>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">1. Agreement to Terms</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            By accessing or using the stoaix platform ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. These Terms constitute a legally binding agreement between you (the clinic operator) and stoaix.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">2. Description of Service</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            stoaix provides an AI-powered clinic management platform that enables clinics to configure an AI assistant for handling patient enquiries via WhatsApp/SMS, track leads, and manage patient communications. The Service integrates with third-party providers including GoHighLevel (CRM) and Claude AI (Anthropic).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">3. Account Registration</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Access to the Service is by invitation only. You must provide accurate and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">4. Acceptable Use</h2>
          <p className="text-slate-600 text-sm leading-relaxed">You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
          <ul className="list-disc list-inside text-slate-600 text-sm space-y-1.5 leading-relaxed">
            <li>Provide false or misleading medical information through the AI assistant</li>
            <li>Use the Service in violation of any applicable healthcare regulations</li>
            <li>Attempt to circumvent any security measures or access controls</li>
            <li>Use the Service to send unsolicited communications (spam)</li>
            <li>Share access credentials with unauthorised individuals</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">5. Medical Disclaimer</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            The AI assistant provided through stoaix is designed to answer general enquiries about clinic services, pricing, and booking. It is <strong>not</strong> a substitute for professional medical advice, diagnosis, or treatment. You are solely responsible for ensuring that the AI assistant's responses comply with applicable healthcare regulations (including CQC requirements in England, Healthcare Improvement Scotland, or equivalent regulatory bodies).
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">6. Intellectual Property</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            The stoaix platform, including all software, designs, and content created by stoaix, is owned by stoaix and protected by intellectual property laws. You retain ownership of clinic-specific data and content you upload to the Service. You grant stoaix a licence to process and store this content solely for the purpose of providing the Service.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">7. Data Protection</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Our collection and use of personal data is governed by our{' '}
            <Link href="/privacy-policy" className="text-brand-600 hover:underline">Privacy Policy</Link>.
            You, as the clinic operator, are a data controller for your patients' personal data. You are responsible for ensuring you have appropriate legal bases to process patient data and for obtaining necessary consents.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">8. Limitation of Liability</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            To the fullest extent permitted by law, stoaix shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability to you for any claims arising from these Terms shall not exceed the amount you paid for the Service in the 3 months preceding the claim.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">9. Termination</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            Either party may terminate this agreement with 30 days' written notice. stoaix may immediately suspend or terminate access if you breach these Terms. Upon termination, your data will be retained for 12 months before deletion, unless earlier deletion is requested.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">10. Governing Law</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-800">11. Contact</h2>
          <p className="text-slate-600 text-sm leading-relaxed">
            For questions about these Terms, contact: <strong>legal@stoaix.com</strong>
          </p>
        </section>

        <div className="pt-4 border-t border-slate-100 flex gap-6 text-sm">
          <Link href="/privacy-policy" className="text-brand-600 hover:underline">Privacy Policy</Link>
          <Link href="/cookies" className="text-brand-600 hover:underline">Cookie Policy</Link>
          <Link href="/login" className="text-slate-400 hover:text-slate-600">← Back to Login</Link>
        </div>
      </div>
    </div>
  );
}
