"use client";

import { Form, FormId, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { useState, ReactNode } from "react";
import { Tooltip } from "@material-tailwind/react";
import { DocumentTextIcon, ListBulletIcon, PaperAirplaneIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { TextSectionBuilder } from "@/components/forms/sections/text-section/TextSectionBuilder";
import { DropdownSelectSectionBuilder } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionBuilder";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { ReactSortable } from "react-sortablejs";

const initialForm: Form = {
  title: "Untitled Form",
  description: "",
  userId: "user123",
  formActive: true,
  sectionsOrder: [],
  sectionsMap: new Map<SectionId, FormSection>(),
};

// Add the ResponsiveTooltip component
interface ResponsiveTooltipProps {
  content: string;
  children: ReactNode;
}

// Add this interface above your FormEditor component
interface FormNavButtonProps {
  onClick: () => void;
  tooltipContent: string;
  children: ReactNode;
}

export interface FormEditorParams {
  formId: FormId;
}

// Update the FormNavButton component
const FormNavButton = ({ onClick, tooltipContent, children }: FormNavButtonProps) => {
  return (
    <ResponsiveTooltip content={tooltipContent}>
      <button
        onClick={onClick}
        className="flex items-center justify-center h-10 w-10 rounded-md hover:bg-core-hover transition ease-in-out"
      >
        {children}
      </button>
    </ResponsiveTooltip>
  );
};

const ResponsiveTooltip = ({ content, children }: ResponsiveTooltipProps) => {
  return (
    <div className="relative">
      <div className="hidden sm:block">
        <Tooltip content={content} placement="right" className="absolute left-full ml-2">
          {children}
        </Tooltip>
      </div>
      <div className="block sm:hidden">
        <Tooltip content={content} placement="top">
          {children}
        </Tooltip>
      </div>
    </div>
  );
};

const FormEditor = ({}: FormEditorParams) => {
  const [form, setForm] = useState<Form>(initialForm);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const isFormModified = form.title !== initialForm.title || form.sectionsOrder.length > 0;
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      description: e.target.value,
    }));
  };


  const handleSubmitClick = () => {
    setShowWarning(true);
  };

  const handleConfirmSubmit = () => {
    console.log("Form submitted:", form);
    setShowWarning(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      title: e.target.value,
    }));
  };

  const handleBackClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (isFormModified) {
      setShowBackWarning(true);
      return;
    }
    window.history.back();
  };

  const handleConfirmBack = () => {
    setShowBackWarning(false);
    window.history.back();
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const duplicateSection = (section: FormSection, sectionId: SectionId) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, {
        ...section,
        ...(section.type === FormSectionType.DROPDOWN_SELECT && {
          options: [...section.options],
        }),
      }),
    }));
  };

  const deleteSection = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const newMap = new Map(prevForm.sectionsMap);
      newMap.delete(sectionId);
      return {
        ...prevForm,
        sectionsOrder: prevForm.sectionsOrder.filter((id) => id !== sectionId),
        sectionsMap: newMap,
      };
    });
  };

  const addSection = (section: FormSection) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, section),
    }));
  };

  const sortableItems = form.sectionsOrder
    .map((sectionId) => ({
      id: sectionId,
      section: form.sectionsMap.get(sectionId),
    }))
    .filter((item) => item.section);

  // Handle reordering
  const handleSort = (newOrder: any[]) => {
    const newSectionOrder = newOrder.map((item) => item.id);
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: newSectionOrder,
    }));
  };

  const renderSection = (section: FormSection, sectionId: SectionId) => {
    switch (section.type) {
      case FormSectionType.TEXT:
        return (
          <TextSectionBuilder
            section={section}
            sectionId={sectionId}
            onUpdate={(updatedSection) => {
              setForm((prevForm) => ({
                ...prevForm,
                sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
              }));
            }}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );

      case FormSectionType.DROPDOWN_SELECT:
        return (
          <DropdownSelectSectionBuilder
            section={section}
            sectionId={sectionId}
            onUpdate={(updatedSection) => {
              setForm((prevForm) => ({
                ...prevForm,
                sectionsMap: new Map(prevForm.sectionsMap).set(sectionId, updatedSection),
              }));
            }}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 p-8 justify-center">
      {/* Sticky Back Button */}
      <div className="fixed top-20 left-4 z-50">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
          <span className="text-base font-medium text-gray-700">Back</span>
        </button>
      </div>
      {/* Back Button Warning Dialog */}
      {showBackWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
            <p className="text-gray-600 mb-6">Any unsaved changes will be lost. Do you want to continue?</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setShowBackWarning(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBack}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
              >
                Leave Page
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Left Navbar */}
      <div className="sticky top-40 w-16 bg-white rounded-lg p-6 mr-5 flex flex-col gap-4 items-center h-fit shadow-sm border border-gray-200 z-40">
        <div className="flex flex-col space-y-3">
          <FormNavButton
            onClick={() =>
              addSection({
                type: FormSectionType.TEXT,
                question: "",
                imageUrl: null,
                required: true,
              })
            }
            tooltipContent="Add Text Question"
          >
            <DocumentTextIcon className="w-6 h-6 stroke-1 text-gray-600" />
          </FormNavButton>

          <FormNavButton
            onClick={() =>
              addSection({
                type: FormSectionType.DROPDOWN_SELECT,
                question: "",
                options: [""],
                imageUrl: null,
                required: true,
              })
            }
            tooltipContent="Add Dropdown Question"
          >
            <ListBulletIcon className="w-6 h-6 stroke-1 text-gray-600" />
          </FormNavButton>

          <FormNavButton onClick={handleSubmitClick} tooltipContent="Submit Form">
            <PaperAirplaneIcon className="w-6 h-6 fill-black text-black" />
          </FormNavButton>
        </div>
      </div>
      {/* Main Form Area */}
      <div className="flex-1 flex flex-col gap-5 max-w-3xl mx-auto relative pb-20">
        {/* Form Title Card */}
        <div className="bg-white rounded-lg p-8 shadow-sm">
          {isEditingTitle ? (
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="text-4xl font-bold w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-gray-300 mb-4 shadow-sm"
              autoFocus
            />
          ) : (
            <h1
              onClick={() => setIsEditingTitle(true)}
              className="w-full text-4xl font-bold mb-4 cursor-pointer hover:text-blue-600 hover:bg-gray-50 p-2 rounded-md transition-colors border-2 border-transparent hover:border-gray-200"
            >
              {form.title}
            </h1>
          )}

          {isEditingDescription ? (
            <input
              type="text"
              value={form.description}
              onChange={handleDescriptionChange}
              onBlur={() => setIsEditingDescription(false)}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingDescription(false)}
              className="w-full border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:border-gray-300 text-gray-600 text-lg shadow-sm"
              placeholder="Enter form description"
              autoFocus
            />
          ) : (
            <div
              onClick={() => setIsEditingDescription(true)}
              className="w-full text-gray-600 text-lg cursor-pointer hover:text-blue-600 hover:bg-gray-50 p-2 rounded-md transition-colors border-2 border-transparent hover:border-gray-200"
            >
              {form.description || "Click to add form description"}
            </div>
          )}
        </div>

        {/* Questions Container */}
        <ReactSortable
          list={sortableItems}
          setList={handleSort}
          handle=".drag-handle"
          className="flex flex-col gap-6"
          animation={200}
          delay={2}
        >
          {sortableItems.map((item, index) => (
            <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
              {/* Smaller Section Header with Centered Drag Handle */}
              <div className="drag-handle cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors flex items-center justify-center h-8 bg-gray-50 rounded-t-lg border-b border-gray-200">
                <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
              </div>

              {/* Section Content */}
              <div className="p-6">{item.section && renderSection(item.section, item.id)}</div>
            </div>
          ))}
        </ReactSortable>

        {/* Warning Dialog */}
        {showWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
              <p className="text-gray-600 mb-6">Once submitted, this form cannot be edited further.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setShowWarning(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmSubmit}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Confirm Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormEditor;
