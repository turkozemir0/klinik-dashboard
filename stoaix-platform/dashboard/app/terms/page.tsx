export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: April 2026</p>

      <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">1. Acceptance of Terms</h2>
          <p className="text-slate-600">
            By accessing or using stoaix ("the Service") at platform.stoaix.com, you agree to be bound by
            these Terms of Service. If you do not agree, please do not use the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">2. Description of Service</h2>
          <p className="text-slate-600">
            stoaix is an AI assistant platform for businesses. It enables organizations to manage AI-powered
            conversations, appointments, leads, and knowledge bases through a unified dashboard.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">3. User Accounts</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>Access to the platform is by invitation only</li>
            <li>You are responsible for maintaining the confidentiality of your account credentials</li>
            <li>You agree to notify us immediately of any unauthorized use of your account</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">4. Google Calendar Integration</h2>
          <p className="text-slate-600">
            By connecting your Google Calendar, you authorize stoaix to read and create calendar events
            on your behalf. You may revoke this authorization at any time from your Google Account settings.
            stoaix's use of Google Calendar data is limited to providing the appointment scheduling feature
            and complies with <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">5. Subscription, Billing & Free Trial</h2>
          <ul className="list-disc pl-5 space-y-1 text-slate-600">
            <li>stoaix offers a 7-day free trial period for new subscriptions. A valid credit or debit card is required to start the trial.</li>
            <li>At the end of the 7-day trial period, your subscription will automatically convert to a paid plan and the applicable fee will be charged to the payment method on file, unless you cancel before the trial ends.</li>
            <li>Subscription fees are non-refundable. Once a payment is processed, no refunds will be issued for that billing period.</li>
            <li>You may cancel your subscription at any time before the trial period ends to avoid being charged. Cancellation takes effect at the end of the current billing cycle.</li>
            <li>stoaix reserves the right to modify subscription pricing with 30 days prior notice. Continued use after the effective date constitutes acceptance of the new pricing.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">6. Acceptable Use</h2>
          <p className="text-slate-600">You agree not to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1 text-slate-600">
            <li>Use the Service for any unlawful purpose</li>
            <li>Attempt to gain unauthorized access to any part of the Service</li>
            <li>Transmit any harmful, offensive, or disruptive content through the Service</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">7. Limitation of Liability</h2>
          <p className="text-slate-600">
            stoaix is provided "as is" without warranties of any kind. We are not liable for any indirect,
            incidental, or consequential damages arising from your use of the Service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">8. Changes to Terms</h2>
          <p className="text-slate-600">
            We may update these Terms at any time. Continued use of the Service after changes constitutes
            acceptance of the new Terms.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-700 mb-2">9. Contact</h2>
          <p className="text-slate-600">
            For questions about these Terms, contact us at{' '}
            <a href="mailto:turkozemir@gmail.com" className="text-blue-600 underline">turkozemir@gmail.com</a>.
          </p>
        </section>
      </div>
    </div>
  )
}
