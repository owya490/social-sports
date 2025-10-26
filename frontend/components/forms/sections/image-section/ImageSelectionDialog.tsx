"use client";

import { BlackHighlightButton, InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { ImageSection } from "@/components/gallery/ImageSection";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ImageConfig, ImageType } from "@/interfaces/ImageTypes";
import { Logger } from "@/observability/logger";
import { XMarkIcon } from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";
import { useEffect, useState } from "react";

interface ImageSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
  imageType: ImageType;
  imageUrls: string[];
  onLoadImages: () => Promise<string[]>;
  onUploadImage: (file: File) => Promise<string>;
  title?: string;
  buttonText?: string;
}

export const ImageSelectionDialog = ({
  isOpen,
  onClose,
  onImageSelected,
  imageType,
  imageUrls: initialImageUrls,
  onLoadImages,
  onUploadImage,
  title = "Select Image",
  buttonText = "Select Image",
}: ImageSelectionDialogProps) => {
  const logger = new Logger("ImageSelectionDialogLogger");

  const [imageUrls, setImageUrls] = useState<string[]>(initialImageUrls);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  // Load images when dialog opens
  useEffect(() => {
    const loadImages = async () => {
      if (isOpen) {
        setIsLoading(true);
        try {
          const images = await onLoadImages();
          setImageUrls(images);
        } catch (error) {
          logger.error(`Error fetching images: ${error}`);
          setErrorMessage(`Failed to load existing images: ${error}`);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadImages();
  }, [isOpen, onLoadImages]);

  const validateImage = (file: File) => {
    const config = ImageConfig[imageType];
    if (!config.supportedTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image file (jpg, png).");
      return false;
    }
    return true;
  };

  const handleImageUpload = async (imageFile: File) => {
    if (!validateImage(imageFile)) {
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      let fileToUpload = imageFile;
      const fileSizeInMB = imageFile.size / (1024 * 1024);

      // Only compress if file is 2MB or larger
      if (fileSizeInMB >= 2) {
        const options = {
          maxSizeMB: 2,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(imageFile, options);
      }

      const downloadUrl = await onUploadImage(fileToUpload);

      const updatedImages = [downloadUrl, ...imageUrls];
      setImageUrls(updatedImages);

      // Auto-select the newly uploaded image
      setSelectedImageUrl(downloadUrl);
      setErrorMessage(null);
    } catch (error) {
      console.error("Error during image upload:", error);
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleImageSelect = (url: string) => {
    setSelectedImageUrl(url);
  };

  const handleCreateSection = () => {
    if (!selectedImageUrl) {
      setErrorMessage("Please select an image first.");
      return;
    }

    onImageSelected(selectedImageUrl);
    handleClose();
  };

  const handleClose = () => {
    setSelectedImageUrl("");
    setErrorMessage(null);
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-core-outline">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-core-outline">
          <h2 className="text-xl font-semibold text-core-text">{title}</h2>
          <button onClick={handleClose} className="p-2 hover:bg-core-hover rounded-full transition-colors">
            <XMarkIcon className="w-5 h-5 text-core-text" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Loading State */}
          {isUploading && (
            <div className="mb-4 p-3 bg-core-hover border border-core-outline rounded-lg">
              <p className="text-core-text text-sm">Uploading and processing image...</p>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Image Selection */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : (
            <ImageSection
              type={imageType}
              imageUrls={imageUrls.slice(0, 5)} // Show up to 5 images
              onImageUploaded={handleImageUpload}
              gridCols="grid-cols-2 md:grid-cols-3"
              selectedImageUrl={selectedImageUrl}
              onImageSelect={handleImageSelect}
            />
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-core-outline flex justify-end gap-3">
          <InvertedHighlightButton text="Cancel" onClick={handleClose} />
          <BlackHighlightButton
            text={isUploading ? "Processing..." : buttonText}
            onClick={handleCreateSection}
            disabled={!selectedImageUrl || isUploading}
            className={
              !selectedImageUrl || isUploading
                ? "opacity-50 cursor-not-allowed bg-gray-400 hover:bg-gray-400 hover:text-white border-gray-400 hover:shadow-none"
                : ""
            }
          />
        </div>
      </div>
    </div>
  );
};
