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
  eventEventLink: string;
  isActive: boolean;
  updateData: (id: string, data: any) => any;
  isRecurrenceTemplate: boolean;
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
  eventEventLink,
  isActive,
  updateData,
  isRecurrenceTemplate,
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
      <EventNameEdit
        eventId={eventId}
        eventName={eventName}
        loading={loading}
        isActive={isActive}
        updateData={updateData}
      />
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
        eventEventLink={eventEventLink}
        loading={loading}
        isActive={isActive}
        updateData={updateData}
        isRecurrenceTemplate={isRecurrenceTemplate}
      />
      <div className="h-[1px] bg-core-outline w-full"></div>
      <EventDescriptionEdit
        eventId={eventId}
        eventDescription={eventDescription}
        isActive={isActive}
        loading={loading}
        updateData={updateData}
      />
    </div>
  );
};

export default EventDrilldownDetailsPage;
