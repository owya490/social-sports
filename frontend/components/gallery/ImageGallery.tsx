"use client";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { UserData } from "@/interfaces/UserTypes";
import { getUsersEventImagesUrls, getUsersEventThumbnailsUrls, uploadUserImage } from "@/services/src/imageService";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ImageUploadCard } from "./ImageUploadCard";

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
      // Compress the image before upload
      const options = {
        maxSizeMB: 2,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      // Upload to Firebase
      const path = type === "thumbnail" ? "/eventThumbnails" : "/eventImages";
      const downloadUrl = await uploadUserImage(user.userId, path, compressedFile);

      // Update local state
      if (type === "thumbnail") {
        setThumbnailUrls((prev) => [downloadUrl, ...prev]);
      } else {
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
      <div>
        <h2 className="text-xl font-semibold text-core-text mb-4">Event Thumbnails</h2>
        <p className="text-sm text-gray-600 mb-4">Square aspect ratio (1:1) - Used for event cards on the dashboard</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <ImageUploadCard type="thumbnail" onImageUploaded={(file) => handleImageUpload(file, "thumbnail")} />

          {thumbnailUrls.map((url, index) => (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Thumbnail ${index + 1}`}
                width={300}
                height={300}
                className="w-full aspect-square object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Event Images Section */}
      <div>
        <h2 className="text-xl font-semibold text-core-text mb-4">Event Images</h2>
        <p className="text-sm text-gray-600 mb-4">16:9 aspect ratio - Used for event detail pages</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ImageUploadCard type="image" onImageUploaded={(file) => handleImageUpload(file, "image")} />

          {imageUrls.map((url, index) => (
            <div key={index} className="relative group">
              <Image
                src={url}
                alt={`Event image ${index + 1}`}
                width={400}
                height={225}
                className="w-full aspect-video object-cover rounded-lg border border-gray-200 hover:shadow-md transition-shadow"
              />
            </div>
          ))}
        </div>
      </div>

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
