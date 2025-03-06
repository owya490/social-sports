import { AllImageData } from "@/services/src/imageService";
import imageCompression from "browser-image-compression";
import Image from "next/image";
import { useState } from "react";

type ImageFormProps = AllImageData & {
  updateField: (fields: Partial<AllImageData>) => void;
  eventThumbnailsUrls: string[];
  eventImageUrls: string[];
  thumbnailPreviewUrl: string;
  setThumbnailPreviewUrl: (v: string) => void;
  imagePreviewUrl: string;
  setImagePreviewUrl: (v: string) => void;
};

export function ImageForm({
  image,
  thumbnail,
  imagePreviewUrl,
  setImagePreviewUrl,
  thumbnailPreviewUrl,
  setThumbnailPreviewUrl,
  updateField,
  eventThumbnailsUrls,
  eventImageUrls,
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
    const options = {
      maxSizeMB: 2, // Maximum size of the image after compression
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(imageFile, options);

      if (updateFieldName === "thumbnail") {
        setThumbnailPreviewUrl(URL.createObjectURL(compressedFile));
        updateField({
          thumbnail: compressedFile,
        });
      } else if (updateFieldName === "image") {
        setImagePreviewUrl(URL.createObjectURL(compressedFile));
        console.log(compressedFile);
        updateField({
          image: compressedFile,
        });
      }

      setErrorMessage(null);
    } catch (error) {
      console.error("Error during image compression:", error);
      setErrorMessage("Failed to compress the image. Please try again.");
    }
  };

  // Handle Thumbnail file input change
  const handleThumbnailFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);

      for (const file of fileList) {
        if (validateImage(file)) {
          await handleImageUpload(file, "thumbnail"); // Compress and handle image
          break; // Process only the first valid image
        }
      }
    }
  };

  // Handle Image file input change
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);

      for (const file of fileList) {
        if (validateImage(file)) {
          await handleImageUpload(file, "image"); // Compress and handle image
          break; // Process only the first valid image
        }
      }
    }
  };

  const handleThumbnailSelect = async (url: string) => {
    setThumbnailPreviewUrl(thumbnailPreviewUrl === url ? "" : url);
    (document.getElementById("thumbnail-input") as HTMLInputElement).value = "";
    updateField({
      thumbnail: thumbnail === url ? undefined : url,
    });
  };

  const handleImageSelect = async (url: string) => {
    setImagePreviewUrl(imagePreviewUrl === url ? "" : url);
    (document.getElementById("image-input") as HTMLInputElement).value = "";
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
      <div>
        <label className="text-black text-lg font-semibold">Event Thumbnail</label>
        <p className="text-xs font-light">
          Please upload an image for your event thumbnail. This image will be the image seen for your event on the
          dashboard event cards. (Best to have a square image)
        </p>
        <div className="w-full relative py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {eventThumbnailsUrls.slice(0, 6).map((url, idx) => {
              return (
                <div key={idx}>
                  <img
                    onClick={() => {
                      handleThumbnailSelect(url);
                    }}
                    className={`hover:cursor-pointer h-auto max-w-full rounded-lg object-cover aspect-square ${
                      typeof thumbnail === "string" && thumbnail === url ? "border-4 border-light-blue-400" : ""
                    }`}
                    src={url}
                    alt=""
                  />
                </div>
              );
            })}
          </div>

          <input
            id="thumbnail-input"
            className="rounded-md mt-4"
            accept="image/*"
            type="file"
            multiple // Allow multiple files
            onChange={handleThumbnailFileChange}
          />
          {thumbnailPreviewUrl !== "" && (
            <Image
              src={thumbnailPreviewUrl}
              width={0}
              height={0}
              alt="imagePreview"
              className="h-72 w-fit py-4 aspect-square object-cover"
            />
          )}
        </div>
        {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
      </div>
      <div>
        <label className="text-black text-lg font-semibold">Event Image</label>
        <p className="text-xs font-light">
          Please upload an event image for your event. This image will be seen on your event details page.{" "}
          <span className="block">(Best to have an aspect ratio of 16:9)</span>
        </p>
        <div className="w-full relative py-3">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {eventImageUrls.slice(0, 6).map((url, idx) => {
              return (
                <div key={idx}>
                  <img
                    onClick={() => {
                      handleImageSelect(url);
                    }}
                    className={`hover:cursor-pointer h-auto max-w-full rounded-lg object-cover aspect-video ${
                      typeof image === "string" && image === url ? "border-4 border-light-blue-400" : ""
                    }`}
                    src={url}
                    alt=""
                  />
                </div>
              );
            })}
          </div>

          <input
            id="image-input"
            className="rounded-md mt-4"
            accept="image/*"
            type="file"
            multiple // Allow multiple files
            onChange={handleImageFileChange}
          />
          {imagePreviewUrl !== "" && (
            <Image
              src={imagePreviewUrl}
              width={0}
              height={0}
              alt="imagePreview"
              className="h-72 w-auto py-4 aspect-video object-cover"
            />
          )}
        </div>
        {errorMessage && <p className="text-red-500 text-sm mt-2">{errorMessage}</p>}
      </div>
    </div>
  );
}
