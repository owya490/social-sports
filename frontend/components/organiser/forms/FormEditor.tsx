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
      <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f0f0f0", padding: "20px" }}>
        <div
          style={{
            width: "60px",
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "16px",
            marginRight: "20px",
            marginTop: "80px",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            alignItems: "center",
            position: "sticky",
            top: "80px",
            alignSelf: "flex-start",
            height: "fit-content",
          }}
          className="bg-white border-r-[1px] fixed bottom-0 sm:bottom-auto inset-x-0 sm:inset-x-auto sm:left-0 sm:h-screen z-40"
        >
          <div className="flex flex-col space-y-3 sticky">
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
              <DocumentTextIcon className="w-6 h-6 stroke-1 stroke-core-text" />
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
              <ListBulletIcon className="w-6 h-6 stroke-1 stroke-core-text" />
            </FormNavButton>

            <FormNavButton onClick={handleSubmitClick} tooltipContent="Save Form">
              <PaperAirplaneIcon className="w-6 stroke-1 stroke-core-text" />
            </FormNavButton>
          </div>
        </div>

        {/* Main Form Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "800px",
            margin: "0 auto",
            position: "relative",
            paddingBottom: "80px",
          }}
        >
          {/* Form Title Card */}
          <div
            style={{
              backgroundColor: "white",
              borderRadius: "8px",
              padding: "24px",
            }}
          >
            {isEditingTitle ? (
              <input
                type="text"
                value={form.title}
                onChange={handleTitleChange}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  width: "100%",
                  border: "none",
                  outline: "none",
                  marginBottom: "16px",
                }}
                autoFocus
              />
            ) : (
              <h1
                onClick={() => setIsEditingTitle(true)}
                style={{
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginBottom: "16px",
                  cursor: "pointer",
                }}
              >
                {form.title}
              </h1>
            )}
            <input
              type="text"
              placeholder="Form description"
              style={{
                width: "100%",
                border: "none",
                outline: "none",
                color: "#666",
                fontSize: "16px",
              }}
            />
          </div>
          {/* Warning Dialog */}
          {showWarning && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  backgroundColor: "white",
                  padding: "24px",
                  borderRadius: "8px",
                  maxWidth: "400px",
                  textAlign: "center",
                }}
              >
                <h2 style={{ marginBottom: "16px" }}>Are you sure?</h2>
                <p style={{ marginBottom: "24px", color: "#666" }}>
                  Once submitted, this form cannot be edited further.
                </p>
                <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
                  <button
                    onClick={() => setShowWarning(false)}
                    style={{
                      padding: "8px 16px",
                      border: "1px solid #ccc",
                      borderRadius: "4px",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmSubmit}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#4CAF50",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    Confirm Submit
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions Container */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-sections">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-5">
                  {form.sectionsOrder.map((sectionId, index) => {
                    const section = form.sectionsMap.get(sectionId);
                    return section ? (
                      <Draggable key={sectionId} draggableId={sectionId} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            style={{
                              ...provided.draggableProps.style,
                            }}
                            className={`bg-white rounded-lg ${snapshot.isDragging ? "shadow-lg" : ""}`}
                          >
                            <div
                              {...provided.dragHandleProps}
                              className="flex justify-center items-center h-8 cursor-move hover:bg-gray-50 rounded-t-lg border-b border-gray-200"
                            >
                              <EllipsisHorizontalIcon className="w-6 h-6 text-gray-400" />
                            </div>
                            <div className="p-6">{renderSection(section, sectionId)}</div>
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
        </div>
      </div>
    </StrictMode>
  );
};

export default FormEditor;
