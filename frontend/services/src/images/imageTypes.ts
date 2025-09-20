export enum ImageType {
  THUMBNAIL = "thumbnail",
  IMAGE = "image",
  FORM = "form",
}

export enum ImageOrientation {
  LANDSCAPE = "landscape",
  PORTRAIT = "portrait",
}

interface OrientationConfig {
  aspectRatio: number;
  minCropWidth: number;
  minCropHeight: number;
  displayWidth: string; // CSS class for display width
}

interface TypeConfig {
  allowedOrientations: ImageOrientation[];
  orientationConfigs: {
    [ImageOrientation.LANDSCAPE]?: OrientationConfig;
    [ImageOrientation.PORTRAIT]?: OrientationConfig;
  };
  defaultAspectRatio: number; // For non-form types
  aspectText: string;
  displayName: string;
  containerAspect: "aspect-square" | "aspect-video" | "aspect-[5/4]";
  defaultImageWidth: number;
  defaultImageHeight: number;
}

export const ImageConfig: Record<ImageType, TypeConfig> = {
  [ImageType.THUMBNAIL]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE], // Only landscape for thumbnails
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectRatio: 1,
        minCropWidth: 100,
        minCropHeight: 100,
        displayWidth: "w-full",
      },
    },
    defaultAspectRatio: 1,
    aspectText: "1:1 (Square)",
    displayName: "Thumbnail",
    containerAspect: "aspect-square",
    defaultImageWidth: 300,
    defaultImageHeight: 300,
  },
  [ImageType.IMAGE]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE], // Only landscape for regular images
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectRatio: 16 / 9,
        minCropWidth: 160,
        minCropHeight: 90,
        displayWidth: "w-full",
      },
    },
    defaultAspectRatio: 16 / 9,
    aspectText: "16:9",
    displayName: "Event Image",
    containerAspect: "aspect-video",
    defaultImageWidth: 400,
    defaultImageHeight: 225,
  },
  [ImageType.FORM]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE, ImageOrientation.PORTRAIT],
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectRatio: 5 / 4,
        minCropWidth: 125,
        minCropHeight: 100,
        displayWidth: "w-full",
      },
      [ImageOrientation.PORTRAIT]: {
        aspectRatio: 4 / 5,
        minCropWidth: 80,
        minCropHeight: 100,
        displayWidth: "w-1/2",
      },
    },
    defaultAspectRatio: 5 / 4, // Default to landscape
    aspectText: "5:4 / 4:5",
    displayName: "Form Image",
    containerAspect: "aspect-[5/4]",
    defaultImageWidth: 400,
    defaultImageHeight: 225,
  },
};
