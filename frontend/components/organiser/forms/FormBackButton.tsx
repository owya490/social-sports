"use client";

import { ArrowLeftIcon } from "@heroicons/react/24/outline";

interface FormBackButtonProps {
  onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
}

const FormBackButton = ({ onClick }: FormBackButtonProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="flex items-center justify-center min-w-16 gap-2 px-2.5 py-2.5 bg-white rounded-lg hover:bg-gray-50 transition-colors sm:border sm:border-gray-200"
    >
      <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
      <span className="text-base font-medium text-gray-700 hidden sm:block">Back</span>
    </button>
  );
};

export default FormBackButton;
