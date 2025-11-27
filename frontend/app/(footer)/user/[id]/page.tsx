"use client";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import Loading from "@/components/loading/Loading";
import EventCollectionCard from "@/components/organiser/event-collection/EventCollectionCard";
import OrganiserCalendar from "@/components/users/profile/OrganiserCalendar";
import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { EventData } from "@/interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserPublicEventCollections } from "@/services/src/eventCollections/eventCollectionsService";
import { getEventById } from "@/services/src/events/eventsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { UserNotFoundError } from "@/services/src/users/userErrors";
import { getPublicUserById, getUsernameMapping } from "@/services/src/users/usersService";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserProfilePage({ params }: any) {
  const userId: UserId = params.id;
  const router = useRouter();
  const logger = new Logger("UserProfilePageLogger");
  const [loading, setLoading] = useState(true);
  const [publicUserProfile, setPublicUserProfile] = useState<PublicUserData>(EmptyPublicUserData);
  const [upcomingOrganiserEvents, setUpcomingOrganiserEvents] = useState<EventData[]>([]);
  const [publicEventCollections, setPublicEventCollections] = useState<EventCollection[]>([]);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"events" | "collections">("events");
  useEffect(() => {
    const fetchEvents = async (user: PublicUserData) => {
      const eventPromises = (user.publicUpcomingOrganiserEvents || []).map(
        (eventId) => getEventById(eventId) // Get the event by its ID
      );

      // Wait for all promises to resolve
      const events = await Promise.all(eventPromises);

      // Update the state with the fetched events
      setUpcomingOrganiserEvents(events);
      return events;
    };

    const fetchCollections = async (userId: UserId) => {
      const collections = await getOrganiserPublicEventCollections(userId);
      setPublicEventCollections(collections);
      return collections;
    };

    const fetchUserProfile = async () => {
      try {
        const userIdMapFromUsername = await getUsernameMapping(userId);
        const user = await getPublicUserById(userIdMapFromUsername.userId);
        setPublicUserProfile(user);

        // Fetch both events and collections in parallel
        await Promise.all([fetchEvents(user), fetchCollections(userIdMapFromUsername.userId)]);
        setLoading(false);
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          try {
            const userById = await getPublicUserById(userId, true);
            setPublicUserProfile(userById);

            // Fetch both events and collections in parallel
            await Promise.all([fetchEvents(userById), fetchCollections(userId)]);
            setLoading(false);
            return;
          } catch (error) {
            logger.error(`Error fetching user profile: ${error}`);
            if (error instanceof UserNotFoundError) {
              router.push("/not-found");
              return;
            }
          }
        }
        router.push(getErrorUrl(error));
      }
    };
    fetchUserProfile();
  }, []);

  return loading ? (
    <Loading />
  ) : (
    <div className="md:mt-6 w-full flex justify-center pb-24">
      <div className="screen-width-primary">
        <div className="md:flex gap-16">
          <div id="col-1" className="pt-8 min-w-80">
            <div className="px-8 py-6 border rounded-xl">
              <div className="flex items-center gap-4">
                <Image
                  priority
                  src={publicUserProfile.profilePicture}
                  alt="DP"
                  width={0}
                  height={0}
                  className="object-cover h-20 w-20 rounded-full overflow-hidden border-black border flex-shrink-0"
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
                    {publicUserProfile.publicContactInformation?.mobile || "Not provided"}
                  </p>
                </span>
              </div>
            </div>
          </div>
          <div id="col-2" className="pt-8">
            <h1 className="hidden md:block text-3xl font-bold">{`About ${publicUserProfile.firstName} ${publicUserProfile.surname}`}</h1>
            <div className="md:pt-8 pb-6">
              <div className={`font-light ${isBioExpanded ? "" : "line-clamp-4"}`}>
                <RichTextEditorContent description={publicUserProfile.bio || "No bio provided."} />
              </div>
              {publicUserProfile.bio && publicUserProfile.bio.length > 100 && (
                <button
                  onClick={() => setIsBioExpanded(!isBioExpanded)}
                  className="text-sm text-core-text hover:underline mt-2 font-medium"
                >
                  {isBioExpanded ? "Read Less" : "Read More"}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="pt-8 md:pt-12">
          <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab("events")}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === "events" ? "text-core-text border-b-2 border-black" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Events
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("collections")}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === "collections"
                  ? "text-core-text border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Collections
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "events" ? (
          <OrganiserCalendar events={upcomingOrganiserEvents} />
        ) : (
          <div className="px-4 md:px-0">
            {publicEventCollections.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No public collections</p>
                <p className="text-gray-500 text-sm mt-2">
                  This organiser hasn't created any public event collections yet
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
                {publicEventCollections.map((collection) => (
                  <EventCollectionCard
                    key={collection.eventCollectionId}
                    collection={collection}
                    organiser={publicUserProfile}
                    loading={false}
                    isPublicView={true}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
