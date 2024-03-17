"use client";
import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";

interface OrganiserEventCardProps {
  eventId: EventId;
  image: string;
  name: string;
  organiser: UserData;
  startTime: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  loading?: boolean;
}

export default function OrganiserEventCard(props: OrganiserEventCardProps) {
  if (props.loading === undefined) {
    props = {
      ...props,
      loading: false,
    };
  }
  return (
    <Link href={`/organiser/event/${props.eventId}`}>
      <div className="bg-white rounded-lg text-left border-gray-300 border w-full sm:w-[300px] xl:w-[290px] 2xl:w-[320px] hover:cursor-pointer">
        {props.loading ? (
          <div>
            <LoadingSkeletonEventCard />
          </div>
        ) : (
          <>
            <div
              className="h-36 w-full object-cover rounded-t-lg"
              style={{
                backgroundImage: `url(${props.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
              }}
            ></div>
            <div className="p-4">
              <h4 className="font-bold text-gray-500 text-xs">{timestampToEventCardDateString(props.startTime)}</h4>
              <h2 className="text-xl font-bold mb-1 mt-1 whitespace-nowrap overflow-hidden">{props.name}</h2>
              <div className="mt-4 mb-7 space-y-3">
                <div className="flex items-center">
                  <MapPinIcon className="w-5" />
                  <p className="ml-1 font-light text-sm">{props.location}</p>
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-5" />
                  <p className="ml-1 font-light text-sm">{`$${props.price} AUD per person`}</p>
                </div>
              </div>
              <div className="flex items-center">
                <p className="text-sm font-light text-gray-500">{`${props.vacancy} spots left`}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
