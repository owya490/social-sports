"use client";
import FilterBanner from "@/components/Filter/FilterBanner";
import EventCard from "@/components/events/EventCard";
import { UserCard } from "@/components/users/UserCard";
import { EmptyEventData, EventData, SearchType } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import { getAllEvents, getEventById, searchEventsByKeyword } from "@/services/src/events/eventsService";
import {
  getAllPublicUsers,
  getPublicUserById,
  getUsernameMapping,
  searchUserByKeyword,
} from "@/services/src/users/usersService";
import { sleep } from "@/utilities/sleepUtil";
import { Alert } from "@material-tailwind/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

export default function Dashboard() {
  const [loading, setLoading] = useState<boolean>(true);
  const [allEventsDataList, setAllEventsDataList] = useState<EventData[]>([]);
  const [eventDataList, setEventDataList] = useState<EventData[]>([
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
    EmptyEventData,
  ]);
  const [searchDataList, setSearchDataList] = useState<EventData[]>([]);
  const [showLoginSuccess, setShowLoginSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [_srcLocation, setSrcLocation] = useState<string>("");
  const [triggerFilterApply, setTriggerFilterApply] = useState<boolean | undefined>(undefined);
  const [endLoading, setEndLoading] = useState<boolean | undefined>(undefined);
  const [publicUserDataList, setPublicUserDataList] = useState<PublicUserData[]>([]);
  const [searchType, setSearchType] = useState<SearchType>(SearchType.EVENT);

  const getQueryParams = () => {
    // if (typeof window === "undefined") {
    if (window === undefined) {
      // Return some default or empty values when not in a browser environment
      return { event: null, location: null, user: null };
    }
    const searchParams = new URLSearchParams(window.location.search);
    console.log(searchParams);
    console.log(searchParams.get("event"));
    console.log(searchParams.get("location"));
    console.log(searchParams.get("user"));
    return {
      event: searchParams.get("event"),
      location: searchParams.get("location"),
      user: searchParams.get("user"),
    };
  };

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  });

  function determineSearchType(
    eventParameter: string | null,
    locationParameter: string | null,
    userParameter: string | null
  ): SearchType {
    var type = SearchType.EVENT;
    if (eventParameter !== null) {
      type = SearchType.EVENT;
    } else if (userParameter !== null) {
      type = SearchType.USER;
    } else {
      type = SearchType.EVENT;
    }
    setSearchType(type);
    return type;
  }

  useEffect(() => {
    const fetchSearch = async () => {
      setLoading(true);
      const { event, location, user } = getQueryParams();
      const type = determineSearchType(event, location, user);
      console.log("type: " + type.toString());
      switch (type) {
        case SearchType.EVENT:
          console.log("search type is event");
          await fetchEvents(event || "", location || "");
          return;
        case SearchType.USER:
          console.log("search type is user");
          await fetchUsers(user || "");
          return;
        default:
          console.log("search type is default");
          await fetchEvents(event || "", location || "");
          return;
      }
    };

    const fetchEvents = async (event: string, location: string) => {
      await sleep(500);
      if (event === "UNDEFINED") {
        console.log("owen");
        return false;
      }

      if (typeof event === "string" && typeof location === "string") {
        if (event.trim() === "") {
          console.log("no event name");
          getAllEvents().then((events) => {
            console.log(events);
            setEventDataList(events);
            setSearchDataList(events);
            setAllEventsDataList(events);
          });
        } else {
          searchEventsByKeyword(event, location)
            .then(async (events) => {
              let tempEventDataList: EventData[] = [];
              for (const singleEvent of events) {
                const eventData = await getEventById(singleEvent.eventId);
                tempEventDataList.push(eventData);
              }
              return tempEventDataList;
            })
            .then((tempEventDataList: EventData[]) => {
              setEventDataList(tempEventDataList);
              setSearchDataList(tempEventDataList);
            })
            .catch(() => {
              router.push("/error");
            });
        }
      }
      setSrcLocation(location);
      if (location.trim() !== "") {
        if (triggerFilterApply === undefined) {
          setTriggerFilterApply(false);
        } else {
          setTriggerFilterApply(!triggerFilterApply);
        }
      } else {
        setLoading(false);
      }
    };

    const fetchUsers = async (user: string) => {
      try {
        if (typeof user === "string") {
          // if the search is empty, get everyone and display
          if (user.trim() === "") {
            getAllPublicUsers().then((users) => {
              setPublicUserDataList(users);
            });
          } else {
            // the search is not empty
            // 1. try search the user up by username and if so add it to the first element of the list
            var users: PublicUserData[] = [];
            try {
              const { userId } = await getUsernameMapping(user);
              users.push(await getPublicUserById(userId));
            } catch (error) {
              // no-op - this is fine, just search normally
            }
            // 2. if it doesn't exist, try do token search
            users = [...users, ...(await searchUserByKeyword(user))];
            setPublicUserDataList(users);
          }
        }
      } catch (error) {
        router.push("/error");
      }
      setEventDataList([]);
      setLoading(false);
    };

    setLoading(true);
    fetchSearch();
  }, [searchParams]);

  // useEffect listener for when filtering finishes
  useEffect(() => {
    const finishLoading = async () => {
      if (endLoading !== undefined) {
        // Something wrong with endLoading in the filter stuff
        await sleep(500);
        setLoading(false);
      }
    };
    finishLoading();
  }, [endLoading]);

  useEffect(() => {
    const login = searchParams?.get("login");
    if (login === "success") {
      setShowLoginSuccess(true);

      router.replace("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    let timer: number | undefined;

    if (showLoginSuccess) {
      timer = window.setTimeout(() => {
        setShowLoginSuccess(false);
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [showLoginSuccess]);

  return (
    <div>
      <div className="flex justify-center">
        <FilterBanner
          eventDataList={searchDataList}
          allEventsDataList={allEventsDataList}
          setEventDataList={setEventDataList}
          // srcLocation={srcLocation} // DISABLED LOCATION SEARCH FOR NOW
          srcLocation={""}
          setSrcLocation={setSrcLocation}
          triggerFilterApply={triggerFilterApply}
          endLoading={endLoading}
          setEndLoading={setEndLoading}
        />
      </div>
      <div className="absolute ml-auto mr-auto left-0 right-0 top-32 w-fit z-50">
        <Alert open={showLoginSuccess} color="green">
          Successfully logged in!
        </Alert>
      </div>
      <div className="md:flex justify-center w-full mt-4 px-3 sm:px-20 lg:px-3 pb-10">
        {loading === false && eventDataList.length === 0 && publicUserDataList.length === 0 && (
          <div className="flex justify-center z-10">
            <div>
              <Image
                src={noSearchResultLineDrawing}
                alt="noSearchResultLineDrawing"
                width={500}
                height={300}
                className="opacity-60"
              />
              <div className="text-gray-600 font-medium text-lg sm:text-2xl text-center">
                Sorry, we couldn&apos;t find any results
              </div>
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 3xl:grid-cols-6 gap-4 lg:gap-8 w-full lg:px-10 xl:px-16 2xl:px-24 3xl:px-40">
          {searchType === SearchType.USER
            ? publicUserDataList
                .filter((user) => user.isSearchable)
                .map((user, userIdx) => {
                  return (
                    <UserCard
                      key={userIdx}
                      userId={user.userId}
                      firstName={user.firstName}
                      surname={user.surname}
                      username={user.username}
                      email={user.publicContactInformation.email}
                      image={user.profilePicture}
                      loading={loading}
                    />
                  );
                })
            : eventDataList
                .sort((a, b) => b.accessCount - a.accessCount)
                .map((event, eventIdx) => {
                  return (
                    <EventCard
                      eventId={event.eventId}
                      image={event.image}
                      thumbnail={event.thumbnail}
                      name={event.name}
                      organiser={event.organiser}
                      startTime={event.startDate}
                      location={event.location}
                      price={event.price}
                      vacancy={event.vacancy}
                      loading={loading}
                      key={eventIdx}
                    />
                  );
                })}
        </div>
      </div>
    </div>
  );
}
