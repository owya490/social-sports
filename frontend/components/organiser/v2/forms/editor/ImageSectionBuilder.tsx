"use client";

import {
  FormSectionControls,
  formEditorFieldClass,
} from "@/components/organiser/v2/forms/editor/FormSectionControls";
import { ImageSection, SectionId } from "@/interfaces/FormTypes";
import { ImageOrientation } from "@/interfaces/ImageTypes";
import { determineOrientation } from "@/services/src/images/imageUtils";
import Image from "next/image";
import { useState } from "react";

type ImageSectionBuilderProps = {
  imageSection: ImageSection;
  sectionId: SectionId;
  onUpdate: (section: ImageSection) => void;
  onDelete: (sectionId: SectionId) => void;
  onDuplicate: (section: ImageSection) => void;
};

export function ImageSectionBuilder({
  imageSection,
  sectionId,
  onUpdate,
  onDelete,
  onDuplicate,
}: ImageSectionBuilderProps) {
  const [orientation, setOrientation] = useState<ImageOrientation | null>(null);

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={imageSection.question || ""}
        placeholder="Image title (optional)"
        onChange={(e) => onUpdate({ ...imageSection, question: e.target.value })}
        className={formEditorFieldClass}
      />
      <div className="flex w-full justify-center overflow-hidden rounded-xl border border-border bg-surface">
        <Image
          src={imageSection.imageUrl}
          alt={imageSection.question || "Form image"}
          className={`${
            orientation === null ? "w-full" : orientation === ImageOrientation.LANDSCAPE ? "w-full" : "w-1/2"
          } object-cover`}
          width={0}
          height={0}
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            setOrientation(determineOrientation(img));
          }}
        />
      </div>
      <FormSectionControls
        showRequired={false}
        onDelete={() => onDelete(sectionId)}
        onDuplicate={() => onDuplicate(imageSection)}
      />
    </div>
  );
}
