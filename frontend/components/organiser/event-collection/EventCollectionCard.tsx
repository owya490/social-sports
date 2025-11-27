"use client";
import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";
import { UserInlineDisplay } from "../../users/UserInlineDisplay";

export interface EventCollectionCardProps {
  collection: EventCollection;
  organiser: PublicUserData;
  loading?: boolean;
  isPublicView?: boolean;
}

export default function EventCollectionCard({
  loading,
  collection,
  organiser,
  isPublicView = false,
}: EventCollectionCardProps) {
  if (loading) {
    return (
      <div className="bg-white w-full">
        <Skeleton height={200} className="mb-4" style={{ borderRadius: "1rem" }} />
        <div className="p-4">
          <Skeleton height={24} width={200} className="mb-2" />
          <Skeleton height={16} width="100%" className="mb-2" />
          <Skeleton height={16} width={100} />
        </div>
      </div>
    );
  }

  const href = isPublicView
    ? `/event-collection/${collection.eventCollectionId}`
    : `/organiser/event/event-collection/${collection.eventCollectionId}`;

  return (
    <Link href={href}>
      <div className="bg-white text-left w-full hover:cursor-pointer hover:scale-[1.02] transition-all duration-300 md:min-w-72">
        <div
          className="w-full"
          style={{
            backgroundImage: `url(${collection.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            aspectRatio: "16/9",
            borderRadius: "1rem",
          }}
        ></div>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-core-text">{collection.name}</h2>
          <UserInlineDisplay organiser={organiser} />
          <p className="text-gray-600 text-xs font-light mt-1 line-clamp-2">{collection.description}</p>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs font-light text-gray-500">
              {collection.eventIds.length} {collection.eventIds.length === 1 ? "event" : "events"}
            </p>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-gray-100 rounded-full">
              {collection.isPrivate ? (
                <LockClosedIcon className="w-3.5 h-3.5 text-gray-600" />
              ) : (
                <LockOpenIcon className="w-3.5 h-3.5 text-gray-600" />
              )}
              <span className="text-xs text-gray-600">{collection.isPrivate ? "Private" : "Public"}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
