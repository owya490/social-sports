"use client";

import { ImageSection, SectionId } from "@/interfaces/FormTypes";
import { DocumentDuplicateIcon, TrashIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

interface ImageSectionBuilderProps {
  imageSection: ImageSection;
  sectionId: SectionId;
  onUpdate: (section: ImageSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: ImageSection, sectionId: SectionId) => void;
}

export const ImageSectionBuilder = ({
  imageSection,
  sectionId,
  onUpdate,
  onDelete,
  onDuplicate,
}: ImageSectionBuilderProps) => {
  return (
    <div className="flex flex-col gap-4">
      {/* Title Input */}
      <div className="py-2.5">
        <input
          type="text"
          value={imageSection.title || ""}
          placeholder="Enter image title here"
          onChange={(e) => {
            const updatedSection = { ...imageSection, title: e.target.value };
            onUpdate(updatedSection);
          }}
          className="w-full flex-1 px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Image Display/Upload Area */}
      <div className="py-2.5">
        <div className="relative">
          <Image
            src={imageSection.imageUrl}
            alt={imageSection.title || "Form image"}
            className="w-full aspect-video object-cover rounded-lg border border-gray-200"
            width={0}
            height={0}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-2">
        <button
          onClick={() => onDelete(sectionId)}
          className="flex items-center gap-1 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          <TrashIcon className="w-4 h-4 stroke-2" />
          <span>Delete</span>
        </button>
        <button
          onClick={() => onDuplicate(imageSection, sectionId)}
          className="flex items-center gap-1 px-2 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-md transition-colors duration-200"
        >
          <DocumentDuplicateIcon className="w-4 h-4 stroke-2" />
          <span>Duplicate</span>
        </button>
      </div>
    </div>
  );
};
