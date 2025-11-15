"use client";

import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { Fragment, useState } from "react";

interface ShareCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function ShareCalendarModal({ isOpen, onClose, username }: ShareCalendarModalProps) {
  const [shareType, setShareType] = useState<"public" | "private">("public");
  const [passkey, setPasskey] = useState("");
  const [copied, setCopied] = useState(false);

  const handlePasskeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow lowercase alphanumeric and hyphen, max 10 characters
    const sanitized = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "")
      .slice(0, 10);
    setPasskey(sanitized);
  };

  const getShareLink = () => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    if (shareType === "public") {
      return `${baseUrl}/user/${username}`;
    } else {
      return `${baseUrl}/user/${username}/private-calendar?key=${passkey}`;
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getShareLink());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy to clipboard:", err);
    }
  };

  const handleClose = () => {
    setShareType("public");
    setPasskey("");
    setCopied(false);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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

        <div className="fixed inset-0 overflow-y-auto">
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
              <div className="w-full max-w-md transform overflow-hidden rounded-lg bg-white p-6 text-left shadow-xl transition-all">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Share Calendar</h3>
                  <button className="text-gray-400 hover:text-gray-600 transition-colors" onClick={handleClose}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Radio Options */}
                <div className="space-y-3 mb-6">
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="public"
                      checked={shareType === "public"}
                      onChange={(e) => setShareType(e.target.value as "public" | "private")}
                      className="mt-1 mr-3 h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">Upcoming Public Events</div>
                      <div className="text-xs text-gray-500 mt-1">Share only public events on your calendar</div>
                    </div>
                  </label>

                  <label className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="shareType"
                      value="private"
                      checked={shareType === "private"}
                      onChange={(e) => setShareType(e.target.value as "public" | "private")}
                      className="mt-1 mr-3 h-4 w-4 text-black border-gray-300 focus:ring-black"
                    />
                    <div>
                      <div className="text-sm font-medium text-gray-900">All Upcoming Events Including Private</div>
                      <div className="text-xs text-gray-500 mt-1">Share all events with a secure passkey</div>
                    </div>
                  </label>
                </div>

                {/* Passkey Input (only for private) */}
                {shareType === "private" && (
                  <div className="mb-6">
                    <label htmlFor="passkey" className="block text-sm font-medium text-gray-700 mb-2">
                      Passkey
                    </label>
                    <input
                      type="text"
                      id="passkey"
                      value={passkey}
                      onChange={handlePasskeyChange}
                      placeholder="Enter passkey (max 10 chars)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">Only lowercase letters, numbers, and hyphens allowed</p>
                  </div>
                )}

                {/* Share Link */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share Link</label>
                  <div className="bg-gray-100 rounded-md p-3 font-mono text-xs text-gray-800 break-all">
                    {getShareLink()}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={copyToClipboard}
                    disabled={shareType === "private" && passkey.length === 0}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
