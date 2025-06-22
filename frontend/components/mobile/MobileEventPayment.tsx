"use client";

import { FulfilmentEntityType } from "@/interfaces/FulfilmentTypes";
import { URL } from "@/interfaces/Types";
import { timestampToDateString } from "@/services/src/datetimeUtils";
import {
  execNextFulfilmentEntity,
  FULFILMENT_SESSION_ENABLED,
  initFulfilmentSession,
} from "@/services/src/fulfilment/fulfilmentServices";
import { getStripeCheckoutFromEventId } from "@/services/src/stripe/stripeService";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { displayPrice } from "@/utilities/priceUtils";
import { CurrencyDollarIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader, Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { InvertedHighlightButton } from "../elements/HighlightButton";
import { MAX_TICKETS_PER_ORDER } from "../events/EventDetails";
import { DifferentDayEventDateTime, SameDayEventDateTime } from "../events/EventPayment";

interface MobileEventPaymentProps {
  location: string;
  price: number;
  vacancy: number;
  startDate: Timestamp;
  endDate: Timestamp;
  registrationEndDate: Timestamp;
  eventId: string;
  isPaymentsActive: boolean;
  isPrivate: boolean;
  paused: boolean;
  setLoading: (value: boolean) => void;
  eventLink: string;
}

export default function MobileEventPayment(props: MobileEventPaymentProps) {
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
    }
  };

  const { startDate, endDate, registrationEndDate, paused } = props;
  const eventInPast = Timestamp.now() > endDate;
  const eventRegistrationClosed = Timestamp.now() > registrationEndDate || paused;

  return (
    <div className="mx-2">
      <p className="font-semibold xs:text-2xl lg:text-3xl 2xl:text-3xl mb-5 mt-5 text-center"></p>
      <div className="flex justify-start">
        <div className="w-full text-sm">
          {timestampToDateString(startDate) === timestampToDateString(endDate) ? (
            <SameDayEventDateTime startDate={startDate} endDate={endDate} />
          ) : (
            <DifferentDayEventDateTime startDate={startDate} endDate={endDate} />
          )}
          <div className="mb-1 mt-2 sm:mb-3">
            <h2 className="font-semibold text-sm">Location & Price</h2>
            <div className="flex items-center">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(props.location)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-light mr-[5%]"
              >
                {props.location}
              </a>
            </div>
          </div>
          <div className="mb-4">
            <h2 className="hidden sm:block font-semibold">Price</h2>
            <div className="flex items-center">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <p className="text-md font-light mr-[5%]">${displayPrice(props.price)} AUD</p>
            </div>
          </div>
        </div>
      </div>
      <hr className="px-2 h-[1px] mx-auto bg-core-outline border-0 rounded dark:bg-gray-400 mb-4"></hr>
      <div className="relative flex mb-6 w-full">
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
                <Select
                  label="Select Ticket Amount"
                  size="lg"
                  value={`${attendeeCount}`}
                  onChange={handleAttendeeCount}
                >
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
                      try {
                        const fulfilmentSessionId = await initFulfilmentSession({
                          type: "checkout",
                          fulfilmentEntityTypes: [FulfilmentEntityType.STRIPE],
                          endUrl: getUrlWithCurrentHostname(`/event/success/${props.eventId}`) as URL,
                          eventId: props.eventId,
                          numTickets: attendeeCount,
                        });

                        await execNextFulfilmentEntity(fulfilmentSessionId, router);

                        // TODO: implement proper way of deleting fulfilment sessions: https://owenyang.atlassian.net/browse/SPORTSHUB-365
                      } catch {
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
                    window.location.href = props.eventLink;
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
  );
}
