"use client";

import { ClockIcon } from "@heroicons/react/24/outline";
import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";

interface TimeoutWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  onStayActive: () => void;
}

const TimeoutWarningModal = ({ isOpen, remainingSeconds, onStayActive }: TimeoutWarningModalProps) => {
  return (
    <Dialog open={isOpen} handler={() => {}} size="sm">
      <DialogHeader className="mx-2 text-lg font-medium leading-6 flex items-center gap-2">
        <ClockIcon className="h-5 w-5 text-orange-500" />
        Session Timeout Warning
      </DialogHeader>
      <DialogBody>
        <div className="space-y-3">
          <p className="text-gray-600">
            Your session will expire in <span className="font-bold text-red-600">{remainingSeconds} seconds</span>.
          </p>
        </div>
      </DialogBody>
      <DialogFooter className="flex justify-center">
        <Button className="mx-2 bg-blue-500 hover:bg-blue-600" color="blue" onClick={onStayActive}>
          Confirm
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default TimeoutWarningModal;
