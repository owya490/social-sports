import { inviteAttendee } from "@/services/src/organiser/organiserService";
import { Dialog, Transition, Description, DialogTitle, TransitionChild, DialogPanel } from "@headlessui/react";
import { ExclamationCircleIcon } from "@heroicons/react/24/outline";
import React, { Fragment, useState } from "react";

interface InviteAttendeeDialogProps {
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isFilterModalOpen: boolean;
}

const InviteAttendeeDialog = ({ setIsFilterModalOpen, closeModal, isFilterModalOpen }: InviteAttendeeDialogProps) => {
  const [inviteEmail, setInviteEmail] = useState<string>("");
  const [enabled, setEnabled] = useState(true);
  return (
    <div>
      <Transition appear show={isFilterModalOpen} as={Fragment}>
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
                      onChange={(e) => setInviteEmail(e.target.value)}
                    />
                  </div>
                  <div className="mt-2 float-right">
                    <div
                      className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-4 py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
                      onClick={() => inviteAttendee(inviteEmail)}
                    >
                      Add Attendee
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

export default InviteAttendeeDialog;
