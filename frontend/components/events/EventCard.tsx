"use client";
import { EventId } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";
import { UserInlineDisplay } from "../users/UserInlineDisplay";

interface EventCardProps {
  eventId: EventId;
  image: string;
  thumbnail: string;
  name: string;
  organiser: PublicUserData;
  startTime: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  loading?: boolean;
  isClickable?: boolean;
  isScrapedEvent?: boolean;
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
    isScrapedEvent = false,
  } = props;

  const [imageLoaded, setImageLoaded] = useState(false);

  // Preload images for better performance
  useEffect(() => {
    const imageToLoad = thumbnail || image;
    if (imageToLoad) {
      const img = new window.Image();
      img.onload = () => setImageLoaded(true);
      img.src = imageToLoad;
    }
  }, [image, thumbnail]);

  const cardContent = (
    <div className="bg-white text-left w-full hover:cursor-pointer hover:scale-[1.02] transition-all duration-300 md:min-w-72">
      {loading ? (
        <div className="w-full">
          <LoadingSkeletonEventCard />
        </div>
      ) : (
        <>
          <div className="relative">
            <div
              className={`w-full ${imageLoaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
              style={{
                backgroundImage: imageLoaded ? `url(${thumbnail || image})` : "none",
                backgroundSize: "cover",
                backgroundPosition: "center center",
                aspectRatio: "1/1",
                borderRadius: "1rem",
              }}
            ></div>
            {isScrapedEvent && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                From Meetup
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex">
              <h4 className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(startTime)}</h4>
              <h4 className="font-light text-gray-500 text-xs ml-auto">{`$${displayPrice(price)}`}</h4>
            </div>
            <h2 className="text-lg font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-core-text">{name}</h2>
            <UserInlineDisplay organiser={organiser} />
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

  return isClickable ? cardContent : <Link href={`/event/${eventId}`}>{cardContent}</Link>;
}
