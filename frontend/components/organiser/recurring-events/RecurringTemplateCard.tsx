"use client";
import { Frequency, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Switch } from "@mantine/core";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import LoadingSkeletonOrganiserEventCard from "../../loading/LoadingSkeletonOrganiserEventCard";

export interface RecurringTemplateCardProps {
  recurrenceTemplateId: RecurrenceTemplateId;
  image: string;
  name: string;
  startTime: Timestamp;
  location: string;
  price: number;
  loading?: boolean;
  frequency: Frequency;
  recurrenceAmount: number;
  createDaysBefore: number;
  recurrenceEnabled: boolean;
}

export default function RecurringTemplateCard(props: RecurringTemplateCardProps) {
  if (props.loading === undefined) {
    props = {
      ...props,
      loading: false,
    };
  }
  return (
    <Link href={`/organiser/recurring-event/${props.recurrenceTemplateId}`}>
      <div className="bg-white rounded-lg text-left border-gray-300 border w-full sm:w-[600px] xl:w-[580px] 2xl:w-[640px] hover:cursor-pointer">
        {props.loading ? (
          <div>
            <LoadingSkeletonOrganiserEventCard />
          </div>
        ) : (
          <>
            <div
              className="h-36 w-full object-cover rounded-t-lg"
              style={{
                backgroundImage: `url(${props.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
              }}
            ></div>
            <div className="p-4">
              <h4 className="font-bold text-gray-500 text-xs">{timestampToEventCardDateString(props.startTime)}</h4>
              <h2 className="text-xl font-bold mb-1 mt-1 whitespace-nowrap overflow-hidden">{props.name}</h2>
              <div className="mt-4 mb-5 space-y-3">
                <div className="flex items-center">
                  <MapPinIcon className="w-5 shrink-0" />
                  <p className="ml-1 font-light text-sm whitespace-nowrap overflow-hidden">{props.location}</p>
                </div>
                <div className="flex items-center">
                  <CurrencyDollarIcon className="w-5 shrink-0" />
                  <p className="ml-1 font-light text-sm">{`$${displayPrice(props.price)} AUD per person`}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2">
                <div>
                  <div className="flex items-center">
                    <p className="text-sm font-thin ">{`Frequency: ${props.frequency}`}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-thin ">{`Recurrence Amount: ${props.recurrenceAmount} times`}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-thin">{`Creating events ${props.createDaysBefore} days before`}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center">
                    {/* <p className="text-sm font-light text-gray-500">{`Recurrence Enabled`}</p> */}
                    <Switch
                      color="teal"
                      label="Enable Recurrence for this Event"
                      size="sm"
                      className="my-4"
                      checked={props.recurrenceEnabled}
                      onChange={(event) => {
                        // handleRecurrenceEnabledChange(event.currentTarget.checked);
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  );
}
