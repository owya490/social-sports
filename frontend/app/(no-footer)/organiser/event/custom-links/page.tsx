"use client";
import Loading from "@/components/loading/Loading";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import CustomEventLinksTable from "@/components/organiser/event/custom-event-links/CustomEventLinksTable";
import { useUser } from "@/components/utility/UserContext";
import { CustomEventLink } from "@/interfaces/CustomLinkTypes";
import { EventData } from "@/interfaces/EventTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { getAllOrganiserCustomEventLinks } from "@/services/src/events/customEventLinks/customEventLinksService";
import { getEventById } from "@/services/src/events/eventsService";
import { getRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CustomLinks() {
  const { user } = useUser();
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const [activeRecurringTemplates, setActiveRecurringTemplates] = useState<RecurrenceTemplate[]>([]);
  const [links, setLinks] = useState<Record<string, CustomEventLink>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [events, templates, links] = await Promise.all([
          Promise.all(user.publicUpcomingOrganiserEvents.map(async (eventId: string) => await getEventById(eventId))),
          Promise.all(
            user.recurrenceTemplates.map(async (templateId: string) => await getRecurrenceTemplate(templateId))
          ),
          getAllOrganiserCustomEventLinks(user.userId),
        ]);
        const filteredTemplates = templates.filter((template) => template.recurrenceData.recurrenceEnabled);

        setActiveEvents(events);
        setActiveRecurringTemplates(filteredTemplates);
        setLinks(Object.fromEntries(links.map((link) => [link.id, link])));
      } catch (error) {
        console.error("Error fetching custom event links:", error);
        router.push("/error");
      } finally {
        setLoading(false);
      }
    };

    if (user.userId) {
      fetchData();
    }
  }, [user]);
  return loading ? (
    <Loading />
  ) : (
    <div className="sm:ml-14 mt-16">
      <div className="screen-width-primary sm:mx-auto">
        <OrganiserNavbar />
        <div className="text-4xl md:text-3xl lg:text-4xl py-6">Custom Event Links</div>
        <CustomEventLinksTable
          user={user}
          activeEvents={activeEvents}
          activeRecurringTemplates={activeRecurringTemplates}
          links={links}
          setLinks={setLinks}
        />
      </div>
    </div>
  );
}
