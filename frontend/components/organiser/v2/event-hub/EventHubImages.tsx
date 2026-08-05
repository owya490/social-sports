"use client";

import { ImageForm } from "@/components/events/create/forms/ImageForm";
import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { AllImageData, getUsersEventImagesUrls, getUsersEventThumbnailsUrls } from "@/services/src/images/imageService";
import { sleep } from "@/utilities/sleepUtil";
import { useEffect, useMemo, useState } from "react";
import Skeleton from "react-loading-skeleton";
import {
  EventHubPrimaryButton,
  EventHubStage,
  EventHubToolbar,
} from "./EventHubStage";

type EventHubImagesProps = {
  user: UserData;
  eventId: EventId;
  eventImage: string;
  eventThumbnail: string;
  updateData: (id: EventId, data: { image?: string; thumbnail?: string }) => Promise<void>;
};

export function EventHubImages({
  user,
  eventId,
  eventImage,
  eventThumbnail,
  updateData,
}: EventHubImagesProps) {
  const logger = useMemo(() => new Logger("EventHubImages"), []);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);
  const [eventThumbnailUrls, setEventThumbnailUrls] = useState<string[]>([]);
  const [allImageData, setAllImageData] = useState<AllImageData>({
    image: undefined,
    thumbnail: undefined,
  });
  const [dirty, setDirty] = useState(false);

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
        image: eventImage || undefined,
        thumbnail: eventThumbnail || undefined,
      });
      setLoading(false);
    };
    void fetchUserImages();
  }, [user.userId, eventImage, eventThumbnail]);

  const submit = async () => {
    setSubmitLoading(true);
    try {
      await updateData(eventId, { image: allImageData.image, thumbnail: allImageData.thumbnail });
      setDirty(false);
    } catch (error) {
      logger.error(`Error updating event images: ${error}`);
    }
    await sleep(800);
    setSubmitLoading(false);
  };

  return (
    <EventHubStage>
      <EventHubToolbar
        meta={dirty ? "Unsaved image changes" : "Event images"}
        action={
          <EventHubPrimaryButton onClick={submit} disabled={submitLoading || loading || !dirty}>
            {submitLoading ? "Saving…" : "Save images"}
          </EventHubPrimaryButton>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="aspect-video rounded-xl" />
          <Skeleton className="aspect-video rounded-xl" />
        </div>
      ) : (
        <div className="pt-1">
          <ImageForm
            {...allImageData}
            user={user}
            setImageUrls={setEventImageUrls}
            setThumbnailUrls={setEventThumbnailUrls}
            updateField={(fields: Partial<AllImageData>) => {
              setAllImageData((prev) => ({ ...prev, ...fields }));
              setDirty(true);
            }}
            eventThumbnailsUrls={eventThumbnailUrls}
            eventImageUrls={eventImageUrls}
            flush
          />
        </div>
      )}
    </EventHubStage>
  );
}
