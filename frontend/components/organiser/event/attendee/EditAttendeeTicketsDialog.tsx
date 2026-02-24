import Loading from "@/components/loading/Loading";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { setAttendeeTickets } from "@/services/src/attendee/attendeeService";
import { getEventById } from "@/services/src/events/eventsService";
import { getOrderById } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { Description, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Alert, Input } from "@material-tailwind/react";
import { Fragment, useEffect, useState } from "react";

interface EditAttendeeTicketsDialogProps {
  setIsEditAttendeeTicketsDialogModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isEditAttendeeTicketsDialogModalOpen: boolean;
  order: Order;
  tickets: Ticket[];
  eventId: EventId;
  eventData: EventData;
  setEventVacancy: React.Dispatch<React.SetStateAction<number>>;
  setOrderTicketsMap: React.Dispatch<React.SetStateAction<Map<Order, Ticket[]>>>;
}

export const EditAttendeeTicketsDialog = ({
  closeModal,
  isEditAttendeeTicketsDialogModalOpen,
  order,
  tickets,
  eventId,
  eventData,
  setEventVacancy,
  setOrderTicketsMap,
}: EditAttendeeTicketsDialogProps) => {
  const numTickets = tickets.length;
  const [newNumTickets, setNewNumTickets] = useState<string>(numTickets.toString());

  useEffect(() => {
    if (isEditAttendeeTicketsDialogModalOpen) {
      setNewNumTickets(numTickets.toString());
    }
  }, [isEditAttendeeTicketsDialogModalOpen, numTickets]);

  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);

  const handleErrorEditAttendeeTickets = () => {
    setShowErrorMessage(true);
  };

  const handleEditAttendeeTickets = async () => {
    try {
      setLoading(true);
      await setAttendeeTickets({
        eventId,
        orderId: order.orderId,
        numTickets: parseInt(newNumTickets),
      });
      const updatedOrder = await getOrderById(order.orderId);
      const updatedTickets = await getTicketsByIds(updatedOrder.tickets);
      setOrderTicketsMap((prev) => {
        const next = new Map(prev);
        const [oldOrder] = Array.from(next.entries()).find(([o]) => o.orderId === order.orderId) ?? [];
        if (oldOrder) next.delete(oldOrder);
        next.set(updatedOrder, updatedTickets);
        return next;
      });
      const updatedEventData = await getEventById(eventId);
      setEventVacancy(updatedEventData.vacancy);
      setShowSuccessAlert(true);
      setShowErrorMessage(false);
      closeModal();
    } catch (error) {
      setErrorMessage((error as Error).message);
      handleErrorEditAttendeeTickets();
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = () => {
    return <div className="text-red-400 text-sm py-2">Error editing attendee tickets - {errorMessage}!</div>;
  };

  return (
    <div>
      <Transition appear show={isEditAttendeeTicketsDialogModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={closeModal}>
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
                    <div>
                      <DialogTitle
                        as="h3"
                        className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[0px] border-gray-500 w-full text-center flex justify-center items-center"
                      >
                        Edit Attendee Tickets
                      </DialogTitle>
                      <Description className="font-semibold text-organiser-title-gray-text p-4 rounded-lg bg-yellow-100 mb-2 text-sm">
                        <div className="flex flex-row">
                          <div>
                            IMPORTANT: The event organiser and attendee will need to organise their own payment
                            arrangement to account for this change.
                          </div>
                          <div className="content-center ml-4">
                            <ExclamationCircleIcon className="h-8" />
                          </div>
                        </div>
                      </Description>
                      <Description className=" text-organiser-dark-gray-text p-2 mb-2 text-sm">
                        <span className="font-semibold"> {order.email}</span> currently has{" "}
                        <span className="font-semibold">{numTickets}</span> tickets.
                        <br></br>
                        Change this to:
                      </Description>
                      <div className="">
                        <Input
                          label="Number of tickets"
                          crossOrigin={undefined}
                          required
                          value={newNumTickets}
                          type="number"
                          min={0}
                          max={numTickets + eventData.vacancy}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              const capped = Math.min(Math.max(value, 0), numTickets + eventData.vacancy);
                              setNewNumTickets(capped.toString());
                            } else {
                              setNewNumTickets("0");
                            }
                          }}
                          className="rounded-md focus:ring-0"
                          size="lg"
                        />
                      </div>

                      <div className="mt-2 float-right">
                        <div
                          className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
                          onClick={() => {
                            handleEditAttendeeTickets();
                          }}
                        >
                          Submit
                        </div>
                      </div>
                      <div className="mt-2 float-left">{showErrorMessage ? <ErrorMessage /> : <div></div>}</div>
                    </div>
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
          className="z-40"
        >
          Success editing attendee tickets!
        </Alert>
      </div>
    </div>
  );
};
