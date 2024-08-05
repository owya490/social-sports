import Loading from "@/components/loading/Loading";
import { EventMetadata } from "@/interfaces/EventTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getEventById } from "@/services/src/events/eventsService";
import { addAttendee } from "@/services/src/organiser/organiserService";
import { Description, Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Alert, Input } from "@material-tailwind/react";
import React, { Fragment, useState } from "react";

interface InviteAttendeeDialogProps {
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isFilterModalOpen: boolean;
  eventId: string;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  setEventVacancy: React.Dispatch<React.SetStateAction<number>>;
}

const InviteAttendeeDialog = ({
  setIsFilterModalOpen,
  closeModal,
  isFilterModalOpen,
  eventId,
  setEventMetadata,
  setEventVacancy,
}: InviteAttendeeDialogProps) => {
  const [attendeeEmail, setAttendeeEmail] = useState<string>("");
  const [attendeeName, setAttendeeName] = useState<string>("");
  const [attendeePhoneNumber, setAttendeePhoneNumber] = useState<string>("");
  const [numTickets, setNumTickets] = useState<string>("0");
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState<boolean>(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

  const ErrorMessage = () => {
    return <div className="text-red-400 text-sm py-2">Error adding new attendee!</div>;
  };

  const handleErrorAddingAttendee = () => {
    setShowErrorMessage(true);
  };

  const resetInputFields = () => {
    setAttendeeEmail("");
    setAttendeeName("");
    setAttendeePhoneNumber("");
    setNumTickets("0");
  };

  const handleAddAttendee = async () => {
    try {
      setLoading(true);
      await addAttendee(attendeeEmail, attendeeName, attendeePhoneNumber, parseInt(numTickets), eventId);
      const updatedEventMetadata = await getEventsMetadataByEventId(eventId);
      setEventMetadata(updatedEventMetadata);
      const updatedEventData = await getEventById(eventId);
      setEventVacancy(updatedEventData.vacancy);
      setShowSuccessAlert(true);
      resetInputFields();
      setShowErrorMessage(false);
      closeModal();
    } catch (error) {
      handleErrorAddingAttendee();
    } finally {
      setLoading(false);
    }
  };

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
                    <form onSubmit={handleAddAttendee}>
                      <DialogTitle
                        as="h3"
                        className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[0px] border-gray-500 w-full text-center flex justify-center items-center"
                      >
                        Add Attendee
                      </DialogTitle>
                      <Description className="font-semibold text-organiser-title-gray-text p-4 rounded-lg border-0 bg-yellow-100 mb-2 text-sm">
                        <div className="flex flex-row">
                          <div>NOTE: The event organiser and attendee will need to organise their own payment.</div>
                          <div className="content-center ml-4">
                            <ExclamationCircleIcon className="h-8" />
                          </div>
                        </div>
                      </Description>
                      <div className="space-y-2">
                        <div className="">
                          <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            tabIndex={1}
                            required
                            className="block w-full rounded-lg border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                            placeholder="Attendee email"
                            onChange={(e) => setAttendeeEmail(e.target.value)}
                          />
                        </div>
                        <div className="">
                          <input
                            id="name"
                            name="name"
                            type="text"
                            tabIndex={1}
                            required
                            className="block w-full rounded-lg border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                            placeholder="Attendee name"
                            onChange={(e) => setAttendeeName(e.target.value)}
                          />
                        </div>
                        <div className="">
                          <input
                            id="mobilenumber"
                            name="mobilenumber"
                            type="tel"
                            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                            autoComplete="number"
                            tabIndex={1}
                            required
                            className="block w-full rounded-lg border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-black sm:text-sm sm:leading-6"
                            placeholder="Mobile number"
                            onChange={(e) => setAttendeePhoneNumber(e.target.value)}
                          />
                        </div>
                        <Input
                          label="Number of tickets"
                          crossOrigin={undefined}
                          required
                          value={numTickets}
                          type="number"
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              const maxValue = Math.max(value, 0);
                              setNumTickets(maxValue.toString());
                            } else {
                              setNumTickets("0");
                            }
                          }}
                          className="rounded-md focus:ring-0"
                          size="lg"
                        />
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
          className="z-40"
        >
          Success adding new attendee!
        </Alert>
      </div>
    </div>
  );
};

export default InviteAttendeeDialog;
