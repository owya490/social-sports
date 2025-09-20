"use client";
import { ImageConfig, ImageType } from "@/services/src/images/imageTypes";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { ImageCropModal } from "./ImageCropModal";

interface ImageUploadCardProps {
  type: ImageType;
  onImageUploaded: (file: File) => void;
}

export const ImageUploadCard = ({ type, onImageUploaded }: ImageUploadCardProps) => {
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file type
      const validTypes = ["image/jpeg", "image/png"];
      if (!validTypes.includes(file.type)) {
        alert("Please upload a valid image file (jpg, png).");
        // Clear the input value to allow selecting the same file again
        e.target.value = "";
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
    // Clear the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropCancel = () => {
    setShowCropModal(false);
    setSelectedFile(null);
    // Clear the input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const config = ImageConfig[type];
  const aspectRatio = config.defaultAspectRatio;
  const aspectText = config.aspectText;

  return (
    <>
      <div
        className={`relative border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors cursor-pointer group ${config.containerAspect}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />

        <div className="flex flex-col items-center justify-center h-full p-4 text-gray-500 group-hover:text-gray-600">
          <PlusIcon className="w-8 h-8 md:mb-2" />
          <p className="text-sm font-medium text-center">Add {config.displayName}</p>
          <p className="text-xs text-gray-400 mt-1">{aspectText}</p>
        </div>
      </div>

      {selectedFile && (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
          imageFile={selectedFile}
          aspectRatio={aspectRatio}
          cropType={type}
        />
      )}
    </>
  );
};
