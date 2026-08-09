"use client";

import { useEffect, useState } from "react";

const FALLBACK_HERO = "#525252";

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0"))
    .join("")}`;
}

/** Soften extreme lights/darks so the hero band stays readable as a flat colour field. */
function clampHeroTone(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2 / 255;

  if (lightness > 0.78) {
    return rgbToHex(r * 0.72, g * 0.72, b * 0.72);
  }
  if (lightness < 0.18) {
    return rgbToHex(Math.min(255, r + 48), Math.min(255, g + 48), Math.min(255, b + 48));
  }
  return rgbToHex(r, g, b);
}

function sampleDominantColor(image: HTMLImageElement): string {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return FALLBACK_HERO;

  ctx.drawImage(image, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha < 128) continue;
    const pr = data[i];
    const pg = data[i + 1];
    const pb = data[i + 2];
    const lum = (pr + pg + pb) / 3;
    if (lum > 245 || lum < 12) continue;
    r += pr;
    g += pg;
    b += pb;
    count += 1;
  }

  if (count === 0) return FALLBACK_HERO;
  return clampHeroTone(r / count, g / count, b / count);
}

/** Extracts a flat hero colour from a remote profile image (CORS anonymous). */
export function useImageDominantColor(imageUrl: string | undefined): string {
  const [colorByUrl, setColorByUrl] = useState<{ url: string; color: string } | null>(null);

  useEffect(() => {
    if (!imageUrl) return;

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";

    img.onload = () => {
      if (cancelled) return;
      try {
        setColorByUrl({ url: imageUrl, color: sampleDominantColor(img) });
      } catch {
        setColorByUrl({ url: imageUrl, color: FALLBACK_HERO });
      }
    };
    img.onerror = () => {
      if (!cancelled) setColorByUrl({ url: imageUrl, color: FALLBACK_HERO });
    };

    img.src = imageUrl;

    return () => {
      cancelled = true;
      img.onload = null;
      img.onerror = null;
    };
  }, [imageUrl]);

  if (!imageUrl) return FALLBACK_HERO;
  if (colorByUrl?.url === imageUrl) return colorByUrl.color;
  return FALLBACK_HERO;
}
