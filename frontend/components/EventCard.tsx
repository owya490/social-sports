"use client";
import { EventId } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import Image from "next/image";
import Coin from "./../svgs/coin.svg";
import Location from "./../svgs/location.svg";

import { useRouter } from "next/navigation";

interface IEventCard {
    eventId: EventId;
    image: string;
    name: string;
    organiser: UserData;
    startTime: Date;
    location: string;
    price: number;
    vacancy: number;
}

export default function EventCard(props: IEventCard) {
    const router = useRouter();

    return (
        <button
            className="bg-white rounded-xl min-w-xs max-w-xs text-left"
            onClick={() => {
                router.push(`/event/${props.eventId}`);
            }}
        >
            <Image
                // src={list[num]}
                src={props.image}
                height={0}
                width={0}
                alt="stvImage"
                className="w-full rounded-t-xl h-36 object-cover"
            />
            <div className="p-4">
                <h4 className="font-bold text-gray-500 text-xs">
                    SAT, SEPT 23 · 20:00 AEST
                    {/* {props.startTime} */}
                </h4>
                <h2 className="text-xl font-bold mb-1 mt-1">
                    {/* Sydney Thunder Volleyball Men’s Training */}
                    {props.name}
                </h2>
                <div className="flex ml-0.5 items-center">
                    <Image
                        // src={DP}
                        src={props.organiser.profilePicture}
                        alt="DP"
                        width={50}
                        height={50}
                        className="rounded-full w-4 h-4"
                    />
                    <p className="text-xs font-light ml-1">
                        {/* Hosted by Tzeyen Rossiter */}
                        {`Hosted by ${props.organiser.firstName} ${props.organiser.surname}`}
                    </p>
                </div>
                <div className="mt-4 mb-7 space-y-3">
                    <div className="flex items-center">
                        {/* <LocationIcon /> */}
                        <Image src={Location} alt="coin" className="w-5" />
                        <p className="ml-1 font-light text-sm">
                            {/* North Ryde RSL, NSW */}
                            {props.location}
                        </p>
                    </div>
                    <div className="flex items-center">
                        {/* <DollarSignIcon /> */}
                        <Image src={Coin} alt="coin" className="w-5" />

                        <p className="ml-1 font-light text-sm">
                            {/* $30.00 AUD per person */}
                            {`$${props.price} AUD per person`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center">
                    <p className="text-sm font-light text-gray-500">
                        {/* 5 spots left */}
                        {`${props.vacancy} spots left`}
                    </p>
                    <button className="ml-auto rounded-full bg-[#30ADFF] py-1 px-2 text-white">
                        <h2 className="text-sm">Book Now</h2>
                    </button>
                </div>
            </div>
        </button>
    );
}
