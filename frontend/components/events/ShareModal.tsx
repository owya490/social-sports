"use client";

import { EventId } from "@/interfaces/EventTypes";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import Image from "next/image";
import { Fragment, useEffect, useState } from "react";
import email_icons from "../../public/images/email.png";
import fb_icons from "../../public/images/fbfb.jpeg";
import share_arrow from "../../public/images/share_arrow.png";
import { BlackHighlightButton } from "../elements/HighlightButton";

interface ShareModalProps {
  eventId: EventId;
}

const ShareModal = ({ eventId }: ShareModalProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [eventURL, setEventURL] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setEventURL(getUrlWithCurrentHostname(`/event/${eventId}`));
  }, []);

  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleFacebookShare = () => {
    const facebookShareURL = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventURL)}`;
    window.open(facebookShareURL, "_blank", "width=550,height=450");
    toggleModal();
  };

  const handleEmailShare = () => {
    const subject = "Check out this event!";
    const body = `I found this interesting event here: 
${eventURL}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    toggleModal();
  };

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(eventURL);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy URL to clipboard:", err);
    }
  };

  const highlightURL = (event: { preventDefault: () => void; stopPropagation: () => void }) => {
    event.preventDefault();
    event.stopPropagation();

    const urlElement = document.getElementById("url");
    if (urlElement) {
      const range = document.createRange();
      range.selectNode(urlElement);
      window.getSelection()?.removeAllRanges();
      window.getSelection()?.addRange(range);
    }
  };

  return (
    <div className="relative px-4 sm:px-0">
      <div className="flex items-center bg-organiser-light-gray rounded-xl w-fit cursor-pointer" onClick={toggleModal}>
        <div className="rounded-md text-sm sm:text-lg px-4 py-2">Share</div>
        <Image src={share_arrow} alt="Share arrow" className="w-9 h-5 mx-2" />
      </div>

      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={toggleModal}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Share</h3>
                    <button className="text-gray-500 hover:text-gray-700" onClick={toggleModal}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-center gap-4">
                    <div className="cursor-pointer" onClick={handleFacebookShare} title="Share on Facebook">
                      <Image src={fb_icons} alt="Share via Facebook" className="h-11 w-11" />
                    </div>
                    <div className="cursor-pointer" onClick={handleEmailShare} title="Share via Email">
                      <Image src={email_icons} alt="Share via Email" className="h-11 w-11" />
                    </div>
                  </div>
                  <p
                    id="url"
                    onClick={highlightURL}
                    className="mt-4 cursor-pointer hover:bg-gray-50 p-2 rounded break-all"
                  >
                    {eventURL}
                  </p>
                  <BlackHighlightButton className={`w-full mt-2`} onClick={copyURL} disabled={copied}>
                    {copied ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </span>
                    ) : (
                      "Copy"
                    )}
                  </BlackHighlightButton>
                </div>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default ShareModal;
