"use client";

import Image from "next/image";
import HeroImage from "./../../public/images/home_hero.jpg";

export default function HomePage() {
  // const [eventData, setEventData] = useState<EventData[]>([]);
  // useEffect(() => {
  //   getEventById("D7kgbTinsnV1A3KG3LFU").then((data) => {
  //     eventData.push(data);
  //     setEventData(eventData);
  //   });
  // });
  // redirect("/dashboard");
  return (
    <div>
      <Image
        src={HeroImage}
        alt="hero"
        height={0}
        width={0}
        className="w-full object-cover h-screen relative brightness-75"
      />
      <div className="absolute top-0 w-full h-screen flex justify-center items-center">
        <h1 className="text-white font-robotocondensed text-5xl">
          Your One Stop Social Sport Shop
        </h1>
      </div>
      {/* <RecommendedEvents eventData={eventData[0]} /> */}
    </div>
  );
}
