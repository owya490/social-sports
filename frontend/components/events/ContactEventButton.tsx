"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";
import { useState } from "react";

interface ContactEventButtonProps {
  eventLink: string;
  fallbackLink: string;
  className?: string;
}

export default function ContactEventButton({ eventLink, fallbackLink, className = "" }: ContactEventButtonProps) {
  const [openModal, setOpenModal] = useState(false);
  const linkToUse = eventLink || fallbackLink;

  const handleContactClick = () => {
    if (linkToUse) {
      setOpenModal(true);
    }
  };

  return (
    <>
      <InvertedHighlightButton onClick={handleContactClick} className={className} text="Contact Now" />
      <Dialog open={openModal} handler={setOpenModal}>
        <DialogHeader className="mx-2 text-lg font-medium leading-6">Contact Event Organizer</DialogHeader>
        <DialogBody>
          <p className="mx-2 text-base font-medium text-black">You are going to be redirected to:</p>
          <p className="mx-2 text-base font-medium text-blue-900">{linkToUse}</p>
        </DialogBody>
        <DialogFooter className="flex justify-between">
          <Button className="mx-2 bg-gray-200" variant="text" color="black" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button
            className="ml-2"
            variant="filled"
            color="black"
            onClick={() => {
              window.open(linkToUse, "_blank", "noopener,noreferrer");
              setOpenModal(false);
            }}
          >
            Proceed
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
