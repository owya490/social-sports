"use client";

import DescriptionRichTextEditor from "@/components/editor/DescriptionRichTextEditor";
import { RichTextEditorContent } from "@/components/editor/RichTextEditorContent";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
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

  const handleDescriptionChange = (e: string) => {
    updateFormDescription(e as FormDescription);
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
        <>
          <DescriptionRichTextEditor description={formDescription} updateDescription={handleDescriptionChange} />
          <InvertedHighlightButton className="mt-2 ml-auto" onClick={() => setIsEditingDescription(false)}>
            Done
          </InvertedHighlightButton>
        </>
      ) : (
        <button
          className="w-full border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 focus:outline-none focus:border-gray-300 text-left text-sm"
          onClick={() => setIsEditingDescription(true)}
        >
          {formDescription ? <RichTextEditorContent description={formDescription} /> : "Click to add form description"}
        </button>
      )}
    </div>
  );
};
