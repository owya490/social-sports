import {
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { CalendarDaysIcon, ClockIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";

interface MobileEventDetailFooterProps {
  date: Timestamp;
}

export default function MobileEventDetailFooter(
  props: MobileEventDetailFooterProps
) {
  return (
    <div className="fixed bottom-0 h-16 bg-white w-full z-50 border-t-2 border-gray-300 py-2 px-3 flex justify-center">
      <div className="screen-width-primary">
        {/* <div className="grid grid-cols-2"> */}
        <div className="flex items-center">
          <div className="w-1/2">
            <div className="flex items-center mb-2">
              <CalendarDaysIcon className="w-4 h-4 mr-2" />
              <p className="text-xs font-light mr-[5%]">
                {timestampToDateString(props.date)}
              </p>
            </div>
            <div className="flex items-center">
              <ClockIcon className="w-4 h-4 mr-2" />
              <p className="text-xs font-light mr-[5%]">
                {timestampToTimeOfDay(props.date)}
              </p>
            </div>
          </div>

          <div className="relative flex justify-center ml-auto">
            <Link href="#">
              <div
                className="text-lg rounded-lg border border-black px-4 py-2"
                style={{
                  textAlign: "center",
                  position: "relative",
                }}
              >
                Contact Now
              </div>
            </Link>
          </div>
        </div>
        {/* </div> */}
      </div>
    </div>
  );
}
