"use client";

import { Button, Dialog, DialogBody, DialogFooter, DialogHeader } from "@material-tailwind/react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const UnsavedChangesModal = ({ isOpen, onConfirm, onCancel }: UnsavedChangesModalProps) => {
  return (
    <Dialog open={isOpen} handler={onCancel}>
      <DialogHeader className="mx-2 text-lg font-medium leading-6">Unsaved Changes</DialogHeader>
      <DialogBody>
        <p className="text-gray-600">
          You have unsaved changes in this form. If you go back now, your changes will be lost.
        </p>
        <p className="text-gray-600 mt-2">Are you sure you want to continue?</p>
      </DialogBody>
      <DialogFooter className="flex justify-between">
        <Button className="mx-2 bg-gray-200" variant="text" color="black" onClick={onCancel}>
          Cancel
        </Button>
        <Button className="mx-2 bg-red-500 hover:bg-red-600" color="red" onClick={onConfirm}>
          Confirm
        </Button>
      </DialogFooter>
    </Dialog>
  );
};

export default UnsavedChangesModal;
