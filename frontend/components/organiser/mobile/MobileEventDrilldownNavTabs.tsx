interface EventDrilldownNavTabsProps {
  currSidebarPage: string;
  setCurrSidebarPage: (page: string) => void;
}

export const MobileEventDrilldownNavTabs = ({ currSidebarPage, setCurrSidebarPage }: EventDrilldownNavTabsProps) => {
  const navigationTabs = ["Details", "Attendees", "Settings"];

  return (
    <div className="flex sm:hidden">
      {navigationTabs.map((tab, idx) => {
        return (
          <button
            key={`navTab${idx}`}
            className={`px-2 py-2 text-center overflow-hidden text-xs basis-1/2 ${
              currSidebarPage === tab ? "border-b-[3px] border-black font-bold" : ""
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
