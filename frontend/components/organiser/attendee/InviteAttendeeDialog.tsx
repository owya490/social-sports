import { inviteAttendee } from "@/services/src/organiser/organiserService";
import { Dialog, Transition } from "@headlessui/react";
import React, { Fragment, useState } from "react";

interface InviteAttendeeDialogProps {
  setIsFilterModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeModal: () => void;
  isFilterModalOpen: boolean;
}

const InviteAttendeeDialog = ({ setIsFilterModalOpen, closeModal, isFilterModalOpen }: InviteAttendeeDialogProps) => {
  const [inviteEmail, setInviteEmail] = useState<string>("");
  return (
    <div>
      <Transition appear show={isFilterModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-30" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform rounded-2xl p-6 bg-white text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-2xl font-medium leading-6 text-gray-900 pb-3 border-b-[0px] border-gray-500 w-full text-center flex justify-center items-center"
                  >
                    Invite
                  </Dialog.Title>

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
                      Send invite
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default InviteAttendeeDialog;
