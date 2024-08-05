"use client";
import EventImage from "@/components/events/EventImage";
import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";

interface EventCardProps {
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

export default function EventCard(props: EventCardProps) {
  if (props.loading === undefined) {
    props = {
      ...props,
      loading: false,
    };
  }

  return (
    <Link href={`/event/${props.eventId}`}>
      <div className="bg-white rounded-lg text-left border-gray-300 border w-full md:w-[300px] xl:w-[290px] 2xl:w-[320px] hover:cursor-pointer">
        {props.loading ? (
          <div>
            <LoadingSkeletonEventCard />
          </div>
        ) : (
          <>
            <div className="h-36 w-full object-cover rounded-t-lg overflow-hidden">
              <EventImage imageSrc={props.image} />
            </div>
            <div className="p-4">
              <h4 className="font-bold text-gray-500 text-xs">{timestampToEventCardDateString(props.startTime)}</h4>
              <h2 className="text-xl font-bold mb-1 mt-1 whitespace-nowrap overflow-hidden">{props.name}</h2>
              <div className="flex ml-0.5 items-center">
                <Image
                  src={props.organiser.profilePicture}
                  alt="DP"
                  width={50}
                  height={50}
                  className="rounded-full w-4 h-4"
                />
                <p className="text-xs font-light ml-1">
                  {`Hosted by ${props.organiser.firstName} ${props.organiser.surname}`}
                </p>
                {props.organiser.isVerifiedOrganiser && (
                  <Image src={Tick} alt="Verified Organiser" className="h-4 w-4 ml-1" />
                )}
              </div>
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
                {/* <button className="ml-auto rounded-lg border-black border py-1 px-2 text-blackm text-center">
                  <h2 className="text-sm">Book Now</h2>
                </button> */}
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
