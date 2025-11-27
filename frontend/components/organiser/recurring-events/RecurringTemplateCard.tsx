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
  disabled: boolean;
  disableLink?: boolean;
  openInNewTab?: boolean;
}

export default function RecurringTemplateCard(props: RecurringTemplateCardProps) {
  if (props.loading === undefined) {
    props = {
      ...props,
      loading: false,
    };
  }
  if (props.disableLink === undefined) {
    props = {
      ...props,
      disableLink: false,
    };
  }
  if (props.openInNewTab === undefined) {
    props = {
      ...props,
      openInNewTab: false,
    };
  }

  const MaybeDisabledLink = ({
    children,
    disableLink = false,
    url,
  }: {
    children: React.ReactNode;
    disableLink?: boolean;
    url: string;
  }) => {
    if (disableLink) {
      return <div>{children}</div>;
    }
    return (
      <Link href={url} target={props.openInNewTab ? "_blank" : undefined}>
        {children}
      </Link>
    );
  };
  return (
    <MaybeDisabledLink
      disableLink={props.disableLink}
      url={`/organiser/event/recurring-events/${props.recurrenceTemplateId}`}
    >
      <div className="bg-white rounded-lg text-left border-gray-300 border w-full hover:cursor-pointer">
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
                  <p className="ml-1 font-light text-sm">{`$${displayPrice(props.price)} AUD`}</p>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <p className="text-sm font-thin">{`Frequency: ${props.frequency}`}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-thin">{`Recurrence Amount: ${props.recurrenceAmount} times`}</p>
                  </div>
                  <div className="flex items-center">
                    <p className="text-sm font-thin">{`Creating events ${props.createDaysBefore} days before`}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Switch
                    color="teal"
                    label={`Recurrence is ${props.recurrenceEnabled ? "Enabled" : "Not Enabled"}`}
                    size="sm"
                    className="my-4"
                    disabled={props.disabled}
                    checked={props.recurrenceEnabled}
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </MaybeDisabledLink>
  );
}
