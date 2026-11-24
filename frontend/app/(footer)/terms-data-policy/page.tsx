import Link from "next/link";

export default function TermsDataPolicyPage() {
  return (
    <main className="min-h-[calc(100vh-var(--navbar-height)-var(--footer-height))] bg-white px-4 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Terms of Service &amp; Data Policy
        </h1>
        <p className="mt-3 text-sm text-gray-600">Effective date: November 23, 2026</p>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">1) Who We Are, Acceptance, and Age Requirements</h2>
          <p className="text-gray-700">
            The registered Australian partnership A.Y Chee &amp; E.Z Ni &amp; R Peng &amp; B Wang &amp; O.A Yang &amp;
            D Zhang operates SPORTSHUB (&quot;SPORTSHUB&quot;, &quot;we&quot;, &quot;us&quot;).
          </p>
          <p className="text-gray-700">
            When you access or use the SPORTSHUB platform, you agree to these Terms of Service and this Data Policy
            (&quot;these terms&quot;). If you do not agree, do not use the platform.
          </p>
          <p className="text-gray-700">
            You must be at least 18 years old to create an account or book an event. If you are 16 or 17 years old, you
            may use the platform only with the consent of a parent or legal guardian. A parent or legal guardian who
            books an event for a person under 18 is responsible for that booking and for the minor&apos;s participation.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            2) Platform Role, Event Safety, Cancellations, and Refunds
          </h2>
          <p className="text-gray-700">
            SPORTSHUB provides booking and event management software. Independent event organisers create, manage, and
            run all events on the platform.
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>
              <strong className="font-semibold text-gray-900">Not the Event Organiser:</strong> SPORTSHUB is a software
              and booking platform, not an event organiser. We do not run, supervise, inspect, or insure events or
              venues.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Physical Injury and Event Safety:</strong> Playing sports
              can cause physical injury and property damage. You attend and play in events at your own risk. Event
              organisers are responsible for venue safety, event rules, supervision, and conduct on the field or court.
              SPORTSHUB is not responsible for injuries, accidents, property damage, or disputes that occur at an event.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Cancellations, Refunds, and Chargebacks:</strong> Event
              organisers set their own refund and cancellation policies, manage event cancellations, and issue refunds.
              Event organisers also handle booking disputes and chargebacks with attendees. Contact the event organiser
              directly for any refund request or booking issue. Any applicable platform or payment processing fees are
              non-refundable unless the law requires a refund.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">3) Liability and Australian Consumer Law</h2>
          <p className="text-gray-700">You use the SPORTSHUB platform at your own risk.</p>
          <p className="text-gray-700">
            Nothing in these terms excludes, restricts, or modifies any consumer guarantee, right, or remedy that the
            Australian Consumer Law or other applicable Australian law does not allow us to exclude.
          </p>
          <p className="text-gray-700">
            To the fullest extent permitted by law, SPORTSHUB is not liable for any direct, indirect, incidental,
            special, or consequential loss, including loss of data, profits, business, or goodwill, resulting from your
            use of the platform or attendance at an event. Where the law allows us to limit our liability for a breach
            of a non-excludable guarantee, we limit our liability, at our option, to supplying the platform service
            again, paying the cost of supplying the platform service again, or refunding the platform fees paid for that
            service.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            4) Appropriate Use, Prohibited Conduct, and Organiser Content
          </h2>
          <p className="text-gray-700">
            You must use the platform only for its intended purpose and in a lawful, respectful manner.
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>Do not abuse, disrupt, reverse engineer, or misuse the platform.</li>
            <li>Do not attempt unauthorised access to accounts, systems, or data.</li>
            <li>Do not upload harmful, fraudulent, or unlawful content.</li>
            <li>Do not use the platform in ways we did not design it for.</li>
          </ul>
          <p className="text-gray-700">
            Event organisers keep ownership of the event descriptions, photos, logos, and other content they upload to
            the platform. When you upload content, you confirm that you have the right to use it, and you grant
            SPORTSHUB a non-exclusive, royalty-free licence to host, display, reproduce, and promote that content to
            operate the platform and promote your events.
          </p>
          <p className="text-gray-700">
            We may suspend or end your access if you do not follow these terms or if we reasonably need to protect users
            or platform security.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">5) Data We Collect and Store</h2>
          <p className="text-gray-700">
            SPORTSHUB collects and stores information reasonably necessary to operate the platform, manage accounts and
            bookings, send event communications, prevent fraud, and maintain reliability. Depending on how you use the
            platform, this information may include:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>
              <strong className="font-semibold text-gray-900">Account and Profile Information:</strong> Core account
              details such as your name, email address, username, and account preferences. If you provide optional
              profile details (such as contact information, location, date of birth, gender, biography, or profile
              photo), we store them under your profile. Other users on the platform can see details you mark as public
              profile information.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Bookings, Waitlists, and Event Forms:</strong> When you
              book an event, join a waitlist, or submit an event form, we store the details you provide (such as your
              name, email address, phone number where requested, ticket and order records, form responses, and uploaded
              files). We make relevant booking and form details available to the event organiser so they can manage
              their event. Where an event organiser enables it, attendee names and ticket counts may appear on the event
              page.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Sensitive Information in Custom Forms:</strong> Event
              organisers may create custom forms that request sensitive or health information, such as medical
              conditions, injury disclosures, waivers, or emergency contacts. When you submit a custom form, you consent
              to SPORTSHUB storing your responses and sharing them with the event organiser. Event organisers are
              responsible for collecting, using, and protecting custom form data under applicable privacy laws.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Organiser and Event Content:</strong> Event listings,
              schedules, venue locations, images, custom forms, and settings that event organisers create or upload.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Communications and Technical Data:</strong> Enquiries or
              feedback you submit through the platform, notification records, browser storage required for sign-in
              sessions and performance, and usage and diagnostic data that help us keep the platform stable and secure.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">6) Authentication and Passwords</h2>
          <p className="text-gray-700">
            SPORTSHUB does not store user passwords. Managed authentication services on Google Cloud Platform or the
            third-party sign-in providers you choose handle account authentication and sign-in credentials.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">7) Financial Information and Payment Providers</h2>
          <p className="text-gray-700">
            SPORTSHUB does not collect or store financial information for event organisers or attendees:
          </p>
          <ul className="list-disc space-y-2 pl-6 text-gray-700">
            <li>
              <strong className="font-semibold text-gray-900">Attendees:</strong> SPORTSHUB does not collect or store
              payment card numbers, bank account details, or payment credentials.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Event Organisers:</strong> SPORTSHUB does not collect or
              store payout bank account details, financial credentials, or identity verification documents.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Third-Party Payment Providers:</strong> Our third-party
              payment providers, Stripe and Pyng, handle all payment processing, checkout transactions, and organiser
              payout onboarding directly. Their own terms of service and privacy policies apply to those services.
            </li>
            <li>
              <strong className="font-semibold text-gray-900">Operational Records Only:</strong> SPORTSHUB keeps only
              non-sensitive operational records and transaction references (such as linked provider account or site
              identifiers, order and ticket records, and payment statuses) needed to confirm bookings and operate
              events.
            </li>
          </ul>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            8) Data Storage, Third-Party Services, and Overseas Processing
          </h2>
          <p className="text-gray-700">
            SPORTSHUB stores platform data, including user profiles, event and booking records, and uploaded files, on
            Google Cloud Platform.
          </p>
          <p className="text-gray-700">
            To operate the platform, trusted third-party service providers may process limited data for payments (Stripe
            and Pyng), transactional emails and support enquiries, mapping and venue location services, and platform
            analytics and reliability monitoring. SPORTSHUB does not sell your personal information.
          </p>
          <p className="text-gray-700">
            We store core platform data primarily in Australia. However, some Google Cloud Platform services and
            third-party service providers store or process data outside Australia (including in the United States and
            other locations where those providers operate). When you use the platform, you acknowledge that those
            providers may store or process your data outside Australia.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">
            9) Security, Retention, Account Deletion, and Your Choices
          </h2>
          <p className="text-gray-700">
            We use reasonable administrative, technical, and organisational safeguards to protect stored information.
            However, no electronic transmission or storage method is completely secure, and SPORTSHUB cannot guarantee
            absolute security.
          </p>
          <p className="text-gray-700">
            We keep data only for as long as reasonably necessary to operate the platform, support legitimate business
            operations, resolve disputes, prevent fraud, and meet legal obligations.
          </p>
          <p className="text-gray-700">
            You can review, update, or remove optional profile information in your account settings. To request access
            to your personal information, correct your data, or delete your account and associated personal information,
            contact us through the{" "}
            <Link href="/contact" className="font-medium text-gray-900 underline hover:text-gray-700">
              Contact page
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:info@sportshub.net.au"
              className="font-medium text-gray-900 underline hover:text-gray-700"
            >
              info@sportshub.net.au
            </a>
            . When you request account deletion, we delete or de-identify your account data unless we must keep minimal
            records to meet legal obligations, prevent fraud, or resolve disputes.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">10) Updates to These Terms</h2>
          <p className="text-gray-700">
            We may update these terms from time to time. If we make material changes, we will notify you (for example,
            by email or by posting a clear notice on the platform) and update the effective date at the top of this
            page. If you continue to use the platform after the updated terms take effect, you accept the updated terms.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">11) Governing Law</h2>
          <p className="text-gray-700">
            The laws of New South Wales, Australia govern these terms. You and SPORTSHUB submit to the non-exclusive
            jurisdiction of the courts of New South Wales.
          </p>
        </section>

        <section className="mt-8 space-y-3">
          <h2 className="text-xl font-semibold text-gray-900">12) Contact</h2>
          <p className="text-gray-700">
            For questions, privacy requests, or account deletion requests regarding these terms, contact us through the{" "}
            <Link href="/contact" className="font-medium text-gray-900 underline hover:text-gray-700">
              Contact page
            </Link>{" "}
            or email{" "}
            <a
              href="mailto:info@sportshub.net.au"
              className="font-medium text-gray-900 underline hover:text-gray-700"
            >
              info@sportshub.net.au
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
