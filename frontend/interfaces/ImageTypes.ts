export enum ImageType {
  THUMBNAIL = "thumbnail",
  IMAGE = "image",
  FORM = "form",
  PROFILE_PICTURE = "profile_picture",
}

export enum ImageOrientation {
  LANDSCAPE = "landscape",
  PORTRAIT = "portrait",
}

interface OrientationConfig {
  aspectText: string;
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
  title: string;
  description: string;
  supportedTypes: string[];
}

export const ImageConfig: Record<ImageType, TypeConfig> = {
  [ImageType.THUMBNAIL]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE], // Only landscape for thumbnails
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectText: "1:1 (Square)",
        aspectRatio: 1,
        minCropWidth: 300,
        minCropHeight: 300,
        displayWidth: "w-full",
      },
    },
    defaultAspectRatio: 1,
    aspectText: "1:1 (Square)",
    displayName: "Thumbnail",
    containerAspect: "aspect-square",
    defaultImageWidth: 300,
    defaultImageHeight: 300,
    title: "Event Thumbnails",
    description: "Square aspect ratio (1:1) - Used for event cards on the dashboard",
    supportedTypes: ["image/jpeg", "image/png"],
  },
  [ImageType.IMAGE]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE], // Only landscape for regular images
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectText: "16:9",
        aspectRatio: 16 / 9,
        minCropWidth: 320,
        minCropHeight: 180,
        displayWidth: "w-full",
      },
    },
    defaultAspectRatio: 16 / 9,
    aspectText: "16:9",
    displayName: "Event Image",
    containerAspect: "aspect-video",
    defaultImageWidth: 400,
    defaultImageHeight: 225,
    title: "Event Images",
    description: "16:9 aspect ratio - Used for event detail pages",
    supportedTypes: ["image/jpeg", "image/png"],
  },
  [ImageType.FORM]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE, ImageOrientation.PORTRAIT],
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectText: "5:4",
        aspectRatio: 5 / 4,
        minCropWidth: 400,
        minCropHeight: 320,
        displayWidth: "w-full",
      },
      [ImageOrientation.PORTRAIT]: {
        aspectText: "4:5",
        aspectRatio: 4 / 5,
        minCropWidth: 320,
        minCropHeight: 400,
        displayWidth: "w-1/2",
      },
    },
    defaultAspectRatio: 5 / 4, // Default to landscape
    aspectText: "5:4 / 4:5",
    displayName: "Form Image",
    containerAspect: "aspect-[5/4]",
    defaultImageWidth: 400,
    defaultImageHeight: 320,
    title: "Select or Upload Form Image",
    description:
      "Choose an existing form image or upload a new one. This can be either landscape (5:4) or portrait (4:5) orientation.",
    supportedTypes: ["image/jpeg", "image/png"],
  },
  [ImageType.PROFILE_PICTURE]: {
    allowedOrientations: [ImageOrientation.LANDSCAPE], // Square profile pictures
    orientationConfigs: {
      [ImageOrientation.LANDSCAPE]: {
        aspectText: "1:1 (Square)",
        aspectRatio: 1,
        minCropWidth: 200,
        minCropHeight: 200,
        displayWidth: "w-full",
      },
    },
    defaultAspectRatio: 1,
    aspectText: "1:1 (Square)",
    displayName: "Profile Picture",
    containerAspect: "aspect-square",
    defaultImageWidth: 300,
    defaultImageHeight: 300,
    title: "Profile Pictures",
    description: "Square aspect ratio (1:1) - Choose an existing profile picture or upload a new one",
    supportedTypes: ["image/jpeg", "image/png"],
  },
};
