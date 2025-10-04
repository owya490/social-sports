import { PublicUserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import Tick from "@svgs/Verified_tick.png";
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
    <div className="bg-white w-100% px-2 md:px-10 pt-0 flex md:justify-center">
      <div className="screen-width-primary px-0 md:px-3">
        <div className="flex items-center">
          <div className="mt-8 w-full">
            <p className="font-bold text-xs block md:hidden">{timestampToEventCardDateString(props.startDate)}</p>
            <h1 className="text-3xl md:text-4xl text-core-text">{props.name}</h1>

            <div className="block md:flex items-center pt-1 pb-2 pl-1">
              <div className="relative flex items-center group">
                <Image
                  src={props.organiser.profilePicture}
                  alt="DP"
                  width={50}
                  height={50}
                  className="rounded-full w-4 h-4 shrink-0"
                />
                <Link
                  href={`/user/${props.organiser.userId}`}
                  className="text-xs font-light mr-1 px-1.5 py-1 hover:rounded-full hover:bg-core-hover"
                >
                  Hosted by {`${props.organiser.firstName} ${props.organiser.surname}`}
                </Link>
                {props.organiser.isVerifiedOrganiser && (
                  <div className="relative">
                    <Image src={Tick} alt="Verified Organiser" className="h-4 w-4" />
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#f2b705] text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      Verified Organiser
                    </div>
                  </div>
                )}
                {!props.hideVacancy && (
                  <p className="font-bold text-xs ml-auto md:hidden">{`${props.vacancy} Tickets Left`}</p>
                )}
              </div>

              <p className="text-xs hidden md:block ml-4 font-light">
                {timestampToEventCardDateString(props.startDate)}
              </p>
            </div>
          </div>
          {!props.hideVacancy && (
            <div className="ml-auto text-2xl hidden md:block text-core-text font-light">{`${props.vacancy} Tickets Left`}</div>
          )}
        </div>
      </div>
    </div>
  );
}
