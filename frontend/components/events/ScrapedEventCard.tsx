"use client";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { MapPinIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import LoadingSkeletonEventCard from "../loading/LoadingSkeletonEventCard";

interface ScrapedEventCardProps {
  sourceUrl: string;
  image: string;
  thumbnail: string;
  name: string;
  sourceOrganiser: string;
  startTime: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  loading: boolean;
}

export default function ScrapedEventCard(props: ScrapedEventCardProps) {
  const { sourceUrl, image, thumbnail, name, sourceOrganiser, startTime, location, price, loading } = props;

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
          <div className="p-4">
            <div className="flex">
              <h4 className="font-light text-gray-500 text-xs">{timestampToEventCardDateString(startTime)}</h4>
              <h4 className="font-light text-gray-500 text-xs ml-auto">{`$${displayPrice(price)}`}</h4>
            </div>
            <h2 className="text-lg font-semibold mt-0.5 whitespace-nowrap overflow-hidden text-core-text">{name}</h2>
            <div className="flex items-center mt-1 gap-1">
              <UserCircleIcon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600 font-light">{sourceOrganiser}</span>
            </div>
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

  // External link to the source URL (Meetup)
  return (
    <a href={sourceUrl} target="_blank" rel="noopener noreferrer">
      {cardContent}
    </a>
  );
}
