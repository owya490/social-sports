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
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";
import DescriptionRichTextEditor from "../events/create/DescriptionRichTextEditor";
import { updateEventByName } from "@/services/src/events/eventsService";

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
  const [newEditTitle, setNewEditTitle] = useState("");
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (eventName) {
      setTitle(eventName);
      setNewEditTitle(eventName);
    }
  }, [eventName]);

  const handleTitleUpdate = () => {
    setTitle(newEditTitle);
    // Update to firestore
    setEditTitle(false);
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

  const handleDateUpdate = () => {
    setDate(newEditDate);
    // Update to firestore
    setEditDate(false);
  };

  const handleCancelDate = () => {
    setNewEditDate(date);
    setEditDate(false);
  };

  const handleTimeUpdate = () => {
    setTime(newEditTime);
    // Update to firestore
    setEditTime(false);
  };

  const handleCancelTime = () => {
    setNewEditTime(time);
    setEditTime(false);
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

  const handleLocationUpdate = () => {
    setLocation(newEditLocation);
    // Update to firestore
    setEditLocation(false);
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

  const handlePriceUpdate = () => {
    setPrice(newEditPrice);
    // Update to firestore
    setEditPrice(false);
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
                    crossOrigin={false}
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
                        crossOrigin={false}
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
                  {editDate ? (
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
                        crossOrigin={false}
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
                        crossOrigin={false}
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
                        value={newEditPrice}
                        style={{
                          width: "100%",
                        }}
                        onChange={(e) => {
                          setNewEditPrice(Number(e.target.value));
                        }}
                        crossOrigin={false}
                      />
                      <CheckIcon
                        className="absolute top-2 right-9 w-7 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          handleDateUpdate();
                          handleTimeUpdate();
                          handleLocationUpdate();
                          handlePriceUpdate();
                        }}
                      />
                      <XMarkIcon
                        className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                        onClick={() => {
                          handleCancelDate();
                          handleCancelTime();
                          handleCancelLocation();
                          handleCancelPrice();
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
