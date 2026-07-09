import Loading from "@/components/loading/Loading";
import { EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EMPTY_ORDER_DEFAULTS, Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { addAttendee } from "@/services/src/attendee/attendeeService";
import {
  findEventTicketType,
  getActiveSortedEventTicketTypes,
  hasEventTicketTypes,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { clampTicketQuantity } from "@/services/src/events/eventsUtils/ticketLimits";
import { Description, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Alert, Input, Option, Select } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import React, { Fragment, useEffect, useState } from "react";

interface InviteAttendeeDialogProps {
  eventData: EventData;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isFilterModalOpen: boolean;
  eventId: EventId;
  setEventVacancy: React.Dispatch<React.SetStateAction<number>>;
  setOrderTicketsMap: React.Dispatch<React.SetStateAction<Map<Order, Ticket[]>>>;
}

const InviteAttendeeDialog = ({
  eventData,
  setEventMetadata,
  closeModal,
  isFilterModalOpen,
  eventId,
  setEventVacancy,
  setOrderTicketsMap,
}: InviteAttendeeDialogProps) => {
  const [attendeeEmail, setAttendeeEmail] = useState<string>("");
  const [attendeeName, setAttendeeName] = useState<string>("");
  const [attendeePhoneNumber, setAttendeePhoneNumber] = useState<string>("");
  const [numTickets, setNumTickets] = useState<string>("1");
  const usesTicketTypes = hasEventTicketTypes(eventData);
  const activeTypes = getActiveSortedEventTicketTypes(eventData.eventTicketTypes);
  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(
    activeTypes[0]?.eventTicketTypeId ?? null
  );
  const selectedType = selectedTypeId
    ? findEventTicketType(eventData.eventTicketTypes, selectedTypeId)
    : undefined;
  const effectiveVacancy = usesTicketTypes ? (selectedType?.vacancy ?? 0) : eventData.vacancy;
  const effectivePrice = usesTicketTypes ? (selectedType?.price ?? 0) : 0;

  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const ErrorMessage = () => {
    return <div className="text-red-400 text-sm py-2">Error adding new attendee - {errorMessage}!</div>;
  };

  const handleErrorAddingAttendee = () => {
    setShowErrorMessage(true);
  };

  const resetInputFields = () => {
    setAttendeeEmail("");
    setAttendeeName("");
    setAttendeePhoneNumber("");
    setNumTickets("1");
  };

  const handleAddAttendee = async () => {
    try {
      setLoading(true);
      const { orderId, ticketIds } = await addAttendee({
        eventId,
        email: attendeeEmail,
        fullName: attendeeName,
        phone: attendeePhoneNumber,
        numTickets: parseInt(numTickets),
        price: effectivePrice,
        ...(selectedTypeId ? { eventTicketTypeId: selectedTypeId } : {}),
      });
      const now = Timestamp.now();
      const typeName = selectedType?.name;
      const newOrder: Order = {
        ...EMPTY_ORDER_DEFAULTS,
        orderId: orderId as OrderId,
        email: attendeeEmail,
        fullName: attendeeName,
        phone: attendeePhoneNumber,
        tickets: ticketIds as TicketId[],
        datePurchased: now,
        status: OrderAndTicketStatus.APPROVED,
        type: OrderAndTicketType.MANUAL,
      };
      const newTickets: Ticket[] = ticketIds.map((ticketId) => ({
        ...EMPTY_TICKET,
        ticketId: ticketId as TicketId,
        eventId,
        orderId: orderId as OrderId,
        purchaseDate: now,
        status: OrderAndTicketStatus.APPROVED,
        type: OrderAndTicketType.MANUAL,
        price: effectivePrice,
        ...(selectedTypeId ? { eventTicketTypeId: selectedTypeId, eventTicketTypeName: typeName } : {}),
      }));
      setOrderTicketsMap((prev) => new Map(prev).set(newOrder, newTickets));
      setEventVacancy(eventData.vacancy - parseInt(numTickets));
      setEventMetadata((prev) => ({
        ...prev,
        completeTicketCount: prev.completeTicketCount + parseInt(numTickets),
      }));
      resetInputFields();
      setShowSuccessAlert(true);
      setShowErrorMessage(false);
      closeModal();
    } catch (error) {
      setErrorMessage((error as Error).message);
      handleErrorAddingAttendee();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer: number | undefined;

    if (showSuccessAlert) {
      timer = window.setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [showSuccessAlert]);

  return (
    <div>
      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-30"
          onClose={() => {
            closeModal();
            setShowErrorMessage(false);
          }}
        >
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <DialogPanel className="w-full max-w-md transform rounded-2xl p-6 bg-white text-left align-middle shadow-xl transition-all">
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <Loading inline={true} />
                    </div>
                  ) : (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        await handleAddAttendee();
                      }}
                    >
                      <DialogTitle
                        as="h3"
                        className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[0px] border-gray-500 w-full text-center flex justify-center items-center"
                      >
                        Add Attendee
                      </DialogTitle>
                      <Description className="font-semibold text-organiser-title-gray-text p-4 rounded-lg border-0 bg-yellow-100 mb-2 text-sm flex justify-between items-center gap-x-2">
                        NOTE: The event organiser and attendee will need to organise their own payment.
                        <ExclamationCircleIcon className="h-8 w-8 flex-shrink-0" />
                      </Description>
                      <div className="space-y-2">
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          tabIndex={1}
                          required
                          className="focus:ring-0"
                          label="Attendee email"
                          onChange={(e) => setAttendeeEmail(e.target.value)}
                          crossOrigin={undefined}
                        />
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          tabIndex={1}
                          required
                          className="focus:ring-0"
                          label="Attendee name"
                          onChange={(e) => setAttendeeName(e.target.value)}
                          crossOrigin={undefined}
                        />
                        <Input
                          id="mobilenumber"
                          name="mobilenumber"
                          type="tel"
                          pattern="04[0-9]{8}"
                          autoComplete="number"
                          tabIndex={1}
                          className="focus:ring-0"
                          label="Mobile number (04 XXXX XXXX)"
                          onChange={(e) => setAttendeePhoneNumber(e.target.value)}
                          crossOrigin={undefined}
                        />
                        <Input
                          label="Number of tickets"
                          crossOrigin={undefined}
                          required
                          value={numTickets}
                          type="number"
                          min={1}
                          max={effectiveVacancy}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              const capped = clampTicketQuantity(value, 1, effectiveVacancy);
                              setNumTickets(capped.toString());
                            } else {
                              setNumTickets("1");
                            }
                          }}
                          className="focus:ring-0"
                        />
                        {usesTicketTypes && activeTypes.length > 0 && (
                          <Select
                            label="Ticket type"
                            value={selectedTypeId ?? ""}
                            onChange={(value) => {
                              if (value) {
                                setSelectedTypeId(value as EventTicketTypeId);
                                setNumTickets("1");
                              }
                            }}
                          >
                            {activeTypes.map(({ eventTicketTypeId, eventTicketType }) => (
                              <Option key={eventTicketTypeId} value={eventTicketTypeId}>
                                {eventTicketType.name} ({eventTicketType.vacancy} remaining)
                              </Option>
                            ))}
                          </Select>
                        )}
                      </div>

                      <div className="mt-2 float-right">
                        <button
                          className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
                          type="submit"
                        >
                          Add Attendee
                        </button>
                      </div>

                      <div className="mt-2 float-left">{showErrorMessage ? <ErrorMessage /> : <div></div>}</div>
                    </form>
                  )}
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
      <div className="fixed ml-auto mr-auto left-4 bottom-4 w-fit z-40">
        <Alert
          open={showSuccessAlert}
          onClose={() => {
            setShowSuccessAlert(false);
          }}
          color="green"
          className="z-40 mb-16 md:mb-0"
        >
          Success adding new attendee!
        </Alert>
      </div>
    </div>
  );
};

export default InviteAttendeeDialog;
