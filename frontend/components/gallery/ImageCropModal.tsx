"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { LoadingSpinner } from "@/components/loading/LoadingSpinner";
import { ImageConfig, ImageOrientation, ImageType } from "@/interfaces/ImageTypes";
import { switchableOrientations, switchOrientation } from "@/services/src/images/imageUtils";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";
import ReactCrop, { centerCrop, Crop, makeAspectCrop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

interface ImageCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
  imageFile: File;
  cropType: ImageType;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number, isMobile: boolean = false) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: isMobile ? 80 : 90, // Smaller initial crop on mobile
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export const ImageCropModal = ({ isOpen, onClose, onCropComplete, imageFile, cropType }: ImageCropModalProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [hasValidCrop, setHasValidCrop] = useState(false);
  const [orientation, setOrientation] = useState<ImageOrientation>(ImageOrientation.LANDSCAPE); // For form images
  const [currentAspectRatio, setCurrentAspectRatio] = useState(ImageConfig[cropType].defaultAspectRatio);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const initialCrop = centerAspectCrop(width, height, currentAspectRatio, isMobile);
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
    [currentAspectRatio, isMobile]
  );

  // Initialize aspect ratio based on crop type
  useEffect(() => {
    const config = ImageConfig[cropType];
    const orientationConfig = config.orientationConfigs[orientation];
    setCurrentAspectRatio(orientationConfig?.aspectRatio || config.defaultAspectRatio);
  }, [cropType, orientation]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
      setHasValidCrop(false);
      // Reset image orientation to landscape when opening
      setOrientation(ImageOrientation.LANDSCAPE);
    } else if (!isOpen) {
      // Reset state when modal closes
      setImageSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setHasValidCrop(false);
      setIsProcessing(false);
      setOrientation(ImageOrientation.LANDSCAPE);
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

      // Use the natural (full resolution) size for the canvas
      const naturalCropWidth = crop.width * scaleX;
      const naturalCropHeight = crop.height * scaleY;

      canvas.width = naturalCropWidth;
      canvas.height = naturalCropHeight;

      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        naturalCropWidth,
        naturalCropHeight,
        0,
        0,
        naturalCropWidth,
        naturalCropHeight
      );

      return new Promise((resolve) => {
        // Use quality 1.0 to maintain maximum image quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              throw new Error("Canvas is empty");
            }
            const file = new File([blob], imageFile.name, {
              type: imageFile.type,
              lastModified: Date.now(),
            });
            resolve(file);
          },
          imageFile.type,
          1.0
        );
      });
    },
    [imageFile]
  );

  const toggleOrientation = () => {
    if (switchableOrientations(cropType) && imgRef.current) {
      const newOrientation = switchOrientation(orientation);
      setOrientation(newOrientation);

      // Recalculate crop immediately with new aspect ratio from config
      const config = ImageConfig[cropType];
      const orientationConfig = config.orientationConfigs[newOrientation];
      const newAspectRatio = orientationConfig?.aspectRatio || config.defaultAspectRatio;

      const { width, height } = imgRef.current;
      const newCrop = centerAspectCrop(width, height, newAspectRatio, isMobile);

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg p-3 sm:p-6 max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center mb-2 sm:mb-4 flex-shrink-0">
          <h2 className="text-lg sm:text-xl font-semibold text-core-text">
            Crop{" "}
            {(() => {
              const config = ImageConfig[cropType];
              if (switchableOrientations(cropType)) {
                const orientationConfig = config.orientationConfigs[orientation];
                return `${config.displayName} (${orientationConfig?.aspectText})`;
              }
              return `${config.displayName} (${config.aspectText})`;
            })()}
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
          <div className="mb-2 sm:mb-4 flex-1 min-h-0">
            <div className="bg-gray-50 p-2 sm:p-4 rounded-lg border border-gray-200 h-full flex flex-col">
              <div className="mb-2 sm:mb-3 flex-shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <p className="text-xs sm:text-sm text-gray-600">
                  Drag the corners to adjust the crop area. The aspect ratio is locked to{" "}
                  {(() => {
                    return ImageConfig[cropType].orientationConfigs[orientation]?.aspectText;
                  })()}
                  .
                </p>
                {switchableOrientations(cropType) && (
                  <button
                    onClick={toggleOrientation}
                    className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors whitespace-nowrap"
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
                  locked={false}
                  minWidth={(() => {
                    const config = ImageConfig[cropType];
                    const baseMinWidth = config.orientationConfigs[orientation]?.minCropWidth || 200;
                    // Use smaller min dimensions on mobile (40% of desktop values, min 100px)
                    return isMobile ? Math.max(100, baseMinWidth * 0.4) : baseMinWidth;
                  })()}
                  minHeight={(() => {
                    const config = ImageConfig[cropType];
                    const baseMinHeight = config.orientationConfigs[orientation]?.minCropHeight || 200;
                    // Use smaller min dimensions on mobile (40% of desktop values, min 100px)
                    return isMobile ? Math.max(100, baseMinHeight * 0.4) : baseMinHeight;
                  })()}
                  keepSelection={true}
                  ruleOfThirds={true}
                  circularCrop={false}
                  className="max-h-full"
                  style={{ touchAction: "none" }}
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      userSelect: "none",
                      maxHeight: isMobile ? "calc(95vh - 200px)" : "calc(90vh - 240px)",
                      touchAction: "none", // Prevent default touch behaviors
                    }}
                    draggable={false}
                  />
                </ReactCrop>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 sm:space-x-4 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
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
