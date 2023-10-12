import EventCard from "@/components/EventCard";

export default function Dashboard() {
    return (
        <div className="pt-20 mx-[05vw] lg:mx-[3vw] xl:mx-[2vw]">
            <div className="flex flex-wrap justify-center">
                {[
                    1,
                    1,
                    1,
                    1,
                    11,
                    1,
                    1,
                    11,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    1,
                    ,
                    1,
                ]
                    // .fill()
                    .map((x) => {
                        return (
                            <div className="m-4">
                                <EventCard />
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
