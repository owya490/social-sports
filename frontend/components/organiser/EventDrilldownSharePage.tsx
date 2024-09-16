import { Square2StackIcon } from "@heroicons/react/24/outline";

const EventDrilldownSharePage = () => {
  return (
    <div className="p-1 md:p-0 flex flex-col space-y-4 mb-6 w-full">
      <div className="text-4xl font-extrabold">Share</div>
      <div>
        <div className="text-organiser-title-gray-text font-bold text-base md:text-lg">Event link</div>
        <div className="flex flex-row">
          <div>https://www.sportshub.net.au/event/108973271</div>
          <Square2StackIcon className="stroke-2 w-4 ml-2 shrink-0" />
        </div>
      </div>

      <div>
        <div className="text-organiser-title-gray-text font-bold text-base md:text-lg">Share on</div>
        <div className="flex flex-row">
          <div>https://www.sportshub.net.au/event/108973271</div>
          <Square2StackIcon className="stroke-2 w-4 ml-2 shrink-0" />
        </div>
      </div>

      <div>
        <div className="text-organiser-title-gray-text font-bold text-base md:text-lg">Generate event poster</div>
        <div className="flex flex-row">
          <div>https://www.sportshub.net.au/event/108973271</div>
          <Square2StackIcon className="stroke-2 w-4 ml-2 shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownSharePage;
