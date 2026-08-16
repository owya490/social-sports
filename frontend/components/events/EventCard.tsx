"use client";
import { EventId } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useState } from "react";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";
import { UserInlineDisplay } from "../users/UserInlineDisplay";

interface EventCardBaseProps {
  image: string;
  thumbnail: string;
  name: string;
  organiser: PublicUserData;
  startTime: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  loading: boolean;
  /** First-viewport cards should load eagerly; the rest must not contend with Firestore. */
  imagePriority?: boolean;
}

type ClickableEventCardProps = EventCardBaseProps & {
  eventId: EventId;
  isClickable?: true;
};

type PreviewEventCardProps = EventCardBaseProps & {
  isClickable: false;
  eventId?: never;
};

type EventCardProps = ClickableEventCardProps | PreviewEventCardProps;

export default function EventCard(props: EventCardProps) {
  const {
    image,
    thumbnail,
    name,
    organiser,
    startTime,
    location,
    price,
    loading,
    imagePriority = false,
  } = props;

  const [imageLoaded, setImageLoaded] = useState(false);
  const isCardClickable = props.isClickable !== false;
  const imageSrc = thumbnail || image;

  const cardContent = (
    <div className="bg-white text-left w-full hover:cursor-pointer hover:scale-[1.02] transition-all duration-300 md:min-w-72">
      {loading ? (
        <div className="w-full">
          <LoadingSkeletonEventCard />
        </div>
      ) : (
        <>
          <div className="relative w-full aspect-square rounded-[1rem] overflow-hidden bg-gray-100">
            {imageSrc ? (
              // Native lazy-load so offscreen Firebase Storage images do not saturate mobile connections.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageSrc}
                alt=""
                loading={imagePriority ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={imagePriority ? "high" : "auto"}
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageLoaded(true)}
                className={`absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-300 ${
                  imageLoaded ? "opacity-100" : "opacity-0"
                }`}
              />
            ) : null}
          </div>
          <div className="p-4">
            <div className="flex">
              <h4 className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(startTime)}</h4>
              <h4 className="font-light text-gray-500 text-xs ml-auto">{getEventPriceDisplay(price)}</h4>
            </div>
            <h2 className="text-lg font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-core-text">{name}</h2>
            <UserInlineDisplay organiser={organiser} isLinkEnabled={!isCardClickable} />
            <div className="mt-1 space-y-3">
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

  if (!isCardClickable) {
    return cardContent;
  }

  return <Link href={`/event/${props.eventId}`}>{cardContent}</Link>;
}
