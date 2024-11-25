import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import { Dispatch, SetStateAction } from "react";
import Skeleton from "react-loading-skeleton";

interface RecurringTemplateDrilldownSidePanelProps {
  loading: boolean;
  currSidebarPage: string;
  setCurrSidebarPage: Dispatch<SetStateAction<string>>;
  eventName: string;
  eventStartDate: Timestamp;
}

const RecurringTemplateDrilldownSidePanel = ({
  loading,
  currSidebarPage,
  setCurrSidebarPage,
  eventName,
  eventStartDate,
}: RecurringTemplateDrilldownSidePanelProps) => {
  return (
    <div className="bg-organiser-light-gray mr-10 w-48 md:w-64 rounded-3xl hidden sm:block">
      <div className="p-8">
        <div className="text-xl font-extrabold">{loading ? <Skeleton style={{ height: 40 }} /> : eventName}</div>
        <div className="text-organiser-dark-gray-text text-sm font-bold">
          {loading ? <Skeleton style={{ height: 20 }} /> : timestampToEventCardDateString(eventStartDate)}
        </div>
        <div className="h-20"></div>
      </div>
      <div className="flex flex-col hover:cursor-pointer">
        <div
          className={`text-organiser-dark-gray-text font-bold text-md ${
            currSidebarPage === "Details" ? "bg-white" : ""
          } hover:bg-white px-8 py-3 transition ease-in-out`}
          onClick={() => setCurrSidebarPage("Details")}
        >
          Details
        </div>
      </div>
      <div className="h-40"></div>
    </div>
  );
};

export default RecurringTemplateDrilldownSidePanel;