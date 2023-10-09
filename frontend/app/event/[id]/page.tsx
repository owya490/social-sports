import { TagGroup } from "@/components/TagGroup";
import EventDescription from "@/components/events/EventDescription";
import EventImage from "@/components/events/EventImage";
import EventPayment from "@/components/events/EventPayment";
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
  const date = "Saturday, 23 September, 2023";
  const time = "8:00 - 10:00 pm AEST";
  const location = "North Ryde RSL, NSW";
  const price = "$30";

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
          <EventPayment
            date={date}
            time={time}
            location={location}
            price={price}
          />
        </div>
      </div>
    </div>
  );
}
