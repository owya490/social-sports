"use client";
import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/utilities/datetimeUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface EventCardProps {
  eventId: EventId;
  image: string;
  name: string;
  organiser: UserData;
  startDate: Timestamp;
  location: string;
  price: number;
  vacancy: number;
}

export default function EventCard(props: EventCardProps) {
  const router = useRouter();

  return (
    <div
      className="bg-white rounded-lg text-left border-gray-300 border w-full sm:w-[300px] xl:w-[290px] 2xl:w-[320px] hover:cursor-pointer"
      onClick={() => {
        router.push(`/event/${props.eventId}`);
      }}
    >
      <Image
        priority={true}
        src={props.image}
        height={0}
        width={0}
        alt="stvImage"
        className="w-full rounded-t-lg h-52 xl:h-44 object-cover"
      />
      <div className="p-4">
        <h4 className="font-bold text-gray-500 text-xs">
          {timestampToEventCardDateString(props.startDate)}
        </h4>
        <h2 className="text-xl font-bold mb-1 mt-1 whitespace-nowrap overflow-hidden">
          {props.name}
        </h2>
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
        </div>
        <div className="mt-4 mb-7 space-y-3">
          <div className="flex items-center">
            <MapPinIcon className="w-5" />
            <p className="ml-1 font-light text-sm">{props.location}</p>
          </div>
          <div className="flex items-center">
            <CurrencyDollarIcon className="w-5" />
            <p className="ml-1 font-light text-sm">
              {`$${props.price} AUD per person`}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          <p className="text-sm font-light text-gray-500">
            {`${props.vacancy} spots left`}
          </p>
          <button className="ml-auto rounded-lg border-black border py-1 px-2 text-blackm text-center">
            <h2 className="text-sm">Book Now</h2>
          </button>
        </div>
      </div>
    </div>
  );
}
