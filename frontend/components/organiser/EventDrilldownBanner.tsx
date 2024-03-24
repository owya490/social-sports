import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import React from "react";

interface EventBannerProps {
  name: string;
  startDate: Timestamp;
  organiser: UserData;
  vacancy: number;
}

const EventDrilldownBanner = ({ name, startDate, organiser, vacancy }: EventBannerProps) => {
  return (
    <div className="bg-organiser-light-gray border-b-black border-0 border w-100% px-5 md:px-10 pt-0 shadow-lg flex justify-center">
      <div className="screen-width-primary">
        <div className="flex items-center">
          <div className="mt-3">
            <p className="font-bold text-xs block md:hidden">{timestampToEventCardDateString(startDate)}</p>
            <h1 className="text-3xl md:text-4xl">{name}</h1>

            <div className="block md:flex items-center pt-2 pb-4 pl-1">
              <div className="flex items-center">
                <Image
                  src={organiser.profilePicture}
                  alt="DP"
                  width={50}
                  height={50}
                  className="rounded-full w-4 h-4"
                />
                <p className="text-xs font-light ml-1 mr-4">
                  {`Hosted by ${organiser.firstName} ${organiser.surname}`}
                </p>
              </div>

              <p className="font-bold text-xs hidden md:block">{timestampToEventCardDateString(startDate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownBanner;
