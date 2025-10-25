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
