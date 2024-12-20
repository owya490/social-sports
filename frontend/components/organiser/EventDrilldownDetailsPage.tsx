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
import { getLocationCoordinates } from "@/services/src/locationUtils";
import { displayPrice, dollarsToCents } from "@/utilities/priceUtils";
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
  updateData: (id: string, data: any) => Promise<any>;
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
  updateData,
}: EventDrilldownDetailsPageProps) => {
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
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
      await updateData(eventId, { name: newEditTitle, nameTokens });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update event name:", error);
    }
  };

  const handleCancelTitle = () => {
    setNewEditTitle(title);
    setEditTitle(false);
  };

  //TODO: More elegant solution for usestates

  const [editStartDate, setEditStartDate] = useState(false);
  const [newEditStartDate, setNewEditStartDate] = useState("");
  const [startDate, setStartDate] = useState("");

  const [editStartTime, setEditStartTime] = useState(false);
  const [newEditStartTime, setNewEditStartTime] = useState("");
  const [startTime, setStartTime] = useState("");

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
      setStartDate(`${dateString}`);
      setNewEditStartDate(`${dateString}`);
      setStartTime(`${timeString}`);
      setNewEditStartTime(`${timeString}`);
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
      const dateStartTimeString = `${newEditStartDate} ${newEditStartTime}`;
      const updatedStartTimestamp = parseDateTimeStringToTimestamp(dateStartTimeString);
      const dateEndTimeString = `${newEditEndDate} ${newEditEndTime}`;
      const updatedEndTimestamp = parseDateTimeStringToTimestamp(dateEndTimeString);
      setEditStartDate(false);
      setEditStartTime(false);
      setEditEndTime(false);
      await updateData(eventId, {
        startDate: updatedStartTimestamp,
        registrationDeadline: updatedStartTimestamp,
        endDate: updatedEndTimestamp,
      });
      window.location.reload();
    } catch (error) {
      console.error("Failed to update event date and time:", error);
    }
  };

  useEffect(() => {
    const currentDateTime = new Date();
    const selectedStartDateTime = new Date(
      `${formatStringToDate(newEditStartDate)}T${formatTimeTo24Hour(newEditStartTime)}`
    );
    const selectedEndDateTime = new Date(`${formatStringToDate(newEditEndDate)}T${formatTimeTo24Hour(newEditEndTime)}`);

    if (currentDateTime > selectedStartDateTime) {
      setDateWarning("Event start date and time is in the past!");
    } else {
      setDateWarning(null);
    }

    if (selectedEndDateTime < selectedStartDateTime) {
      setTimeWarning("Event must end after it starts!");
    } else {
      setTimeWarning(null);
    }
  }, [newEditStartDate, newEditStartTime, newEditEndDate, newEditEndTime]);

  useEffect(() => {
    setNewEditEndDate(newEditStartDate);
  }, [newEditStartDate]);

  const handleCancelDateTime = () => {
    const dateString = timestampToDateString(eventStartDate);
    const timeString = timestampToTimeOfDay(eventStartDate);
    const endDateString = timestampToDateString(eventEndDate);
    const endTimeString = timestampToTimeOfDay(eventEndDate);
    setNewEditStartDate(`${dateString}`);
    setNewEditStartTime(`${timeString}`);
    setNewEditEndDate(`${endDateString}`);
    setNewEditEndTime(`${endTimeString}`);
    setEditStartDate(false);
    setEditStartTime(false);
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
      await updateData(eventId, {
        location: newEditLocation,
        locationTokens,
        locationLatLng: {
          lat: latLng.lat,
          lng: latLng.lng,
        },
      });
      window.location.reload();
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

  const handleManualNewEditPriceUpdate = (price: number) => {
    setNewEditPrice(dollarsToCents(price));
  };

  const handlePriceUpdate = async () => {
    setPrice(newEditPrice);
    setEditPrice(false);
    try {
      await updateData(eventId, { price: newEditPrice });
      window.location.reload();
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
      <div className="h-fit border-organiser-darker-light-gray border-solid sm:border-2 rounded-3xl px-4 pt-2 relative">
        <div className="text-organiser-title-gray-text font-bold">
          Event Name
          {loading ? (
            <Skeleton className="w-80 sm:w-[400px]" />
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
      <div className="border-organiser-darker-light-gray border-solid sm:border-2 rounded-3xl pl-4 p-2 pb-4 relative">
        <div className="text-organiser-title-gray-text font-bold">Event Details</div>
        <div className={`text-sm flex flex-col mt-4 w-full ${editStartDate ? "space-y-4" : ""}`}>
          <div className="px-2 flex space-x-2 grow w-full">
            <CalendarDaysIcon className="w-4 shrink-0" />
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
                  {editStartDate ? (
                    <div className="sm:flex w-full space-y-4 sm:space-y-0">
                      <Input
                        className="w-80 sm:w-full"
                        type="date"
                        value={formatStringToDate(newEditStartDate)}
                        onChange={(e) => {
                          setNewEditStartDate(formatDateToString(e.target.value));
                        }}
                        crossOrigin="false"
                        label="Start Date"
                      />
                      <div className="mr-2"></div>
                      <Input
                        className="w-80 sm:w-full"
                        type="date"
                        value={formatStringToDate(newEditEndDate)}
                        onChange={(e) => {
                          setNewEditEndDate(formatDateToString(e.target.value));
                        }}
                        crossOrigin="false"
                        label="End Date"
                      />
                    </div>
                  ) : (
                    <div>
                      {newEditStartDate === newEditEndDate ? (
                        <div>{newEditStartDate}</div>
                      ) : (
                        <div>
                          {newEditStartDate} - {newEditEndDate}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="px-2 flex flex-row space-x-2">
            <ClockIcon className="w-4 mt-2 shrink-0" />
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
                    <div className="sm:flex space-y-4 sm:space-y-0">
                      <Input
                        className="w-80 sm:w-full"
                        type="time"
                        value={formatTimeTo24Hour(newEditStartTime)}
                        onChange={(e) => {
                          setNewEditStartTime(formatTimeTo12Hour(e.target.value));
                        }}
                        crossOrigin="false"
                        label="Start Time"
                      />
                      <div className="mr-2"></div>
                      <Input
                        className="w-80 sm:w-full"
                        type="time"
                        value={formatTimeTo24Hour(newEditEndTime)}
                        onChange={(e) => {
                          setNewEditEndTime(formatTimeTo12Hour(e.target.value));
                        }}
                        crossOrigin="false"
                        label="End Time"
                      />
                    </div>
                  ) : (
                    <div className="mt-2">
                      {newEditStartTime} - {newEditEndTime}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {editStartDate ? (
            <>
              {dateWarning && <div className="text-red-600 text-sm mt-2">{dateWarning}</div>}
              {timeWarning && <div className="text-red-600 text-sm mt-2">{timeWarning}</div>}
            </>
          ) : (
            <div></div>
          )}
          <div className="px-2 flex flex-row space-x-2">
            <MapPinIcon className="w-4 mt-2 shrink-0" />
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
                        className="w-80 sm:w-full"
                        value={newEditLocation}
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
            <CurrencyDollarIcon className="w-4 mt-2 shrink-0" />
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
                        className="w-80 sm:w-full"
                        type="number"
                        min="0"
                        value={displayPrice(newEditPrice)}
                        onChange={(e) => {
                          handleManualNewEditPriceUpdate(parseFloat(e.target.value));
                        }}
                        crossOrigin="false"
                        label="Price"
                      />
                      <CheckIcon
                        className={`absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer ${
                          dateWarning || timeWarning ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                        }`}
                        onClick={() => {
                          if (!dateWarning && !timeWarning) {
                            handleDateTimeUpdate();
                            handleLocationUpdate();
                            handlePriceUpdate();
                          }
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
                      ${displayPrice(newEditPrice)}
                      <PencilSquareIcon
                        className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          setEditStartDate(true);
                          setEditStartTime(true);
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
      <div className="min-h-20 border-organiser-darker-light-gray border-solid sm:border-2 rounded-3xl px-4 pt-2 relative w-full sm:h-fit">
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
