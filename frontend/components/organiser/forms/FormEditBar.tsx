"use client";

import { ArrowLeftIcon, DocumentTextIcon, ListBulletIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { Spinner } from "@material-tailwind/react";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { FormNavButton } from "./FormUtilityComponents";

interface FormEditBarProps {
  onAddTextSection: () => void;
  onAddDropdownSection: () => void;
  onAddImageSection: () => void;
  onSaveForm: () => void;
  onBackClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
  isFormModified: boolean;
  isSubmitting: boolean;
}

const FormEditBar = ({
  onAddTextSection,
  onAddDropdownSection,
  onAddImageSection,
  onSaveForm,
  onBackClick,
  isFormModified,
  isSubmitting,
}: FormEditBarProps) => {
  return (
    <>
      {/* Mobile Edit Bar */}
      <div className="sm:hidden fixed top-16 z-40 w-full flex justify-between px-6">
        {/* Back Button */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-md flex justify-center items-center">
          <FormNavButton onClick={onBackClick} tooltipContent="Go back">
            <ArrowLeftIcon className="w-5 h-5 stroke-1 text-black" />
          </FormNavButton>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-md flex justify-center items-center gap-2">
          <FormNavButton onClick={onAddTextSection} tooltipContent="Add Text Question">
            <DocumentTextIcon className="w-5 h-5 stroke-1 text-black" />
          </FormNavButton>

          <FormNavButton onClick={onAddDropdownSection} tooltipContent="Add Dropdown Question">
            <ListBulletIcon className="w-5 h-5 stroke-1 text-black" />
          </FormNavButton>

          <FormNavButton onClick={onAddImageSection} tooltipContent="Add Image Section">
            <PhotoIcon className="w-5 h-5 stroke-1 text-black" />
          </FormNavButton>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-md flex justify-center items-center">
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

      {/* Desktop Edit Bar */}
      <div className="hidden sm:flex sticky top-36 flex-col gap-4 items-center z-40">
        <div className="bg-white rounded-lg border border-gray-200 shadow-md">
          <FormNavButton onClick={onBackClick} tooltipContent="Back">
            <ArrowLeftIcon className="w-5 h-5 stroke-1 text-black" />
          </FormNavButton>
        </div>
        <div className="flex flex-col space-y-3 bg-white rounded-lg border border-gray-200 shadow-md">
          <FormNavButton onClick={onAddTextSection} tooltipContent="Add Text Question">
            <DocumentTextIcon className="w-6 h-6 stroke-1 text-black" />
          </FormNavButton>

          <FormNavButton onClick={onAddDropdownSection} tooltipContent="Add Dropdown Question">
            <ListBulletIcon className="w-6 h-6 stroke-1 text-black" />
          </FormNavButton>

          <FormNavButton onClick={onAddImageSection} tooltipContent="Add Image Section">
            <PhotoIcon className="w-6 h-6 stroke-1 text-black" />
          </FormNavButton>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-md">
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
    </>
  );
};

export default FormEditBar;
