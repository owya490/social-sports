"use client";

import { FormDescription, FormTitle } from "@/interfaces/FormTypes";
import { useState } from "react";

interface HeaderSectionBuilderProps {
  formTitle: FormTitle;
  formDescription: FormDescription;
  updateFormTitle: (formTitle: FormTitle) => void;
  updateFormDescription: (formDescription: FormDescription) => void;
}

export const HeaderSectionBuilder = ({
  formTitle,
  formDescription,
  updateFormTitle,
  updateFormDescription,
}: HeaderSectionBuilderProps) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormTitle(e.target.value as FormTitle);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormDescription(e.target.value as FormDescription);
  };

  return (
    <div className="bg-white rounded-lg p-8">
      {isEditingTitle ? (
        <input
          type="text"
          value={formTitle}
          onChange={handleTitleChange}
          onBlur={() => setIsEditingTitle(false)}
          onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
          className="text-4xl font-bold w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-gray-300 mb-4"
          autoFocus
        />
      ) : (
        <h1
          onClick={() => setIsEditingTitle(true)}
          className="w-full text-4xl font-bold mb-4 cursor-pointer hover:text-blue-600 hover:bg-gray-50 p-2 rounded-md transition-colors border-2 border-transparent hover:border-gray-200"
        >
          {formTitle}
        </h1>
      )}

      {isEditingDescription ? (
        <input
          type="text"
          value={formDescription}
          onChange={handleDescriptionChange}
          onBlur={() => setIsEditingDescription(false)}
          onKeyDown={(e) => e.key === "Enter" && setIsEditingDescription(false)}
          className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-gray-300 text-gray-600 text-lg"
          placeholder="Enter form description"
          autoFocus
        />
      ) : (
        <div
          onClick={() => setIsEditingDescription(true)}
          className="w-full text-gray-600 text-lg cursor-pointer hover:text-blue-600 hover:bg-gray-50 p-2 rounded-md transition-colors border-2 border-transparent hover:border-gray-200"
        >
          {formDescription || "Click to add form description"}
        </div>
      )}
    </div>
  );
};
