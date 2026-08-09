import {
  contrastForRgb,
  dominantColourFromImageData,
  ORGANISER_ACCENT_CACHE_TTL_MS,
  ORGANISER_ACCENT_STORAGE_KEY,
  organiserAccentImageProxyUrl,
  parseOrganiserAccentCache,
  readCachedOrganiserAccent,
  rgbToHex,
  writeCachedOrganiserAccent,
} from "./organiserAccentColour";

describe("organiserAccentColour", () => {
  it("builds a same-origin proxy url for profile pictures", () => {
    const src = "https://firebasestorage.googleapis.com/v0/b/bucket/o/photo.jpg?alt=media";
    expect(organiserAccentImageProxyUrl(src)).toBe(
      `/api/organiser-accent-image?url=${encodeURIComponent(src)}`
    );
  });

  it("converts rgb to hex", () => {
    expect(rgbToHex(242, 183, 5)).toBe("#f2b705");
    expect(rgbToHex(0, 0, 0)).toBe("#000000");
  });

  it("picks dark contrast on light accents and white on dark accents", () => {
    expect(contrastForRgb(242, 183, 5)).toBe("#0a0a0a");
    expect(contrastForRgb(20, 40, 80)).toBe("#ffffff");
  });

  it("averages saturated mid-tone pixels for the dominant colour", () => {
    // One red pixel, one near-white pixel (ignored), one near-black (ignored)
    const data = new Uint8ClampedArray([
      200, 40, 40, 255, // keep
      250, 250, 250, 255, // skip white
      10, 10, 10, 255, // skip black
      180, 50, 50, 255, // keep
    ]);
    const palette = dominantColourFromImageData(data);
    expect(palette.accent).toBe(rgbToHex(190, 45, 45));
    expect(palette.contrast).toBe("#ffffff");
  });

  it("reads and writes a 1-day cache keyed by user and image url", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    };
    const now = 1_700_000_000_000;
    writeCachedOrganiserAccent(
      "user-1",
      "https://example.com/photo.jpg",
      { accent: "#336699", contrast: "#ffffff" },
      storage,
      now
    );

    expect(readCachedOrganiserAccent("user-1", "https://example.com/photo.jpg", storage, now + 1000)).toEqual({
      accent: "#336699",
      contrast: "#ffffff",
    });
    expect(readCachedOrganiserAccent("user-2", "https://example.com/photo.jpg", storage, now + 1000)).toBeNull();
    expect(readCachedOrganiserAccent("user-1", "https://example.com/other.jpg", storage, now + 1000)).toBeNull();
    expect(
      readCachedOrganiserAccent(
        "user-1",
        "https://example.com/photo.jpg",
        storage,
        now + ORGANISER_ACCENT_CACHE_TTL_MS + 1
      )
    ).toBeNull();

    const raw = storage.getItem(ORGANISER_ACCENT_STORAGE_KEY);
    const parsed = parseOrganiserAccentCache(raw, now);
    expect(parsed?.expiresAt).toBe(now + ORGANISER_ACCENT_CACHE_TTL_MS);
  });
});
