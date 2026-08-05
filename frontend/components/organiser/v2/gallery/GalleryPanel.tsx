"use client";

import { ImageCropModal } from "@/components/gallery/ImageCropModal";
import { ImageConfig, ImageType } from "@/interfaces/ImageTypes";
import { PlusIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";

type GalleryUploadTileProps = {
  type: ImageType;
  onImageUploaded: (file: File) => void;
  onInvalidFile: (message: string) => void;
  disabled?: boolean;
};

function GalleryUploadTile({ type, onImageUploaded, onInvalidFile, disabled }: GalleryUploadTileProps) {
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const config = ImageConfig[type];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    const file = e.target.files[0];
    if (!config.supportedTypes.includes(file.type)) {
      onInvalidFile("Use a JPG or PNG image.");
      e.target.value = "";
      return;
    }
    setSelectedFile(file);
    setShowCropModal(true);
  };

  const clearInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <>
      <label
        className={`relative flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface hover:bg-surface-hover transition-colors cursor-pointer focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus ${config.containerAspect} ${
          disabled ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileSelect}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={`Add ${config.displayName}`}
        />
        <PlusIcon className="h-7 w-7 text-foreground-muted" aria-hidden />
        <span className="mt-2 text-xs font-semibold text-foreground font-sans text-center px-2">
          Add {config.displayName.toLowerCase()}
        </span>
        <span className="mt-0.5 text-xs text-foreground-muted font-sans">{config.aspectText}</span>
      </label>

      {selectedFile ? (
        <ImageCropModal
          isOpen={showCropModal}
          onClose={() => {
            setShowCropModal(false);
            setSelectedFile(null);
            clearInput();
          }}
          onCropComplete={(croppedFile) => {
            onImageUploaded(croppedFile);
            setSelectedFile(null);
            setShowCropModal(false);
            clearInput();
          }}
          imageFile={selectedFile}
          cropType={type}
        />
      ) : null}
    </>
  );
}

type GallerySectionProps = {
  type: ImageType;
  imageUrls: string[];
  onImageUploaded: (file: File) => void;
  onInvalidFile: (message: string) => void;
  gridCols: string;
  uploading: boolean;
  emptyHint?: string;
};

function GallerySection({
  type,
  imageUrls,
  onImageUploaded,
  onInvalidFile,
  gridCols,
  uploading,
  emptyHint,
}: GallerySectionProps) {
  const config = ImageConfig[type];

  return (
    <section aria-label={config.title} className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold text-foreground font-sans">{config.title}</h2>
        <p className="mt-0.5 text-xs text-foreground-muted font-sans">{config.description}</p>
      </div>
      <div className={`grid ${gridCols} gap-3`}>
        <GalleryUploadTile
          type={type}
          onImageUploaded={onImageUploaded}
          onInvalidFile={onInvalidFile}
          disabled={uploading}
        />
        {imageUrls.map((url, index) => (
          <div
            key={url}
            className={`relative overflow-hidden rounded-xl border border-border bg-surface-muted ${config.containerAspect}`}
          >
            <Image
              src={url}
              alt={`${config.displayName} ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
      {emptyHint && imageUrls.length === 0 ? (
        <p className="text-xs text-foreground-muted font-sans">{emptyHint}</p>
      ) : null}
    </section>
  );
}

type GalleryPanelProps = {
  thumbnailUrls: string[];
  imageUrls: string[];
  loading: boolean;
  uploading: boolean;
  onUpload: (file: File, type: "thumbnail" | "image") => void;
};

export function GalleryPanel({
  thumbnailUrls,
  imageUrls,
  loading,
  uploading,
  onUpload,
}: GalleryPanelProps) {
  const [fileError, setFileError] = useState<string | null>(null);
  const isEmpty = thumbnailUrls.length === 0 && imageUrls.length === 0;

  return (
    <section aria-label="Image gallery" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10 space-y-4">
      {uploading ? (
        <div
          role="status"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground-secondary font-sans"
        >
          Uploading image…
        </div>
      ) : null}

      {fileError ? (
        <div
          role="alert"
          className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground font-sans"
        >
          {fileError}
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-background p-4 sm:p-5 space-y-8">
        {loading ? (
          <>
            {[0, 1].map((section) => (
              <div key={section} className="space-y-3">
                <Skeleton height={14} width={140} />
                <Skeleton height={12} width={220} />
                <div
                  className={`grid ${
                    section === 0 ? "grid-cols-2 md:grid-cols-4" : "grid-cols-1 md:grid-cols-3"
                  } gap-3`}
                >
                  {Array.from({ length: 4 }, (_, index) => (
                    <Skeleton key={index} className="!rounded-xl !leading-none aspect-square" />
                  ))}
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <GallerySection
              type={ImageType.THUMBNAIL}
              imageUrls={thumbnailUrls}
              onImageUploaded={(file) => {
                setFileError(null);
                onUpload(file, "thumbnail");
              }}
              onInvalidFile={setFileError}
              gridCols="grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
              uploading={uploading}
              emptyHint={isEmpty ? "No thumbnails yet — add a square crop for event cards." : undefined}
            />
            <GallerySection
              type={ImageType.IMAGE}
              imageUrls={imageUrls}
              onImageUploaded={(file) => {
                setFileError(null);
                onUpload(file, "image");
              }}
              onInvalidFile={setFileError}
              gridCols="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
              uploading={uploading}
              emptyHint={isEmpty ? "No event images yet — add a 16:9 crop for event pages." : undefined}
            />
          </>
        )}
      </div>
    </section>
  );
}
