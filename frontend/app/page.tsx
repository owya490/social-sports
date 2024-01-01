"use client";

import RecommendedEvents from "@/components/events/RecommendedEvents";
import Image from "next/image";
import { useEffect } from "react";
import Logo from "./../public/images/black-logo.png";

export default function Home() {
  function sleep(time: number) {
    return new Promise((resolve) => setTimeout(resolve, time));
  }
  useEffect(() => {
    async function animateLogo() {
      document.getElementById("logo")!.classList.add("rotate-[359deg]");
      await sleep(1000);
      // document.getElementById("title")!.classList.remove("hidden");
      console.log(screen.width);
      if (screen.width > 768) {
        document.getElementById("title")!.classList.replace("w-0", "w-[500px]");
        document.getElementById("logo")!.classList.add("-translate-x-5");
      } else {
        document.getElementById("title")!.classList.replace("w-0", "w-40");
        document.getElementById("logo")!.classList.add("-translate-x-3");
      }
      await sleep(2000);
      document
        .getElementById("arrow")!
        .classList.replace("opacity-0", "opacity-100");
    }
    animateLogo();
  }, []);
  return (
    <div>
      {/* <Image
        src={HeroImage}
        alt="hero"
        height={0}
        width={0}
        className="w-full object-cover h-screen relative brightness-75"
      /> */}
      <div
        id="background"
        className="w-full object-cover h-screen relative bg-black transition-all duration-1000"
      ></div>
      <div className="absolute top-0 w-full h-screen flex justify-center items-center">
        {/* <h1 className="text-white font-robotocondensed text-5xl">
          Your One Stop Social Sport Shop
        </h1> */}
        <div>
          <div className="flex items-center">
            <Image
              id="logo"
              src={Logo}
              alt={"..."}
              height={0}
              width={0}
              className="transition-all duration-1000 w-10 h-10 md:w-20 md:h-20"
            />
            <h1
              id="title"
              className="text-white text-2xl md:text-7xl font-bold w-0 transition-all overflow-hidden whitespace-nowrap duration-1000"
            >
              SPORTS HUB
            </h1>
          </div>
        </div>
        <div
          id="arrow"
          className="opacity-0 absolute bottom-60 md:bottom-96 w-full flex justify-center mt-10 md:mt-16 -translate-x-2 transition-all duration-1000"
        >
          <div className="animate-bounce bg-white dark:bg-slate-800 p-2 w-8 h-8 md:w-10 md:h-10 ring-1 ring-slate-900/5 dark:ring-slate-200/20 shadow-lg rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-black"
              fill="none"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
            </svg>
          </div>
        </div>
      </div>
      <RecommendedEvents />
    </div>
  );
}
