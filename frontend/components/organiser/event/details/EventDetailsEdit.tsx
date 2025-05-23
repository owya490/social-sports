import {
  CalendarDaysIcon,
  CheckIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  LinkIcon,
  MapPinIcon,
  PencilSquareIcon,
  StarIcon,
  UserPlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect } from "react";

import { Input, Option, Select, Spinner } from "@material-tailwind/react";

import { EventData } from "@/interfaces/EventTypes";
import {
  formatDateToString,
  formatStringToDate,
  formatTimeTo12Hour,
  formatTimeTo24Hour,
  parseDateTimeStringToTimestamp,
  timestampToDateString,
  timestampToTimeOfDay,
} from "@/services/src/datetimeUtils";
import { updateEventCapacityById } from "@/services/src/events/eventsService";
import { getLocationCoordinates } from "@/services/src/locationUtils";
import { displayPrice, dollarsToCents } from "@/utilities/priceUtils";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import Skeleton from "react-loading-skeleton";

export const EventDetailsEdit = ({
  eventId,
  eventStartDate,
  eventEndDate,
  eventLocation,
  eventSport,
  eventCapacity,
  eventVacancy,
  eventPrice,
  eventRegistrationDeadline,
  eventEventLink,
  loading,
  isActive,
  updateData,
  isRecurrenceTemplate,
}: {
  eventId: string;
  eventStartDate: Timestamp;
  eventEndDate: Timestamp;
  eventLocation: string;
  eventSport: string;
  eventCapacity: number;
  eventVacancy: number;
  eventPrice: number;
  eventRegistrationDeadline: Timestamp;
  eventEventLink: string;
  loading: boolean;
  isActive: boolean;
  updateData: (id: string, data: any) => any;
  isRecurrenceTemplate: boolean;
}) => {
  const [updateLoading, setUpdateLoading] = useState<boolean>(false);
  const [dateWarning, setDateWarning] = useState<string | null>(null);
  const [timeWarning, setTimeWarning] = useState<string | null>(null);
  const [registrationDeadlineWarning, setRegistrationDeadlineWarning] = useState<string | null>(null);
  const [capacityWarning, setCapacityWarning] = useState<string | null>(null);

  // Date and Time
  const [isEdit, setIsEdit] = useState(false);

  const [newEditStartDate, setNewEditStartDate] = useState("");
  const [startDate, setStartDate] = useState("");

  const [newEditStartTime, setNewEditStartTime] = useState("");
  const [startTime, setStartTime] = useState("");

  const [newEditEndDate, setNewEditEndDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [newEditEndTime, setNewEditEndTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleDateTimeUpdate = (): Partial<EventData> => {
    const updatedStartTimestamp = parseDateTimeStringToTimestamp(`${newEditStartDate} ${newEditStartTime}`);
    const updatedEndTimestamp = parseDateTimeStringToTimestamp(`${newEditEndDate} ${newEditEndTime}`);
    return {
      startDate: updatedStartTimestamp,
      endDate: updatedEndTimestamp,
    };
  };

  // Registration Deadline
  const [newEditRegistrationDeadlineDate, setNewEditRegistrationDeadlineDate] = useState("");
  const [registrationDeadlineDate, setRegistrationDeadlineDate] = useState("");

  const [newEditRegistrationDeadlineTime, setNewEditRegistrationDeadlineTime] = useState("");
  const [registrationDeadlineTime, setRegistrationDeadlineTime] = useState("");

  const handleRegistrationDeadlineUpdate = (): Partial<EventData> => {
    const updatedRegistrationDeadline = parseDateTimeStringToTimestamp(
      `${newEditRegistrationDeadlineDate} ${newEditRegistrationDeadlineTime}`
    );
    return {
      registrationDeadline: updatedRegistrationDeadline,
    };
  };

  // Location
  const [newEditLocation, setNewEditLocation] = useState("");
  const [location, setLocation] = useState("");

  const handleLocationUpdate = async (): Promise<Partial<EventData>> => {
    setLocation(newEditLocation);
    const locationTokens = newEditLocation.toLowerCase().split(" ");
    const latLng = await getLocationCoordinates(newEditLocation);

    return {
      location: newEditLocation,
      locationTokens,
      locationLatLng: {
        lat: latLng.lat,
        lng: latLng.lng,
      },
    };
  };

  // Keep end datetime and registration deadline in sync with start date.
  useEffect(() => {
    setNewEditEndDate(newEditStartDate);
    setNewEditRegistrationDeadlineDate(newEditStartDate);
    setNewEditRegistrationDeadlineTime(newEditStartTime);
  }, [newEditStartDate]);

  // Sport
  const [newEditSport, setNewEditSport] = useState("");
  const [sport, setSport] = useState("");

  const handleSportUpdate = (): Partial<EventData> => {
    setSport(newEditSport);
    return { sport: newEditSport };
  };

  // Capacity
  const [newEditCapacity, setNewEditCapacity] = useState(0);
  const [capacity, setCapacity] = useState(0);

  const handleCapacityUpdate = async () => {
    const valid = await updateEventCapacityById(eventId, newEditCapacity);
    if (valid) {
      setCapacity(newEditCapacity);
    } else {
      setNewEditCapacity(capacity);
    }
  };

  // Price
  const [newEditPrice, setNewEditPrice] = useState(0);
  const [price, setPrice] = useState(0);

  const handleManualNewEditPriceUpdate = (price: number) => {
    setNewEditPrice(dollarsToCents(price));
  };

  const handlePriceUpdate = (): Partial<EventData> => {
    setPrice(newEditPrice);
    return { price: newEditPrice };
  };

  // Event Link
  const [newEditEventLink, setNewEditEventLink] = useState("");
  const [eventLink, setEventLink] = useState("");

  const handleEventLinkUpdate = (): Partial<EventData> => {
    setEventLink(newEditEventLink);
    return { eventLink: newEditEventLink };
  };

  // loading useEffect to populate states
  useEffect(() => {
    setNewEditStartDate(timestampToDateString(eventStartDate));
    setStartDate(timestampToDateString(eventStartDate));
    setNewEditStartTime(timestampToTimeOfDay(eventStartDate));
    setStartTime(timestampToTimeOfDay(eventStartDate));
    setNewEditEndDate(timestampToDateString(eventEndDate));
    setEndDate(timestampToDateString(eventEndDate));
    setNewEditEndTime(timestampToTimeOfDay(eventEndDate));
    setEndTime(timestampToTimeOfDay(eventEndDate));

    setNewEditRegistrationDeadlineDate(timestampToDateString(eventRegistrationDeadline));
    setRegistrationDeadlineDate(timestampToDateString(eventRegistrationDeadline));
    setNewEditRegistrationDeadlineTime(timestampToTimeOfDay(eventRegistrationDeadline));
    setRegistrationDeadlineTime(timestampToTimeOfDay(eventRegistrationDeadline));

    setNewEditLocation(eventLocation);
    setLocation(eventLocation);

    setNewEditSport(eventSport);
    setSport(eventSport);

    setNewEditCapacity(eventCapacity);
    setCapacity(eventCapacity);

    setNewEditPrice(eventPrice);
    setPrice(eventPrice);

    setNewEditEventLink(eventEventLink);
    setEventLink(eventEventLink);
  }, [loading]);

  // UseEffect triggered on certain field mutations to ensure entry is valid
  useEffect(() => {
    const currentDateTime = new Date();
    const selectedStartDateTime = new Date(
      `${formatStringToDate(newEditStartDate)}T${formatTimeTo24Hour(newEditStartTime)}`
    );
    const selectedEndDateTime = new Date(`${formatStringToDate(newEditEndDate)}T${formatTimeTo24Hour(newEditEndTime)}`);
    const selectedRegistrationDeadline = new Date(
      `${formatStringToDate(newEditRegistrationDeadlineDate)}T${formatTimeTo24Hour(newEditRegistrationDeadlineTime)}`
    );

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
    if (selectedRegistrationDeadline > selectedEndDateTime) {
      setRegistrationDeadlineWarning("Registration Deadline is after event end!");
    } else {
      setRegistrationDeadlineWarning(null);
    }
    if (newEditCapacity < eventCapacity - eventVacancy) {
      setCapacityWarning("New Capacity cannot be lower than current attendees count.");
    } else {
      setCapacityWarning(null);
    }
  }, [
    newEditStartDate,
    newEditStartTime,
    newEditEndDate,
    newEditEndTime,
    newEditRegistrationDeadlineDate,
    newEditRegistrationDeadlineTime,
    newEditCapacity,
  ]);

  // need to recurring and event snowflake divergence - capacity can be updated freely in recurrence templates
  const handleUpdate = async () => {
    setUpdateLoading(true);
    var data = {
      ...handleDateTimeUpdate(),
      ...handleRegistrationDeadlineUpdate(),
      ...(await handleLocationUpdate()),
      ...handleSportUpdate(),
      ...handlePriceUpdate(),
      ...handleEventLinkUpdate(),
    };
    if (!isRecurrenceTemplate) {
      await handleCapacityUpdate();
    } else {
      data = {
        ...data,
        capacity: newEditCapacity,
        vacancy: newEditCapacity,
      };
    }

    await updateData(eventId, data);
    setUpdateLoading(false);
  };

  const handleCancel = () => {
    setNewEditStartDate(startDate);
    setNewEditStartTime(startTime);
    setNewEditRegistrationDeadlineDate(registrationDeadlineDate);
    setNewEditRegistrationDeadlineTime(registrationDeadlineTime);
    setNewEditEndDate(endDate);
    setNewEditEndTime(endTime);
    setNewEditLocation(location);
    setNewEditSport(sport);
    setNewEditCapacity(capacity);
    setNewEditPrice(price);
    setNewEditEventLink(eventLink);
  };

  return (
    <div className="border-organiser-darker-light-gray pl-4 p-2 pb-4 relative">
      <div className="text-black font-bold">Event Details</div>
      <div className={`text-sm flex flex-col mt-4 w-full ${isEdit ? "space-y-4" : ""}`}>
        <div className="px-2 flex space-x-2 grow w-full">
          <CalendarDaysIcon className="w-4 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
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
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
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
        {isEdit ? (
          <>
            {dateWarning && <div className="text-red-600 text-sm mt-2">{dateWarning}</div>}
            {timeWarning && <div className="text-red-600 text-sm mt-2">{timeWarning}</div>}
          </>
        ) : (
          <div></div>
        )}
        <div className="px-2 flex flex-row space-x-2">
          <ExclamationTriangleIcon className="w-4 mt-2 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
                  <div className="sm:flex space-y-4 sm:space-y-0">
                    <Input
                      className="w-80 sm:w-full"
                      type="date"
                      value={formatStringToDate(newEditRegistrationDeadlineDate)}
                      onChange={(e) => {
                        setNewEditRegistrationDeadlineDate(formatDateToString(e.target.value));
                      }}
                      crossOrigin="false"
                      label="Registration End Date"
                    />
                    <div className="mr-2"></div>
                    <Input
                      className="w-80 sm:w-full"
                      type="time"
                      value={formatTimeTo24Hour(newEditRegistrationDeadlineTime)}
                      onChange={(e) => {
                        setNewEditRegistrationDeadlineTime(formatTimeTo12Hour(e.target.value));
                      }}
                      crossOrigin="false"
                      label="Registration End Time"
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    {newEditRegistrationDeadlineTime} {newEditRegistrationDeadlineDate}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        {isEdit && (
          <>
            {registrationDeadlineWarning && (
              <div className="text-red-600 text-sm mt-2">{registrationDeadlineWarning}</div>
            )}
          </>
        )}
        <div className="px-2 flex flex-row space-x-2">
          <MapPinIcon className="w-4 mt-2 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
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
          <StarIcon className="w-4 mt-2 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
                  <div className="flex">
                    <Select
                      label="Sport"
                      size="lg"
                      value={sport}
                      onChange={(e: string | any) => {
                        setNewEditSport(e);
                      }}
                    >
                      <Option value="volleyball">Volleyball</Option>
                      <Option value="badminton">Badminton</Option>
                      <Option value="basketball">Basketball</Option>
                      <Option value="soccer">Soccer</Option>
                      <Option value="tennis">Tennis</Option>
                      <Option value="table-tennis">Table Tennis</Option>
                      <Option value="oztag">Oztag</Option>
                      <Option value="baseball">Baseball</Option>
                    </Select>
                  </div>
                ) : (
                  <div className="mt-2">{newEditSport}</div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="px-2 flex flex-row space-x-2">
          <UserPlusIcon className="w-4 mt-2 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
                  <div className="flex">
                    <Input
                      className="w-80 sm:w-full"
                      type="number"
                      value={newEditCapacity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          const maxValue = Math.max(value, 0);
                          setNewEditCapacity(maxValue);
                        } else {
                          setNewEditCapacity(0);
                        }
                      }}
                      crossOrigin="false"
                      label="Capacity"
                    />
                  </div>
                ) : (
                  <div className="mt-2">{newEditCapacity}</div>
                )}
              </>
            )}
          </div>
        </div>
        {isEdit && <>{capacityWarning && <div className="text-red-600 text-sm mt-2">{capacityWarning}</div>}</>}
        <div className="px-2 flex flex-row space-x-2">
          <CurrencyDollarIcon className="w-4 mt-2 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
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
                        (dateWarning || timeWarning || registrationDeadlineWarning || capacityWarning) &&
                        !isRecurrenceTemplate
                          ? "opacity-50 cursor-not-allowed"
                          : "cursor-pointer"
                      }`}
                      onClick={() => {
                        if (
                          (!dateWarning && !timeWarning && !registrationDeadlineWarning && !capacityWarning) ||
                          isRecurrenceTemplate
                        ) {
                          handleUpdate();
                          setIsEdit(false);
                        }
                      }}
                    />
                    <XMarkIcon
                      className="absolute top-2 right-2 w-7 stroke-organiser-title-gray-text cursor-pointer"
                      onClick={() => {
                        handleCancel();
                        setIsEdit(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="mt-2">
                    ${displayPrice(newEditPrice)}
                    {isActive &&
                      (updateLoading ? (
                        <Spinner className="absolute top-2 right-2 w-5" />
                      ) : (
                        <PencilSquareIcon
                          className="absolute top-2 right-2 w-5 stroke-organiser-title-gray-text cursor-pointer"
                          onClick={() => {
                            setIsEdit(true);
                          }}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="px-2 flex flex-row space-x-2">
          <LinkIcon className="w-4 mt-2 shrink-0" />
          <div>
            {loading ? (
              <Skeleton
                style={{
                  height: 12,
                  width: 100,
                }}
              />
            ) : (
              <>
                {isEdit ? (
                  <div className="flex">
                    <Input
                      className="w-80 sm:w-full"
                      value={newEditEventLink}
                      onChange={(e) => {
                        setNewEditEventLink(e.target.value);
                      }}
                      crossOrigin="false"
                      label="EventLink"
                    />
                  </div>
                ) : (
                  <div className="mt-2">{newEditEventLink}</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
