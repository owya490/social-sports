"use client";

import Loading from "@/components/loading/Loading";
import EventCollectionCard from "@/components/organiser/event-collection/EventCollectionCard";
import OrganiserEventsBrowse from "@/components/users/profile/OrganiserEventsBrowse";
import { UserProfileHeader } from "@/components/users/profile/UserProfileHeader";
import { EventCollection } from "@/interfaces/EventCollectionTypes";
import { EventData } from "@/interfaces/EventTypes";
import { EmptyPublicUserData, PublicUserData, UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getOrganiserPublicEventCollections } from "@/services/src/eventCollections/eventCollectionsService";
import { getEventById } from "@/services/src/events/eventsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { UserNotFoundError } from "@/services/src/users/userErrors";
import { getPublicUserById, getUsernameMapping } from "@/services/src/users/usersService";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type ProfileTab = "events" | "collections";

export default function UserProfilePage() {
  const params = useParams<{ id: string }>();
  const userId = params.id as UserId;
  const router = useRouter();
  const logger = new Logger("UserProfilePageLogger");
  const [loading, setLoading] = useState(true);
  const [publicUserProfile, setPublicUserProfile] = useState<PublicUserData>(EmptyPublicUserData);
  const [upcomingOrganiserEvents, setUpcomingOrganiserEvents] = useState<EventData[]>([]);
  const [publicEventCollections, setPublicEventCollections] = useState<EventCollection[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("events");

  useEffect(() => {
    const fetchEvents = async (user: PublicUserData) => {
      const eventPromises = (user.publicUpcomingOrganiserEvents || []).map((eventId) => getEventById(eventId));
      const events = await Promise.all(eventPromises);
      setUpcomingOrganiserEvents(events);
      return events;
    };

    const fetchCollections = async (resolvedUserId: UserId) => {
      const collections = await getOrganiserPublicEventCollections(resolvedUserId);
      setPublicEventCollections(collections);
      return collections;
    };

    const fetchUserProfile = async () => {
      try {
        const userIdMapFromUsername = await getUsernameMapping(userId, true);
        const user = await getPublicUserById(userIdMapFromUsername.userId);
        setPublicUserProfile(user);
        await Promise.all([fetchEvents(user), fetchCollections(userIdMapFromUsername.userId)]);
        setLoading(false);
      } catch (error) {
        if (error instanceof UserNotFoundError) {
          try {
            const userById = await getPublicUserById(userId, true);
            setPublicUserProfile(userById);
            await Promise.all([fetchEvents(userById), fetchCollections(userId)]);
            setLoading(false);
            return;
          } catch (innerError) {
            logger.error(`Error fetching user profile: ${innerError}`);
            if (innerError instanceof UserNotFoundError) {
              router.push("/not-found");
              return;
            }
          }
        }
        router.push(getErrorUrl(error));
      }
    };
    void fetchUserProfile();
  }, [userId, router]);

  if (loading) {
    return <Loading />;
  }

  const tabs: { id: ProfileTab; label: string }[] = [
    { id: "events", label: "Events" },
    { id: "collections", label: "Collections" },
  ];

  return (
    <div className="min-h-screen bg-surface text-foreground pb-16">
      {/* White organiser identity band (Luma: hero + profile sit on white) */}
      <UserProfileHeader user={publicUserProfile} />

      {/* Grey stage for events / collections */}
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 sm:pt-6">
          <div
            role="tablist"
            aria-label="Profile sections"
            className="flex items-center gap-1 border-b border-border"
          >
            {tabs.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 text-sm font-semibold font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                    active
                      ? "text-foreground border-b-2 border-foreground -mb-px"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="pt-5 sm:pt-6">
            {activeTab === "events" ? (
              <OrganiserEventsBrowse
                events={upcomingOrganiserEvents}
                emptyTitle="No upcoming events"
                emptyDescription="This organiser hasn't published any upcoming events yet."
              />
            ) : publicEventCollections.length === 0 ? (
              <div className="rounded-xl border border-border bg-background px-5 py-12 text-center">
                <p className="text-sm font-semibold text-foreground font-sans">No public collections</p>
                <p className="mt-1 text-xs text-foreground-muted font-sans">
                  This organiser hasn&apos;t created any public event collections yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
        </div>
      </div>
    </div>
  );
}
