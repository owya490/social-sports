import { EventData } from "@/interfaces/EventTypes";
import Image from "next/image";

interface IEventBanenr {
    eventData: EventData;
}

export default function EventBanner(props: IEventBanenr) {
    const { eventData } = props;
    return (
        <div className="bg-white border-b-black border-1 border w-screen px-5 md:px-10 pt-16 shadow-lg">
            <div className="grid md:grid-cols-3">
                <div className="flex items-center col-span-2">
                    <div className="mt-3">
                        <p className="font-bold text-xs block md:hidden">
                            {/* SAT, SEPT 23 · 20:00 AEST */}
                            {eventData.startDate.toString()}
                        </p>
                        <h1 className="text-3xl md:text-4xl">
                            {/* Sydney Thunder Men&apos;s Volleyball */}
                            {eventData.name}
                        </h1>

                        <div className="block md:flex items-center pt-2 pb-4 pl-1">
                            <div className="flex items-center">
                                <Image
                                    // src={DP}
                                    src={eventData.organiser.profilePicture}
                                    alt="DP"
                                    width={50}
                                    height={50}
                                    className="rounded-full w-4 h-4"
                                />
                                <p className="text-xs font-light ml-1 mr-4">
                                    {/* Hosted by Tzeyen Rossiter */}
                                    {`Hosted by ${eventData.organiser.firstName} ${eventData.organiser.surname}`}
                                </p>
                            </div>

                            <p className="font-bold text-xs hidden md:block">
                                {/* SAT, SEPT 23 · 20:00 AEST */}
                                {eventData.startDate.toString()}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <h2 className="ml-auto font-bold text-xl mb-3">
                        {/* 12 Spots Remaining */}
                        {`${eventData.vacancy} Spots Remaining`}
                    </h2>
                </div>
            </div>
        </div>
    );
}
