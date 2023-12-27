import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";

interface IEventBanner {
  name: string;
  startDate: Timestamp;
  organiser: UserData;
  vacancy: number;
}

export default function EventBanner(props: IEventBanner) {
  return (
    <div className="bg-white border-b-black border-1 border w-screen px-5 md:px-10 pt-20 shadow-lg flex justify-center">
      <div className="w-[400px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
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
        </div>
      </div>
    </div>
  );
}
