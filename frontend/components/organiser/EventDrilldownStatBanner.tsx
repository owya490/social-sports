import { displayPrice } from "@/utilities/priceUtils";
import Skeleton from "react-loading-skeleton";

interface EventDrilldownStatBannerProps {
  loading: boolean;
  eventAccessCount: number;
  completeTicketCount: number;
  eventCapacity: number;
  eventPrice: number;
  totalNetSales: number;
}

const EventDrilldownStatBanner = ({
  loading,
  eventAccessCount,
  completeTicketCount,
  eventCapacity,
  totalNetSales,
}: EventDrilldownStatBannerProps) => {
  return (
    <div className="bg-organiser-light-gray p-4 md:p-10 mx-2 sm:mx-0 rounded-2xl md:rounded-3xl flex justify-between flex-row space-x-2 md:space-x-6 max-w-6xl xl:mx-auto mb-4 md:mb-0">
      <div className="text-center basis-1/3 flex flex-col justify-center">
        <div className="text-sm md:text-lg">Net Sales</div>
        <div className="font-extrabold text-xl md:text-3xl">
          {loading ? (
            <Skeleton
              style={{
                width: 80,
              }}
            />
          ) : (
            `$A${displayPrice(totalNetSales).toFixed(2)}`
          )}
        </div>
      </div>
      <div className="inline-block h-16 md:h-24 w-[1px] self-stretch bg-organiser-title-gray-text"></div>
      <div className="text-center basis-1/3 flex flex-col justify-center">
        <div className="text-sm md:text-lg">Tickets Sold</div>
        <div className="font-extrabold text-xl md:text-3xl">
          {loading ? (
            <Skeleton
              style={{
                width: 80,
              }}
            />
          ) : (
            `${completeTicketCount ?? 0}/${eventCapacity}`
          )}
        </div>
      </div>
      <div className="inline-block h-16 md:h-24 w-[1px] self-stretch bg-organiser-title-gray-text"></div>
      <div className="text-center basis-1/3 flex flex-col justify-center">
        <div className="text-sm md:text-lg">Page Views</div>
        <div className="font-extrabold text-xl md:text-3xl">
          {loading ? (
            <Skeleton
              style={{
                width: 80,
              }}
            />
          ) : (
            eventAccessCount
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownStatBanner;
