import { PublicUserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { CalendarIcon, TicketIcon } from "@heroicons/react/24/outline";
import { CheckBadgeIcon } from "@heroicons/react/24/solid";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

interface EventBannerProps {
  name: string;
  startDate: Timestamp;
  organiser: PublicUserData;
  vacancy: number;
  hideVacancy: boolean;
}

export default function EventBanner(props: EventBannerProps) {
  return (
    <div className="bg-white w-full px-4 md:px-10 pt-4 md:pt-4 flex md:justify-center">
      <div className="screen-width-primary px-0 md:px-3">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            {/* Date - Mobile only */}
            <div className="flex items-center gap-1.5 mb-2 md:hidden">
              <CalendarIcon className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-700 font-medium">{timestampToEventCardDateString(props.startDate)}</p>
            </div>

            {/* Event Title */}
            <h1 className="text-2xl md:text-4xl font-bold text-core-text mb-3 leading-tight line-clamp-2">
              {props.name}
            </h1>

            {/* Organiser Info */}
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

              {/* Date - Desktop */}
              <div className="hidden md:flex items-center gap-1.5">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <p className="text-sm text-gray-700">{timestampToEventCardDateString(props.startDate)}</p>
              </div>

              {/* Vacancy - Mobile */}
              {!props.hideVacancy && (
                <div className="flex md:hidden items-center gap-1.5 ml-auto">
                  <TicketIcon className="w-4 h-4 text-gray-500" />
                  <p className="text-sm font-semibold text-gray-900">{`${props.vacancy} left`}</p>
                </div>
              )}
            </div>
          </div>

          {/* Vacancy - Desktop */}
          {!props.hideVacancy && (
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-6 py-2.5 rounded-lg">
              <div>
                <p className="text-xs text-gray-600">Tickets Available</p>
                <div className="flex items-center gap-2">
                  <TicketIcon className="w-5 h-5 text-gray-600" />
                  <p className="text-lg font-bold text-gray-900">{props.vacancy}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="lg:w-3/5 xl:w-2/3 h-[1px] bg-gray-300"></div>
      </div>
    </div>
  );
}
