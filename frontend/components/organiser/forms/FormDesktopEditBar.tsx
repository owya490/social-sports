"use client";

import { CheckCircleIcon, DocumentTextIcon, ListBulletIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@material-tailwind/react";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { FormNavButton } from "./FormUtilityComponents";

interface FormDesktopEditBarProps {
  onAddTextSection: () => void;
  onAddDropdownSection: () => void;
  onAddTickboxSection: () => void;
  onAddImageSection: () => void;
  onSaveForm: () => void;
  isFormModified: boolean;
  isSubmitting: boolean;
}

const FormDesktopEditBar = ({
  onAddTextSection,
  onAddDropdownSection,
  onAddTickboxSection,
  onAddImageSection,
  onSaveForm,
  isFormModified,
  isSubmitting,
}: FormDesktopEditBarProps) => {
  return (
    <div className="hidden sm:flex sticky top-40 w-fit bg-white rounded-lg p-6 mr-5 flex-col gap-4 items-center h-fit border border-gray-200 z-40">
      <div className="flex flex-col space-y-3">
        <FormNavButton onClick={onAddTextSection} tooltipContent="Add Text Question">
          <DocumentTextIcon className="w-6 h-6 stroke-1 text-black" />
        </FormNavButton>

        <FormNavButton onClick={onAddDropdownSection} tooltipContent="Add Dropdown Question">
          <ListBulletIcon className="w-6 h-6 stroke-1 text-black" />
        </FormNavButton>

        <FormNavButton onClick={onAddTickboxSection} tooltipContent="Add Tickbox Question">
          <CheckCircleIcon className="w-6 h-6 stroke-1 text-black" />
        </FormNavButton>

        <FormNavButton onClick={onAddImageSection} tooltipContent="Add Image Section">
          <PhotoIcon className="w-6 h-6 stroke-1 text-black" />
        </FormNavButton>

        {isSubmitting ? (
          <Spinner className="w-10 h-6" />
        ) : (
          <FormNavButton
            onClick={onSaveForm}
            disabled={!isFormModified}
            tooltipContent={isFormModified ? "Save Form" : "Form is not modified"}
          >
            <FloppyDiskIcon className="w-6 h-6 fill-black text-black" />
          </FormNavButton>
        )}
      </div>
    </div>
  );
};

export default FormDesktopEditBar;
