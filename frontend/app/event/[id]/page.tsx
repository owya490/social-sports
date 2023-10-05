import { TagGroup } from "@/components/TagGroup";
import EventDescription from "@/components/events/EventDescription";
import EventImage from "@/components/events/EventImage";
import STVWomens from "../../../public/images/stvvvv.jpg";

export default function EventDetails({ params }: any) {
  const title = "Sydney Thunder Volleyball Women's Training";
  const description = [
    "Women’s sessions are for female players who are looking to increase their skill and will be focused solely on training and building game experience.",
    "This training session is for women playing at an intermediate to advanced level and is really focused on perfecting your game! (If you can serve 70% in and receive to a setter with confidence this session is for you)!",
    "These sessions are built to representative level volleyball. This session is focused for women in the Sydney Thunder Volleyball Women’s Representative Team however all women at an advanced level are welcome to join. This session will have STV’s Head Coach Lead the session and will be focused on improving skills as an individual and as a team.",
    "Limited spots are available!",
  ];
  const tags = [
    { label: "Volleyball" },
    { label: "Women's Volleyball", url: "https://www.google.com" },
    { label: "Sydney Thunder Volleyball", url: "https://www.google.com" },
    { label: "Advanced", url: "https://www.google.com" },
  ];

  return (
    <div className="h-screen bg-white text-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-6 mx-[5vw] lg:mx-[2vw] 2xl:mx-[5vw] gap-x-[2vw] 3xl:ml-[8vw]">
        <div className="lg:mr-[7vw] lg:ml-[7vw] 2xl:mr-[0vw] h-fit lg:h-full 2xl:w-fit col-start-1 col-span-1 lg:col-span-2 2xl:col-span-4 2xl:row-start-1">
          <EventImage imageSrc={STVWomens} />
        </div>
        <div className="lg:ml-[7vw] h-fit lg:w-fit col-start-1 lg:col-span-1 2xl:col-span-4">
          <EventDescription title={title} description={description} />
          <div className="flex">
            <div className="hidden lg:block">
              <TagGroup tags={tags} />
            </div>
          </div>
        </div>
        <div className="lg:mr-[8vw] 2xl:mr-[7vw] lg:ml-5 h-fit lg:w-8/9  xs:col-start-1 lg:col-start-2 lg:col-span-1 2xl:row-start-1 2xl:row-span-2 2xl:col-start-5 2xl:col-span-2 border border-1 rounded-[20px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.4)] lg:mt-7 2xl:mt-0 3xl:mr-[8vw]">
          <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl text-center mb-10 lg:mb-8 ml-3 mr-3 mt-9 lg:mt-7 2xl:mt-12 2xl:mb-10">
            Event Details
          </p>
          <div className="flex justify-start">
            <div className="w-full">
              <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
                <img
                  src="https://static.vecteezy.com/system/resources/previews/005/988/959/non_2x/calendar-icon-free-vector.jpg"
                  alt="Event Image"
                  className="your-image-classes w-12 h-12 mr-2"
                />
                <p className="text-md lg:text-lg mr-[5%]">
                  Saturday, 23 September, 2023
                </p>
              </div>
              <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
                <img
                  src="https://t3.ftcdn.net/jpg/05/29/73/96/360_F_529739662_yRW6APsQg3PaJGQ6afQL8hDdod0OR1re.jpg"
                  alt="Event Image"
                  className="your-image-classes w-12 h-12 mr-2"
                />
                <p className="text-md lg:text-lg mr-[5%]">
                  8:00 - 10:00 pm AEST
                </p>
              </div>
              <div className="flex items-center mb-5 ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
                <img
                  src="https://previews.123rf.com/images/giamportone/giamportone1802/giamportone180200009/95977351-map-pin-icon-location-symbol-outline-vector-illustration.jpg"
                  alt="Event Image"
                  className="your-image-classes w-12 h-12 mr-2"
                />
                <p className="text-md lg:text-lg mr-[5%]">
                  North Ryde RSL, NSW
                </p>
              </div>
              <div className="flex items-center ml-[6vw] sm:ml-[8vw] md:ml-[8.1%vw] lg:ml-[7.2%] xl:ml-[7.5%] 2xl:ml-[8%]">
                <img
                  src="https://thumbs.dreamstime.com/b/dollar-sign-dollar-sign-icon-dollar-sign-dollar-sign-icon-vector-illustration-graphic-web-design-170432064.jpg"
                  alt="Event Image"
                  className="your-image-classes w-12 h-12 mr-2"
                />
                <p className="text-md lg:text-lg mr-[5%]">
                  $30.00 AUD per person
                </p>
              </div>
            </div>
          </div>
          <div className="relative flex justify-center">
            <div
              className="text-md lg:text-lg rounded-3xl bg-white p-4 border-[1px] border-black mt-10 w-4/5 h-1/15"
              style={{
                textAlign: "left",
                position: "relative",
              }}
            >
              GUESTS
              <br />
              <p className="text-sm lg:text-lg">1 guest(s)</p>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  d="M9.293 12.293a1 1 0 011.414 0L12 13.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414 1 1 0 011.414 0L12 13.586z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="text-md lg:text-lg flex justify-between">
            <span className="ml-[10%] mt-12">$30 x 1 guest(s)</span>
            <span className="mr-[10%] mt-12">$30</span>
          </div>
          <div className="px-[10%]">
            <hr className="px-2 h-0.5 mx-auto my-4 bg-gray-400 border-0 rounded md:my-10 dark:bg-gray-400"></hr>
          </div>
          <div className="text-lg lg:text-2xl flex justify-between">
            <span className="ml-[10%] mt-2">Total</span>
            <span className="mr-[10%] mt-2">$30</span>
          </div>
          <div className="relative flex justify-center mt-10">
            <div
              className="text-lg lg:text-2xl text-white rounded-3xl bg-sky-500/75 p-3 w-4/5 h-1/18 mb-[10%]"
              style={{
                textAlign: "center",
                position: "relative",
              }}
            >
              Book now
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
