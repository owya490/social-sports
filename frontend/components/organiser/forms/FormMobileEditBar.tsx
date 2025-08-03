"use client";

import { DocumentTextIcon, ListBulletIcon } from "@heroicons/react/24/outline";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { FormNavButton } from "./FormUtilityComponents";
import { Spinner } from "@material-tailwind/react";

interface FormMobileEditBarProps {
  onAddTextSection: () => void;
  onAddDropdownSection: () => void;
  onSaveForm: () => void;
  isFormModified: boolean;
  isSubmitting: boolean;
}

const FormMobileEditBar = ({
  onAddTextSection,
  onAddDropdownSection,
  onSaveForm,
  isFormModified,
  isSubmitting,
}: FormMobileEditBarProps) => {
  return (
    <div className="md:hidden fixed top-20 left-20 right-2 z-40">
      <div className="bg-white rounded-lg border border-gray-200 flex justify-center items-center gap-4">
        <FormNavButton onClick={onAddTextSection} tooltipContent="Add Text Question">
          <DocumentTextIcon className="w-5 h-5 stroke-1 text-gray-600" />
        </FormNavButton>

        <FormNavButton onClick={onAddDropdownSection} tooltipContent="Add Dropdown Question">
          <ListBulletIcon className="w-5 h-5 stroke-1 text-gray-600" />
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
