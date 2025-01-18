import { CheckIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect } from "react";

import OrganiserEventDescription from "@/components/events/OrganiserEventDescription";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import DescriptionRichTextEditor from "../../../events/create/DescriptionRichTextEditor";
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
  eventPrice: number;
  eventImage: string;
  eventId: string;
  eventRegistrationDeadline: Timestamp;
  isActive: boolean;
  updateData: (id: string, data: any) => Promise<any>;
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
  eventPrice,
  eventImage,
  eventId,
  eventRegistrationDeadline,
  isActive,
  updateData,
}: EventDrilldownDetailsPageProps) => {
  const [editDescription, setEditDescription] = useState(false);
  const [newEditDescription, setNewEditDescription] = useState(eventDescription);
  const [description, setDescription] = useState(eventDescription);

  useEffect(() => {
    if (eventDescription) {
      setDescription(eventDescription);
      setNewEditDescription(eventDescription);
    }
  }, [eventDescription]);

  const handleDescriptionUpdate = async () => {
    setDescription(newEditDescription);
    setEditDescription(false);
    try {
      await updateData(eventId, { description: newEditDescription });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update event description:", error);
    }
  };

  const handleCancelDescription = () => {
    setNewEditDescription(description);
    setEditDescription(false);
  };

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
        eventPrice={eventPrice}
        eventRegistrationDeadline={eventRegistrationDeadline}
        loading={loading}
        isActive={isActive}
      />

      <div className="h-[1px] bg-core-outline w-full"></div>
      <div className="min-h-20 border-organiser-darker-light-gray px-4 pt-2 relative w-full sm:h-fit">
        <div className="text-organiser-title-gray-text font-bold">
          Event Description
          {loading ? (
            <Skeleton className="w-80 sm:w-[400px]" />
          ) : (
            <>
              {editDescription ? (
                <div className="my-2 w-full">
                  <DescriptionRichTextEditor
                    description={newEditDescription}
                    updateDescription={setNewEditDescription}
                  />
                  <CheckIcon
                    className="absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleDescriptionUpdate();
                    }}
                  />
                  <XMarkIcon
                    className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleCancelDescription();
                    }}
                  />
                </div>
              ) : (
                <div className="text-sm my-2">
                  <OrganiserEventDescription description={newEditDescription} />
                  <PencilSquareIcon
                    className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => setEditDescription(true)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownDetailsPage;
