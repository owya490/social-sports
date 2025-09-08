import { ImageSection } from "@/components/gallery/ImageSection";
import { UserData } from "@/interfaces/UserTypes";
import { AllImageData, uploadEventImage, uploadEventThumbnail } from "@/services/src/imageService";
import imageCompression from "browser-image-compression";
import { useState } from "react";

type ImageFormProps = AllImageData & {
  user: UserData;
  updateField: (fields: Partial<AllImageData>) => void;
  eventThumbnailsUrls: string[];
  eventImageUrls: string[];
  setThumbnailUrls: (v: string[]) => void;
  setImageUrls: (v: string[]) => void;
};

export function ImageForm({
  user,
  image,
  thumbnail,
  updateField,
  eventThumbnailsUrls,
  eventImageUrls,
  setThumbnailUrls,
  setImageUrls,
}: ImageFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate image type
  const validateImage = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif"];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Please upload a valid image file (jpg, png, gif).");
      return false;
    }
    return true;
  };

  // Compress image before upload
  const handleImageUpload = async (imageFile: File, updateFieldName: "thumbnail" | "image") => {
    if (!validateImage(imageFile)) {
      return;
    }
    const options = {
      maxSizeMB: 2, // Maximum size of the image after compression
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);

      if (updateFieldName === "thumbnail") {
        const downloadUrl = await uploadEventThumbnail(user.userId, compressedFile);
        setThumbnailUrls([downloadUrl, ...eventThumbnailsUrls]);
        updateField({
          thumbnail: downloadUrl,
        });
      } else if (updateFieldName === "image") {
        const downloadUrl = await uploadEventImage(user.userId, compressedFile);
        setImageUrls([downloadUrl, ...eventImageUrls]);
        updateField({
          image: downloadUrl,
        });
      }

      setErrorMessage(null);
    } catch (error) {
      console.error("Error during image compression:", error);
      setErrorMessage("Failed to compress the image. Please try again.");
    }
  };

  const handleThumbnailSelect = (url: string) => {
    updateField({
      thumbnail: thumbnail === url ? undefined : url,
    });
  };

  const handleImageSelect = (url: string) => {
    updateField({
      image: image === url ? undefined : url,
    });
  };

  return (
    <div className="mb-16 space-y-8">
      {/* Warning Message */}
      <div className="bg-core-hover text-core-text p-2.5 rounded border border-core-outline text-xs">
        ⚠️ If your image upload button isn&apos;t working, try closing and reopening the browser.
      </div>
      <ImageSection
        title="Event Thumbnail"
        description="Please upload an image for your event thumbnail. This image will be the image seen for your event on the dashboard event cards. (Best to have a square image)"
        type="thumbnail"
        imageUrls={eventThumbnailsUrls.slice(0, 5)}
        onImageUploaded={(file: File) => {
          handleImageUpload(file, "thumbnail");
        }}
        gridCols="grid-cols-2 md:grid-cols-3"
        selectedImageUrl={typeof thumbnail === "string" ? thumbnail : undefined}
        onImageSelect={handleThumbnailSelect}
      />
      {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}

      <ImageSection
        title="Event Image"
        description="Please upload an event image for your event. This image will be seen on your event details page. (Best to have an aspect ratio of 16:9)"
        type="image"
        imageUrls={eventImageUrls.slice(0, 5)}
        onImageUploaded={(file: File) => {
          handleImageUpload(file, "image");
        }}
        gridCols="grid-cols-2 md:grid-cols-3"
        selectedImageUrl={typeof image === "string" ? image : undefined}
        onImageSelect={handleImageSelect}
      />
      {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
    </div>
  );
}
