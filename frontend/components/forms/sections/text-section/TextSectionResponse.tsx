"use client";
import { TextSection } from "@/interfaces/FormTypes";
import { Textarea } from "@material-tailwind/react";
import Image from "next/image";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const TextSectionResponse = ({
  textSection,
  answerOnChange,
}: {
  textSection: TextSection;
  answerOnChange: (answer: string) => void;
}) => {
  return (
    <div className="flex bg-white p-8 rounded-xl flex-col gap-4">
      <h1 className="font-bold text-xl">{textSection.question}</h1>
      {textSection.imageUrl && (
        <Image src={textSection.imageUrl} alt={""} width={0} height={0} className="h-40 aspect-video" />
      )}
      <Textarea
        label="Please answer here"
        className="focus:ring-0"
        value={textSection.answer}
        onChange={(e) => {
          answerOnChange(e.target.value);
        }}
      />
      {textSection.required && <span className="text-red-700 ml-auto">* Required</span>}
    </div>
  );
};
