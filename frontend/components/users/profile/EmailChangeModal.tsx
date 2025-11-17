"use client";
import { handleSignOut, updateUserEmail } from "@/services/src/auth/authService";
import { UserData } from "@/interfaces/UserTypes";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { Spinner } from "@material-tailwind/react";
import React, { Fragment, useState } from "react";
import { useRouter } from "next/navigation";

interface EmailChangeModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  currentEmail: string;
  setUser: (user: UserData) => void;
}

export const EmailChangeModal: React.FC<EmailChangeModalProps> = ({ open, onClose, userId, currentEmail, setUser }) => {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!newEmail || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (newEmail === currentEmail) {
      setError("New email must be different from current email");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      // Update Firebase Auth email (with verification)
      await updateUserEmail(newEmail, password, true);

      setSuccess(
        "Verification email sent! You will be logged out in a few seconds. Please check your inbox, verify your new email, and then sign in again with your new email address."
      );
      setNewEmail("");
      setPassword("");

      // Log out user after a delay and redirect to login
      setTimeout(async () => {
        try {
          await handleSignOut(setUser);
          router.push("/login?emailChanged=true");
        } catch (error) {
          console.error("Error during logout:", error);
          router.push("/login");
        }
      }, 4000);
    } catch (err: any) {
      console.error("Error updating email:", err);
      setError(err.message || "Failed to update email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setNewEmail("");
      setPassword("");
      setError("");
      setSuccess("");
      onClose();
    }
  };

  return (
    <div className="relative px-4 sm:px-0">
      <Transition appear show={open} as={Fragment}>
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
                <div className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white px-6 py-6 text-left align-middle shadow-xl transition-all relative space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">Change Email Address</h3>
                    <button className="text-gray-500 hover:text-gray-700" onClick={handleClose} disabled={loading}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="bg-organiser-light-gray rounded px-2 py-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      )}
                      {success && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-sm text-green-800">{success}</p>
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-organiser-dark-gray-text mb-2">
                          Current Email
                        </label>
                        <input
                          type="email"
                          value={currentEmail}
                          disabled
                          className="w-full px-3 py-2 bg-organiser-darker-light-gray border border-gray-300 rounded-md text-sm text-organiser-title-gray-text"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-organiser-dark-gray-text mb-2">
                          New Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          placeholder="Enter new email address"
                          required
                          disabled={loading || !!success}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-organiser-dark-gray-text mb-2">
                          Current Password <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your current password"
                          required
                          disabled={loading || !!success}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-organiser-title-gray-text mt-1">
                          Required for security verification
                        </p>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Important:</strong> After submitting, you'll receive a verification email at your new
                          address and will be automatically logged out. After verifying your new email, sign in again
                          using your new email address.
                        </p>
                      </div>

                      <div className="flex justify-end space-x-3 pt-2">
                        <button
                          type="button"
                          onClick={handleClose}
                          disabled={loading}
                          className="px-4 py-2 text-sm font-medium text-organiser-dark-gray-text bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading || !!success}
                          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          {loading && <Spinner className="w-4 h-4" />}
                          <span>{loading ? "Updating..." : "Update Email"}</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};
