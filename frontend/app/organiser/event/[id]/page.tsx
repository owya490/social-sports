import EventBanner from "@/components/events/EventBanner";
import EventDrilldownDetailsPage from "@/components/organiser/EventDrilldownDetailsPage";
import EventDrilldownSidePanel from "@/components/organiser/EventDrilldownSidePanel";
import EventDrilldownStatBanner from "@/components/organiser/EventDrilldownStatBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { Timestamp } from "firebase/firestore";

//brians
export default function EventPage() {
  return (
    <div className="ml-14 mt-16">
      <OrganiserNavbar />
      <EventBanner name={"Volleyball World Cup"} startDate={Timestamp.now()} organiser={""} vacancy={3} />
      <EventDrilldownStatBanner />
      <div className="flex flex-row">
        <div>
          <EventDrilldownSidePanel />
        </div>
        <div className="mx-auto">
          <EventDrilldownDetailsPage />
        </div>
      </div>
    </div>
  );
}
