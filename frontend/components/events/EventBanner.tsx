import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import Tick from "@svgs/Verified_tick.png";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";

interface EventBannerProps {
  name: string;
  startDate: Timestamp;
  organiser: UserData;
  vacancy: number;
}

export default function EventBanner(props: EventBannerProps) {
  return (
    <div className="bg-white border-b-black border-1 border w-100% px-5 md:px-10 pt-0 shadow-lg flex justify-center">
      <div className="screen-width-primary">
        <div className="flex items-center">
          <div className="mt-3">
            <p className="font-bold text-xs block md:hidden">{timestampToEventCardDateString(props.startDate)}</p>
            <h1 className="text-3xl md:text-4xl">{props.name}</h1>

            <div className="block md:flex items-center pt-2 pb-4 pl-1">
              <div className="relative flex items-center group">
                <Image
                  src={props.organiser.profilePicture}
                  alt="DP"
                  width={50}
                  height={50}
                  className="rounded-full w-4 h-4"
                />
                <p className="text-xs font-light ml-1 mr-1">
                  {`Hosted by ${props.organiser.firstName} ${props.organiser.surname}`}
                </p>
                {props.organiser.isVerifiedOrganiser && (
                  <div className="relative">
                    <Image src={Tick} alt="Verified Organiser" className="h-4 w-4" />
                    <div className="absolute left-0 top-full mt-1 hidden group-hover:block bg-[#f2b705] text-black text-xs px-2 py-1 rounded whitespace-nowrap">
                      Verified Organiser
                    </div>
                  </div>
                )}
                <p className="font-bold text-xs ml-auto md:hidden">{`${props.vacancy} Tickets Left`}</p>
              </div>

              <p className="font-bold text-xs hidden md:block ml-4">
                {timestampToEventCardDateString(props.startDate)}
              </p>
            </div>
          </div>
          <div className="ml-auto font-bold text-2xl hidden md:block">{`${props.vacancy} Tickets Left`}</div>
        </div>
      </div>
    </div>
  );
}
