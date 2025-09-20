"use client";
import Image from "next/image";
import { ImageUploadCard } from "./ImageUploadCard";

interface ImageSectionProps {
  title: string;
  description: string;
  type: "thumbnail" | "image";
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
  return (
    <div>
      <h2 className="text-xl font-semibold text-core-text mb-4">{title}</h2>
      <p className="text-sm text-gray-600 mb-4">{description}</p>

      <div className={`grid ${gridCols} gap-4`}>
        <ImageUploadCard type={type} onImageUploaded={onImageUploaded} />

        {imageUrls.map((url, index) => (
          <div key={index} className="relative group">
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              width={type === "thumbnail" ? 300 : 400}
              height={type === "thumbnail" ? 300 : 225}
              className={`w-full ${type === "thumbnail" ? "aspect-square" : "aspect-video"} ${
                selectedImageUrl === url ? "border-4 border-light-blue-400" : ""
              } object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow`}
              onClick={() => {
                onImageSelect?.(url);
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
