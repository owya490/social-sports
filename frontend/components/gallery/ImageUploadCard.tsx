"use client";
import { ImageConfig, ImageOrientation, ImageType } from "@/interfaces/ImageTypes";
import { cropSizeError, fittingCropOrientation, readImageDimensions } from "@/services/src/images/imageUtils";
import { PlusIcon } from "@heroicons/react/24/outline";
import { useRef, useState } from "react";
import { ImageCropModal } from "./ImageCropModal";

interface ImageUploadCardProps {
  type: ImageType;
  onImageUploaded: (file: File) => void;
  onInvalidFile: (message: string | null) => void;
}

export const ImageUploadCard = ({ type, onImageUploaded, onInvalidFile }: ImageUploadCardProps) => {
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [initialOrientation, setInitialOrientation] = useState(ImageOrientation.LANDSCAPE);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectionId = useRef(0);
  const config = ImageConfig[type];

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    const requestId = ++selectionId.current;
    if (!config.supportedTypes.includes(file.type)) {
      onInvalidFile("Please upload a valid image file (jpg, png).");
      return;
    }

    let size: { width: number; height: number };
    try {
      size = await readImageDimensions(file);
    } catch {
      if (requestId !== selectionId.current) return;
      onInvalidFile("Couldn't read that image. Try a different JPG or PNG.");
      return;
    }
    if (requestId !== selectionId.current) return;

    const message = cropSizeError(type, size);
    if (message) {
      onInvalidFile(message);
      return;
    }

    onInvalidFile(null);
    setInitialOrientation(fittingCropOrientation(type, size) ?? ImageOrientation.LANDSCAPE);
    setSelectedFile(file);
    setShowCropModal(true);
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
          cropType={type}
          initialOrientation={initialOrientation}
        />
      )}
    </>
  );
};
