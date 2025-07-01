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

import { useEffect, useState } from "react";

export default function CustomLinks() {
  const { user } = useUser();
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const [activeRecurringTemplates, setActiveRecurringTemplates] = useState<RecurrenceTemplate[]>([]);
  const [links, setLinks] = useState<CustomEventLink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const events = Promise.all(
        user.publicUpcomingOrganiserEvents.map(async (eventId) => await getEventById(eventId))
      );
      events.then((events) => setActiveEvents(events));
    };
    const fetchRecurringTemplates = async () => {
      const templates = Promise.all(
        user.recurrenceTemplates.map(async (templateId) => await getRecurrenceTemplate(templateId))
      );
      templates.then((templates) => setActiveRecurringTemplates(templates));
    };

    const fetch = async () => {
      await fetchEvents();
      await fetchRecurringTemplates();
      const links = await getAllOrganiserCustomEventLinks(user.userId);
      setLinks(links);
      setLoading(false);
    };

    if (user.userId) {
      fetch();
    }
  }, [user]);
  return loading ? (
    <Loading />
  ) : (
    <div className="sm:ml-14 mt-16">
      <div className="screen-width-primary sm:mx-auto">
        <OrganiserNavbar currPage="EventDashboard" />
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
