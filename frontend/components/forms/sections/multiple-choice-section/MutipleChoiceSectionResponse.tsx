import { MultipleChoiceSection } from "@/interfaces/FormTypes";
import { Radio } from "@material-tailwind/react";
import Image from "next/image";

export const MutipleChoiceSectionResponse = ({
  multipleChoiceSection,
  answerOnChange,
}: {
  multipleChoiceSection: MultipleChoiceSection;
  answerOnChange: (answer: string) => void;
}) => {
  return (
    <div className="flex bg-white p-8 rounded-xl flex-col gap-4">
      <h1 className="font-bold text-xl">{multipleChoiceSection.question}</h1>
      {multipleChoiceSection.imageUrl && (
        <Image src={multipleChoiceSection.imageUrl} alt={""} width={0} height={0} className="h-40 aspect-video" />
      )}
      <div className="grid grid-cols-2">
        {multipleChoiceSection.options.map((option, idx) => {
          return (
            <Radio
              className="focus:ring-0"
              name={option}
              value={option}
              label={option}
              crossOrigin={undefined}
              checked={multipleChoiceSection.answer === option ? true : false}
              onChange={(e) => {
                answerOnChange(e.target.value);
              }}
            />
          );
        })}
      </div>
      {multipleChoiceSection.required && <span className="text-red-700 ml-auto">* Required</span>}
    </div>
  );
};
