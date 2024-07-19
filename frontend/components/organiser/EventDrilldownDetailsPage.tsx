import {
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { useEffect } from "react";

import { Input } from "@material-tailwind/react";

import OrganiserEventDescription from "@/components/events/OrganiserEventDescription";
import {
  formatDateToString,
  formatStringToDate,
  formatTimeTo12Hour,
  formatTimeTo24Hour,
  parseDateTimeStringToTimestamp,
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { updateEventById } from "@/services/src/events/eventsService";
import { getLocationCoordinates } from "@/services/src/locationUtils";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import DescriptionRichTextEditor from "../events/create/DescriptionRichTextEditor";

interface EventDrilldownDetailsPageProps {
  loading: boolean;
  eventName: string;
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventPrice: number;
  eventImage: string;
  eventId: string;
}

const EventDrilldownDetailsPage = ({
  loading,
  eventName,
  eventStartDate,
  eventEndDate,
  eventDescription,
  eventLocation,
  eventPrice,
  eventImage,
  eventId,
}: EventDrilldownDetailsPageProps) => {
  const [editTitle, setEditTitle] = useState(false);
  const [newEditTitle, setNewEditTitle] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (eventName) {
      setTitle(eventName);
      setNewEditTitle(eventName);
    }
  }, [eventName]);

  const handleTitleUpdate = async () => {
    setTitle(newEditTitle);
    const nameTokens = newEditTitle.toLowerCase().split(" ");
    try {
      setEditTitle(false);
      await updateEventById(eventId, { name: newEditTitle, nameTokens });
    } catch (error) {
      console.error("Failed to update event name:", error);
    }
  };

  const handleCancelTitle = () => {
    setNewEditTitle(title);
    setEditTitle(false);
  };

  const [editDate, setEditDate] = useState(false);
  const [newEditDate, setNewEditDate] = useState("");
  const [date, setDate] = useState("");

  const [editTime, setEditTime] = useState(false);
  const [newEditTime, setNewEditTime] = useState("");
  const [time, setTime] = useState("");

  const [editEndDate, setEditEndDate] = useState(false);
  const [newEditEndDate, setNewEditEndDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [editEndTime, setEditEndTime] = useState(false);
  const [newEditEndTime, setNewEditEndTime] = useState("");
  const [endTime, setEndTime] = useState("");

  useEffect(() => {
    if (eventStartDate) {
      const dateString = timestampToDateString(eventStartDate);
      const timeString = timestampToTimeOfDay(eventStartDate);
      setDate(`${dateString}`);
      setNewEditDate(`${dateString}`);
      setTime(`${timeString}`);
      setNewEditTime(`${timeString}`);
    }
  }, [eventStartDate]);

  useEffect(() => {
    if (eventEndDate) {
      const dateString = timestampToDateString(eventEndDate);
      const timeString = timestampToTimeOfDay(eventEndDate);
      setEndDate(`${dateString}`);
      setNewEditEndDate(`${dateString}`);
      setEndTime(`${timeString}`);
      setNewEditEndTime(`${timeString}`);
    }
  }, [eventEndDate]);

  const handleDateTimeUpdate = async () => {
    try {
      const dateStartTimeString = `${newEditDate} ${newEditTime}`;
      const updatedStartTimestamp = parseDateTimeStringToTimestamp(dateStartTimeString);
      const dateEndTimeString = `${newEditEndDate} ${newEditEndTime}`;
      const updatedEndTimestamp = parseDateTimeStringToTimestamp(dateEndTimeString);
      setEditDate(false);
      setEditTime(false);
      setEditEndTime(false);
      await updateEventById(eventId, {
        startDate: updatedStartTimestamp,
        registrationDeadline: updatedStartTimestamp,
        endDate: updatedEndTimestamp,
      });
    } catch (error) {
      console.error("Failed to update event date and time:", error);
    }
  };

  const handleCancelDateTime = () => {
    const dateString = timestampToDateString(eventStartDate);
    const timeString = timestampToTimeOfDay(eventStartDate);
    const endDateString = timestampToDateString(eventEndDate);
    const endTimeString = timestampToTimeOfDay(eventEndDate);
    setNewEditDate(`${dateString}`);
    setNewEditTime(`${timeString}`);
    setNewEditEndDate(`${endDateString}`);
    setNewEditEndTime(`${endTimeString}`);
    setEditDate(false);
    setEditTime(false);
    setEditEndTime(false);
    setEditEndDate(false);
  };

  const [editLocation, setEditLocation] = useState(false);
  const [newEditLocation, setNewEditLocation] = useState("");
  const [location, setLocation] = useState("");

  useEffect(() => {
    if (eventLocation) {
      setLocation(eventLocation);
      setNewEditLocation(eventLocation);
    }
  }, [eventLocation]);

  const handleLocationUpdate = async () => {
    setLocation(newEditLocation);
    setEditLocation(false);
    const locationTokens = newEditLocation.toLowerCase().split(" ");
    const latLng = await getLocationCoordinates(newEditLocation);
    try {
      await updateEventById(eventId, {
        location: newEditLocation,
        locationTokens,
        locationLatLng: {
          lat: latLng.lat,
          lng: latLng.lng,
        },
      });
    } catch (error) {
      console.error("Failed to update event location:", error);
    }
  };

  const handleCancelLocation = () => {
    setNewEditLocation(location);
    setEditLocation(false);
  };

  const [editPrice, setEditPrice] = useState(false);
  const [newEditPrice, setNewEditPrice] = useState(0);
  const [price, setPrice] = useState(0);

  useEffect(() => {
    if (eventPrice) {
      setPrice(eventPrice);
      setNewEditPrice(eventPrice);
    }
  }, [eventPrice]);

  const handlePriceUpdate = async () => {
    setPrice(newEditPrice);
    setEditPrice(false);
    try {
      await updateEventById(eventId, { price: newEditPrice });
    } catch (error) {
      console.error("Failed to update event price:", error);
    }
  };

  const handleCancelPrice = () => {
    setNewEditPrice(price);
    setEditPrice(false);
  };

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
            className="h-full w-full object-cover rounded-3xl"
          />
        )}
      </div>
      <div className="h-fit border-organiser-darker-light-gray border-solid border-2 rounded-3xl px-4 pt-2 relative">
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
                <div className="flex my-1">
                  <Input
                    value={newEditTitle}
                    style={{
                      fontSize: "1.5rem",
                      width: "100%",
                    }}
                    onChange={(e) => {
                      setNewEditTitle(e.target.value);
                    }}
                    crossOrigin="false"
                  />
                  <CheckIcon
                    className="absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleTitleUpdate();
                    }}
                  />
                  <XMarkIcon
                    className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                    onClick={() => {
                      handleCancelTitle();
                    }}
                  />
                </div>
              ) : (
                <div className="font-bold text-2xl my-1">
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
        <div className={`text-sm flex flex-col mt-4 ${editDate ? "space-y-2" : ""}`}>
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
                <>
                  {editDate ? (
                    <div className="flex">
                      <Input
                        type="date"
                        value={formatStringToDate(newEditDate)}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditDate(formatDateToString(e.target.value));
                        }}
                        crossOrigin="false"
                        label="Start Date"
                      />

                      <Input
                        type="date"
                        value={formatStringToDate(newEditEndDate)}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditEndDate(formatDateToString(e.target.value));
                        }}
                        crossOrigin="false"
                        label="End Date"
                      />
                    </div>
                  ) : (
                    <div>
                      {newEditDate === newEditEndDate ? (
                        <div>{newEditDate}</div>
                      ) : (
                        <div>
                          {newEditDate} - {newEditEndDate}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <ClockIcon className="w-4 mt-2" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                <>
                  {editEndTime ? (
                    <div className="flex">
                      <Input
                        type="time"
                        value={formatTimeTo24Hour(newEditTime)}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditTime(formatTimeTo12Hour(e.target.value));
                        }}
                        crossOrigin="false"
                        label="Start Time"
                      />
                      <Input
                        type="time"
                        value={formatTimeTo24Hour(newEditEndTime)}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditEndTime(formatTimeTo12Hour(e.target.value));
                        }}
                        crossOrigin="false"
                        label="End Time"
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      {newEditTime} - {newEditEndTime}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <MapPinIcon className="w-4 mt-2" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                <>
                  {editLocation ? (
                    <div className="flex">
                      <Input
                        value={newEditLocation}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditLocation(e.target.value);
                        }}
                        crossOrigin="false"
                        label="Location"
                      />
                    </div>
                  ) : (
                    <div className="mt-2">{newEditLocation}</div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <CurrencyDollarIcon className="w-4 mt-2" />
            <div>
              {loading ? (
                <Skeleton
                  style={{
                    height: 10,
                    width: 100,
                  }}
                />
              ) : (
                <>
                  {editPrice ? (
                    <div className="flex">
                      <Input
                        type="number"
                        min="0"
                        value={newEditPrice}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditPrice(Number(e.target.value));
                        }}
                        crossOrigin="false"
                        label="Price"
                      />
                      <CheckIcon
                        className="absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          handleDateTimeUpdate();
                          handleLocationUpdate();
                          handlePriceUpdate();
                        }}
                      />
                      <XMarkIcon
                        className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          handleCancelDateTime();
                          handleCancelLocation();
                          handleCancelPrice();
                        }}
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      ${newEditPrice}
                      <PencilSquareIcon
                        className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          setEditDate(true);
                          setEditTime(true);
                          setEditLocation(true);
                          setEditPrice(true);
                          setEditEndTime(true);
                        }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="min-h-20 border-organiser-darker-light-gray border-solid border-2 rounded-3xl pl-4 pt-2 relative h-fit">
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
                <div className="flex my-2">
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
