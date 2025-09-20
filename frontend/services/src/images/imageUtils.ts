import { ImageOrientation } from "../../../interfaces/ImageTypes";

export const determineOrientation = (img: HTMLImageElement): ImageOrientation => {
  return img.naturalWidth > img.naturalHeight ? ImageOrientation.LANDSCAPE : ImageOrientation.PORTRAIT;
};
