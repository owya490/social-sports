import { ImageOrientation, ImageType } from "@/interfaces/ImageTypes";
import { cropSizeError, fittingCropOrientation, orientationCropError } from "../src/images/imageUtils";

describe("crop size guard", () => {
  it("rejects a thumbnail smaller than the 300×300 square", () => {
    const size = { width: 184, height: 260 };

    expect(fittingCropOrientation(ImageType.THUMBNAIL, size)).toBeNull();
    expect(cropSizeError(ImageType.THUMBNAIL, size)).toBe(
      "This image is 184×260 pixels, which is too small for a thumbnail. Use a photo at least 300×300 pixels."
    );
  });

  it.each([
    [300, 300],
    [301, 400],
    [1200, 800],
  ])("accepts a %i×%i thumbnail", (width, height) => {
    const size = { width, height };
    expect(fittingCropOrientation(ImageType.THUMBNAIL, size)).toBe(ImageOrientation.LANDSCAPE);
    expect(cropSizeError(ImageType.THUMBNAIL, size)).toBeNull();
  });

  it.each([
    [299, 400],
    [400, 299],
    [299, 299],
  ])("rejects a %i×%i thumbnail", (width, height) => {
    expect(cropSizeError(ImageType.THUMBNAIL, { width, height })).toContain("300×300");
  });

  it("uses the event image minimum of 320×180", () => {
    expect(cropSizeError(ImageType.IMAGE, { width: 320, height: 180 })).toBeNull();
    expect(cropSizeError(ImageType.IMAGE, { width: 319, height: 400 })).toContain("320×180");
    expect(cropSizeError(ImageType.IMAGE, { width: 1000, height: 179 })).toContain("320×180");
  });

  it("accepts a form photo that fits either orientation", () => {
    expect(fittingCropOrientation(ImageType.FORM, { width: 400, height: 320 })).toBe(ImageOrientation.LANDSCAPE);
    expect(fittingCropOrientation(ImageType.FORM, { width: 320, height: 400 })).toBe(ImageOrientation.PORTRAIT);
    expect(cropSizeError(ImageType.FORM, { width: 320, height: 400 })).toBeNull();
  });

  it("names both form sizes when neither orientation fits", () => {
    expect(cropSizeError(ImageType.FORM, { width: 300, height: 300 })).toBe(
      "This image is 300×300 pixels, which is too small for a form image. Use a photo at least 400×320 (5:4) or 320×400 (4:5)."
    );
  });

  it("uses the profile picture minimum of 200×200", () => {
    expect(cropSizeError(ImageType.PROFILE_PICTURE, { width: 200, height: 200 })).toBeNull();
    expect(cropSizeError(ImageType.PROFILE_PICTURE, { width: 199, height: 200 })).toContain("200×200");
  });

  it("explains when the other form orientation does not fit", () => {
    expect(orientationCropError(ImageType.FORM, ImageOrientation.LANDSCAPE, { width: 320, height: 400 })).toBe(
      "This photo is 320×400 pixels. 5:4 needs a photo at least 400×320 pixels."
    );
    expect(orientationCropError(ImageType.FORM, ImageOrientation.PORTRAIT, { width: 320, height: 400 })).toBeNull();
  });
});
