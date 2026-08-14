"use client";

import { ImageSection } from "@/interfaces/FormTypes";
import { ImageOrientation } from "@/interfaces/ImageTypes";
import { determineOrientation } from "@/services/src/images/imageUtils";
import Image from "next/image";
import { useState } from "react";

export function CompactImageSection({ imageSection }: { imageSection: ImageSection }) {
  const [orientation, setOrientation] = useState<ImageOrientation | null>(null);

  return (
    <div className="space-y-2">
      {imageSection.question ? (
        <p className="text-sm font-semibold text-foreground font-sans leading-snug">{imageSection.question}</p>
      ) : null}
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex w-full justify-center">
          <Image
            src={imageSection.imageUrl}
            alt={imageSection.question || "Form image"}
            className={`${
              orientation === null ? "w-full" : orientation === ImageOrientation.LANDSCAPE ? "w-full" : "w-1/2"
            } object-cover`}
            width={0}
            height={0}
            onLoad={(e) => {
              const img = e.target as HTMLImageElement;
              setOrientation(determineOrientation(img));
            }}
          />
        </div>
      </div>
    </div>
  );
}
