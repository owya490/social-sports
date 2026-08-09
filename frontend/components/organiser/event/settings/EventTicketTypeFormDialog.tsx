"use client";

import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { BlackHighlightButton, InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { FormId } from "@/interfaces/FormTypes";
import { UserData } from "@/interfaces/UserTypes";
import { Dialog, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { Input } from "@material-tailwind/react";
import { Fragment, useEffect, useState } from "react";

export interface EventTicketTypeFormValues {
  name: string;
  priceDollars: number;
  capacity: number;
  formId: FormId | null;
}

interface EventTicketTypeFormDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  initialValues: EventTicketTypeFormValues;
  user: UserData;
  onSave: (values: EventTicketTypeFormValues) => Promise<void>;
  /** Hide form picker when forms are managed elsewhere (e.g. event hub Forms tab). */
  hideFormSelector?: boolean;
}

export function EventTicketTypeFormDialog({
  open,
  onClose,
  title,
  initialValues,
  user,
  onSave,
  hideFormSelector = false,
}: EventTicketTypeFormDialogProps) {
  const [name, setName] = useState(initialValues.name);
  const [priceDollars, setPriceDollars] = useState(String(initialValues.priceDollars));
  const [capacity, setCapacity] = useState(String(initialValues.capacity));
  const [formId, setFormId] = useState<FormId | null>(initialValues.formId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    setName(initialValues.name);
    setPriceDollars(String(initialValues.priceDollars));
    setCapacity(String(initialValues.capacity));
    setFormId(initialValues.formId);
    setError(null);
    // Reset only when the dialog opens; ignore initialValues identity changes from parent re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: open-only reset
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const parsedCapacity = parseInt(capacity, 10);
    const parsedPrice = parseFloat(priceDollars);
    if (!Number.isFinite(parsedCapacity) || parsedCapacity < 1) {
      setError("Capacity must be at least 1");
      return;
    }
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      setError("Price must be 0 or greater");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({
        name: name.trim(),
        priceDollars: parsedPrice,
        capacity: parsedCapacity,
        formId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </TransitionChild>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-xl">
                <DialogTitle className="text-lg font-bold mb-4">{title}</DialogTitle>
                <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
                  <Input
                    label="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    crossOrigin={undefined}
                  />
                  <Input
                    label="Price (AUD)"
                    type="number"
                    min={0}
                    step={0.01}
                    value={priceDollars}
                    onChange={(e) => setPriceDollars(e.target.value)}
                    crossOrigin={undefined}
                  />
                  <Input
                    label="Capacity"
                    type="number"
                    min={1}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    crossOrigin={undefined}
                  />
                  {!hideFormSelector ? (
                    <div>
                      <p className="text-sm font-semibold mb-2">Registration Form</p>
                      <FormSelector formId={formId} user={user} updateField={setFormId} />
                    </div>
                  ) : null}
                  {error && <p className="text-red-500 text-sm">{error}</p>}
                  <div className="flex justify-end gap-2 mt-2">
                    <InvertedHighlightButton type="button" text="Cancel" onClick={onClose} />
                    <BlackHighlightButton type="submit" text={saving ? "Saving..." : "Save"} disabled={saving} />
                  </div>
                </form>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
