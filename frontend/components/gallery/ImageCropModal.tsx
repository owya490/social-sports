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
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasValidCrop, setHasValidCrop] = useState(false);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, aspectRatio);
      setCrop(initialCrop);
      // Immediately set a completed crop so the user can't proceed without a crop
      setCompletedCrop({
        x: (initialCrop.x / 100) * width,
        y: (initialCrop.y / 100) * height,
        width: (initialCrop.width / 100) * width,
        height: (initialCrop.height / 100) * height,
        unit: "px",
      });
      setHasValidCrop(true);
    },
    [aspectRatio]
  );

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
      setHasValidCrop(false);
    } else if (!isOpen) {
      // Reset state when modal closes
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setHasValidCrop(false);
      setIsProcessing(false);
    }
  }, [imageFile, isOpen]);

  const getCroppedImg = useCallback(
    (image: HTMLImageElement, crop: PixelCrop): Promise<File> => {
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
    if (!completedCrop || !imgRef.current || !hasValidCrop) {
      alert("Please select a crop area before proceeding.");
      return;
    }

    setIsProcessing(true);
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop);
      onCropComplete(croppedFile);
      onClose();
    } catch (error) {
      console.error("Error cropping image:", error);
      alert("Error processing the cropped image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
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
          <div className="mb-4 flex-1 min-h-0">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 h-full flex flex-col">
              <p className="text-sm text-gray-600 mb-3 flex-shrink-0">
                Drag the corners to adjust the crop area. The aspect ratio is locked to{" "}
                {cropType === "thumbnail" ? "1:1 (Square)" : "16:9"}.
              </p>
              <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                <ReactCrop
                  crop={crop}
                  onChange={(pixelCrop, percentCrop) => {
                    setCrop(percentCrop);
                  }}
                  onComplete={(pixelCrop) => {
                    setCompletedCrop(pixelCrop);
                    setHasValidCrop(pixelCrop.width > 0 && pixelCrop.height > 0);
                  }}
                  aspect={aspectRatio}
                  minWidth={cropType === "thumbnail" ? 100 : 160}
                  minHeight={cropType === "thumbnail" ? 100 : 90}
                  keepSelection={true}
                  ruleOfThirds={true}
                  className="max-h-full"
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-full object-contain"
                    style={{ userSelect: "none", maxHeight: "calc(90vh - 240px)" }}
                    draggable={false}
                  />
                </ReactCrop>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <InvertedHighlightButton
            text={isProcessing ? "Processing..." : "Upload Image"}
            onClick={handleCropAccept}
            disabled={!hasValidCrop || !completedCrop || isProcessing}
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
