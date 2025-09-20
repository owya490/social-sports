"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ImageType } from "@/services/src/images/imageTypes";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File;
  aspectRatio: number; // 1 for square (thumbnail), 16/9 for event image
  cropType: ImageType;
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
  const [isLandscape, setIsLandscape] = useState(true); // For form images: true = 16:9 landscape, false = 9:16 portrait
  const [currentAspectRatio, setCurrentAspectRatio] = useState(aspectRatio);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, currentAspectRatio);
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
    [currentAspectRatio]
  );

  // Initialize aspect ratio based on crop type
  useEffect(() => {
    if (cropType === ImageType.FORM) {
      setCurrentAspectRatio(isLandscape ? 5 / 4 : 4 / 5);
    } else {
      setCurrentAspectRatio(aspectRatio);
    }
  }, [cropType, aspectRatio, isLandscape]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
      setHasValidCrop(false);
      // Reset form image orientation to landscape when opening
      if (cropType === ImageType.FORM) {
        setIsLandscape(true);
      }
    } else if (!isOpen) {
      // Reset state when modal closes
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setHasValidCrop(false);
      setIsProcessing(false);
      setIsLandscape(true);
    }
  }, [imageFile, isOpen, cropType]);

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

  const toggleOrientation = () => {
    if (cropType === ImageType.FORM && imgRef.current) {
      const newIsLandscape = !isLandscape;
      setIsLandscape(newIsLandscape);

      // Recalculate crop immediately with new aspect ratio
      const newAspectRatio = newIsLandscape ? 5 / 4 : 4 / 5;
      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, newAspectRatio);

      setCrop(newCrop);
      setCompletedCrop({
        x: (newCrop.x / 100) * width,
        y: (newCrop.y / 100) * height,
        width: (newCrop.width / 100) * width,
        height: (newCrop.height / 100) * height,
        unit: "px",
      });
      setHasValidCrop(true);
    }
  };

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
            Crop{" "}
            {cropType === ImageType.THUMBNAIL
              ? "Thumbnail (Square)"
              : cropType === ImageType.FORM
              ? `Form Image (${isLandscape ? "5:4 Landscape" : "4:5 Portrait"})`
              : "Event Image (16:9)"}
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
              <div className="mb-3 flex-shrink-0 flex justify-between items-center">
                <p className="text-sm text-gray-600">
                  Drag the corners to adjust the crop area. The aspect ratio is locked to{" "}
                  {cropType === ImageType.THUMBNAIL
                    ? "1:1 (Square)"
                    : cropType === ImageType.FORM
                    ? isLandscape
                      ? "5:4 (Landscape)"
                      : "4:5 (Portrait)"
                    : "16:9"}
                  .
                </p>
                {cropType === ImageType.FORM && (
                  <button
                    onClick={toggleOrientation}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
                    disabled={isProcessing}
                  >
                    <ArrowPathIcon className="w-4 h-4" />
                    Rotate
                  </button>
                )}
              </div>
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
                  aspect={currentAspectRatio}
                  minWidth={
                    cropType === ImageType.THUMBNAIL
                      ? 100
                      : cropType === ImageType.FORM
                      ? isLandscape
                        ? 125
                        : 80
                      : 160
                  }
                  minHeight={
                    cropType === ImageType.THUMBNAIL
                      ? 100
                      : cropType === ImageType.FORM
                      ? isLandscape
                        ? 100
                        : 100
                      : 90
                  }
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
