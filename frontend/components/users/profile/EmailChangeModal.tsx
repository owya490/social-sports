"use client";

import { updateUserEmail } from "@/services/src/auth/authService";
import { handleSignOut } from "@/services/src/auth/authService";
import { useUser } from "@/components/utility/UserContext";
import { Dialog, DialogBody, DialogFooter, DialogHeader, Input } from "@material-tailwind/react";
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

  return (
    <Dialog open={isOpen} handler={handleClose}>
      <DialogHeader className="mx-2 text-lg font-medium leading-6">Change Email Address</DialogHeader>

      <DialogBody>
        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">Verification Email Sent!</p>
              <p className="text-sm text-green-700">
                We&apos;ve sent a verification email to <strong>{newEmail}</strong>. Please check your inbox and click
                the verification link to complete the email change.
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Important:</strong> You will be logged out in a few seconds. After verifying your new email,
                please log in with your <strong>new email address</strong> and the same password.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-red-500 text-sm mt-2">{error}</div>}

            <div>
              <Input
                type="text"
                label="Current Email"
                value={currentEmail}
                disabled
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
            </div>

            <div>
              <Input
                type="email"
                label="New Email Address"
                placeholder="Enter new email address"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={loading}
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
            </div>

            <div>
              <Input
                type="password"
                label="Current Password"
                placeholder="Enter your current password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="rounded-md focus:ring-0"
                size="lg"
                crossOrigin={undefined}
              />
              <p className="text-sm mt-2">Required for security verification</p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> After submitting, you&apos;ll receive a verification email at your new address.
                You must verify the email before the change takes effect. You&apos;ll be automatically logged out after
                submission.
              </p>
            </div>
          </form>
        )}
      </DialogBody>

      {!success && (
        <DialogFooter className="flex justify-between">
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
            {loading ? "Updating..." : "Update Email"}
          </button>
        </DialogFooter>
      )}
    </Dialog>
  );
}
