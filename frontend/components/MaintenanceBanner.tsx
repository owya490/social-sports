import { BOOKING_MAINTENANCE_MESSAGE, isBookingMaintenanceActive } from "@/services/featureFlags";

export const MaintenanceBanner = () => {
  if (!isBookingMaintenanceActive()) {
    return null;
  }

  return (
    <div className="relative isolate flex w-full items-center justify-center overflow-hidden bg-amber-50 px-6 py-2.5 sm:px-3.5">
      <p className="text-center text-sm leading-6 text-amber-950">
        <strong className="font-semibold">Maintenance break</strong>
        <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
          <circle r={1} cx={1} cy={1} />
        </svg>
        {BOOKING_MAINTENANCE_MESSAGE}
      </p>
    </div>
  );
};
