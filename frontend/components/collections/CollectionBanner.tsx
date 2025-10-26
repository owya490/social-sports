import { PublicUserData } from "@/interfaces/UserTypes";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";

interface CollectionBannerProps {
  name: string;
  description: string;
  organiser: PublicUserData;
  eventCount: number;
  image: string;
}

export default function CollectionBanner(props: CollectionBannerProps) {
  return (
    <div className="bg-white w-full pt-6 md:pt-8">
      <div className="mb-6">
        {/* Side-by-side layout: Image on left, content on right */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* 16:9 Image - Side positioned */}
          <div className="flex-shrink-0 w-full md:w-80 lg:w-96">
            <div
              className="w-full rounded-xl"
              style={{
                backgroundImage: `url(${props.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                aspectRatio: "16/9",
              }}
            ></div>
          </div>

          {/* Collection Details */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              {/* Collection Name */}
              <h1 className="text-2xl md:text-3xl font-bold text-core-text leading-tight mb-2">{props.name}</h1>

              {/* Description */}
              <p className="text-gray-600 text-sm md:text-base mb-3 line-clamp-3">{props.description}</p>
            </div>

            {/* Organiser Info & Event Count */}
            <div className="flex items-center justify-between flex-wrap gap-3 mt-2">
              <div className="flex items-center">
                <div className="flex items-center group mr-3 md:mr-3 max-w-64 md:max-w-96">
                  <Image
                    src={props.organiser.profilePicture}
                    alt="Organiser"
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8 object-cover"
                  />
                  <div className="flex items-center group-hover:bg-core-hover ml-1 px-2 py-1 rounded-full mr-1">
                    <Link
                      href={`/user/${props.organiser.userId}`}
                      className="text-sm text-gray-700 text-nowrap max-w-48 md:max-w-96 overflow-hidden font-medium transition-colors"
                    >
                      {`${props.organiser.firstName} ${props.organiser.surname}`}
                    </Link>
                    {props.organiser.isVerifiedOrganiser && (
                      <div className="relative group/badge ml-1">
                        <CheckBadgeIcon className="w-5 h-5 text-yellow-700" />
                        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover/badge:block bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-10 shadow-lg">
                          Verified Organiser
                          <div className="absolute left-1/2 -translate-x-1/2 -top-1 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Count Badge */}
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg">
                <p className="text-sm font-medium text-gray-700">
                  {props.eventCount} {props.eventCount === 1 ? "Event" : "Events"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-[1px] bg-gray-300"></div>
    </div>
  );
}
