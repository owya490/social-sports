"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { ImageForm } from "@/components/events/create/forms/ImageForm";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { UserData } from "@/interfaces/UserTypes";
import { AllImageData, getUsersEventImagesUrls, getUsersEventThumbnailsUrls } from "@/services/src/images/imageService";
import { sleep } from "@/utilities/sleepUtil";
import { Spinner } from "@material-tailwind/react";
import { useEffect, useState } from "react";

interface EventDrilldownImagesPageProps {
  user: UserData;
  eventId: string;
  eventImage: string;
  eventThumbnail: string;
  updateData: (id: string, data: { image?: string; thumbnail?: string }) => Promise<void>;
}

export const EventDrilldownImagesPage = ({
  user,
  eventId,
  eventImage,
  eventThumbnail,
  updateData,
}: EventDrilldownImagesPageProps) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);

  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);
  const [eventThumbnailUrls, setEventThumbnailUrls] = useState<string[]>([]);

  const [allImageData, setAllImageData] = useState<AllImageData>({ image: undefined, thumbnail: undefined });

  useEffect(() => {
    const fetchUserImages = async () => {
      const userEventThumbnailsUrls = await getUsersEventThumbnailsUrls(user.userId);
      const userEventImageUrls = await getUsersEventImagesUrls(user.userId);
      if (eventThumbnail) {
        setEventThumbnailUrls([eventThumbnail, ...userEventThumbnailsUrls.filter((url) => url !== eventThumbnail)]);
      } else {
        setEventThumbnailUrls(userEventThumbnailsUrls);
      }
      if (eventImage) {
        setEventImageUrls([eventImage, ...userEventImageUrls.filter((url) => url !== eventImage)]);
      } else {
        setEventImageUrls(userEventImageUrls);
      }
      setAllImageData({
        image: eventImage ? eventImage : undefined,
        thumbnail: eventThumbnail ? eventThumbnail : undefined,
      });
      setLoading(false);
    };
    fetchUserImages();
  }, []);

  const submit = async () => {
    setSubmitLoading(true);

    try {
      await updateData(eventId, { image: allImageData.image, thumbnail: allImageData.thumbnail });
    } catch (error) {
      console.error("Error updating event:", error);
    }

    await sleep(2000);
    setSubmitLoading(false);
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
            user={user}
            setImageUrls={setEventImageUrls}
            setThumbnailUrls={setEventThumbnailUrls}
            updateField={(fields: Partial<AllImageData>) => {
              setAllImageData((prev) => {
                return { ...prev, ...fields };
              });
            }}
            eventThumbnailsUrls={eventThumbnailUrls}
            eventImageUrls={eventImageUrls}
          />
          {submitLoading ? (
            <Spinner className="ml-2 w-5" />
          ) : (
            <InvertedHighlightButton text={"Update"} onClick={submit} />
          )}
        </>
      )}
    </div>
  );
};
