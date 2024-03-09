import Image from "next/image";
import React from "react";

import BannerImage from "../../public/images/vball1.webp";

const EventDrilldownDetailsPage = () => {
  return (
    <div className="">
      <div>
        <Image
          src={BannerImage}
          alt="BannerImage"
          width={0}
          height={0}
          className="h-full w-full object-cover rounded-3xl"
        />
      </div>
      <div className="h-20 border-organiser-darker-light-gray border-solid rounded-3xl">asdf</div>
    </div>
  );
};

export default EventDrilldownDetailsPage;
