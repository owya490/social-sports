import {
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  LinkIcon,
  QrCodeIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";

export default function CoreFeaturesSection() {
  return (
    <div className="w-screen flex justify-center py-24 bg-white">
      <div className="screen-width-dashboard px-6">
        <div className="relative max-w-4xl mx-auto">
          <div className="max-w-2xl mb-6">
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 text-xs font-medium rounded-full mb-3">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
              CORE FEATURES
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-core-text">Everything you need to run your events</h3>
            <p className="text-black font-thin mt-2 text-sm md:text-base">
              Modern tools for organisers, clubs and communities.
            </p>
          </div>
          {/* Feature Cards */}
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 items-stretch gap-2 md:gap-12 pt-2">
            <div className="bg-white p-4 md:p-8">
              <div className="flex items-start gap-3 mb-2">
                <CalendarDaysIcon className="w-5 h-5 mt-0.5 text-core-text" />
                <h4 className="text-lg font-bold text-core-text">Recurring Events</h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs font-light">
                Schedule once, repeat automatically with flexible rules for daily, weekly, or fortnightly.
              </p>
            </div>
            <div className="bg-white p-4 md:p-8">
              <div className="flex items-start gap-3 mb-2">
                <ClipboardDocumentListIcon className="w-5 h-5 mt-0.5 text-core-text" />
                <h4 className="text-lg font-bold text-core-text">Custom Forms</h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs font-light">
                Collect exactly what you need with drag-and-drop fields and validation.
              </p>
            </div>
            <div className="bg-white p-4 md:p-8">
              <div className="flex items-start gap-3 mb-2">
                <LinkIcon className="w-5 h-5 mt-0.5 text-core-text" />
                <h4 className="text-lg font-bold text-core-text">Custom Links</h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs font-light">
                Create branded, trackable links for events, forms and teams.
              </p>
            </div>
            <div className="bg-white p-4 md:p-8">
              <div className="flex items-start gap-3 mb-2">
                <Squares2X2Icon className="w-5 h-5 mt-0.5 text-core-text" />
                <h4 className="text-lg font-bold text-core-text">Organiser Platform</h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs font-light">
                All-in-one dashboard for events, payments, participants and communication.
              </p>
            </div>
            <div className="bg-white p-4 md:p-8">
              <div className="flex items-start gap-3 mb-2">
                <EnvelopeIcon className="w-5 h-5 mt-0.5 text-core-text" />
                <h4 className="text-lg font-bold text-core-text">Email Reminders</h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs font-light">
                Automated reminders and confirmations to keep everyone in the loop.
              </p>
            </div>
            <div className="bg-white p-4 md:p-8">
              <div className="flex items-start gap-3 mb-2">
                <QrCodeIcon className="w-5 h-5 mt-0.5 text-core-text" />
                <h4 className="text-lg font-bold text-core-text">QR Code Tickets</h4>
              </div>
              <p className="text-gray-600 leading-relaxed text-xs font-light">
                Instant scannable tickets for faster check-in and tighter security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
