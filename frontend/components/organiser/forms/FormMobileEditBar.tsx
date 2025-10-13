"use client";

import { DocumentTextIcon, ListBulletIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@material-tailwind/react";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { FormNavButton } from "./FormUtilityComponents";

interface FormMobileEditBarProps {
  onAddTextSection: () => void;
  onAddDropdownSection: () => void;
  onAddImageSection: () => void;
  onSaveForm: () => void;
  isFormModified: boolean;
  isSubmitting: boolean;
}

const FormMobileEditBar = ({
  onAddTextSection,
  onAddDropdownSection,
  onAddImageSection,
  onSaveForm,
  isFormModified,
  isSubmitting,
}: FormMobileEditBarProps) => {
  return (
    <div className="sm:hidden fixed top-16 left-4 right-4 z-40">
      <div className="bg-white rounded-lg border border-gray-200 shadow-lg flex justify-center items-center gap-4 py-3">
        <FormNavButton onClick={onAddTextSection} tooltipContent="Add Text Question">
          <DocumentTextIcon className="w-5 h-5 stroke-1 text-black" />
        </FormNavButton>

        <FormNavButton onClick={onAddDropdownSection} tooltipContent="Add Dropdown Question">
          <ListBulletIcon className="w-5 h-5 stroke-1 text-black" />
        </FormNavButton>

        <FormNavButton onClick={onAddImageSection} tooltipContent="Add Image Section">
          <PhotoIcon className="w-5 h-5 stroke-1 text-black" />
        </FormNavButton>
        {isSubmitting ? (
          <Spinner className="w-10 h-5" />
        ) : (
          <FormNavButton
            onClick={onSaveForm}
            disabled={!isFormModified}
            tooltipContent={isFormModified ? "Save Form" : "Form is not modified"}
          >
            <FloppyDiskIcon className="w-5 h-5 fill-black text-black" />
          </FormNavButton>
        )}
      </div>
    </div>
  );
};

export default FormMobileEditBar;
