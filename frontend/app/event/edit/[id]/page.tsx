"use client";
import Loading from "@/components/Loading";
import { TagGroup } from "@/components/TagGroup";
import EventCard from "@/components/events/EventCard";
import CustomDateInput from "@/components/events/create/CustomDateInput";
import CustomTimeInput from "@/components/events/create/CustomTimeInput";
import DescriptionRichTextEditor from "@/components/events/create/DescriptionRichTextEditor";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import { Tag } from "@/interfaces/TagTypes";
import { getEventById, updateEvent } from "@/services/eventsService";
import { uploadUserImage } from "@/services/imageService";
import { getLocationCoordinates } from "@/services/locationUtils";
import { getAllTags } from "@/services/tagService";
import {
  convertDateAndTimeStringToTimestamp,
  convertTimestampToYYYYMMDDString,
  timestampToTimeOfDay24Hour,
} from "@/utilities/datetimeUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Button, Input, Option, Select } from "@material-tailwind/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditEvent({ params }: any) {
  const eventId: EventId = params.id;
  const { user } = useUser();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [tags, setTags] = useState<Tag[]>([]);

  const [dateString, setDateString] = useState("");
  const [startTimeString, setStartTimeString] = useState("");
  const [endTimeString, setEndTimeString] = useState("");
  const [priceString, setPriceString] = useState("15");
  const [capacityString, setCapacityString] = useState("20");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [image, setImage] = useState<File | undefined>(undefined);

  useEffect(() => {
    const fetchedEventDataPromise = getEventById(eventId);
    const fetchedTagsPromise = getAllTags();

    Promise.all([fetchedEventDataPromise, fetchedTagsPromise])
      .then(([fetchedEventData, fetchedTags]) => {
        setImagePreviewUrl(fetchedEventData.image);
        setEventData(fetchedEventData);
        setTags(fetchedTags);

        // Set necessary strings to allow to display on screen
        setDateString(
          convertTimestampToYYYYMMDDString(fetchedEventData.startDate)
        );
        setStartTimeString(
          timestampToTimeOfDay24Hour(fetchedEventData.startDate)
        );
        setEndTimeString(timestampToTimeOfDay24Hour(fetchedEventData.endDate));
      })
      .then(() => {
        setLoading(false);
      });
  }, []);

  async function uploadImageThenUpdateEvent() {
    setLoading(true);
    const lngLat = await getLocationCoordinates(eventData.location);
    updateEvent(eventId, {
      ...eventData,
      locationLatLng: {
        lat: lngLat.lat,
        lng: lngLat.lng,
      },
      image:
        image === undefined
          ? eventData.image
          : await uploadUserImage(user.userId, image),
    }).then(() => {
      localStorage.removeItem("lastFetchedEventData");
      router.push(`/event/${eventId}`);
    });
  }

  return loading ? (
    <Loading />
  ) : (
    <div className="w-screen flex justify-center">
      <div className="screen-width-primary mt-28 mb-32 flex">
        <div className="w-3/5">
          <div className="flex w-full justify-center">
            <div className="w-4/5">
              <h1 className="text-5xl font-semibold mb-12">Edit Your Event</h1>
              <div className="space-y-12">
                <div>
                  <label className="text-black text-lg font-semibold">
                    What’s the name of your event?
                  </label>
                  <p className="text-sm mb-5 mt-2">
                    This will be your event&apos;s title. Your title will be
                    used to help create your event&apos;s summary, description,
                    category, and tags – so be specific!
                  </p>
                  <Input
                    label="Event Name"
                    crossOrigin={undefined}
                    required
                    value={eventData.name}
                    onChange={(e) => {
                      setEventData({ ...eventData, name: e.target.value });
                    }}
                    className="rounded-md"
                    size="lg"
                  />
                </div>
                <div>
                  <label className="text-black text-lg font-semibold">
                    When does your event start and end?
                  </label>
                  <div className="flex space-x-2 mt-4">
                    <div className="basis-1/2">
                      <CustomDateInput
                        date={dateString}
                        placeholder="Date"
                        handleChange={(e) => {
                          setDateString(e);
                          setEventData({
                            ...eventData,
                            startDate: convertDateAndTimeStringToTimestamp(
                              e,
                              startTimeString
                            ),
                          });
                        }}
                      />
                    </div>
                    <div className="basis-1/4">
                      <CustomTimeInput
                        value={startTimeString}
                        placeholder="Start time"
                        handleChange={(e) => {
                          setStartTimeString(e);
                          setEventData({
                            ...eventData,
                            startDate: convertDateAndTimeStringToTimestamp(
                              dateString,
                              e
                            ),
                          });
                        }}
                      />
                    </div>
                    <div className="basis-1/4">
                      <CustomTimeInput
                        value={endTimeString}
                        placeholder="End time"
                        handleChange={(e) => {
                          setEndTimeString(e);
                          setEventData({
                            ...eventData,
                            endDate: convertDateAndTimeStringToTimestamp(
                              dateString,
                              e
                            ),
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-black text-lg font-semibold">
                    Where is it located?
                  </label>
                  <div className="mt-4">
                    <Input
                      label="Location"
                      crossOrigin={undefined}
                      required
                      value={eventData.location}
                      onChange={(e) => {
                        setEventData({
                          ...eventData,
                          location: e.target.value,
                        }); // need to get lat lng in the final submit
                      }}
                      className="rounded-md"
                      size="lg"
                      icon={<MapPinIcon />}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-black text-lg font-semibold">
                    What Sport is it?
                  </label>
                  <div className="mt-4">
                    <Select
                      label="Select Sport"
                      size="lg"
                      value={eventData.sport}
                      onChange={(e) => {
                        setEventData({ ...eventData, sport: e! });
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
                </div>
                <div>
                  <label className="text-black text-lg font-semibold">
                    What is the price of the event and max capacity?
                  </label>
                  <p className="text-sm mt-2 mb-5">
                    Event price is the cost of each ticket. Event capacity is
                    the total number of tickets you&apos;re willing to sell.
                  </p>
                  <div className="w-full flex space-x-3">
                    <div className="mt-4 grow">
                      <Input
                        label="Price"
                        crossOrigin={undefined}
                        required
                        value={priceString}
                        type="number"
                        onChange={(e) => {
                          setEventData({
                            ...eventData,
                            price: parseInt(
                              e.target.value === "" ? "0" : e.target.value
                            ),
                          });
                          setPriceString(e.target.value);
                        }}
                        className="rounded-md"
                        size="lg"
                        icon={<CurrencyDollarIcon />}
                      />
                    </div>
                    <div className="mt-4 grow">
                      <Input
                        label="Capacity"
                        crossOrigin={undefined}
                        required
                        value={capacityString}
                        type="number"
                        onChange={(e) => {
                          setEventData({
                            ...eventData,
                            capacity: parseInt(
                              e.target.value === "" ? "0" : e.target.value
                            ),
                          });
                          setCapacityString(e.target.value);
                        }}
                        className="rounded-md"
                        size="lg"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-black text-lg font-semibold">
                    Write a Description for your event!
                  </label>
                  <div className="w-full mt-8">
                    <DescriptionRichTextEditor
                      description={eventData.description}
                      updateDescription={(e) => {
                        setEventData({
                          ...eventData,
                          description: e,
                        });
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-black text-lg font-semibold">
                    Upload a photo as your event cover.
                  </label>
                  <div className="w-full mt-8 border border-black rounded-lg relative py-3">
                    <h4 className="absolute -top-3 left-3 text-sm px-1 bg-white">
                      Image
                    </h4>
                    {imagePreviewUrl !== "" && (
                      <Image
                        src={imagePreviewUrl}
                        width={0}
                        height={0}
                        alt="imagePreview"
                        className="h-72 w-fit p-4"
                      />
                    )}
                    <input
                      className="rounded-md ml-4"
                      accept="image/*"
                      type="file"
                      onChange={(e) => {
                        console.log(e.target.files);
                        if (e.target.files !== null) {
                          console.log(URL.createObjectURL(e.target.files![0]));
                          setImagePreviewUrl(
                            URL.createObjectURL(e.target.files![0])
                          );
                          setImage(e.target.files[0]);
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-black text-lg font-semibold">
                    Search and select relevant tags?
                  </label>
                  <div className="relative flex w-full max-w-[32rem] my-8">
                    <Input
                      label="Tag Search"
                      value={""}
                      className="pr-20"
                      containerProps={{
                        className: "min-w-0",
                      }}
                      onChange={() => {}}
                      crossOrigin={undefined}
                    />
                    <Button
                      size="sm"
                      className="!absolute right-1 top-1 rounded"
                    >
                      Search
                    </Button>
                  </div>
                  <div className="w-full flex flex-wrap">
                    <TagGroup tags={tags} spacing={true} size="sm" />
                  </div>
                </div>
              </div>
              <button
                className="bg-black rounded-lg py-3 px-4 text-white font-semibold mt-12"
                onClick={uploadImageThenUpdateEvent}
              >
                UPDATE EVENT
              </button>
            </div>
          </div>
        </div>
        <div className="w-2/5">
          <div className="sticky top-24 mt-24">
            <EventCard
              {...eventData}
              image={imagePreviewUrl}
              vacancy={eventData.capacity - eventData.attendees.length}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
