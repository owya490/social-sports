import { Form, FormId, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { useState, ReactNode } from "react";
import { Tooltip } from "@material-tailwind/react";
import { DocumentTextIcon, ListBulletIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { TextSectionBuilder } from "@/components/forms/sections/text-section/TextSectionBuilder";
import { DropdownSelectSectionBuilder } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionBuilder";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { StrictMode } from "react";

const initialForm: Form = {
  title: "Untitled Form",
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

  // Add this state near your other useState declarations
  const [showWarning, setShowWarning] = useState(false);

  // Add this after your existing code but before the final return statement
  const handleSubmitClick = () => {
    setShowWarning(true);
  };

  const handleConfirmSubmit = () => {
    // Implement actual submit logic here
    console.log("Form submitted:", form);
    setShowWarning(false);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prevForm) => ({
      ...prevForm,
      title: e.target.value,
    }));
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const duplicateSection = (section: FormSection, sectionId: SectionId) => {
    const newSectionId: SectionId = `section-${form.sectionsOrder.length + 1}`;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: new Map(prevForm.sectionsMap).set(newSectionId, {
        ...section,
        // Deep copy the options array if it exists
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

  const onDragEnd = (result: DropResult) => {
    console.log("Drag ended:", result);

    if (!result.destination) {
      return;
    }

    const newOrder = Array.from(form.sectionsOrder);
    const [reorderedItem] = newOrder.splice(result.source.index, 1);
    newOrder.splice(result.destination.index, 0, reorderedItem);

    console.log("New order:", newOrder);

    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: newOrder,
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
    <StrictMode>
      <div className="flex min-h-screen bg-gray-100 p-5">
        {/* Left Toolbar */}
        <div className="sticky top-20 w-14 bg-white rounded-lg p-4 mr-5 flex flex-col gap-4 items-center h-fit shadow-sm border border-gray-200 z-40">
          <div className="flex flex-col space-y-3">
            <FormNavButton
              onClick={() => addSection({
                type: FormSectionType.TEXT,
                question: "",
                imageUrl: null,
                required: true,
              })}
              tooltipContent="Add Text Question"
            >
              <DocumentTextIcon className="w-5 h-5 stroke-1 text-gray-600" />
            </FormNavButton>
  
            <FormNavButton
              onClick={() => addSection({
                type: FormSectionType.DROPDOWN_SELECT,
                question: "",
                options: [""],
                imageUrl: null,
                required: true,
              })}
              tooltipContent="Add Dropdown Question"
            >
              <ListBulletIcon className="w-5 h-5 stroke-1 text-gray-600" />
            </FormNavButton>
  
            <FormNavButton onClick={handleSubmitClick} tooltipContent="Submit Form">
              <PaperAirplaneIcon className="w-5 h-5 stroke-1 text-gray-600" />
            </FormNavButton>
          </div>
        </div>
  
        {/* Main Form Area */}
        <div className="flex-1 flex flex-col gap-5 max-w-3xl mx-auto relative pb-20">
          {/* Form Title Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {isEditingTitle ? (
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                className="text-3xl font-bold w-full border-none focus:outline-none mb-4"
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                className="text-3xl font-bold mb-4 cursor-pointer"
              >
                {form.title}
              </h1>
            )}
            <input
              type="text"
              placeholder="Form description"
              className="w-full border-none focus:outline-none text-gray-600 text-base"
            />
          </div>
  
          {/* Questions Container */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="flex flex-col gap-5"
                >
                  {form.sectionsOrder.map((sectionId, index) => {
                    const section = form.sectionsMap.get(sectionId);
                    return section ? (
                      <Draggable key={sectionId} draggableId={sectionId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={provided.draggableProps.style}
                            className={`bg-white rounded-lg ${
                              snapshot.isDragging ? "shadow-lg" : "shadow-sm"
                            }`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="flex justify-center items-center h-8 cursor-move hover:bg-gray-50 rounded-t-lg border-b border-gray-200"
                            >
                              <EllipsisHorizontalIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="p-6">
                              {renderSection(section, sectionId)}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ) : null;
                  })}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
  
          {/* Warning Dialog */}
          {showWarning && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg max-w-md text-center">
                <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
                <p className="text-gray-600 mb-6">
                  Once submitted, this form cannot be edited further.
                </p>
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
    </StrictMode>
  );
};

export default FormEditor;
