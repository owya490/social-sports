import location from "@/public/images/location.png";
import Image from "next/image";

export const LocationPanel = () => {
  return (
    <div className="border border-core-outline rounded-xl p-6 space-y-2 hidden lg:block">
      <Image src={location} alt="location" width={0} height={0} className="h-9 w-9" />
      <div className="text-xl font-bold">What is my location used for?</div>
      <div className="text-md">Sports Hub uses your location to better recommend you events that are close to you!</div>
    </div>
  );
};
