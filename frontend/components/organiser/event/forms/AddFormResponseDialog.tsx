"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import FormResponder, { FormResponderRef } from "@/components/forms/FormResponder";
import { EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { submitManualFormResponse } from "@/services/src/forms/formsServices";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { Fragment, useRef, useState } from "react";

interface AddFormResponseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  formId: FormId;
  eventId: EventId;
  refreshResponses: () => void;
}

const logger = new Logger("AddFormResponseDialogLogger");

const AddFormResponseDialog = ({ isOpen, onClose, formId, eventId, refreshResponses }: AddFormResponseDialogProps) => {
  const formResponderRef = useRef<FormResponderRef>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!formResponderRef.current) return;

    // Check validation
    if (!formResponderRef.current.areAllRequiredFieldsFilled()) {
      setError("Please fill out all required fields.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      const savedId = await formResponderRef.current.save();
      if (!savedId) {
        logger.error("Failed to save form response: save() returned null");
        setError("Failed to save form response. Please try again.");
        return;
      }
      await submitManualFormResponse(formId, eventId, savedId);
      refreshResponses();
      onClose();
    } catch (err: any) {
      logger.error(`Failed to save form response: ${err}`);
      setError(`Failed to save form response. ${err.message || "Please try again."}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
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
              <DialogPanel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 shrink-0">
                  <DialogTitle as="h3" className="text-xl font-bold text-gray-900">
                    Add Manual Form Response
                  </DialogTitle>
                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close dialog"
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors focus:outline-none"
                  >
                    <XMarkIcon className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-core-hover">
                  <FormResponder
                    ref={formResponderRef}
                    formId={formId}
                    eventId={eventId}
                    formResponseId={null}
                    canEditForm={true}
                    isEmbedded={true}
                    hideSaveButton={true}
                  />
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 flex justify-between items-center shrink-0 bg-white">
                  <div className="text-red-600 text-sm font-medium">{error}</div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <InvertedHighlightButton
                      type="button"
                      className="border-1 px-4 bg-black text-white"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? (
                        <span className="flex items-center gap-2">Saving...</span>
                      ) : (
                        <span className="text-sm flex items-center gap-2">
                          <FloppyDiskIcon className="h-4 w-4" /> Save Response
                        </span>
                      )}
                    </InvertedHighlightButton>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default AddFormResponseDialog;
