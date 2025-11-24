"use client";

import { updateUserEmail } from "@/services/src/auth/authService";
import { handleSignOut } from "@/services/src/auth/authService";
import { useUser } from "@/components/utility/UserContext";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface EmailChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

export function EmailChangeModal({ isOpen, onClose, currentEmail }: EmailChangeModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { setUser } = useUser();
  const router = useRouter();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    // Validation
    if (!newEmail || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (!validateEmail(newEmail)) {
      setError("Please enter a valid email address");
      return;
    }

    if (newEmail === currentEmail) {
      setError("New email must be different from your current email");
      return;
    }

    setLoading(true);

    try {
      await updateUserEmail(newEmail, password);
      setSuccess(true);
      setError("");

      // Show success message and prepare for logout
      setTimeout(async () => {
        await handleSignOut(setUser);
        router.push("/login");
      }, 4000); // Logout after 4 seconds
    } catch (err: any) {
      setError(err.message || "Failed to update email. Please try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading && !success) {
      setNewEmail("");
      setPassword("");
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/50" />

      <div className="fixed inset-0 z-10 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel className="relative w-full max-w-md bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-core-outline">
              <h2 className="text-2xl font-semibold text-core-text">Change Email Address</h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600"
                disabled={loading}
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              {success ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-800 font-medium mb-2">Verification Email Sent!</p>
                    <p className="text-sm text-green-700">
                      We&apos;ve sent a verification email to <strong>{newEmail}</strong>. Please check your inbox and
                      click the verification link to complete the email change.
                    </p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-700">
                      <strong>Important:</strong> You will be logged out in a few seconds. After verifying your new
                      email, please log in with your <strong>new email address</strong> and the same password.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Email</label>
                    <input
                      type="text"
                      value={currentEmail}
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Enter new email address"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your current password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">Required for security verification</p>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Note:</strong> After submitting, you&apos;ll receive a verification email at your new
                      address. You must verify the email before the change takes effect. You&apos;ll be automatically
                      logged out after submission.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            {!success && (
              <div className="flex justify-end gap-3 p-6 border-t border-core-outline bg-white">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium border border-core-outline rounded-md hover:bg-core-hover disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Email"}
                </button>
              </div>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
