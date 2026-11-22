import Link from "next/link";

export default function TermsDataPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] bg-white px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Terms of Service &amp; Data Policy
        </h1>
        <p className="mt-3 text-sm text-gray-600">Effective date: November 22, 2026</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1) Acceptance of Terms</h2>
          <p className="text-gray-700">
            By accessing or using SPORTSHUB, you agree to be bound by these Terms of Service and this Data Policy. If
            you do not agree, you must discontinue use of the platform.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">2) Use at Your Own Risk</h2>
          <p className="text-gray-700">
            You use this website and all related services at your own risk. To the fullest extent permitted by law,
            SPORTSHUB is not liable for any direct, indirect, incidental, special, consequential, or punitive damages,
            including loss of data, profits, business, or goodwill arising from or related to your use of the service.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3) Appropriate Use and Prohibited Conduct</h2>
          <p className="text-gray-700">
            You agree to use the service only for its intended purpose and in a lawful, respectful manner.
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Do not abuse, disrupt, reverse engineer, or misuse the platform.</li>
            <li>Do not attempt unauthorised access to accounts, systems, or data.</li>
            <li>Do not upload harmful, fraudulent, or unlawful content.</li>
            <li>Do not use the service in ways it was not designed to be used.</li>
          </ul>
          <p className="text-gray-700">
            We may suspend or terminate access where these terms are violated or where reasonably necessary to protect
            users and platform security.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">4) Data We Collect and Store</h2>
          <p className="text-gray-700">
            SPORTSHUB collects and stores information reasonably necessary to operate the platform, manage accounts and
            bookings, facilitate event communications, prevent fraud, and maintain service reliability. Depending on how
            you use the platform, this may include:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>
              <strong className="font-semibold text-gray-900">Account and Profile Information:</strong> Core account
              details such as your name, email address, username, and account preferences. If you choose to provide
              optional profile information (such as your contact information, location, date of birth, gender,
              biography, or profile photo), that information will be stored under your profile. Information you
              designate as public profile information may be visible to other users on the platform.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Bookings, Waitlists, and Event Forms:</strong> When you
              book an event, join a waitlist, or submit an event form, we store the details provided (such as your name,
              email address, phone number where requested, ticket and order records, and form responses or uploaded
              files). Relevant booking and form details are made accessible to the applicable event organiser to
              administer their event, and where enabled by the organiser, attendee names and ticket counts may appear on
              the event page.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Organiser and Event Content:</strong> Event listings,
              schedules, venue locations, images, custom forms, and operational settings created or uploaded by
              organisers.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Communications and Technical Data:</strong> Enquiries or
              feedback submitted through the platform, transactional notification records, browser storage required for
              sign-in sessions and performance, and usage and diagnostic data used to maintain platform stability and
              security.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">5) Authentication and Passwords</h2>
          <p className="text-gray-700">
            SPORTSHUB does not store user passwords. Account authentication and sign-in credentials are handled by
            managed authentication services on Google Cloud Platform or by supported third-party sign-in providers you
            choose to use.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">6) Financial Information and Payment Providers</h2>
          <p className="text-gray-700">
            SPORTSHUB does not collect or store financial information for either organisers or attendees:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>
              <strong className="font-semibold text-gray-900">Attendees:</strong> SPORTSHUB does not collect or store
              payment card numbers, bank account details, or payment credentials.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Organisers:</strong> SPORTSHUB does not collect or store
              payout bank account details, financial credentials, or identity verification documents.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Third-Party Payment Providers:</strong> All payment
              processing, checkout transactions, and organiser payout onboarding are handled directly by our
              third-party payment providers, Stripe and Pyng, and are subject to their respective terms of service and
              privacy policies.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Operational Records Only:</strong> SPORTSHUB retains only
              non-sensitive operational records and transaction references (such as linked provider account or site
              identifiers, order and ticket records, and payment statuses) necessary to confirm bookings and operate
              events.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">7) Data Storage and Third-Party Services</h2>
          <p className="text-gray-700">
            All data stored by SPORTSHUB, including user profiles, event and booking records, and uploaded media, is
            stored with Google Cloud Platform.
          </p>
          <p className="text-gray-700">
            Where necessary to deliver platform functionality, limited data may be processed by trusted third-party
            service providers supporting payments (Stripe and Pyng), transactional emails and support enquiries, mapping
            and venue location services, and platform analytics and reliability monitoring. SPORTSHUB does not sell your
            personal information.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">8) Security, Retention, and Your Choices</h2>
          <p className="text-gray-700">
            We implement reasonable administrative, technical, and organisational safeguards to protect stored
            information. However, no method of electronic transmission or storage is completely secure, and SPORTSHUB
            cannot guarantee absolute security.
          </p>
          <p className="text-gray-700">
            We retain data only for as long as reasonably necessary to operate the platform, support legitimate
            operational and business purposes, resolve disputes, prevent fraud, and satisfy legal obligations. You may
            review, update, or remove optional profile information through your account settings, or contact us
            regarding data enquiries.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">9) Updates to These Terms</h2>
          <p className="text-gray-700">
            We may update these Terms of Service and Data Policy from time to time. Continued use of the service
            following any update constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">10) Contact</h2>
          <p className="text-gray-700">
            For questions or requests regarding these Terms of Service or this Data Policy, please contact us through
            the{" "}
            <Link href="/contact" className="font-medium text-gray-900 underline hover:text-gray-700">
              Contact page
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
