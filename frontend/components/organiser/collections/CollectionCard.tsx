"use client";
import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { LockClosedIcon, LockOpenIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

export interface CollectionCardProps {
  collection: EventCollection;
  loading?: boolean;
}

export default function CollectionCard({ loading, collection }: CollectionCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-300 p-6 w-full">
        <Skeleton height={24} width={200} className="mb-2" />
        <Skeleton height={16} width="100%" className="mb-4" />
        <Skeleton height={16} width={100} />
      </div>
    );
  }

  return (
    <Link href={`/organiser/event/collections/${collection.eventCollectionId}`}>
      <div className="bg-white rounded-lg border border-gray-300 p-6 w-full hover:shadow-lg hover:border-gray-400 transition-all duration-200 cursor-pointer group max-w-md h-full">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg group-hover:bg-gray-200 transition-colors">
              {collection.name === "Upcoming Public Events" ? (
                <LockOpenIcon className="w-6 h-6 text-core-text" />
              ) : (
                <LockClosedIcon className="w-6 h-6 text-core-text" />
              )}
            </div>
            <h2 className="text-xl font-bold text-core-text">{collection.name}</h2>
          </div>
        </div>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{collection.description}</p>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-500">
            {collection.eventIds.length} {collection.eventIds.length === 1 ? "event" : "events"}
          </p>
          <div className="space-x-2">
            <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">
              {collection.isPrivate ? "Private" : "Public"}
            </span>
            {collection.isDefault && (
              <span className="text-xs px-3 py-1 bg-gray-100 text-gray-600 rounded-full">Default</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
