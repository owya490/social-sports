"use client";

import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { DropdownSelectSectionResponse } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionResponse";
import { ImageSectionResponse } from "@/components/forms/sections/image-section/ImageSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import LoadingSkeletonFormGalleryCard from "@/components/loading/LoadingSkeletonFormGalleryCard";
import { FormId, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface FormPreviewCardProps {
  formId: FormId;
  formTitle: string;
  formDescription: string;
  sectionsOrder: SectionId[]; // keeps track of ordering for editing forms
  sectionsMap: Record<SectionId, FormSection>;
  lastUpdated: Timestamp | null;
  isLoading: boolean;
}

export const FormPreviewCard = ({
  formId,
  formTitle,
  formDescription,
  sectionsOrder,
  sectionsMap,
  lastUpdated,
  isLoading,
}: FormPreviewCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Handle click outside to unlock the card
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsLocked(false);
      }
    };

    if (isLocked) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isLocked]);

  // Determine if card should be expanded (either hovered or locked)
  const isExpanded = isHovered || isLocked;

  const handleCardClick = () => {
    setIsLocked(!isLocked);
    setIsHovered(false);
  };

  // skeleton loading state
  if (isLoading) {
    return <LoadingSkeletonFormGalleryCard />;
  }

  return (
    <button
      ref={cardRef}
      className="w-full h-80 sm:max-w-64 border border-core-outline rounded-lg overflow-hidden hover:scale-[1.02] transition-all cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
    >
      {/* Form Preview Section */}
      <div className="h-64 overflow-hidden px-4 ml-7 sm:ml-2 md:ml-0 2xl:ml-2 pointer-events-none select-none">
        <div className="scale-[0.4] origin-top-left w-[40rem] sm:w-[28rem] md:w-[28rem] lg:w-[30rem] xl:w-[32rem]">
          <h1 className="font-bold text-3xl mb-2 truncate">{formTitle}</h1>
          {sectionsOrder.map((sectionId) => {
            const section = sectionsMap[sectionId]; // force the not undefined for now
            switch (section.type) {
              case FormSectionType.TEXT:
                return (
                  <TextSectionResponse
                    key={sectionId}
                    textSection={section}
                    answerOnChange={() => {}}
                    canEdit={false}
                  />
                );
              case FormSectionType.DROPDOWN_SELECT:
                return (
                  <DropdownSelectSectionResponse
                    key={sectionId}
                    dropdownSelectSection={section}
                    answerOnChange={() => {}}
                    canEdit={false}
                  />
                );
              case FormSectionType.IMAGE:
                return <ImageSectionResponse key={sectionId} imageSection={section} />;
              default:
                return null;
            }
          })}
        </div>
      </div>

      {/* Metadata/Action Section */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-white transition-all duration-300 ease-in-out border-t border-core-outline ${
          isExpanded ? "h-full border-t-0 text-wrap" : "h-20 text-nowrap"
        }`}
      >
        {/* Content Container */}
        <div className={`p-4 h-full flex flex-col transition-all duration-300`}>
          {/* Title - moves to top on hover */}
          <div className={`transition-all duration-300 ${isExpanded ? "mb-4" : ""}`}>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-800 text-left truncate">{formTitle}</h3>
                {lastUpdated && (
                  <p className="font-thin text-xs text-left">
                    Last Updated{" "}
                    {lastUpdated.toDate().toLocaleDateString("en-AU", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      timeZone: "Australia/Sydney",
                    })}
                  </p>
                )}
              </div>
              {/* Mobile interaction indicator */}
              <div className="sm:hidden flex-shrink-0 ml-2">
                {isExpanded ? (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600 transition-transform duration-300" />
                ) : (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600 transition-transform duration-300" />
                )}
              </div>
            </div>
            {/* Action Buttons - only show on hover */}
            <div className={`mt-12 transition-all duration-300 text-wrap ${isExpanded ? "opacity-100" : "opacity-0"}`}>
              {/* Form Description */}
              <div className="text-xs text-left font-light mt-4 h-32 overflow-hidden">
                <RichTextEditorContent description={formDescription} />
              </div>
              <div className="flex gap-3 mt-4">
                {/* Form Editor */}
                <Link
                  className="w-full py-3 px-4 border border-core-outline rounded-lg text-xs hover:bg-core-hover transition-colors duration-200 text-center"
                  href={`/organiser/forms/${formId}/editor`}
                >
                  Edit
                </Link>

                {/* View as Responder */}
                <Link
                  href={`/organiser/forms/${formId}/preview`}
                  className="w-full py-3 px-4 hover:bg-core-hover border border-core-outline rounded-lg text-xs transition-colors duration-200 text-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  Preview
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </button>
  );
};
