"use client";
import { handleSignOut, updateUserEmail } from "@/services/src/auth/authService";
import { UserData } from "@/interfaces/UserTypes";
import { Alert, Button, Dialog, DialogBody, DialogFooter, DialogHeader, Input } from "@material-tailwind/react";
import React, { useState } from "react";
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
    <Dialog open={open} handler={handleClose} size="md" className="bg-white">
      <DialogHeader className="text-gray-900">Change Email Address</DialogHeader>
      <form onSubmit={handleSubmit}>
        <DialogBody className="space-y-4">
          {error && (
            <Alert color="red" className="mb-4">
              {error}
            </Alert>
          )}
          {success && (
            <Alert color="green" className="mb-4">
              {success}
            </Alert>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Email</label>
            <Input
              type="email"
              value={currentEmail}
              disabled
              className="w-full bg-gray-100"
              crossOrigin={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="Enter new email address"
              required
              disabled={loading || !!success}
              className="w-full"
              crossOrigin={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your current password"
              required
              disabled={loading || !!success}
              className="w-full"
              crossOrigin={undefined}
              onPointerEnterCapture={undefined}
              onPointerLeaveCapture={undefined}
            />
            <p className="text-xs text-gray-500 mt-1">Required for security verification</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>Important:</strong> After submitting, you'll receive a verification email at your new address and
              will be automatically logged out. After verifying your new email, sign in again using your new email
              address.
            </p>
          </div>
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button
            variant="text"
            color="gray"
            onClick={handleClose}
            disabled={loading}
            className="mr-2"
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            color="blue"
            disabled={loading || !!success}
            loading={loading}
            placeholder={undefined}
            onPointerEnterCapture={undefined}
            onPointerLeaveCapture={undefined}
          >
            {loading ? "Updating..." : "Update Email"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
};
