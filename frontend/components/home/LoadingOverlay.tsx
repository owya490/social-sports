"use client";

import Image from "next/image";
import { useEffect } from "react";
import Logo from "../../public/images/black-logo.png";
import { sleep } from "../utility/sleepUtil";

export default function LoadingOverlay() {
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
      await sleep(1000);
      document.getElementById("overlay")!.classList.add("opacity-0");
      await sleep(1000);
      document.getElementById("overlay")!.classList.add("hidden");
      // document.getElementById("title")!.classList.add("opacity-0");
      // document.getElementById("logo")!.classList.add("opacity-0");
      // await sleep(500);
      // document.getElementById("background")!.classList.add("opacity-0");
    }
    animateLogo();
  }, []);

  return (
    <div
      id="overlay"
      className="absolute top-0 w-screen h-screen z-50 transition-all duration-1000"
    >
      <div
        id="background"
        className="w-full object-cover h-screen relative bg-black transition-all duration-1000"
      ></div>
      <div className="absolute top-0 w-full h-screen flex justify-center items-center">
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
      </div>
    </div>
  );
}
