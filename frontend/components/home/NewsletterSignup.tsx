import { Input } from "@material-tailwind/react";
import Image from "next/image";
import VolleyballArt from "./../../public/images/volleyball-digging.png";

export default function NewsletterSignup() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3">
      <div className="col-span-1 md:col-span-2">
        <Image
          src={VolleyballArt}
          height={0}
          width={0}
          alt="..."
          className="ml-auto"
        />
      </div>
      <div className="flex justify-center items-center md:ml-5">
        <div className="h-fit">
          <h1 className="text-3xl font-semibold lg:text-4xl">
            Subscribe To The <span className="">Newsletter</span>
          </h1>
          <p className="mt-3 font-thin italic">
            be the first to knows when our{" "}
            <span className="font-bold">Brand</span> is live
          </p>

          <div className="flex flex-col mt-6 space-y-3 lg:space-y-0 lg:flex-row">
            <Input
              crossOrigin={undefined}
              label="Email Address"
              variant="outlined"
            />
            <button className="w-full px-5 py-2 text-sm tracking-wider uppercase transition-colors duration-300 transform border border-black rounded-lg lg:w-auto lg:mx-4 hover:bg-black hover:text-white">
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
