"use client";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { ImageCropModal } from "./ImageCropModal";

interface ImageUploadCardProps {
  type: "thumbnail" | "image";
  onImageUploaded: (file: File) => void;
}

export const ImageUploadCard = ({ type, onImageUploaded }: ImageUploadCardProps) => {
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (jpg, png, gif).");
        return;
      }

      setSelectedFile(file);
      setShowCropModal(true);
    }
  };

  const handleCropComplete = (croppedFile: File) => {
    onImageUploaded(croppedFile);
    setSelectedFile(null);
    setShowCropModal(false);
  };

  const aspectRatio = type === "thumbnail" ? 1 : 16 / 9;
  const aspectText = type === "thumbnail" ? "1:1 (Square)" : "16:9";

  return (
    <>
      <div
        className={`relative border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer group ${
          type === "thumbnail" ? "aspect-square" : "aspect-video"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 group-hover:text-gray-600">
          <PlusIcon className="w-8 h-8 mb-2" />
          <p className="text-sm font-medium text-center">Add {type === "thumbnail" ? "Thumbnail" : "Event Image"}</p>
          <p className="text-xs text-gray-400 mt-1">{aspectText}</p>
        </div>
      </div>

      {selectedFile && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setSelectedFile(null);
          }}
          onCropComplete={handleCropComplete}
          imageFile={selectedFile}
          aspectRatio={aspectRatio}
          cropType={type}
        />
      )}
    </>
  );
};
