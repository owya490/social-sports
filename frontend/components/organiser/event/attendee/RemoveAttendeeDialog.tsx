import Loading from "@/components/loading/Loading";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { setAttendeeTickets } from "@/services/src/attendee/attendeeService";
import { getEventById } from "@/services/src/events/eventsService";
import { Dialog, Transition, Description, DialogTitle, TransitionChild, DialogPanel } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Alert } from "@material-tailwind/react";
import React, { Dispatch, Fragment, SetStateAction, useState } from "react";

interface RemoveAttendeeDialogProps {
  setIsRemoveAttendeeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isRemoveAttendeeModalOpen: boolean;
  order: Order;
  eventId: EventId;
  eventData: EventData;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setOrderTicketsMap: React.Dispatch<React.SetStateAction<Map<Order, Ticket[]>>>;
}

const RemoveAttendeeDialog = ({
  closeModal,
  isRemoveAttendeeModalOpen,
  order,
  eventId,
  eventData,
  setEventVacancy,
  setOrderTicketsMap,
}: RemoveAttendeeDialogProps) => {
  const [loading, setLoading] = useState<boolean>(false);

  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleErrorRemovingAttendee = () => {
    setShowErrorMessage(true);
  };

  const handleRemoveAttendee = async () => {
    try {
      setLoading(true);
      await setAttendeeTickets({
        eventId,
        orderId: order.orderId,
        numTickets: 0,
      });
      setOrderTicketsMap((prev) => {
        const next = new Map(prev);
        const [oldOrder] = Array.from(next.entries()).find(([o]) => o.orderId === order.orderId) ?? [];
        if (oldOrder) next.delete(oldOrder);
        return next;
      });
      setEventVacancy(eventData.vacancy + order.tickets.length);
      setShowSuccessAlert(true);
      setShowErrorMessage(false);
      closeModal();
    } catch (error) {
      handleErrorRemovingAttendee();
      setErrorMessage((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = () => {
    return <div className="text-red-400 text-sm py-2">Error removing attendee - {errorMessage}!</div>;
  };

  return (
    <div>
      <Transition appear show={isRemoveAttendeeModalOpen} as={Fragment}>
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
                        Remove Attendee
                      </DialogTitle>
                      <Description className="font-semibold text-organiser-title-gray-text p-4 rounded-lg bg-yellow-100 mb-2 text-sm">
                        <div className="flex flex-row">
                          <div>
                            IMPORTANT: The event organiser and attendee will need to organise their own payment.
                          </div>
                          <div className="content-center ml-4">
                            <ExclamationCircleIcon className="h-8" />
                          </div>
                        </div>
                      </Description>
                      <Description className=" text-organiser-dark-gray-text p-2 mb-2 text-sm">
                        You are about to remove
                        <span className="font-semibold"> {order.email}</span>.
                      </Description>

                      <div className="mt-2 float-right">
                        <div
                          className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
                          onClick={() => {
                            handleRemoveAttendee();
                          }}
                        >
                          Remove Attendee
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
          Success removing attendee!
        </Alert>
      </div>
    </div>
  );
};

export default RemoveAttendeeDialog;
