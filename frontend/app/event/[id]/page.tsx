import EventBanner from "@/components/events/EventBanner";
import { EventDetails } from "@/components/events/EventDetails";
import RecommendedEvents from "@/components/events/RecommendedEvents";

export default function EventPage({ params }: any) {
    return (
        <div className="text-black">
            <EventBanner />
            <div className="mt-10 mx-[5vw] lg:mx-[2vw] xl:mx-[3vw]">
                <EventDetails />
                <div className="mx-4 lg:mx-16">
                    <div className="w-full bg-gray-300 h-[1px] mt-10"></div>
                    <div className="flex my-5">
                        <h5 className="font-bold text-lg">
                            Similar events nearby
                        </h5>
                        <a className="text-sm font-light ml-auto cursor-pointer">
                            See all
                        </a>
                    </div>
                    <div className="flex space-x-5">
                        <RecommendedEvents />
                        <RecommendedEvents />
                        <RecommendedEvents />
                        <RecommendedEvents />
                    </div>
                </div>
            </div>
        </div>
    );
}
