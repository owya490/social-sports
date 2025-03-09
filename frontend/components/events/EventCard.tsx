"use client";
import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";

interface EventCardProps {
  eventId: EventId;
  image: string;
  thumbnail: string;
  name: string;
  organiser: UserData;
  startTime: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  loading?: boolean;
  isClickable?: boolean;
}

export default function EventCard(props: EventCardProps) {
  const {
    eventId,
    image,
    thumbnail,
    name,
    organiser,
    startTime,
    location,
    price,
    vacancy,
    loading = false,
    isClickable = false,
  } = props;

  const cardContent = (
    <div className="bg-white text-left w-full hover:cursor-pointer hover:scale-[1.02] transition-all duration-300 md:min-w-72">
      {loading ? (
        <div className="w-full">
          <LoadingSkeletonEventCard />
        </div>
      ) : (
        <>
          <div
            className="w-full"
            style={{
              backgroundImage: `url(${thumbnail ? thumbnail : image})`,
              backgroundSize: "cover",
              backgroundPosition: "center center",
              aspectRatio: "1/1",
              borderRadius: "1rem",
            }}
          ></div>
          <div className="p-4">
            <div className="flex">
              <h4 className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(startTime)}</h4>
              <h4 className="font-light text-gray-500 text-xs ml-auto">{`$${displayPrice(price)}`}</h4>
            </div>
            <h2 className="text-lg font-semibold mb-0.5 mt-0.5 whitespace-nowrap overflow-hidden text-core-text">
              {name}
            </h2>
            <div className="flex ml-0.5 items-center">
              <Image src={organiser.profilePicture} alt="DP" width={50} height={50} className="rounded-full w-4 h-4" />
              <p className="text-xs font-light ml-1">{`Hosted by ${organiser.firstName} ${organiser.surname}`}</p>
              {organiser.isVerifiedOrganiser && <Image src={Tick} alt="Verified Organiser" className="h-4 w-4 ml-1" />}
            </div>
            <div className="mt-2 space-y-3">
              <div className="flex items-center ml-0.5">
                <MapPinIcon className="w-4 shrink-0" />
                <p className="ml-1 font-light text-core-text text-xs whitespace-nowrap overflow-hidden">{location}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return isClickable ? cardContent : <Link href={`/event/${eventId}`}>{cardContent}</Link>;
}
