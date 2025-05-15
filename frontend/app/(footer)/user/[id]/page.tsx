"use client";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import ChevronLeftButton from "@/components/elements/ChevronLeftButton";
import ChevronRightButton from "@/components/elements/ChevronRightButton";
import EventCard from "@/components/events/EventCard";
import Loading from "@/components/loading/Loading";
import { EventData } from "@/interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData, UserId } from "@/interfaces/UserTypes";
import { getEventById } from "@/services/src/events/eventsService";
import { getPublicUserById } from "@/services/src/users/usersService";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useEffect, useState } from "react";

export default function UserProfilePage({ params }: any) {
  const userId: UserId = params.id;
  const [loading, setLoading] = useState(true);
  const [publicUserProfile, setPublicUserProfile] = useState<PublicUserData>(EmptyPublicUserData);
  const [upcomingOrganiserEvents, setUpcomingOrganiserEvents] = useState<EventData[]>([]);
  useEffect(() => {
    getPublicUserById(userId).then((user) => {
      setPublicUserProfile(user);

      const fetchEvents = async () => {
        const eventPromises = (user.publicUpcomingOrganiserEvents || []).map(
          (eventId) => getEventById(eventId) // Get the event by its ID
        );

        // Wait for all promises to resolve
        const events = await Promise.all(eventPromises);

        // Update the state with the fetched events
        setUpcomingOrganiserEvents(events);
        setLoading(false);
      };

      fetchEvents();
    });
  }, []);

  const scrollLeft = () => {
    document.getElementById("recommended-event-overflow")?.scrollBy({
      top: 0,
      left: -50,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    document.getElementById("recommended-event-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  return loading ? (
    <Loading />
  ) : (
    <div className="mt-16 w-full flex justify-center mb-8">
      <div className="screen-width-primary">
        <div className="md:flex gap-16">
          <div id="col-1" className="pt-8 min-w-80">
            <div className="px-8 py-12 border rounded-xl">
              <div className="flex items-center gap-4">
                <Image
                  priority
                  src={publicUserProfile.profilePicture}
                  alt="DP"
                  width={0}
                  height={0}
                  className="object-cover h-24 w-24 rounded-full overflow-hidden border-black border"
                />
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    {`${publicUserProfile.firstName} ${publicUserProfile.surname}`}{" "}
                    {publicUserProfile.isVerifiedOrganiser && (
                      <div>
                        <Image src={Tick} alt="Verified Organiser" className="h-6 w-6 ml-2" />
                      </div>
                    )}
                  </h2>
                  <p className="font-thin text-sm">{`${publicUserProfile.username}`}</p>
                </div>
              </div>
              <div className="h-[1px] bg-core-outline my-4"></div>
              <div className=" space-y-1">
                <h3 className="text-lg">Contact Information</h3>
                <span className="flex items-center gap-4">
                  <EnvelopeIcon className="w-4 h-4" />
                  <p className="text-xs font-light">
                    {publicUserProfile.publicContactInformation?.email || "Not provided"}
                  </p>
                </span>
                <span className="flex items-center gap-4">
                  <PhoneIcon className="w-4 h-4" />
                  <p className="text-xs font-light">
                    {publicUserProfile.publicContactInformation?.email || "Not provided"}
                  </p>
                </span>
              </div>
            </div>
          </div>
          <div id="col-2" className="pt-8">
            <h1 className="hidden md:block text-3xl font-bold">{`About ${publicUserProfile.firstName} ${publicUserProfile.surname}`}</h1>
            <p className="md:pt-8 pb-6 font-light">
              <RichTextEditorContent description={publicUserProfile.bio || "No bio provided."} />
            </p>
            <div className="h-[1px] bg-core-outline my-4"></div>
          </div>
        </div>
        <div className="block">
          <div className="w-full flex justify-center">
            <div className="flex my-5 w-full">
              <h5 className="font-bold text-lg">{`Upcoming Events by ${publicUserProfile.firstName} ${publicUserProfile.surname}`}</h5>
            </div>
          </div>
        </div>
        {upcomingOrganiserEvents.length !== 0 ? (
          <div className="flex items-center">
            <div className="hidden sm:block pr-2">
              <ChevronLeftButton handleClick={scrollLeft} />
            </div>

            <div id="recommended-event-overflow" className="flex overflow-x-auto pb-4 snap-x snap-mandatory">
              <div className="flex space-x-2 xl:space-x-8">
                {upcomingOrganiserEvents.map((event, i) => {
                  return (
                    <div key={`recommended-event-${i}`} className="snap-start w-[300px] min-h-[250px]">
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
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="hidden sm:block pl-2">
              <ChevronRightButton handleClick={scrollRight} />
            </div>
          </div>
        ) : (
          <p className="font-thin">No upcoming events by this organiser.</p>
        )}
      </div>
    </div>
  );
}
