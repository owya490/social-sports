import { PublicUserData } from "@/interfaces/UserTypes";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";

export function OrganiserPill({ organiser }: { organiser: PublicUserData }) {
  return (
    <div className="flex items-center group mr-3 md:mr-3 max-w-64 md:max-w-96">
      <Image
        src={organiser.profilePicture}
        alt="Organiser"
        width={32}
        height={32}
        className="rounded-full w-8 h-8 object-cover"
      />
      <div className="flex items-center group-hover:bg-core-hover ml-1 px-2 py-1 rounded-full mr-1">
        <Link
          href={`/user/${organiser.userId}`}
          className="text-sm text-gray-700 text-nowrap max-w-48 md:max-w-96 overflow-hidden font-medium transition-colors"
        >
          {`${organiser.firstName} ${organiser.surname}`}
        </Link>
        {organiser.isVerifiedOrganiser && (
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
  );
}
