import {
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PencilSquareIcon,
  PlayCircleIcon,
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
  eventStartdate: Timestamp;
  eventDescription: string;
  eventLocation: string;
  eventPrice: number;
  eventImage: string;
  eventId: string;
  eventDuration: { hrs: number; mins: number };
}

const EventDrilldownDetailsPage = ({
  loading,
  eventName,
  eventStartdate,
  eventDescription,
  eventLocation,
  eventPrice,
  eventImage,
  eventId,
  eventDuration,
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
      await updateEventById(eventId, { name: newEditTitle, nameTokens });
      setEditTitle(false);
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

  useEffect(() => {
    if (eventStartdate) {
      const dateString = timestampToDateString(eventStartdate);
      const timeString = timestampToTimeOfDay(eventStartdate);
      setDate(`${dateString}`);
      setNewEditDate(`${dateString}`);
      setTime(`${timeString}`);
      setNewEditTime(`${timeString}`);
    }
  }, [eventStartdate]);

  const handleDateTimeUpdate = async () => {
    const dateTimeString = `${newEditDate} ${newEditTime}`;
    const updatedTimestamp = parseDateTimeStringToTimestamp(dateTimeString);

    try {
      await updateEventById(eventId, { startDate: updatedTimestamp, registrationDeadline: updatedTimestamp });
      setEditDate(false);
      setEditTime(false);
    } catch (error) {
      console.error("Failed to update event date and time:", error);
    }
  };

  const handleCancelDateTime = () => {
    const dateString = timestampToDateString(eventStartdate);
    const timeString = timestampToTimeOfDay(eventStartdate);
    setNewEditDate(`${dateString}`);
    setNewEditTime(`${timeString}`);
    setEditDate(false);
    setEditTime(false);
  };

  const [editDurationHrs, setEditDurationHrs] = useState(false);
  const [newEditDurationHrs, setNewEditDurationHrs] = useState(0);
  const [durationHrs, setDurationHrs] = useState(0);

  const [editDurationMins, setEditDurationMins] = useState(false);
  const [newEditDurationMins, setNewEditDurationMins] = useState(0);
  const [durationMins, setDurationMins] = useState(0);

  useEffect(() => {
    if (eventDuration) {
      setDurationHrs(eventDuration.hrs);
      setNewEditDurationHrs(eventDuration.hrs);
      setDurationMins(eventDuration.mins);
      setNewEditDurationMins(eventDuration.mins);
    }
  }, [eventDuration]);

  const handleDurationUpdate = async () => {
    try {
      await updateEventById(eventId, { duration: { hrs: newEditDurationHrs, mins: newEditDurationMins } });
      setEditDurationHrs(false);
      setEditDurationMins(false);
    } catch (error) {
      console.error("Failed to update event duration:", error);
    }
  };

  const handleCancelDuration = () => {
    setNewEditDurationHrs(durationHrs);
    setNewEditDurationMins(durationMins);
    setEditDurationHrs(false);
    setEditDurationMins(false);
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
      setEditLocation(false);
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
    try {
      await updateEventById(eventId, { price: newEditPrice });
      setEditPrice(false);
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
    try {
      await updateEventById(eventId, { description: newEditDescription });
      setEditDescription(false);
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
                <>
                  {editDate ? (
                    <div className="flex my-1">
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
                      />
                    </div>
                  ) : (
                    <div>{newEditDate}</div>
                  )}
                </>
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
                <>
                  {editTime ? (
                    <div className="flex my-1">
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
                      />
                    </div>
                  ) : (
                    <div>{newEditTime}</div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <PlayCircleIcon className="w-4" />
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
                  {editDurationHrs || editDurationMins ? (
                    <div className="flex my-1">
                      <Input
                        type="text"
                        min="0"
                        value={`${newEditDurationHrs * 60 + newEditDurationMins} mins`}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          const totalMinutes = parseInt(e.target.value);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          setNewEditDurationHrs(hours);
                          setNewEditDurationMins(minutes);
                          // setNewEditDurationHrs(newEditDurationHrs);
                          // setNewEditDurationMins(newEditDurationMins);
                        }}
                        crossOrigin="false"
                      />
                    </div>
                  ) : (
                    <div>
                      {newEditDurationHrs} hrs {newEditDurationMins} mins
                    </div>
                  )}
                </>
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
                <>
                  {editLocation ? (
                    <div className="flex my-1">
                      <Input
                        value={newEditLocation}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditLocation(e.target.value);
                        }}
                        crossOrigin="false"
                      />
                    </div>
                  ) : (
                    <div>{newEditLocation}</div>
                  )}
                </>
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
                <>
                  {editPrice ? (
                    <div className="flex my-1">
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
                      />
                      <CheckIcon
                        className="absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          handleDateTimeUpdate();
                          handleLocationUpdate();
                          handlePriceUpdate();
                          handleDurationUpdate();
                        }}
                      />
                      <XMarkIcon
                        className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          handleCancelDateTime();
                          handleCancelLocation();
                          handleCancelPrice();
                          handleCancelDuration();
                        }}
                      />
                    </div>
                  ) : (
                    <div>
                      ${newEditPrice}
                      <PencilSquareIcon
                        className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          setEditDate(true);
                          setEditTime(true);
                          setEditLocation(true);
                          setEditPrice(true);
                          setEditDurationHrs(true);
                          setEditDurationMins(true);
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
