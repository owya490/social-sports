import { TagGroup } from "@/components/TagGroup";
import EventBanner from "@/components/events/EventBanner";
import EventDescription from "@/components/events/EventDescription";
import EventImage from "@/components/events/EventImage";
import EventPayment from "@/components/events/EventPayment";
import STVWomens from "../../../public/images/stvvvv.jpg";

export default function EventPage({ params }: any) {
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
        <div className="text-black">
            <EventBanner />
            <div className="mt-10 mx-[5vw] lg:mx-[2vw] xl:mx-[3vw]">
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-6 gap-x-[2vw] 3xl:ml-[8vw]">
                    <div className="lg:mr-[7vw] lg:ml-[5vw] xl:mr-[0vw] h-fit lg:h-full xl:w-fit col-start-1 col-span-1 lg:col-span-2 xl:col-span-4 xl:row-start-1">
                        <EventImage imageSrc={STVWomens} />
                    </div>
                    <div className="lg:ml-[5vw] h-fit lg:w-fit col-start-1 lg:col-span-1 xl:col-span-4">
                        <EventDescription
                            title={title}
                            description={description}
                        />
                        <div className="flex">
                            <div className="hidden lg:block">
                                <TagGroup tags={tags} />
                            </div>
                        </div>
                    </div>
                    <div className="lg:mr-[8vw] xl:mr-[4vw] lg:ml-5 h-fit lg:w-8/9  xs:col-start-1 lg:col-start-2 lg:col-span-1 xl:row-start-1 xl:row-span-2 xl:col-start-5 xl:col-span-2  lg:mt-7 xl:mt-0 3xl:mr-[8vw]">
                        <EventPayment
                            date={date}
                            time={time}
                            location={location}
                            price={price}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
