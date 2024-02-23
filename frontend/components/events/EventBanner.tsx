import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/utilities/datetimeUtils";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "../utility/UserContext";

interface EventBannerProps {
  eventId: EventId;
  name: string;
  startDate: Timestamp;
  organiser: UserData;
  vacancy: number;
}

export default function EventBanner(props: EventBannerProps) {
  const { user } = useUser();
  return (
    <div className="bg-white border-b-black border-1 border w-screen px-5 md:px-10 pt-20 shadow-lg flex justify-center">
      <div className="screen-width-primary">
        <div className="flex items-center">
          <div className="mt-3">
            <p className="font-bold text-xs block md:hidden">
              {timestampToEventCardDateString(props.startDate)}
            </p>
            <h1 className="text-3xl md:text-4xl">{props.name}</h1>

            <div className="block md:flex items-center pt-2 pb-4 pl-1">
              <div className="flex items-center">
                <Image
                  src={props.organiser.profilePicture}
                  alt="DP"
                  width={50}
                  height={50}
                  className="rounded-full w-4 h-4"
                />
                <p className="text-xs font-light ml-1 mr-4">
                  {`Hosted by ${props.organiser.firstName} ${props.organiser.surname}`}
                </p>
              </div>

              <p className="font-bold text-xs hidden md:block">
                {timestampToEventCardDateString(props.startDate)}
              </p>
            </div>
          </div>
          {props.organiser.userId === user.userId && (
            <Link className="ml-auto flex" href={`edit/${props.eventId}`}>
              <PencilSquareIcon className="w-5 h-5 mr-1" /> <p>Edit</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
