import { EventId, EventMetadata, Name, Purchaser } from "@/interfaces/EventTypes";
import { setAttendeeTickets } from "@/services/src/organiser/organiserService";
import { Description, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Input } from "@material-tailwind/react";
import { Fragment, useState } from "react";

interface EditAttendeeTicketsDialogProps {
  setIsEditAttendeeTicketsDialogModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isEditAttendeeTicketsDialogModalOpen: boolean;
  email: string;
  numTickets: number;
  purchaser: Purchaser;
  attendeeName: Name;
  eventId: EventId;
  setEventMetadataState: React.Dispatch<React.SetStateAction<EventMetadata>>;
}

export const EditAttendeeTicketsDialog = ({
  setIsEditAttendeeTicketsDialogModalOpen,
  closeModal,
  isEditAttendeeTicketsDialogModalOpen,
  email,
  numTickets,
  purchaser,
  attendeeName,
  eventId,
  setEventMetadataState,
}: EditAttendeeTicketsDialogProps) => {
  const [newNumTickets, setNewNumTickets] = useState<string>(numTickets.toString());

  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

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
                  <DialogTitle
                    as="h3"
                    className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[0px] border-gray-500 w-full text-center flex justify-center items-center"
                  >
                    Edit Attendee Tickets
                  </DialogTitle>
                  <Description className="font-semibold text-organiser-title-gray-text p-4 rounded-lg bg-yellow-100 mb-2 text-sm">
                    <div className="flex flex-row">
                      <div>
                        IMPORTANT: The event organiser and attendee will need to organise their own payment arrangement
                        to account for this change.
                      </div>
                      <div className="content-center ml-4">
                        <ExclamationCircleIcon className="h-8" />
                      </div>
                    </div>
                  </Description>
                  <Description className=" text-organiser-dark-gray-text p-2 mb-2 text-sm">
                    <span className="font-semibold"> {email}</span> currently has{" "}
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
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value)) {
                          const maxValue = Math.max(value, 0);
                          setNewNumTickets(maxValue.toString());
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
                        setAttendeeTickets(parseInt(newNumTickets), purchaser, attendeeName, eventId);
                      }}
                    >
                      Submit
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
