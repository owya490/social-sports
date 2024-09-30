"use client";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { useUser } from "@/components/utility/UserContext";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { getOrganiserRecurrenceTemplates } from "@/services/src/recurringEvents/recurringEventsService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function RecurringEventDashboard() {
  const { user } = useUser();
  const router = useRouter();

  const [recurrenceTemplateList, setRecurrenceTemplateList] = useState<RecurrenceTemplate[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const organiserRecurrenceTemplatesList = await getOrganiserRecurrenceTemplates(user.userId);
        setRecurrenceTemplateList(organiserRecurrenceTemplatesList);
      } catch (error) {
        router.push("/error");
      }
    };
    fetchData();
  }, []);
  return (
    <div className="w-screen pt-14 lg:pt-16 lg:pb-10 md:pl-7 h-fit max-h-screen overflow-y-auto">
      <OrganiserNavbar currPage={"EventDashboard"} />
      <div className="flex justify-center">
        <div className="flex flex-col items-center md:items-start"></div>
      </div>
    </div>
  );
}
