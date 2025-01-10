import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import Skeleton from "react-loading-skeleton";

interface EventBannerProps {
  name: string;
  startDate: Timestamp;
  organiser: UserData;
  vacancy: number;
  loading: boolean;
}

const EventDrilldownBanner = ({ name, startDate, organiser, vacancy, loading }: EventBannerProps) => {
  return (
    <div className="bg-white w-100% px-5 md:px-10 pt-2 flex justify-center">
      <div className="max-w-6xl w-full">
        <div className="flex items-center">
          <div className="mt-5">
            <p className="font-bold text-xs block md:hidden">
              {loading ? <Skeleton /> : timestampToEventCardDateString(startDate)}
            </p>
            <h1 className="text-3xl md:text-4xl">{loading ? <Skeleton style={{ width: 300 }} /> : name}</h1>

            <div className="block md:flex items-center pt-2 pb-4 pl-1">
              <p className="font-bold text-xs hidden md:block">
                {loading ? (
                  <Skeleton
                    style={{
                      width: 150,
                    }}
                  />
                ) : (
                  timestampToEventCardDateString(startDate)
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownBanner;
