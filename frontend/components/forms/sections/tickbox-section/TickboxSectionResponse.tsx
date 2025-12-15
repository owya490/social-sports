import { TickboxSection } from "@/interfaces/FormTypes";
import { Checkbox } from "@material-tailwind/react";
import Image from "next/image";

export const TickboxSectionResponse = ({
  tickboxSection,
  answerOnChange,
  canEdit,
}: {
  tickboxSection: TickboxSection;
  answerOnChange: (answer: string[]) => void;
  canEdit: boolean;
}) => {
  const handleCheckboxChange = (option: string, checked: boolean) => {
    const currentAnswers = tickboxSection.answer || [];
    let newAnswers: string[];

    if (checked) {
      newAnswers = [...currentAnswers, option];
    } else {
      newAnswers = currentAnswers.filter((a) => a !== option);
    }
    answerOnChange(newAnswers);
  };

  return (
    <div className="flex bg-white p-8 rounded-xl flex-col gap-4">
      <h1 className="font-bold text-xl">{tickboxSection.question}</h1>
      {tickboxSection.imageUrl && (
        <Image src={tickboxSection.imageUrl} alt={""} width={0} height={0} className="h-40 aspect-video" />
      )}
      <div className="flex flex-col gap-2">
        {tickboxSection.options.map((option, idx) => {
          const isChecked = tickboxSection.answer?.includes(option) || false;
          return (
            <Checkbox
              key={idx}
              label={option}
              checked={isChecked}
              onChange={(e) => handleCheckboxChange(option, e.target.checked)}
              disabled={!canEdit}
              crossOrigin={undefined}
              color="gray"
              className="checked:!bg-black checked:!border-black focus:!border-black hover:before:!bg-black focus:before:!bg-transparent focus:ring-0 focus:shadow-none focus:outline-none"
              ripple={false}
            />
          );
        })}
      </div>
      {tickboxSection.required && <span className="text-red-700 ml-auto">* Required</span>}
    </div>
  );
};
