"use client";
import DescriptionRichTextEditor from "@/components/events/create/DescriptionRichTextEditor";
import OrganiserEventDescription from "@/components/events/OrganiserEventDescription";
import { EventId } from "@/interfaces/EventTypes";
import { updateEventById } from "@/services/src/events/eventsService";
import { CheckIcon, PencilSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import Skeleton from "react-loading-skeleton";

export const EventDescriptionEdit = ({
  eventId,
  eventDescription,
  loading,
}: {
  eventId: EventId;
  eventDescription: string;
  loading: boolean;
}) => {
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
      await updateEventById(eventId, { description: newEditDescription });
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
    <div className="min-h-20 border-organiser-darker-light-gray px-4 pt-2 relative w-full sm:h-fit">
      <div className="text-organiser-title-gray-text font-bold">
        Event Description
        {loading ? (
          <Skeleton className="w-80 sm:w-[400px]" />
        ) : (
          <>
            {editDescription ? (
              <div className="my-2 w-full">
                <DescriptionRichTextEditor description={newEditDescription} updateDescription={setNewEditDescription} />
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
  );
};
