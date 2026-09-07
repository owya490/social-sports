"use client";

import { updateUserPassword } from "@/services/src/auth/authService";
import {
  getPasswordChangeValidationError,
  PASSWORD_UPDATE_FAILED_ERROR_MESSAGE,
} from "@/utilities/passwordValidationUtils";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Input } from "@material-tailwind/react";
import { useState } from "react";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PasswordChangeModal({ isOpen, onClose }: PasswordChangeModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setSuccess(false);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const validationError = getPasswordChangeValidationError(currentPassword, newPassword, confirmPassword);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      await updateUserPassword(currentPassword, newPassword);
      setSuccess(true);
      setError("");
      setLoading(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : PASSWORD_UPDATE_FAILED_ERROR_MESSAGE);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) {
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} handler={handleClose}>
      <DialogHeader className="mx-2 text-lg font-medium leading-6">Change Password</DialogHeader>

      <DialogBody>
        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 font-medium mb-2">Password updated</p>
            <p className="text-sm text-green-700">
              Your password has been changed. Use the new password the next time you sign in.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <div>
              <Input
                type="password"
                label="Current Password"
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
            </div>

            <div>
              <Input
                type="password"
                label="New Password"
                placeholder="Enter a new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
              <p className="text-sm mt-2">Must be at least 6 characters</p>
            </div>

            <div>
              <Input
                type="password"
                label="Confirm New Password"
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
            </div>
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
              {loading ? "Updating..." : "Update Password"}
            </button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
