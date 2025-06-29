"use client";
import { EventId } from "@/interfaces/EventTypes";
import { FulfilmentEntityType, FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { duration, timestampToDateString, timestampToTimeOfDay } from "@/services/src/datetimeUtils";
import {
  execNextFulfilmentEntity,
  FULFILMENT_SESSION_ENABLED,
  initFulfilmentSession,
} from "@/services/src/fulfilment/fulfilmentServices";
import { getStripeCheckoutFromEventId } from "@/services/src/stripe/stripeService";
import { displayPrice } from "@/utilities/priceUtils";
import {
  CalendarDaysIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  PlayCircleIcon,
} from "@heroicons/react/24/outline";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InvertedHighlightButton } from "../elements/HighlightButton";
import { MAX_TICKETS_PER_ORDER } from "./EventDetails";

interface EventPaymentProps {
  startDate: Timestamp;
  endDate: Timestamp;
  registrationEndDate: Timestamp;
  location: string;
  price: number;
  vacancy: number;
  isPaymentsActive: boolean;
  eventId: EventId;
  isPrivate: boolean;
  paused: boolean;
  setLoading: (value: boolean) => void;
  eventLink: string;
}

export default function EventPayment(props: EventPaymentProps) {
  const router = useRouter();
  const [attendeeCount, setAttendeeCount] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  const handleAttendeeCount = (value?: string) => {
    if (value) {
      setAttendeeCount(parseInt(value));
    }
  };

  const handleContactClick = () => {
    if (props.eventLink) {
      setOpenModal(true);
    } else {
      console.warn("No event link provided!");
      // TODO: Redirect user to the organiser's profile page instead of just logging a warning
    }
  };

  const { startDate, endDate, registrationEndDate, paused } = props;

  const eventInPast = Timestamp.now() > endDate;
  const eventRegistrationClosed = Timestamp.now() > registrationEndDate || paused;

  return (
    <div className="md:border border-1 border-gray-300 rounded-[20px] shadow-[0_5px_30px_-15px_rgba(0,0,0,0.3)] bg-white">
      <div className="mx-6">
        <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl mb-5 mt-6 text-center"></p>
        <div className="flex justify-start">
          <div className="w-full">
            <div className="mb-6">
              {timestampToDateString(startDate) === timestampToDateString(endDate) ? (
                <SameDayEventDateTime startDate={startDate} endDate={endDate} />
              ) : (
                <DifferentDayEventDateTime startDate={startDate} endDate={endDate} />
              )}
            </div>
            <div className="mb-6">
              <h2 className=" font-semibold">Location</h2>
              <div className="flex">
                <MapPinIcon className="w-4 h-4 mr-2 lg:mt-1 shrink-0" />
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-md font-light mr-[5%]"
                >
                  {props.location}
                </a>
              </div>
            </div>

            <div className="mb-6">
              <h2 className=" font-semibold">Price</h2>
              <div className="flex items-center font-light">
                <CurrencyDollarIcon className="w-5 h-5 mr-2 shrink-0" />
                <p className="text-md mr-[5%] font-light">${displayPrice(props.price)} AUD</p>
              </div>
            </div>
          </div>
        </div>
        <hr className="px-2 h-0.5 mx-auto bg-core-outline border-0 rounded dark:bg-gray-400 mb-6"></hr>
        <div className="relative flex justify-center mb-6 w-full">
          {eventRegistrationClosed ? (
            <div>
              <h2 className="font-semibold">Event registration has closed.</h2>
              <p className="text-xs font-light">Please check with the organiser for more details.</p>
            </div>
          ) : eventInPast ? (
            <div>
              <h2 className="font-semibold">Event has already finished.</h2>
              <p className="text-xs font-light">Please check with the organiser for future events.</p>
            </div>
          ) : props.isPaymentsActive ? (
            <div className="w-full">
              {props.vacancy === 0 ? (
                <div>
                  <h2 className="font-semibold">Event currently sold out.</h2>
                  <p>Please check back later.</p>
                </div>
              ) : (
                <>
                  <div className="!text-black !border-black mb-6">
                    <Select
                      className="border-black border-t-transparent text-black"
                      label="Select Ticket Amount"
                      size="lg"
                      value={`${attendeeCount}`}
                      onChange={handleAttendeeCount}
                      labelProps={{
                        className: "text-black before:border-black after:border-black",
                      }}
                      menuProps={{
                        className: "text-black",
                      }}
                    >
                      {/* TODO remove the hardcoded event as that was 1 off for gg eoy social */}
                      {Array(Math.min(props.vacancy, MAX_TICKETS_PER_ORDER))
                        .fill(0)
                        .map((_, idx) => {
                          const count = idx + 1;
                          return (
                            <Option key={`attendee-option-${count}`} value={`${count}`}>
                              {count} Ticket{count > 1 ? "s" : ""}
                            </Option>
                          );
                        })}
                    </Select>
                  </div>
                  <button
                    className="font-semibold rounded-2xl border bg-black text-white hover:bg-white hover:text-black hover:border-core-outline w-full py-3 transition-all duration-300 mb-2"
                    style={{
                      textAlign: "center",
                      position: "relative",
                    }}
                    onClick={async () => {
                      props.setLoading(true);
                      window.scrollTo(0, 0);

                      // We'll put this behind a flag for now just in case we need to quickly disable this.
                      if (FULFILMENT_SESSION_ENABLED) {
                        let fulfilmentSessionId: FulfilmentSessionId | undefined = undefined;
                        try {
                          fulfilmentSessionId = await initFulfilmentSession({
                            type: "checkout",
                            fulfilmentEntityTypes: [FulfilmentEntityType.STRIPE],
                            eventId: props.eventId,
                            numTickets: attendeeCount,
                          });

                          await execNextFulfilmentEntity(fulfilmentSessionId, router);

                          // TODO: implement proper way of deleting fulfilment sessions: https://owenyang.atlassian.net/browse/SPORTSHUB-365
                          // For now, we'll just manually delete the session after processing.
                        } catch {
                          // Clean up fulfilment session if it fails

                          router.push("/error");
                        }
                      } else {
                        const stripeCheckoutLink = await getStripeCheckoutFromEventId(
                          props.eventId,
                          props.isPrivate,
                          attendeeCount
                        );

                        router.push(stripeCheckoutLink);
                      }
                    }}
                  >
                    Book Now
                  </button>
                  <p className=" font-light text-[0.75rem]">{`Registrations close: ${timestampToTimeOfDay(
                    registrationEndDate
                  )} ${timestampToDateString(registrationEndDate)}`}</p>
                </>
              )}
            </div>
          ) : (
            <>
              <InvertedHighlightButton
                onClick={handleContactClick}
                className="text-lg rounded-2xl border border-black w-full py-3"
              >
                Contact Now
              </InvertedHighlightButton>
              <Dialog open={openModal} handler={setOpenModal}>
                <DialogHeader className="mx-2 text-lg font-medium leading-6">Contact Event Organizer</DialogHeader>
                <DialogBody>
                  <p className="mx-2 text-base font-medium text-black">You are going to be redirected to:</p>
                  <p className="mx-2 text-base font-medium text-blue-900">{props.eventLink}</p>
                </DialogBody>
                <DialogFooter className="flex justify-between">
                  <Button className="mx-2 bg-gray-200" variant="text" color="black" onClick={() => setOpenModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    className="ml-2"
                    variant="filled"
                    color="black"
                    onClick={() => {
                      window.open(props.eventLink, "_blank", "noopener,noreferrer");
                      setOpenModal(false);
                    }}
                  >
                    Proceed
                  </Button>
                </DialogFooter>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export const SameDayEventDateTime = ({ startDate, endDate }: { startDate: Timestamp; endDate: Timestamp }) => {
  const { hours, minutes } = duration(startDate, endDate);
  return (
    <>
      <h2 className=" font-semibold">Date and Time</h2>
      <div className="flex items-center">
        <CalendarDaysIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">{timestampToDateString(startDate)}</p>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">
          {timestampToTimeOfDay(startDate)} - {timestampToTimeOfDay(endDate)}
        </p>
      </div>
      <div className="flex items-center">
        <PlayCircleIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">
          {hours} hrs {minutes} mins
        </p>
      </div>
    </>
  );
};

export const DifferentDayEventDateTime = ({ startDate, endDate }: { startDate: Timestamp; endDate: Timestamp }) => {
  return (
    <>
      <h2 className=" font-semibold">Start Date</h2>
      <div className="flex items-center">
        <CalendarDaysIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">{`${timestampToDateString(startDate)}`}</p>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">{`${timestampToTimeOfDay(startDate)}`}</p>
      </div>
      <h2 className=" font-semibold">End Date</h2>
      <div className="flex items-center">
        <CalendarDaysIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">{`${timestampToDateString(endDate)}`}</p>
      </div>
      <div className="flex items-center">
        <ClockIcon className="w-5 mr-2 shrink-0" />
        <p className="text-md mr-[5%] font-light">{`${timestampToTimeOfDay(endDate)}`}</p>
      </div>
    </>
  );
};
