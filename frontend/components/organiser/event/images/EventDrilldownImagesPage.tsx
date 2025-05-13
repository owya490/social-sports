"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { ImageForm } from "@/components/events/create/forms/ImageForm";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { UserData } from "@/interfaces/UserTypes";
import { updateEventById } from "@/services/src/events/eventsService";
import {
  AllImageData,
  getUsersEventImagesUrls,
  getUsersEventThumbnailsUrls,
  uploadAndGetImageAndThumbnailUrls,
} from "@/services/src/imageService";
import { useEffect, useState } from "react";

interface EventDrilldownImagesPageProps {
  user: UserData;
  eventId: string;
  sport: string;
  eventImagePreviewUrl: string;
  eventThumbnailPreviewUrl: string;
}

export const EventDrilldownImagesPage = ({
  user,
  eventId,
  sport,
  eventImagePreviewUrl,
  eventThumbnailPreviewUrl,
}: EventDrilldownImagesPageProps) => {
  const [loading, setLoading] = useState<boolean>(true);

  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);
  const [eventThumbnailUrls, setEventThumbnailUrls] = useState<string[]>([]);

  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState<string>("");

  const [allImageData, setAllImageData] = useState<AllImageData>({ image: "", thumbnail: "" });

  useEffect(() => {
    const fetchUserImages = async () => {
      setEventThumbnailUrls(await getUsersEventThumbnailsUrls(user.userId));
      setEventImageUrls(await getUsersEventImagesUrls(user.userId));
      setLoading(false);
    };
    fetchUserImages();
    setImagePreviewUrl(eventImagePreviewUrl);
    setThumbnailPreviewUrl(eventThumbnailPreviewUrl);
    setAllImageData({
      image: eventImagePreviewUrl,
      thumbnail: eventThumbnailPreviewUrl,
    });
  }, []);

  const submit = async () => {
    const [imageUrl, thumbnailUrl] = await uploadAndGetImageAndThumbnailUrls(user.userId, { ...allImageData, sport });

    updateEventById(eventId, { image: imageUrl, thumbnail: thumbnailUrl });
  };

  return (
    <div className="px-4 md:px-0">
      {loading ? (
        <div className="flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <ImageForm
            {...allImageData}
            imagePreviewUrl={imagePreviewUrl}
            setImagePreviewUrl={setImagePreviewUrl}
            updateField={(fields: Partial<AllImageData>) => {
              setAllImageData((prev) => {
                return { ...prev, ...fields };
              });
            }}
            eventThumbnailsUrls={eventThumbnailUrls}
            eventImageUrls={eventImageUrls}
            thumbnailPreviewUrl={thumbnailPreviewUrl}
            setThumbnailPreviewUrl={setThumbnailPreviewUrl}
          />
          <InvertedHighlightButton text={"Update"} onClick={submit} />
        </>
      )}
    </div>
  );
};
