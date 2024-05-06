import React, { Dispatch, SetStateAction } from "react";

interface EventDrilldownSidePanelProps {
  currSidebarPage: string;
  setCurrSidebarPage: Dispatch<SetStateAction<string>>;
}

const EventDrilldownSidePanel = ({ currSidebarPage, setCurrSidebarPage }: EventDrilldownSidePanelProps) => {
  return (
    <div className="bg-organiser-light-gray mr-10 w-64 rounded-3xl">
      <div className="p-8">
        <div className="text-xl font-extrabold">Volleyball World Cup</div>
        <div className="text-organiser-dark-gray-text text-sm font-bold">Sun, 17 March 2024, 10:00am</div>
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
        <div
          className={`text-organiser-dark-gray-text font-bold text-md ${
            currSidebarPage === "Manage Attendees" ? "bg-white" : ""
          } hover:bg-white px-8 py-3 transition ease-in-out`}
          onClick={() => setCurrSidebarPage("Manage Attendees")}
        >
          Manage Attendees
        </div>
        <div
          className={`text-organiser-dark-gray-text font-bold text-md ${
            currSidebarPage === "Communication" ? "bg-white" : ""
          } hover:bg-white px-8 py-3 transition ease-in-out`}
          onClick={() => setCurrSidebarPage("Communication")}
        >
          Communication
        </div>
        <div
          className={`text-organiser-dark-gray-text font-bold text-md ${
            currSidebarPage === "Share" ? "bg-white" : ""
          } hover:bg-white px-8 py-3 transition ease-in-out`}
          onClick={() => setCurrSidebarPage("Share")}
        >
          Share
        </div>
      </div>
      <div className="h-40"></div>
    </div>
  );
};

export default EventDrilldownSidePanel;
