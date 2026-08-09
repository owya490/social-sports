export const ORGANISER_ACCENT_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const ORGANISER_ACCENT_STORAGE_KEY = "organiserHubAccentColour";

export const DEFAULT_ORGANISER_ACCENT = "#f2b705";
export const DEFAULT_ORGANISER_ACCENT_CONTRAST = "#0a0a0a";

export type OrganiserAccentPalette = {
  accent: string;
  contrast: string;
};

type OrganiserAccentCacheEntry = OrganiserAccentPalette & {
  userId: string;
  imageUrl: string;
  expiresAt: number;
};

function toHexChannel(value: number): string {
  return Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0");
}

export function rgbToHex(r: number, g: number, b: number): string {
  return `#${toHexChannel(r)}${toHexChannel(g)}${toHexChannel(b)}`;
}

function relativeLuminance(r: number, g: number, b: number): number {
  const toLinear = (channel: number) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastForRgb(r: number, g: number, b: number): string {
  return relativeLuminance(r, g, b) > 0.5 ? DEFAULT_ORGANISER_ACCENT_CONTRAST : "#ffffff";
}

export function parseOrganiserAccentCache(raw: string | null, now = Date.now()): OrganiserAccentCacheEntry | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<OrganiserAccentCacheEntry>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.imageUrl !== "string" ||
      typeof parsed.accent !== "string" ||
      typeof parsed.contrast !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }
    if (parsed.expiresAt <= now) return null;
    return parsed as OrganiserAccentCacheEntry;
  } catch {
    return null;
  }
}

export function readCachedOrganiserAccent(
  userId: string,
  imageUrl: string,
  storage: Pick<Storage, "getItem"> | null = typeof localStorage === "undefined" ? null : localStorage,
  now = Date.now()
): OrganiserAccentPalette | null {
  if (!storage) return null;
  const cached = parseOrganiserAccentCache(storage.getItem(ORGANISER_ACCENT_STORAGE_KEY), now);
  if (!cached) return null;
  if (cached.userId !== userId || cached.imageUrl !== imageUrl) return null;
  return { accent: cached.accent, contrast: cached.contrast };
}

export function writeCachedOrganiserAccent(
  userId: string,
  imageUrl: string,
  palette: OrganiserAccentPalette,
  storage: Pick<Storage, "setItem"> | null = typeof localStorage === "undefined" ? null : localStorage,
  now = Date.now()
): void {
  if (!storage) return;
  const entry: OrganiserAccentCacheEntry = {
    userId,
    imageUrl,
    accent: palette.accent,
    contrast: palette.contrast,
    expiresAt: now + ORGANISER_ACCENT_CACHE_TTL_MS,
  };
  try {
    storage.setItem(ORGANISER_ACCENT_STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // Ignore quota / private-mode failures — accent still applies for this session.
  }
}

export function applyOrganiserAccentCssVars(palette: OrganiserAccentPalette): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.setProperty("--color-accent", palette.accent);
  root.style.setProperty("--color-accent-contrast", palette.contrast);
  root.style.setProperty("--color-focus", palette.accent);
}

export function clearOrganiserAccentCssVars(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.style.removeProperty("--color-accent");
  root.style.removeProperty("--color-accent-contrast");
  root.style.removeProperty("--color-focus");
}

/** Average colourful mid-tone pixels from raw RGBA image data. */
export function dominantColourFromImageData(data: Uint8ClampedArray): OrganiserAccentPalette {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const max = Math.max(pr, pg, pb);
    const min = Math.min(pr, pg, pb);
    if (max < 40 || min > 230 || max - min < 25) continue;
    r += pr;
    g += pg;
    b += pb;
    count += 1;
  }

  if (count === 0) {
    return { accent: DEFAULT_ORGANISER_ACCENT, contrast: DEFAULT_ORGANISER_ACCENT_CONTRAST };
  }

  const avgR = r / count;
  const avgG = g / count;
  const avgB = b / count;
  return {
    accent: rgbToHex(avgR, avgG, avgB),
    contrast: contrastForRgb(avgR, avgG, avgB),
  };
}

/**
 * Sample a local File/Blob in the browser (no network). Used when the organiser
 * picks a profile photo — browsers block reading pixels from Firebase URLs.
 */
export async function accentFromLocalImageFile(file: Blob): Promise<OrganiserAccentPalette> {
  const bitmap = await createImageBitmap(file);
  try {
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return { accent: DEFAULT_ORGANISER_ACCENT, contrast: DEFAULT_ORGANISER_ACCENT_CONTRAST };
    }
    ctx.drawImage(bitmap, 0, 0, size, size);
    return dominantColourFromImageData(ctx.getImageData(0, 0, size, size).data);
  } finally {
    bitmap.close();
  }
}

/** Cache + apply after a profile photo upload/selection. */
export function rememberOrganiserAccentFromPhoto(
  userId: string,
  imageUrl: string,
  palette: OrganiserAccentPalette
): void {
  writeCachedOrganiserAccent(userId, imageUrl, palette);
  applyOrganiserAccentCssVars(palette);
}
