"use client";
import CreateEventBanner from "@/components/home/CreateEventBanner";
import Hero from "@/components/home/Hero";
import LoadingOverlay from "@/components/home/LoadingOverlay";
import PopularEvents from "@/components/home/PopularEvents";
import SearchSport from "@/components/home/SearchSport";
import { sleep } from "@/utilities/sleepUtil";
import { useEffect, useState } from "react";

export default function Home() {
  const [shouldAnimate, setShouldAnimate] = useState(false);
  useEffect(() => {
    async function init() {
      document.getElementById("page")!.classList.add("hidden");
      document.getElementById("footer")!.classList.add("hidden");
      await sleep(2200);
      document.getElementById("page")!.classList.remove("hidden");
      document.getElementById("footer")!.classList.remove("hidden");
    }

    if (sessionStorage.getItem("animation") === null) {
      setShouldAnimate(true);
      init();
    }
  }, []);

  return (
    <div>
      <LoadingOverlay shouldAnimate={shouldAnimate} />
      <div id="page" className="">
        <div className="w-screen justify-center flex">
          <div className="screen-width-dashboard">
            <Hero />
            <SearchSport />
          </div>
        </div>
        {/* <RecommendedEvents />
        <div className="my-16 md:my-36 w-screen flex justify-center">
          <div className="screen-width-dashboard">
            <NewsletterSignup />
          </div>
        </div>
        <PopularLocations /> */}
        <PopularEvents />
        <CreateEventBanner />
      </div>
    </div>
  );
}
