"use client";
import { ImageSection } from "@/components/gallery/ImageSection";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ImageConfig, ImageType } from "@/interfaces/ImageTypes";
import { UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { getUsersProfilePhotosUrls, uploadProfilePhoto } from "@/services/src/images/imageService";
import { updateUser } from "@/services/src/users/usersService";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import imageCompression from "browser-image-compression";
import { useEffect, useState } from "react";

interface ProfilePhotoSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData;
  setUser: (user: UserData) => void;
}

const logger = new Logger("ProfilePhotoSelectionModalLogger");

export const ProfilePhotoSelectionModal = ({ isOpen, onClose, user, setUser }: ProfilePhotoSelectionModalProps) => {
  const [profilePhotoUrls, setProfilePhotoUrls] = useState<string[]>([]);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      setIsLoading(true);
      getUsersProfilePhotosUrls(user.userId)
        .then((urls) => {
          setProfilePhotoUrls(urls);
          setSelectedPhotoUrl(user.profilePicture || "");
        })
        .catch((error) => {
          logger.error("Error fetching profile photos:", error);
          setErrorMessage("Failed to load profile photos");
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, user]);

  const validateImage = (file: File) => {
    const config = ImageConfig[ImageType.PROFILE_PICTURE];
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

      const downloadUrl = await uploadProfilePhoto(user.userId, fileToUpload);

      // Add the new photo to the beginning of the list
      const updatedPhotos = [downloadUrl, ...profilePhotoUrls];
      setProfilePhotoUrls(updatedPhotos);

      // Auto-select the newly uploaded photo
      setSelectedPhotoUrl(downloadUrl);
      setErrorMessage(null);
    } catch (error: any) {
      logger.error("Error during image upload:", error);
      setErrorMessage("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoSelect = (url: string) => {
    setSelectedPhotoUrl(url);
  };

  const handleConfirm = async () => {
    if (!selectedPhotoUrl) {
      setErrorMessage("Please select a photo first.");
      return;
    }

    try {
      setIsUploading(true);

      // Update user profile with new photo
      await updateUser(user.userId, {
        profilePicture: selectedPhotoUrl,
      });

      setUser({ ...user, profilePicture: selectedPhotoUrl });
      bustUserLocalStorageCache();
      handleClose();
    } catch (error: any) {
      logger.error("Error updating profile picture:", error);
      setErrorMessage("Failed to update profile picture. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedPhotoUrl("");
    setErrorMessage(null);
    setIsUploading(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-lg shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-core-outline">
              <h2 className="text-2xl font-semibold text-core-text">Change Profile Picture</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={isUploading}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {errorMessage && (
              <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorMessage}</p>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : (
                <ImageSection
                  type={ImageType.PROFILE_PICTURE}
                  imageUrls={profilePhotoUrls}
                  onImageUploaded={handleImageUpload}
                  gridCols="grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
                  selectedImageUrl={selectedPhotoUrl}
                  onImageSelect={handlePhotoSelect}
                />
              )}
            </div>

            {!isLoading && (
              <div className="flex justify-end gap-3 p-6 border-t border-core-outline bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium border border-core-outline rounded-md hover:bg-core-hover"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50"
                  disabled={!selectedPhotoUrl || isUploading}
                >
                  {isUploading ? "Uploading..." : "Set as Profile Picture"}
                </button>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};
