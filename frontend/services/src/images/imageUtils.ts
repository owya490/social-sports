import { ImageConfig, ImageOrientation, ImageType } from "../../../interfaces/ImageTypes";

export const determineOrientation = (img: HTMLImageElement): ImageOrientation => {
  return img.naturalWidth > img.naturalHeight ? ImageOrientation.LANDSCAPE : ImageOrientation.PORTRAIT;
};

export const isLandscape = (orientation: ImageOrientation): boolean => {
  return orientation === ImageOrientation.LANDSCAPE;
};

export const switchOrientation = (orientation: ImageOrientation): ImageOrientation => {
  return orientation === ImageOrientation.LANDSCAPE ? ImageOrientation.PORTRAIT : ImageOrientation.LANDSCAPE;
};

export const switchableOrientations = (imageType: ImageType): boolean => {
  return ImageConfig[imageType].allowedOrientations.length > 1;
};

export type ImagePixelSize = {
  width: number;
  height: number;
};

type CropMinimum = {
  orientation: ImageOrientation;
  width: number;
  height: number;
  aspectText: string;
};

const cropMinimums = (imageType: ImageType): CropMinimum[] => {
  const config = ImageConfig[imageType];
  return config.allowedOrientations.flatMap((orientation) => {
    const spec = config.orientationConfigs[orientation];
    if (!spec) return [];
    return [
      {
        orientation,
        width: spec.minCropWidth,
        height: spec.minCropHeight,
        aspectText: spec.aspectText,
      },
    ];
  });
};

const fitsMinimum = (size: ImagePixelSize, minimum: CropMinimum): boolean => {
  return size.width >= minimum.width && size.height >= minimum.height;
};

const withArticle = (name: string): string => {
  const lower = name.toLowerCase();
  return `${/^[aeiou]/i.test(lower) ? "an" : "a"} ${lower}`;
};

const formatPixels = (width: number, height: number): string => `${width}×${height}`;

// The cropper locks onto the whole photo when the file is smaller than the
// minimum crop, and the required aspect ratio is lost. Reject those first.
export const fittingCropOrientation = (imageType: ImageType, size: ImagePixelSize): ImageOrientation | null => {
  return cropMinimums(imageType).find((minimum) => fitsMinimum(size, minimum))?.orientation ?? null;
};

export const cropSizeError = (imageType: ImageType, size: ImagePixelSize): string | null => {
  if (fittingCropOrientation(imageType, size)) return null;

  const config = ImageConfig[imageType];
  const minimums = cropMinimums(imageType);
  const actual = formatPixels(size.width, size.height);
  const required =
    minimums.length <= 1
      ? `${formatPixels(minimums[0]?.width ?? 0, minimums[0]?.height ?? 0)} pixels`
      : minimums
          .map((minimum) => `${formatPixels(minimum.width, minimum.height)} (${minimum.aspectText})`)
          .join(" or ");

  return `This image is ${actual} pixels, which is too small for ${withArticle(config.displayName)}. Use a photo at least ${required}.`;
};

export const orientationCropError = (
  imageType: ImageType,
  orientation: ImageOrientation,
  size: ImagePixelSize
): string | null => {
  const minimum = cropMinimums(imageType).find((option) => option.orientation === orientation);
  if (!minimum || fitsMinimum(size, minimum)) return null;
  return `This photo is ${formatPixels(size.width, size.height)} pixels. ${minimum.aspectText} needs a photo at least ${formatPixels(minimum.width, minimum.height)} pixels.`;
};

export const readImageDimensions = (file: File): Promise<ImagePixelSize> => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(url);
      if (width > 0 && height > 0) resolve({ width, height });
      else reject(new Error("Could not read image"));
    };
    image.onerror = fail;
    image.src = url;
  });
};
