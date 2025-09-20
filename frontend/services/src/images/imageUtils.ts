import { ImageOrientation } from "./imageTypes";

export const determineOrientation = (img: HTMLImageElement): ImageOrientation => {
  return img.naturalWidth > img.naturalHeight ? ImageOrientation.LANDSCAPE : ImageOrientation.PORTRAIT;
};
