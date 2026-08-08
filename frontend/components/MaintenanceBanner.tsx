import {
  BOOKING_MAINTENANCE_MESSAGE,
  isBookingMaintenanceActive,
  SHOW_HOMEPAGE_STATUS_BANNER,
} from "@/services/featureFlags";

const BannerSeparator = () => (
  <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 hidden h-0.5 w-0.5 fill-current sm:inline">
    <circle r={1} cx={1} cy={1} />
  </svg>
);

export const MaintenanceBanner = () => {
  if (!SHOW_HOMEPAGE_STATUS_BANNER) {
    return null;
  }

  const maintenanceActive = isBookingMaintenanceActive();

  return (
    <div className="relative isolate w-full overflow-hidden bg-gray-100 px-4 py-3 sm:px-6 sm:py-2.5">
      <p className="mx-auto max-w-5xl text-pretty text-center text-sm leading-relaxed text-gray-900 sm:leading-6">
        {maintenanceActive ? (
          <>
            <strong className="block font-semibold sm:inline">Maintenance break</strong>
            <BannerSeparator />
            <span className="mt-1 block sm:mt-0 sm:inline">{BOOKING_MAINTENANCE_MESSAGE}</span>
          </>
        ) : (
          <>
            <span className="sm:hidden">
              If you run into any issues booking, reach out to{" "}
              <a
                href="mailto:info@sportshub.net.au"
                className="font-semibold text-gray-900 underline underline-offset-2"
              >
                info@sportshub.net.au
              </a>
              .
            </span>
            <span className="hidden sm:contents">
              <strong className="font-semibold">Something exciting is on the way!</strong>
              <BannerSeparator />
              We&apos;re in the middle of rolling out some exciting new features. If you run into any issues booking,
              reach out to{" "}
              <a
                href="mailto:info@sportshub.net.au"
                className="font-semibold text-gray-900 underline underline-offset-2"
              >
                info@sportshub.net.au
              </a>{" "}
              and we&apos;ll get you sorted.
            </span>
          </>
        )}
      </p>
    </div>
  );
};
