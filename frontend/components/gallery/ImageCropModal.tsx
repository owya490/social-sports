"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File;
  aspectRatio: number; // 1 for square (thumbnail), 16/9 for event image
  cropType: "thumbnail" | "image";
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageCropModal = ({
  isOpen,
  onClose,
  onCropComplete,
  imageFile,
  aspectRatio,
  cropType,
}: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>("");

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspectRatio));
    },
    [aspectRatio]
  );

  // Convert file to data URL when modal opens
  useEffect(() => {
    if (imageFile && isOpen) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile, isOpen]);

  const getCroppedImg = useCallback(
    async (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("No 2d context");
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      canvas.width = crop.width;
      canvas.height = crop.height;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            throw new Error("Canvas is empty");
          }
          const file = new File([blob], imageFile.name, {
            type: imageFile.type,
            lastModified: Date.now(),
          });
          resolve(file);
        }, imageFile.type);
      });
    },
    [imageFile]
  );

  const handleCropAccept = async () => {
    if (!completedCrop || !imgRef.current) {
      return;
    }

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-core-text">
            Crop {cropType === "thumbnail" ? "Thumbnail (Square)" : "Event Image (16:9)"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            disabled={isProcessing}
          >
            ×
          </button>
        </div>

        {imageSrc && (
          <div className="mb-4">
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={cropType === "thumbnail" ? 100 : 160}
              minHeight={cropType === "thumbnail" ? 100 : 90}
            >
              <img
                ref={imgRef}
                alt="Crop preview"
                src={imageSrc}
                onLoad={onImageLoad}
                className="max-w-full max-h-96 object-contain"
              />
            </ReactCrop>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <InvertedHighlightButton
            text={isProcessing ? "Processing..." : "Accept Crop"}
            onClick={handleCropAccept}
            disabled={!completedCrop || isProcessing}
          />
        </div>

        {isProcessing && (
          <div className="flex justify-center mt-4">
            <LoadingSpinner />
          </div>
        )}
      </div>
    </div>
  );
};
