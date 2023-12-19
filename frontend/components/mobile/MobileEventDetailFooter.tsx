import {
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/datetimeUtils";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";

interface IMobileEventDetailFooter {
  date: Timestamp;
}

export default function MobileEventDetailFooter(
  props: IMobileEventDetailFooter
) {

  return (
    <div className="fixed bottom-0 h-16 bg-white w-full z-50 border-t-2 border-gray-300 py-2 px-3 flex justify-center">
      <div className="w-[400px] sm:w-[500px] md:w-[700px] lg:w-[1000px] xl:w-[1200px]">
        {/* <div className="grid grid-cols-2"> */}
        <div className="flex">
          <div className="w-1/2">
            <div className="flex items-center">
              <CalendarDaysIcon className="w-5 mr-2" />
              <p className="text-md mr-[5%]">
                {timestampToDateString(props.date)}
              </p>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-5 mr-2" />
              <p className="text-md mr-[5%]">
                {timestampToTimeOfDay(props.date)}
              </p>
            </div>
          </div>

          <div className="relative flex justify-center ml-auto">
            <a href="#">
              <div
                className="text-lg rounded-2xl border border-black px-4 py-2"
                style={{
                  textAlign: "center",
                  position: "relative",
                }}
              >
                Contact Now
              </div>
            </a>
          </div>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
}
