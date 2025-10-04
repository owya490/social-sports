"use client";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ImageType } from "@/interfaces/ImageTypes";
import { UserData } from "@/interfaces/UserTypes";
import {
  getUsersEventImagesUrls,
  getUsersEventThumbnailsUrls,
  uploadEventImage,
  uploadEventThumbnail,
} from "@/services/src/images/imageService";
import imageCompression from "browser-image-compression";
import { useEffect, useState } from "react";
import { ImageSection } from "./ImageSection";

interface ImageGalleryProps {
  user: UserData;
}

export const ImageGallery = ({ user }: ImageGalleryProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);

  useEffect(() => {
    const fetchImages = async () => {
      if (!user.userId) {
        setLoading(false);
        return;
      }

      try {
        const [thumbnails, images] = await Promise.all([
          getUsersEventThumbnailsUrls(user.userId),
          getUsersEventImagesUrls(user.userId),
        ]);

        setThumbnailUrls(thumbnails);
        setImageUrls(images);
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [user.userId]);

  const handleImageUpload = async (file: File, type: "thumbnail" | "image") => {
    if (!user.userId) return;

    setUploading(true);
    try {
      let fileToUpload = file;
      const fileSizeInMB = file.size / (1024 * 1024);

      // Only compress if file is 2MB or larger
      if (fileSizeInMB >= 2) {
        const options = {
          maxSizeMB: 2,
          useWebWorker: true,
        };
        fileToUpload = await imageCompression(file, options);
      }

      // Upload to Firebase
      if (type === "thumbnail") {
        const downloadUrl = await uploadEventThumbnail(user.userId, fileToUpload);
        setThumbnailUrls((prev) => [downloadUrl, ...prev]);
      } else {
        const downloadUrl = await uploadEventImage(user.userId, fileToUpload);
        setImageUrls((prev) => [downloadUrl, ...prev]);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      {uploading && (
        <div className="flex justify-center items-center p-4">
          <LoadingSpinner />
          <span className="ml-2 text-core-text">Uploading image...</span>
        </div>
      )}

      {/* Thumbnails Section */}
      <ImageSection
        type={ImageType.THUMBNAIL}
        imageUrls={thumbnailUrls}
        onImageUploaded={(file) => handleImageUpload(file, "thumbnail")}
        gridCols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
      />

      {/* Event Images Section */}
      <ImageSection
        type={ImageType.IMAGE}
        imageUrls={imageUrls}
        onImageUploaded={(file) => handleImageUpload(file, "image")}
        gridCols="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      />

      {/* Empty State */}
      {!loading && thumbnailUrls.length === 0 && imageUrls.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No images uploaded yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Start by uploading your first event thumbnail or image using the upload cards above
          </p>
        </div>
      )}
    </div>
  );
};
