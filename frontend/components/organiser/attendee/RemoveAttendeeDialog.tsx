import Loading from "@/components/loading/Loading";
import { EventId, EventMetadata, Name, Purchaser } from "@/interfaces/EventTypes";
import { getEventsMetadataByEventId } from "@/services/src/events/eventsMetadata/eventsMetadataService";
import { getEventById } from "@/services/src/events/eventsService";
import { removeAttendee } from "@/services/src/organiser/organiserService";
import { Dialog, Transition, Description, DialogTitle, TransitionChild, DialogPanel } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { Alert } from "@material-tailwind/react";
import React, { Dispatch, Fragment, SetStateAction, useState } from "react";

interface RemoveAttendeeDialogProps {
  setIsRemoveAttendeeModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isRemoveAttendeeModalOpen: boolean;
  email: string;
  purchaser: Purchaser;
  attendeeName: Name;
  eventId: EventId;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  setEventVacancy: Dispatch<SetStateAction<number>>;
}

const RemoveAttendeeDialog = ({
  setIsRemoveAttendeeModalOpen,
  closeModal,
  isRemoveAttendeeModalOpen,
  email,
  purchaser,
  attendeeName,
  eventId,
  setEventMetadata,
  setEventVacancy,
}: RemoveAttendeeDialogProps) => {
  const [enabled, setEnabled] = useState(true);

  const [loading, setLoading] = useState<boolean>(false);

  const [showSuccessAlert, setShowSuccessAlert] = useState<boolean>(false);
  const [showErrorMessage, setShowErrorMessage] = useState<boolean>(false);

  const handleErrorRemovingAttendee = () => {
    setShowErrorMessage(true);
  };

  const handleRemoveAttendee = async () => {
    try {
      setLoading(true);
      await removeAttendee(purchaser, attendeeName, eventId);
      const updatedEventMetadata = await getEventsMetadataByEventId(eventId);
      const updatedEventData = await getEventById(eventId);
      setEventMetadata(updatedEventMetadata);
      setEventVacancy(updatedEventData.vacancy);
      setShowSuccessAlert(true);
      setShowErrorMessage(false);
      closeModal();
    } catch (error) {
      handleErrorRemovingAttendee();
    } finally {
      setLoading(false);
    }
  };

  const ErrorMessage = () => {
    return <div className="text-red-400 text-sm py-2">Error removing attendee!</div>;
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
                        <span className="font-semibold"> {email}</span>.
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
      <div className="sticky ml-auto mr-auto left-0 right-0 top-32 w-fit">
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
