import EventBanner from "@/components/events/EventBanner";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { Timestamp } from "firebase/firestore";

//brians
export default function EventPage() {
  return (
    <div className="ml-14 mt-16">
      <OrganiserNavbar />
      <EventBanner name={"Volleyball World Cup"} startDate={Timestamp.now()} organiser={""} vacancy={3} />
    </div>
  );
}
