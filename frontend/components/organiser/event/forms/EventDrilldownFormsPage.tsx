import { Form, FormResponse, FormSectionType } from "@/interfaces/FormTypes";
import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";

interface EventDrilldownFormsPageProps {
  form: Form;
  formResponse: FormResponse;
}

const getAnswerDisplay = (section: any): string | JSX.Element => {
  if (!section) return "—";

  switch (section.type) {
    case FormSectionType.TEXT:
      return section.answer || "—";
    case FormSectionType.MULTIPLE_CHOICE:
      return section.answer !== null ? section.options[section.answer] : "—";
    case FormSectionType.DROPDOWN_SELECT:
      return section.answer || "—";
    case FormSectionType.BINARY_CHOICE:
      if (section.answer === 0) return section.choice1;
      if (section.answer === 1) return section.choice2;
      return "—";
    case FormSectionType.FILE_UPLOAD:
      return section.fileUrl ? (
        <a href={section.fileUrl} className="text-blue-500 underline" target="_blank" rel="noopener noreferrer">
          View File
        </a>
      ) : (
        "—"
      );
    case FormSectionType.DATE_TIME:
      return section.timestamp ? new Date(section.timestamp).toLocaleString() : "—";
    default:
      return "—";
  }
};

const EventDrilldownFormsPage = ({form, formResponse }: EventDrilldownFormsPageProps) => {
  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Form Responses</div>
      </div>
      <div className="flex flex-col overflow-x-auto">
        <div className="min-w-max grid auto-cols-max grid-flow-col justify-start text-organiser-title-gray-text font-bold text-xs md:text-base">
          {form.sectionsOrder.map((sectionId) => {
            const section = form.sectionsMap.get(sectionId);
            return (
              <div key={sectionId} className="px-4 py-2 whitespace-nowrap border-b border-gray-300">
                {section?.question || "Untitled Question"}
              </div>
            );
          })}
          <div className="px-1.5 flex items-center">
            <EllipsisVerticalIcon className="w-6 stroke-0" />
          </div>
        </div>

        <div className="inline-block w-full h-0.5 my-0 md:my-2 self-stretch bg-organiser-title-gray-text"></div>

        <div className="min-w-max grid auto-cols-max grid-flow-col justify-start text-xs md:text-base">
          {form.sectionsOrder.map((sectionId) => {
            const section = formResponse.responseMap.get(sectionId);
            return (
              <div key={sectionId} className="px-4 py-2 whitespace-nowrap border-b border-gray-300">
                {getAnswerDisplay(section)}
              </div>
            );
          })}
          <div className="px-1.5 flex items-center">
            <EllipsisVerticalIcon className="w-6 stroke-0" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDrilldownFormsPage;
