import Image from "next/image";

import { Timestamp } from "firebase/firestore";
import Skeleton from "react-loading-skeleton";
import { EventDescriptionEdit } from "./EventDescriptionEdit";
import { EventDetailsEdit } from "./EventDetailsEdit";
import { EventNameEdit } from "./EventNameEdit";

interface EventDrilldownDetailsPageProps {
  loading: boolean;
  eventName: string;
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventSport: string;
  eventCapacity: number;
  eventVacancy: number;
  eventPrice: number;
  eventImage: string;
  eventId: string;
  eventRegistrationDeadline: Timestamp;
  isActive: boolean;
}

const EventDrilldownDetailsPage = ({
  loading,
  eventName,
  eventStartDate,
  eventEndDate,
  eventDescription,
  eventLocation,
  eventSport,
  eventCapacity,
  eventVacancy,
  eventPrice,
  eventImage,
  eventId,
  eventRegistrationDeadline,
  isActive,
}: EventDrilldownDetailsPageProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6">
      <div>
        {loading ? (
          <Skeleton
            style={{
              height: 450,
              borderRadius: 30,
            }}
          />
        ) : (
          <Image
            src={eventImage}
            alt="BannerImage"
            width={0}
            height={0}
            className="h-full w-full aspect-[16/9] object-cover sm:rounded-3xl"
          />
        )}
      </div>
      <EventNameEdit eventId={eventId} eventName={eventName} loading={loading} isActive={isActive} />
      <div className="h-[1px] bg-core-outline w-full"></div>
      <EventDetailsEdit
        eventId={eventId}
        eventStartDate={eventStartDate}
        eventEndDate={eventEndDate}
        eventLocation={eventLocation}
        eventSport={eventSport}
        eventCapacity={eventCapacity}
        eventVacancy={eventVacancy}
        eventPrice={eventPrice}
        eventRegistrationDeadline={eventRegistrationDeadline}
        loading={loading}
        isActive={isActive}
      />
      <div className="h-[1px] bg-core-outline w-full"></div>
      <EventDescriptionEdit eventId={eventId} eventDescription={eventDescription} loading={loading} />
    </div>
  );
};

export default EventDrilldownDetailsPage;
