import Image from "next/image";

import {
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

import TextField from "@mui/material/TextField";

import { timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import DescriptionRichTextEditor from "../events/create/DescriptionRichTextEditor";

interface EventDrilldownDetailsPageProps {
  loading: boolean;
  eventName: string;
  eventStartdate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventPrice: number;
  eventImage: string;
}

const EventDrilldownDetailsPage = ({
  loading,
  eventName,
  eventStartdate,
  eventDescription,
  eventLocation,
  eventPrice,
  eventImage,
}: EventDrilldownDetailsPageProps) => {
  const [editTitle, setEditTitle] = useState(false);
  const [newEditTitle, setNewEditTitle] = useState(eventName);
  const [title, setTitle] = useState(eventName);

  const handleTitleUpdate = () => {
    setTitle(newEditTitle);
    // Update to firestore
    setEditTitle(false);
  };

  const handleCancelTitle = () => {
    setNewEditTitle(title);
    setEditTitle(false);
  };

  const [editDescription, setEditDescription] = useState(false);
  const [newEditDescription, setNewEditDescription] = useState(eventDescription);
  const [description, setDescription] = useState(eventDescription);

  const handleDescriptionUpdate = () => {
    setDescription(newEditDescription);
    // Update to firestore
    setEditDescription(false);
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
            className="h-full w-full object-cover rounded-3xl"
          />
        )}
      </div>
      <div className="h-20 border-organiser-darker-light-gray border-solid border-2 rounded-3xl px-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">
          Event Name
          {loading ? (
            <Skeleton
              style={{
                width: 400,
              }}
            />
          ) : (
            <>
              {editTitle ? (
                <div className="flex">
                  <TextField
                    value={newEditTitle}
                    variant="standard"
                    fullWidth
                    inputProps={{ style: { fontSize: "1.25rem", color: "#333" } }}
                    onChange={(e) => {
                      setNewEditTitle(e.target.value);
                    }}
                  />
                  <CheckIcon
                    className="w-9 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleTitleUpdate();
                    }}
                  />
                  <XMarkIcon
                    className="w-9 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleCancelTitle();
                    }}
                  />
                </div>
              ) : (
                <div className="font-bold text-2xl">
                  {newEditTitle}
                  <PencilSquareIcon
                    className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => setEditTitle(true)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div className="border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 p-2 pb-4 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Details</div>
        <div className="text-sm flex flex-col space-y-1 mt-4">
          <div className="px-2 flex flex-row space-x-2">
            <CalendarDaysIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                timestampToDateString(eventStartdate)
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <ClockIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                timestampToTimeOfDay(eventStartdate)
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <MapPinIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                eventLocation
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <CurrencyDollarIcon className="w-4" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                `$${eventPrice}`
              )}
            </div>
          </div>
        </div>
        <PencilSquareIcon className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text" />{" "}
      </div>
      <div className="h-20 border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">
          Event Description
          {loading ? (
            <Skeleton
              style={{
                width: 400,
              }}
            />
          ) : (
            <>
              {editDescription ? (
                <div className="flex">
                  <DescriptionRichTextEditor
                    description={newEditDescription}
                    updateDescription={setNewEditDescription}
                  />
                  <CheckIcon
                    className="w-9 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleDescriptionUpdate();
                    }}
                  />
                  <XMarkIcon
                    className="w-9 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleCancelDescription();
                    }}
                  />
                </div>
              ) : (
                <div className="text-sm mt-4">
                  {newEditDescription}
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
