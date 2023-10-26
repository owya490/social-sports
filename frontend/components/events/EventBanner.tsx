import { UserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/datetimeUtils";
import { Timestamp } from "firebase/firestore";
import Image from "next/image";

interface IEventBanenr {
    name: string;
    startDate: Timestamp;
    organiser: UserData;
    vacancy: number;
}

export default function EventBanner(props: IEventBanenr) {
    return (
        <div className="bg-white border-b-black border-1 border w-screen px-5 md:px-10 pt-16 shadow-lg">
            <div className="grid md:grid-cols-3">
                <div className="flex items-center col-span-2">
                    <div className="mt-3">
                        <p className="font-bold text-xs block md:hidden">
                            {timestampToEventCardDateString(
                                props.startDate
                            )}
                        </p>
                        <h1 className="text-3xl md:text-4xl">
                            {props.name}
                        </h1>

                        <div className="block md:flex items-center pt-2 pb-4 pl-1">
                            <div className="flex items-center">
                                <Image
                                    src={props.organiser.profilePicture}
                                    alt="DP"
                                    width={50}
                                    height={50}
                                    className="rounded-full w-4 h-4"
                                />
                                <p className="text-xs font-light ml-1 mr-4">
                                    {`Hosted by ${props.organiser.firstName} ${props.organiser.surname}`}
                                </p>
                            </div>

                            <p className="font-bold text-xs hidden md:block">
                                {timestampToEventCardDateString(
                                    props.startDate
                                )}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center">
                    <h2 className="ml-auto font-bold text-xl mb-3">
                        {`${props.vacancy} Spots Remaining`}
                    </h2>
                </div>
            </div>
        </div>
    );
}
