import Image from "next/image";
import React from "react";

import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import Skeleton from "react-loading-skeleton";
import { Timestamp } from "firebase/firestore";
import { timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import EventDrilldownDescription from "./EventDrilldownDescription";

interface EventDrilldownDetailsPageProps {
  loading: boolean;
  eventName: string;
  eventStartdate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventPrice: number;
  eventImage: string;
}

const EventDrilldownDetailsPage = ({
  loading,
  eventName,
  eventStartdate,
  eventDescription,
  eventLocation,
  eventPrice,
  eventImage,
}: EventDrilldownDetailsPageProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div>
        {loading ? (
          <Skeleton
            style={{
              height: 450,
              borderRadius: 30,
            }}
          />
        ) : (
          <Image
            src={eventImage}
            alt="BannerImage"
            width={0}
            height={0}
            className="h-full w-full object-cover rounded-3xl"
          />
        )}
      </div>
      <div className="h-20 border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Name</div>
        <div className="font-bold text-2xl">
          {loading ? (
            <Skeleton
              style={{
                width: 400,
              }}
            />
          ) : (
            eventName
          )}
        </div>
        <PencilSquareIcon className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text" />
      </div>
      <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 p-2 pb-4 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Details</div>
        <div className="text-sm flex flex-col space-y-1 mt-4">
          <div className="px-2 flex flex-row space-x-2">
            <CalendarDaysIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                timestampToDateString(eventStartdate)
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <ClockIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                timestampToTimeOfDay(eventStartdate)
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <MapPinIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                eventLocation
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <CurrencyDollarIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                `$${eventPrice}`
              )}
            </div>
          </div>
        </div>
        <PencilSquareIcon className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text" />{" "}
      </div>
      <div className="pb-3 border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Description</div>
        <div className="text-sm mt-4">
          {loading ? (
            <Skeleton
              style={{
                width: 400,
              }}
            />
          ) : (
            <EventDrilldownDescription description={eventDescription} />
          )}
        </div>
        <PencilSquareIcon className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text" />{" "}
      </div>
    </div>
  );
};

export default EventDrilldownDetailsPage;
