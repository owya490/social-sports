"use client";
import { EventId } from "@/interfaces/EventTypes";
import { PublicUserData } from "@/interfaces/UserTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import Link from "next/link";
import LoadingSkeletonOrganiserEventCard from "../../loading/LoadingSkeletonOrganiserEventCard";

export interface OrganiserEventCardProps {
  eventId: EventId;
  image: string;
  name: string;
  organiser: PublicUserData;
  startTime: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  loading?: boolean;
  disabled?: boolean;
  openInNewTab?: boolean;
}

export default function OrganiserEventCard(props: OrganiserEventCardProps) {
  if (props.loading === undefined) {
    props = {
      ...props,
      loading: false,
      openInNewTab: false,
    };
  }
  if (props.disabled === undefined) {
    props = {
      ...props,
      disabled: false,
    };
  }

  const MaybeDisabledLink = ({
    children,
    disabled = false,
    openInNewTab = false,
    url,
  }: {
    children: React.ReactNode;
    disabled?: boolean;
    openInNewTab?: boolean;
    url: string;
  }) => {
    if (disabled) {
      return <div>{children}</div>;
    }
    return (
      <Link href={url} target={openInNewTab ? "_blank" : undefined}>
        {children}
      </Link>
    );
  };

  return (
    <MaybeDisabledLink
      disabled={props.disabled}
      openInNewTab={props.openInNewTab}
      url={`/organiser/event/${props.eventId}`}
    >
      <div className="bg-background rounded-xl text-left border-border border w-full hover:cursor-pointer hover:bg-surface-hover transition-colors">
        {props.loading ? (
          <div>
            <LoadingSkeletonOrganiserEventCard />
          </div>
        ) : (
          <>
            <div
              className="h-36 w-full object-cover rounded-t-xl"
              style={{
                backgroundImage: `url(${props.image})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
              }}
            ></div>
            <div className="p-4">
              <h4 className="type-meta">{timestampToEventCardDateString(props.startTime)}</h4>
              <h2 className="text-xl font-bold mb-1 mt-1 whitespace-nowrap overflow-hidden text-foreground font-sans">
                {props.name}
              </h2>
              <div className="mt-4 mb-6 space-y-3">
                <div className="flex items-center text-foreground-secondary">
                  <MapPinIcon className="w-5 shrink-0" />
                  <p className="ml-1 font-normal text-sm whitespace-nowrap overflow-hidden font-sans">
                    {props.location}
                  </p>
                </div>
                <div className="flex items-center text-foreground-secondary">
                  <CurrencyDollarIcon className="w-5 shrink-0" />
                  <p className="ml-1 font-normal text-sm font-sans">{getEventPriceDisplay(props.price, true)}</p>
                </div>
              </div>
              <div className="flex items-center">
                <p className="type-meta">{`${props.vacancy} spots left`}</p>
              </div>
            </div>
          </>
        )}
      </div>
    </MaybeDisabledLink>
  );
}
