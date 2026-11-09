jest.mock("@/services/src/firebase", () => ({
  storage: {},
}));

jest.mock("@/config/SportsConfig", () => ({
  SPORTS_CONFIG: {},
}));

jest.mock("firebase/storage", () => ({
  ref: jest.fn((_storage: unknown, path: string) => ({ fullPath: path })),
  uploadBytes: jest.fn().mockResolvedValue({}),
  getDownloadURL: jest.fn().mockResolvedValue("https://example.com/image"),
  getMetadata: jest.fn(),
  listAll: jest.fn(),
}));

import { UserId } from "@/interfaces/UserTypes";
import { uploadBytes } from "firebase/storage";
import {
  IMAGE_CACHE_CONTROL,
  uploadEventImage,
  uploadEventThumbnail,
  uploadFormImage,
  uploadProfilePhoto,
} from "../src/images/imageService";

describe("imageService uploads", () => {
  const file = new File(["x"], "photo.jpg", { type: "image/jpeg" });
  const userId = "user-1" as UserId;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    ["event thumbnail", () => uploadEventThumbnail(userId, file)],
    ["event image", () => uploadEventImage(userId, file)],
    ["form image", () => uploadFormImage(userId, file)],
    ["profile photo", () => uploadProfilePhoto(userId, file)],
  ])("uploads %s with long-lived immutable cache headers", async (_label, upload) => {
    await expect(upload()).resolves.toBe("https://example.com/image");

    expect(uploadBytes).toHaveBeenCalledWith(expect.anything(), file, {
      cacheControl: IMAGE_CACHE_CONTROL,
    });
  });

  it("uses a public, one-year, immutable cache policy", () => {
    expect(IMAGE_CACHE_CONTROL).toBe("public, max-age=31536000, immutable");
  });
});
