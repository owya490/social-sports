"use client";

import { GalleryHeader } from "@/components/organiser/v2/gallery/GalleryHeader";
import { GalleryPanel } from "@/components/organiser/v2/gallery/GalleryPanel";
import { useUser } from "@/components/utility/UserContext";
import { Logger } from "@/observability/logger";
import {
  getUsersEventImagesUrls,
  getUsersEventThumbnailsUrls,
  uploadEventImage,
  uploadEventThumbnail,
} from "@/services/src/images/imageService";
import imageCompression from "browser-image-compression";
import { useEffect, useLayoutEffect, useState } from "react";

const logger = new Logger("OrganiserGalleryV2");

export default function OrganiserGalleryV2Page() {
  const { user, userLoading } = useUser();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchImages = async () => {
    if (!user.userId) {
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const [thumbnails, images] = await Promise.all([
        getUsersEventThumbnailsUrls(user.userId),
        getUsersEventImagesUrls(user.userId),
      ]);
      setThumbnailUrls(thumbnails);
      setImageUrls(images);
    } catch (fetchError) {
      logger.error(`Failed to get organiser images: ${fetchError}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userLoading) {
      return;
    }
    if (!user.userId) {
      setLoading(false);
      setThumbnailUrls([]);
      setImageUrls([]);
      return;
    }
    void fetchImages();
  }, [user.userId, userLoading]);

  const handleUpload = async (file: File, type: "thumbnail" | "image") => {
    if (!user.userId) return;
    setUploading(true);
    setUploadError(null);
    try {
      let fileToUpload = file;
      const fileSizeInMB = file.size / (1024 * 1024);
      if (fileSizeInMB >= 2) {
        fileToUpload = await imageCompression(file, { maxSizeMB: 2, useWebWorker: true });
      }
      if (type === "thumbnail") {
        const downloadUrl = await uploadEventThumbnail(user.userId, fileToUpload);
        setThumbnailUrls((prev) => [downloadUrl, ...prev]);
      } else {
        const downloadUrl = await uploadEventImage(user.userId, fileToUpload);
        setImageUrls((prev) => [downloadUrl, ...prev]);
      }
    } catch (uploadErr) {
      logger.error(`Failed to upload image: ${uploadErr}`);
      setUploadError("Could not upload that image. Try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* THESIS: A quiet media library—upload tiles and crops lead, shell stays out of the way.
          OWN-WORLD: Honest Clubhouse tokens—outlined panel, dashed upload tiles, muted meta.
          STORY: Upload thumbnails and event images; crop modal stays shared with legacy.
          FIRST VIEWPORT: Title + count subtitle, thumbnail then image sections in one panel.
          FORM: Established v2 operate extension; list/library port.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="min-h-screen bg-surface text-foreground pb-2">
        <GalleryHeader
          thumbnailCount={thumbnailUrls.length}
          imageCount={imageUrls.length}
          loading={loading}
        />

        {error ? (
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
            <div className="rounded-xl border border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground font-sans">Could not load images</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">Check your connection and try again.</p>
              <button
                type="button"
                onClick={() => {
                  void fetchImages();
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <>
            {uploadError ? (
              <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-4">
                <div
                  role="alert"
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground font-sans"
                >
                  {uploadError}
                </div>
              </div>
            ) : null}
            <GalleryPanel
              thumbnailUrls={thumbnailUrls}
              imageUrls={imageUrls}
              loading={loading}
              uploading={uploading}
              onUpload={(file, type) => {
                void handleUpload(file, type);
              }}
            />
          </>
        )}
      </div>
    </>
  );
}
