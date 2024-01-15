import Image from "next/image";
import HeroImage from "./../../public/images/basketball-hero.png";

export default function Hero() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 mt-4 md:mt-8">
      <div className="w-full flex justify-center items-center">
        <div>
          <h1 className="text-6xl font-extrabold">
            Satisfy your Sports Cravings.
          </h1>
          <p className="font-light mt-4">
            Find your next Social Sports Session right here on{" "}
            <a href="/dashboard" className="font-semibold hover:underline">
              Sports Hub.
            </a>
          </p>
        </div>
      </div>
      <div>
        <Image
          priority
          src={HeroImage}
          height={0}
          width={0}
          alt="..."
          className="w-full object-cover"
        />
      </div>
    </div>
  );
}
