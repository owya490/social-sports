interface EventDrilldownNavTabsProps {
  currSidebarPage: string;
  setCurrSidebarPage: (page: string) => void;
}

export const EventDrilldownNavTabs = ({ currSidebarPage, setCurrSidebarPage }: EventDrilldownNavTabsProps) => {
  const navigationTabs = ["Details", "Attendees"];

  return (
    <div className="flex sm:hidden">
      {navigationTabs.map((tab) => {
        return (
          <button
            className={`px-2 py-2 text-center overflow-hidden rounded-xl text-xs basis-1/2 ${
              currSidebarPage === tab ? "bg-gray-300" : ""
            }`}
            onClick={() => {
              setCurrSidebarPage(tab);
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
};
