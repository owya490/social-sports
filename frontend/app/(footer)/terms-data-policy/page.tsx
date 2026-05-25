export default function TermsDataPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] bg-white px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Terms of Service & Data Policy</h1>
        <p className="mt-3 text-sm text-gray-600">Effective date: May 8, 2026</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1) Acceptance of Terms</h2>
          <p className="text-gray-700">By accessing or using SPORTSHUB, you agree to these Terms of Service and Data Policy. If you do not agree, you should discontinue use of the platform.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2) Use at Your Own Risk</h2>
          <p className="text-gray-700">You use this website and all related services at your own risk. To the fullest extent permitted by law, SPORTSHUB is not liable for any direct, indirect, incidental, special, consequential, or punitive damages, including loss of data, profits, business, or goodwill arising from or related to your use of the service.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3) Appropriate Use and Prohibited Conduct</h2>
          <p className="text-gray-700">You agree to use the service only for its intended purpose and in a lawful, respectful manner.</p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Do not abuse, disrupt, reverse engineer, or misuse the platform.</li>
            <li>Do not attempt unauthorized access to accounts, systems, or data.</li>
            <li>Do not upload harmful, fraudulent, or unlawful content.</li>
            <li>Do not use the service in ways it was not designed to be used.</li>
          </ul>
          <p className="text-gray-700">We may suspend or terminate access when these terms are violated or to protect users and platform security.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">4) Data We May Store</h2>
          <p className="text-gray-700">We may store information you enter into your account and related service data for functional purposes, including account management, event operations, communication, support, fraud prevention, and product reliability.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">5) Financial Data</h2>
          <p className="text-gray-700">SPORTSHUB does not store your financial payment card details. Payment processing is handled by trusted third-party payment providers.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">6) Security and Retention</h2>
          <p className="text-gray-700">We use reasonable administrative, technical, and organizational safeguards. No method of transmission or storage is completely secure, and we cannot guarantee absolute security. We retain data for as long as needed for legitimate business, legal, and operational purposes.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">7) Updates to These Terms</h2>
          <p className="text-gray-700">We may update these terms and policy from time to time. Continued use of the service after updates constitutes acceptance of the revised terms.</p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">8) Contact</h2>
          <p className="text-gray-700">For questions regarding these Terms of Service or Data Policy, please contact us through the Contact page.</p>
        </section>
      </div>
    </main>
  );
}
