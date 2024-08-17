import Skeleton from "react-loading-skeleton";

interface EventDrilldownStatBannerProps {
  loading: boolean;
  eventAccessCount: number;
  eventVacancy: number;
  eventCapacity: number;
  eventPrice: number;
}

const EventDrilldownStatBanner = ({
  loading,
  eventAccessCount,
  eventVacancy,
  eventCapacity,
  eventPrice,
}: EventDrilldownStatBannerProps) => {
  return (
    <div className="hidden md:block">
      <div className="bg-organiser-light-gray p-10 m-0 rounded-3xl flex justify-between flex-row space-x-6 max-w-6xl xl:mx-auto">
        <div className="text-center basis-1/3 flex flex-col justify-center">
          <div className="text-lg">Net Sales</div>
          <div className="font-extrabold text-3xl">
            {loading ? (
              <Skeleton
                style={{
                  width: 80,
                }}
              />
            ) : (
              `$A${((eventCapacity - eventVacancy) * eventPrice).toFixed(2)}`
            )}
          </div>
        </div>
        <div className="inline-block h-24 w-0.5 self-stretch bg-organiser-title-gray-text"></div>
        <div className="text-center basis-1/3 flex flex-col justify-center">
          <div className="text-lg">Tickets Sold</div>
          <div className="font-extrabold text-3xl">
            {loading ? (
              <Skeleton
                style={{
                  width: 80,
                }}
              />
            ) : (
              `${eventCapacity - eventVacancy}/${eventCapacity}`
            )}
          </div>
        </div>
        <div className="inline-block h-24 w-0.5 self-stretch bg-organiser-title-gray-text"></div>
        <div className="text-center basis-1/3 flex flex-col justify-center">
          <div className="text-lg">Page Views</div>
          <div className="font-extrabold text-3xl">
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
    </div>
  );
};

export default EventDrilldownStatBanner;
