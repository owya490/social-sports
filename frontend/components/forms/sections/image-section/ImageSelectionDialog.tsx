"use client";

import { BlackHighlightButton, InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { ImageSection } from "@/components/gallery/ImageSection";
import { useUser } from "@/components/utility/UserContext";
import { getUsersFormImagesUrls, uploadFormImage } from "@/services/src/imageService";
import { XMarkIcon } from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";
import { useEffect, useState } from "react";

interface ImageSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (imageUrl: string) => void;
}

export const ImageSelectionDialog = ({ isOpen, onClose, onImageSelected }: ImageSelectionDialogProps) => {
  const { user } = useUser();
  const [formImageUrls, setFormImageUrls] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");

  // Load existing form images from API
  useEffect(() => {
    const loadFormImages = async () => {
      if (isOpen && user.userId) {
        try {
          const images = await getUsersFormImagesUrls(user.userId);
          setFormImageUrls(images);
        } catch (error) {
          console.error("Error fetching form images:", error);
          setErrorMessage("Failed to load existing images.");
        }
      }
    };

    loadFormImages();
  }, [isOpen, user.userId]);

  const validateImage = (file: File) => {
    const validTypes = ["image/jpeg", "image/png"];
    if (!validTypes.includes(file.type)) {
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

    const options = {
      maxSizeMB: 2,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);
      const downloadUrl = await uploadFormImage(user.userId, compressedFile);

      const updatedImages = [downloadUrl, ...formImageUrls];
      setFormImageUrls(updatedImages);

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
          <h2 className="text-xl font-semibold text-core-text">Add Image Section</h2>
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
          <ImageSection
            title="Select or Upload Form Image"
            description="Choose an existing form image or upload a new one. The image will be cropped to 16:9 aspect ratio for best display."
            type="image"
            imageUrls={formImageUrls.slice(0, 10)} // Show up to 10 images
            onImageUploaded={handleImageUpload}
            gridCols="grid-cols-2 md:grid-cols-3"
            selectedImageUrl={selectedImageUrl}
            onImageSelect={handleImageSelect}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-core-outline flex justify-end gap-3">
          <InvertedHighlightButton text="Cancel" onClick={handleClose} />
          <BlackHighlightButton
            text={isUploading ? "Processing..." : "Add Image Section"}
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
