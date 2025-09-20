"use client";
import { ImageConfig, ImageOrientation, ImageType } from "@/services/src/images/imageTypes";
import { determineOrientation } from "@/services/src/images/imageUtils";
import Image from "next/image";
import { useState } from "react";
import { ImageUploadCard } from "./ImageUploadCard";

interface ImageSectionProps {
  title: string;
  description: string;
  type: ImageType;
  imageUrls: string[];
  onImageUploaded: (file: File) => void;
  gridCols: string;
  selectedImageUrl?: string;
  onImageSelect?: (url: string) => void;
}

export const ImageSection = ({
  title,
  description,
  type,
  imageUrls,
  onImageUploaded,
  gridCols,
  selectedImageUrl,
  onImageSelect,
}: ImageSectionProps) => {
  const [imageOrientations, setImageOrientations] = useState<{ [key: string]: ImageOrientation }>({});

  const handleImageLoad = (url: string, e: any) => {
    if (type === ImageType.FORM) {
      const img: HTMLImageElement = e.target;
      const orientation = determineOrientation(img);
      setImageOrientations((prev) => ({ ...prev, [url]: orientation }));
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-core-text mb-4">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className={`grid ${gridCols} gap-4`}>
        <ImageUploadCard type={type} onImageUploaded={onImageUploaded} />

        {imageUrls.map((url, index) => {
          const config = ImageConfig[type];
          const orientation = imageOrientations[url];
          const isPortraitForm = type === ImageType.FORM && orientation === ImageOrientation.PORTRAIT;

          return (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Image ${index + 1}`}
                width={config.defaultImageWidth}
                height={config.defaultImageHeight}
                className={`w-full ${config.containerAspect} ${
                  selectedImageUrl === url ? "border-4 border-light-blue-400" : ""
                } ${
                  isPortraitForm ? "object-contain bg-white" : "object-cover"
                } rounded-lg border border-gray-200 cursor-pointer`}
                onClick={() => {
                  onImageSelect?.(url);
                }}
                onLoad={(e) => handleImageLoad(url, e)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
