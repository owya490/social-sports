"use client";

import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import { FormId, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import Link from "next/link";

interface FormPreviewCardProps {
  formId: FormId;
  formTitle: string;
  sectionsOrder: SectionId[]; // keeps track of ordering for editing forms
  sectionsMap: Map<SectionId, FormSection>;
}

export const FormPreviewCard = ({ formId, formTitle, sectionsOrder, sectionsMap }: FormPreviewCardProps) => {
  return (
    <Link
      className="w-full h-80 sm:max-w-64 border border-core-outline rounded-lg overflow-hidden hover:scale-[1.02] transition-all cursor-pointer"
      href={`organiser/forms/${formId}/form-editor`}
    >
      <div className="h-64 overflow-hidden p-4 ml-8 sm:ml-2 md:ml-0 2xl:ml-2 pointer-events-none select-none">
        <div className="scale-[0.4] origin-top-left w-[40rem] sm:w-[28rem] md:w-[28rem] lg:w-[30rem] xl:w-[32rem]">
          <h1 className="font-bold text-3xl mb-2">{formTitle}</h1>
          {sectionsOrder.map((sectionId, idx) => {
            const section = sectionsMap.get(sectionId)!; // force the not undefined for now
            switch (section.type) {
              case FormSectionType.TEXT:
                return <TextSectionResponse textSection={section} answerOnChange={() => {}} />;
            }
          })}
        </div>
      </div>
      <div className="bg-core-outline h-[1px]"></div>
      <div className="px-4 py-2">
        <h3 className="text-lg font-semibold text-gray-800">Customer Feedback</h3>
        <p className="font-thin text-xs">Last Updated 01/06/2025 10:23pm</p>
      </div>
    </Link>
  );
};
