"use client";

import { ImageSection } from "@/interfaces/FormTypes";
import { ImageOrientation } from "@/interfaces/ImageTypes";
import { determineOrientation } from "@/services/src/images/imageUtils";
import Image from "next/image";
import { useState } from "react";
interface ImageSectionResponseProps {
  imageSection: ImageSection;
}

export const ImageSectionResponse = ({ imageSection }: ImageSectionResponseProps) => {
  const [orientation, setOrientation] = useState<ImageOrientation | null>(null);

  const handleImageLoad = (e: any) => {
    const img: HTMLImageElement = e.target;
    setOrientation(determineOrientation(img));
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden p-8">
      {imageSection.question && (
        <div className="pb-4">
          <h3 className="text-xl font-bold text-black">{imageSection.question}</h3>
        </div>
      )}
      <div className="flex w-full justify-center">
        <Image
          src={imageSection.imageUrl}
          alt={imageSection.question || "Form image"}
          className={`${
            orientation === null ? "w-full" : orientation === ImageOrientation.LANDSCAPE ? "w-full" : "w-1/2"
          } object-cover`}
          width={0}
          height={0}
          onLoad={handleImageLoad}
        />
      </div>
    </div>
  );
};
