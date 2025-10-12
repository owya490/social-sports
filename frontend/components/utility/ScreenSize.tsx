"use client";
import { useEffect, useState } from "react";

export enum ScreenSize {
  XS = "xs",
  SM = "sm",
  MD = "md",
  LG = "lg",
  XL = "xl",
  XL2 = "2xl",
  XL3 = "3xl",
  XL4 = "4xl",
}

const breakpoints: Record<ScreenSize, number> = {
  [ScreenSize.XS]: 0,
  [ScreenSize.SM]: 640,
  [ScreenSize.MD]: 768,
  [ScreenSize.LG]: 1024,
  [ScreenSize.XL]: 1280,
  [ScreenSize.XL2]: 1536,
  [ScreenSize.XL3]: 1920,
  [ScreenSize.XL4]: 2560,
};

const breakpointOrder: ScreenSize[] = [
  ScreenSize.XS,
  ScreenSize.SM,
  ScreenSize.MD,
  ScreenSize.LG,
  ScreenSize.XL,
  ScreenSize.XL2,
  ScreenSize.XL3,
  ScreenSize.XL4,
];

function getScreenSize(width: number): ScreenSize {
  if (width >= breakpoints[ScreenSize.XL4]) return ScreenSize.XL4;
  if (width >= breakpoints[ScreenSize.XL3]) return ScreenSize.XL3;
  if (width >= breakpoints[ScreenSize.XL2]) return ScreenSize.XL2;
  if (width >= breakpoints[ScreenSize.XL]) return ScreenSize.XL;
  if (width >= breakpoints[ScreenSize.LG]) return ScreenSize.LG;
  if (width >= breakpoints[ScreenSize.MD]) return ScreenSize.MD;
  if (width >= breakpoints[ScreenSize.SM]) return ScreenSize.SM;
  return ScreenSize.XS;
}

export function useScreenSize() {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    // SSR safe initialization
    if (typeof window === "undefined") return ScreenSize.MD; // Default for SSR
    return getScreenSize(window.innerWidth);
  });

  useEffect(() => {
    // Update on mount in case SSR default was wrong
    const updateScreenSize = () => {
      setScreenSize(getScreenSize(window.innerWidth));
    };

    // Set initial value
    updateScreenSize();
  }, []);

  // Helper function to check if screen is a specific size
  const is = (size: ScreenSize) => screenSize === size;

  // Helper function to check if screen is at or below a specific size
  const isAtOrBelow = (size: ScreenSize) => {
    const currentIndex = breakpointOrder.indexOf(screenSize);
    const targetIndex = breakpointOrder.indexOf(size);
    return currentIndex <= targetIndex;
  };

  // Helper function to check if screen is at or above a specific size
  const isAtOrAbove = (size: ScreenSize) => {
    const currentIndex = breakpointOrder.indexOf(screenSize);
    const targetIndex = breakpointOrder.indexOf(size);
    return currentIndex >= targetIndex;
  };

  return {
    screenSize,
    is,
    isAtOrBelow,
    isAtOrAbove,
  };
}
