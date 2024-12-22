"use client";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import RecurringTemplateCard from "@/components/organiser/recurring-events/RecurringTemplateCard";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_RECURRENCE_TEMPLATE, Frequency, RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import noSearchResultLineDrawing from "@/public/images/no-search-result-line-drawing.jpg";
import { getOrganiserRecurrenceTemplates } from "@/services/src/recurringEvents/recurringEventsService";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecurringEventDashboard() {
  const { user } = useUser();
  const router = useRouter();

  const [loadingRecurrenceTemplateList, setLoadingRecurrenceTemplateList] = useState<RecurrenceTemplate[]>([
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
        router.push("/error");
      }
    };
    if (user.userId) {
      fetchData();
    }
  }, [user]);
  return (
    <div className="w-screen pt-14 lg:pt-16 lg:pb-10 md:pl-7 h-fit max-h-screen overflow-y-auto">
      <OrganiserNavbar currPage={"EventDashboard"} />
      <div className="flex justify-center">
        <div className="flex flex-col items-center md:items-start">
          <div className="flex flex-row items-center justify-center">
            <div className="text-4xl md:text-5xl lg:text-6xl my-6 ml-4">Recurring Event Templates</div>
          </div>
          <div className="flex flex-row h-full w-full">
            <div className="hidden lg:block"></div>
            {loading ? (
              <div className="z-5 grid grid-cols-1 xl:grid-cols-2 gap-8 justify-items-center px-4 min-w-[300px] lg:min-w-[640px] 2xl:min-w-[1032px] 3xl:min-w-[1372px] h-[68vh] lg:h-[80vh]">
                {loadingRecurrenceTemplateList.map((template, templateIdx) => {
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
                      />
                    </div>
                  );
                })}
              </div>
            ) : recurrenceTemplateList.length === 0 ? (
              <div className="flex justify-center">
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
            ) : (
              <div className="z-5 grid grid-cols-1 xl:grid-cols-2 gap-6 justify-items-center px-4 min-w-[300px] lg:min-w-[640px] 2xl:min-w-[1032px] 3xl:min-w-[1372px] h-[68vh] lg:h-auto">
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
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
