import { DropdownSelectSection } from "@/interfaces/FormTypes";
import { Option, Select } from "@material-tailwind/react";
import Image from "next/image";

export const DropdownSelectSectionResponse = ({
  dropdownSelectSection,
  answerOnChange,
  canEdit,
}: {
  dropdownSelectSection: DropdownSelectSection;
  answerOnChange: (answer: string) => void;
  canEdit: boolean;
}) => {
  return (
    <div className="flex bg-white p-8 rounded-xl flex-col gap-4">
      <h1 className="font-bold text-xl">{dropdownSelectSection.question}</h1>
      {dropdownSelectSection.imageUrl && (
        <Image src={dropdownSelectSection.imageUrl} alt={""} width={0} height={0} className="h-40 aspect-video" />
      )}
      <Select
        label="Select answer here"
        onChange={(e) => {
          answerOnChange(e!);
        }}
        value={dropdownSelectSection.answer}
        disabled={!canEdit}
      >
        {dropdownSelectSection.options.map((option, idx) => {
          return (
            <Option key={idx} value={option}>
              {option}
            </Option>
          );
        })}
      </Select>
      {dropdownSelectSection.required && <span className="text-red-700 ml-auto">* Required</span>}
    </div>
  );
};
