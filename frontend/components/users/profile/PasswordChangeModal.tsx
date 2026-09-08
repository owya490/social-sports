"use client";

import { resetUserPassword } from "@/services/src/auth/authService";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Input } from "@material-tailwind/react";
import { useState } from "react";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
}

export function PasswordChangeModal({ isOpen, onClose, currentEmail }: PasswordChangeModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      await resetUserPassword(currentEmail);
      setSuccess(true);
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset email. Please try again.");
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    setError("");
    setSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} handler={handleClose}>
      <DialogHeader className="mx-2 text-lg font-medium leading-6">Change Password</DialogHeader>

      <DialogBody>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium mb-2">Reset email sent</p>
            <p className="text-sm text-green-700">
              We&apos;ve sent a password reset link to <strong>{currentEmail}</strong>. Check your inbox and junk folder
              to choose a new password.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <div>
              <Input
                type="text"
                label="Email"
                value={currentEmail}
                disabled
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
            </div>

            <p className="text-sm text-gray-700">
              We&apos;ll email you the same password reset link used on the login page. You can then choose a new
              password from that email.
            </p>
          </form>
        )}
      </DialogBody>

      <DialogFooter className="flex justify-between">
        {success ? (
          <button type="button" className="bg-black px-3 py-1.5 text-white rounded-lg ml-auto" onClick={handleClose}>
            Done
          </button>
        ) : (
          <>
            <button
              type="button"
              className="bg-gray-200 px-3 py-1.5 text-black rounded-lg disabled:opacity-50"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="bg-black px-3 py-1.5 text-white rounded-lg disabled:opacity-50"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send reset email"}
            </button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
