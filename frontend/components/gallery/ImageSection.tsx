"use client";
import { ImageConfig, ImageOrientation, ImageType } from "@/interfaces/ImageTypes";
import { determineOrientation } from "@/services/src/images/imageUtils";
import Image from "next/image";
import { useState } from "react";
import { ImageUploadCard } from "./ImageUploadCard";

interface ImageSectionProps {
  type: ImageType;
  imageUrls: string[];
  onImageUploaded: (file: File) => void;
  gridCols: string;
  selectedImageUrl?: string;
  onImageSelect?: (url: string) => void;
  title?: string;
  description?: string;
}

function SelectableImageTile({
  url,
  index,
  type,
  selected,
  onSelect,
}: {
  url: string;
  index: number;
  type: ImageType;
  selected: boolean;
  onSelect?: (url: string) => void;
}) {
  const config = ImageConfig[type];
  const [decoded, setDecoded] = useState(false);
  const [orientation, setOrientation] = useState<ImageOrientation | null>(null);
  const isPortraitForm = type === ImageType.FORM && orientation === ImageOrientation.PORTRAIT;

  return (
    <div
      className={`relative group overflow-hidden rounded-lg ${config.containerAspect} bg-surface-muted border ${
        selected ? "border-4 border-accent" : "border-border"
      }`}
    >
      {!decoded ? (
        <div className="absolute inset-0 overflow-hidden" aria-hidden>
          <div className="image-picker-shimmer absolute inset-0 motion-reduce:animate-none" />
        </div>
      ) : null}
      <Image
        src={url}
        alt={`Image ${index + 1}`}
        width={config.defaultImageWidth}
        height={config.defaultImageHeight}
        className={`w-full h-full ${
          isPortraitForm ? "object-contain bg-white" : "object-cover"
        } cursor-pointer transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          decoded ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => {
          onSelect?.(url);
        }}
        onLoad={(e) => {
          setDecoded(true);
          if (type === ImageType.FORM) {
            setOrientation(determineOrientation(e.target as HTMLImageElement));
          }
        }}
        onError={() => {
          setDecoded(true);
        }}
      />
    </div>
  );
}

export const ImageSection = ({
  type,
  imageUrls,
  onImageUploaded,
  gridCols,
  selectedImageUrl,
  onImageSelect,
  title,
  description,
}: ImageSectionProps) => {
  const config = ImageConfig[type];

  return (
    <div>
      <h2 className="text-xl font-semibold text-core-text mb-1">{title || config.title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description || config.description}</p>

      <div className={`grid ${gridCols} gap-4`}>
        <ImageUploadCard type={type} onImageUploaded={onImageUploaded} />

        {imageUrls.map((url, index) => (
          <SelectableImageTile
            key={url}
            url={url}
            index={index}
            type={type}
            selected={selectedImageUrl === url}
            onSelect={onImageSelect}
          />
        ))}
      </div>
    </div>
  );
};
