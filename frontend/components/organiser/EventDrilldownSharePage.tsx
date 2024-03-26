import { Square2StackIcon } from "@heroicons/react/24/outline";
import React from "react";

const EventDrilldownSharePage = () => {
  return (
    <div className="flex flex-col space-y-4 mb-6 w-full">
      <div className="text-4xl font-extrabold">Share</div>
      <div>
        <div className="text-organiser-title-gray-text font-bold text-lg">Event link</div>
        <div className="flex flex-row">
          <div>https://www.sportshub.net.au/event/108973271</div>
          <Square2StackIcon className="stroke-2 w-4 ml-2" />
        </div>
      </div>

      <div>
        <div className="text-organiser-title-gray-text font-bold text-lg">Share on</div>
        <div className="flex flex-row">
          <div>https://www.sportshub.net.au/event/108973271</div>
          <Square2StackIcon className="stroke-2 w-4 ml-2" />
        </div>
      </div>

      <div>
        <div className="text-organiser-title-gray-text font-bold text-lg">Generate event poster</div>
        <div className="flex flex-row">
          <div>https://www.sportshub.net.au/event/108973271</div>
          <Square2StackIcon className="stroke-2 w-4 ml-2" />
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownSharePage;
