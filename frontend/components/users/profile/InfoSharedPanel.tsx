import eye from "@/public/images/Eye.png";
import Image from "next/image";

export const InfoSharedPanel = () => {
  return (
    <div className="border border-core-outline rounded-xl p-6 space-y-2 hidden lg:block">
      <Image src={eye} alt="eye" width={0} height={0} className="h-9 w-12" />
      <div className="text-xl font-bold">What info is shared with others?</div>
      <div className="text-md">
        SPORTSHUB only shows your name and bio on your public profile page by default. You can consent to showcasing
        your contact information if you are an organiser.
      </div>
    </div>
  );
};
