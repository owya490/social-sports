import Image from "next/image";
import ChevronLeftButton from "../utility/ChevronLeftButton";
import ChevronRightButton from "../utility/ChevronRightButton";

export default function PopularLocations() {
  const scrollLeft = () => {
    document.getElementById("location-overflow")?.scrollBy({
      top: 0,
      left: -50,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    document.getElementById("location-overflow")?.scrollBy({
      top: 0,
      left: 50,
      behavior: "smooth",
    });
  };

  return (
    <div className="w-full flex justify-center mt-16 md:mt-44 mb-10">
      <div className="block">
        <div className="w-full flex justify-center">
          <div className="screen-width-dashboard">
            <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
            <div className="flex my-5">
              <h5 className="font-bold text-lg">Popular Locations</h5>
              <a className="text-sm font-light ml-auto cursor-pointer hover:underline">
                See all
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center">
          <div className="hidden sm:block pr-2">
            <ChevronLeftButton handleClick={scrollLeft} />
          </div>
          <div className="screen-width-dashboard">
            <div
              id="location-overflow"
              className="flex overflow-x-auto snap-x snap-mandatory"
            >
              <div className="flex space-x-4">
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--sydney.webp"
                    }
                    height={0}
                    width={0}
                    alt="sydney"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Sydney
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--melbourne.webp"
                    }
                    height={0}
                    width={0}
                    alt="melb"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Melbourne
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--canberra.webp"
                    }
                    height={0}
                    width={0}
                    alt="canberra"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Canberra
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--brisbane-city.webp"
                    }
                    height={0}
                    width={0}
                    alt="brisbane"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Brisbane
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--newcastle.webp"
                    }
                    height={0}
                    width={0}
                    alt="new-castle"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Newcastle
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>

                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--adelaide.webp"
                    }
                    height={0}
                    width={0}
                    alt="adelaide"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Adelaide
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--perth.webp"
                    }
                    height={0}
                    width={0}
                    alt="perth"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Perth
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
                <div className="bg-white rounded-lg w-full text-left min-w-[350px] max-w-[350px] hover:cursor-pointer relative group snap-start">
                  <Image
                    priority={true}
                    src={
                      "https://d1n9ior3u0lhlo.cloudfront.net/australia--gold-coast.webp"
                    }
                    height={0}
                    width={0}
                    alt="gold-coast"
                    className="w-full rounded-lg h-56 object-cover"
                  />
                  <h3 className="absolute z-50 text-2xl font-bold bottom-3 left-3 text-white">
                    Gold Coast
                  </h3>
                  <div className="group-hover:bg-black opacity-[60%] absolute h-0 group-hover:h-14 bottom-0 w-full rounded-b-lg transition-all duration-500"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden sm:block pl-2">
            <ChevronRightButton handleClick={scrollRight} />
          </div>
        </div>
      </div>
    </div>
  );
}
