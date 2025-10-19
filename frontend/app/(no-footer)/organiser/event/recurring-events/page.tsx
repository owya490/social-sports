"use client";
import RecurringTemplateCard from "@/components/organiser/recurring-events/RecurringTemplateCard";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_RECURRENCE_TEMPLATE, Frequency, RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import {
  calculateRecurrenceEnded,
  getOrganiserRecurrenceTemplates,
} from "@/services/src/recurringEvents/recurringEventsService";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecurringEventDashboard() {
  const logger = new Logger("RecurringEventDashboard");
  const { user } = useUser();
  const router = useRouter();

  const [loadingRecurrenceTemplateList, _setLoadingRecurrenceTemplateList] = useState<RecurrenceTemplate[]>([
    EMPTY_RECURRENCE_TEMPLATE,
    EMPTY_RECURRENCE_TEMPLATE,
    EMPTY_RECURRENCE_TEMPLATE,
    EMPTY_RECURRENCE_TEMPLATE,
  ]);

  const [recurrenceTemplateList, setRecurrenceTemplateList] = useState<RecurrenceTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const organiserRecurrenceTemplatesList = await getOrganiserRecurrenceTemplates(user.userId);
        setRecurrenceTemplateList(organiserRecurrenceTemplatesList);
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to get organiser recurrence templates: ${error}`);
        router.push("/error");
      }
    };
    if (user.userId) {
      fetchData();
    }
  }, [user]);
  return (
    <div className="px-4">
      <div className="flex flex-row justify-between items-center">
        <div className="text-3xl md:text-4xl lg:text-5xl my-6 md:ml-4 lg:ml-0">Recurring Event Templates</div>
      </div>
      <div className="flex justify-center">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 justify-items-center lg:max-h-screen lg:overflow-y-auto lg:h-[80vh] w-full">
            {loadingRecurrenceTemplateList.map((_template, templateIdx) => {
              return (
                <div className="w-full" key={templateIdx}>
                  <RecurringTemplateCard
                    recurrenceTemplateId={""}
                    image={""}
                    name={""}
                    startTime={Timestamp.now()}
                    location={""}
                    price={0}
                    frequency={Frequency.WEEKLY}
                    recurrenceAmount={0}
                    createDaysBefore={0}
                    recurrenceEnabled={false}
                    loading={true}
                    disabled={true}
                  />
                </div>
              );
            })}
          </div>
        ) : recurrenceTemplateList.length === 0 ? (
          <div className="text-center text-gray-500 py-12 md:text-lg">
            <p>No recurring events found</p>
            <p>Create or edit an event to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 justify-items-center lg:max-h-screen lg:overflow-y-auto lg:h-[80vh] w-full">
            {recurrenceTemplateList.map((template, templateIdx) => {
              return (
                <div className="w-full" key={templateIdx}>
                  <RecurringTemplateCard
                    recurrenceTemplateId={template.recurrenceTemplateId}
                    image={template.eventData.image}
                    name={template.eventData.name}
                    startTime={template.eventData.startDate}
                    location={template.eventData.location}
                    price={template.eventData.price}
                    frequency={template.recurrenceData.frequency}
                    recurrenceAmount={template.recurrenceData.recurrenceAmount}
                    createDaysBefore={template.recurrenceData.createDaysBefore}
                    recurrenceEnabled={template.recurrenceData.recurrenceEnabled}
                    disabled={calculateRecurrenceEnded(template)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
