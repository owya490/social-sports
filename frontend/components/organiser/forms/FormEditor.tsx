"use client";

import { DropdownSelectSectionBuilder } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionBuilder";
import { HeaderSectionBuilder } from "@/components/forms/sections/header-section/HeaderSectionBuilder";
import { ImageSectionBuilder } from "@/components/forms/sections/image-section/ImageSectionBuilder";
import { ImageSelectionDialog } from "@/components/forms/sections/image-section/ImageSelectionDialog";
import { TextSectionBuilder } from "@/components/forms/sections/text-section/TextSectionBuilder";
import Loading from "@/components/loading/Loading";
import Modal from "@/components/utility/Modal";
import { useUser } from "@/components/utility/UserContext";
import {
  EmptyForm,
  Form,
  FormDescription,
  FormId,
  FormSection,
  FormSectionType,
  FormTitle,
  ImageSection,
  SectionId,
} from "@/interfaces/FormTypes";
import { createForm, getForm, updateActiveForm } from "@/services/src/forms/formsServices";
import { sleep } from "@/utilities/sleepUtil";
import { ArrowDownIcon, ArrowLeftIcon, ArrowUpIcon, EllipsisHorizontalIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { v4 as uuidv4 } from "uuid";
import EmptyInfoSection from "./EmptyInfoSection";
import FormDesktopEditBar from "./FormDesktopEditBar";
import FormMobileEditBar from "./FormMobileEditBar";
export interface FormEditorParams {
  formId: FormId;
}

const CREATE_FORM_ID = "create-form";

const FormEditor = ({ formId }: FormEditorParams) => {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const initialForm = { ...EmptyForm, title: "Untitled Form" as FormTitle };
  const [form, setForm] = useState<Form>(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [showImageSelectionDialog, setShowImageSelectionDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const isFormModified =
    form.title !== initialForm.title || form.description !== initialForm.description || form.sectionsOrder.length > 0;

  // Handle modal close with proper timing to avoid content flash
  const handleCloseErrorModal = () => {
    setIsModalClosing(true);
    // Clear the error after the modal exit animation completes (200ms based on Headless UI data-leave:duration-200)
    setTimeout(() => {
      setSaveError(null);
      setIsModalClosing(false);
    }, 250); // Adding 50ms buffer to ensure animation completes
  };

  useEffect(() => {
    const fetchForm = async () => {
      if (user.userId !== "") {
        if (formId === CREATE_FORM_ID) {
          setForm((prevForm) => ({ ...prevForm, userId: user.userId }));
        } else {
          const form = await getForm(formId);
          setForm(form);
        }
      }
      setIsLoading(false);
    };
    fetchForm();
  }, [user]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormModified) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isFormModified]);

  // Helper function to filter empty options from dropdown sections
  const filterEmptyOptions = (form: Form): Form => {
    const filteredSectionsMap = { ...form.sectionsMap };
    const sectionsWithNoValidOptions: string[] = [];

    Object.keys(filteredSectionsMap).forEach((sectionId) => {
      const section = filteredSectionsMap[sectionId as SectionId];
      if (section.type === FormSectionType.DROPDOWN_SELECT && "options" in section) {
        // Filter out empty options
        const nonEmptyOptions = section.options.filter((option: string) => option.trim() !== "");

        if (nonEmptyOptions.length === 0) {
          sectionsWithNoValidOptions.push(section.question || "Untitled dropdown question");
        } else {
          section.options = nonEmptyOptions;
        }
      }
    });

    // Throw error if any dropdown sections have no valid options
    if (sectionsWithNoValidOptions.length > 0) {
      const questionsList = sectionsWithNoValidOptions.map((q) => `"${q}"`).join(", ");
      throw new Error(
        `The following dropdown question${sectionsWithNoValidOptions.length > 1 ? "s" : ""} ${
          sectionsWithNoValidOptions.length > 1 ? "have" : "has"
        } no valid options: ${questionsList}. Please add at least one option to each dropdown question.`
      );
    }

    return { ...form, sectionsMap: filteredSectionsMap };
  };

  const handleSubmitClick = async () => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      if (isFormModified) {
        const formToSave = filterEmptyOptions(form);

        if (formId === CREATE_FORM_ID) {
          if (form.userId !== "") {
            const newFormId = await createForm(formToSave);
            router.push(`/organiser/forms/${newFormId}/editor`);
          }
        } else {
          await updateActiveForm(formToSave, formId);
        }
      }
      // sleep (1s)
      await sleep(1000);
    } catch (error) {
      // Handle validation errors from filterEmptyOptions
      if (error instanceof Error) {
        setSaveError(error.message);
      } else {
        setSaveError("An unexpected error occurred while saving the form. Please try again.");
      }
      console.error("Form save error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackClick = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (isFormModified) {
      setShowBackWarning(true);
      return;
    }
    router.push(`/organiser/forms/gallery`);
  };

  const handleConfirmBack = () => {
    setShowBackWarning(false);
    router.push(`/organiser/forms/gallery`);
  };

  const updateFormTitle = (newTitle: FormTitle) => {
    setForm((prevForm) => ({
      ...prevForm,
      title: newTitle,
    }));
  };

  const updateFormDescription = (newDescription: FormDescription) => {
    setForm((prevForm) => ({
      ...prevForm,
      description: newDescription,
    }));
  };

  const duplicateSection = (section: FormSection) => {
    const newSectionId: SectionId = uuidv4() as SectionId; // Use UUID for uniqueness

    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: {
        ...prevForm.sectionsMap,
        [newSectionId]: JSON.parse(JSON.stringify(section)), // Deep clone everything
      },
    }));
  };

  const deleteSection = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const newMap = { ...prevForm.sectionsMap };
      delete newMap[sectionId];
      return {
        ...prevForm,
        sectionsOrder: prevForm.sectionsOrder.filter((id) => id !== sectionId),
        sectionsMap: newMap,
      };
    });
  };

  const addSection = (section: FormSection) => {
    // each section has a unique id
    const newSectionId: SectionId = uuidv4() as SectionId;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: { ...prevForm.sectionsMap, [newSectionId]: section },
    }));
  };

  const handleImageSelectionComplete = (imageUrl: string) => {
    addSection({
      type: FormSectionType.IMAGE,
      question: "",
      imageUrl: imageUrl,
      required: false,
    });
    setShowImageSelectionDialog(false);
  };

  const moveSectionUp = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const currentIndex = prevForm.sectionsOrder.indexOf(sectionId);
      if (currentIndex <= 0) return prevForm; // Already at top

      const newOrder = [...prevForm.sectionsOrder];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];

      return {
        ...prevForm,
        sectionsOrder: newOrder,
      };
    });
  };

  const moveSectionDown = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const currentIndex = prevForm.sectionsOrder.indexOf(sectionId);
      if (currentIndex >= prevForm.sectionsOrder.length - 1) return prevForm; // Already at bottom

      const newOrder = [...prevForm.sectionsOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];

      return {
        ...prevForm,
        sectionsOrder: newOrder,
      };
    });
  };

  const sortableItems = form.sectionsOrder
    .map((sectionId) => ({
      id: sectionId,
      section: form.sectionsMap[sectionId],
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
                sectionsMap: { ...prevForm.sectionsMap, [sectionId]: updatedSection },
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
                sectionsMap: { ...prevForm.sectionsMap, [sectionId]: updatedSection },
              }));
            }}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );

      case FormSectionType.IMAGE:
        return (
          <ImageSectionBuilder
            imageSection={section as ImageSection}
            sectionId={sectionId}
            onUpdate={(updatedSection) => {
              setForm((prevForm) => ({
                ...prevForm,
                sectionsMap: { ...prevForm.sectionsMap, [sectionId]: updatedSection },
              }));
            }}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );
    }
  };
  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="flex min-h-screen bg-gray-100 p-8 justify-center pt-20">
      {/* Sticky Back Button */}
      <div className="fixed top-20 left-2 md:left-8 z-50">
        <button
          onClick={handleBackClick}
          className="flex items-center justify-center min-w-16 gap-2 px-2.5 py-2.5 bg-white rounded-lg hover:bg-gray-50 transition-colors border border-gray-200"
        >
          <ArrowLeftIcon className="w-5 h-5 text-gray-700" />
          <span className="text-base font-medium text-gray-700 hidden md:block">Back</span>
        </button>
      </div>
      {/* Back Button Warning Dialog */}
      {showBackWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md text-center mx-4">
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

      {/* Save Error Dialog */}
      <Modal
        isOpen={!!saveError && !isModalClosing}
        onClose={handleCloseErrorModal}
        title="Cannot Save Form"
        state="error"
        maxWidth="lg"
        primaryButton={{
          text: "OK",
          onClick: handleCloseErrorModal,
        }}
      >
        <div className="text-left">
          <p className="text-sm text-gray-700 dark:text-gray-300">{saveError}</p>
        </div>
      </Modal>
      {/* Mobile Top Navbar */}
      <FormMobileEditBar
        onAddTextSection={() => {
          addSection({
            type: FormSectionType.TEXT,
            question: "",
            imageUrl: null,
            required: true,
          });
        }}
        onAddDropdownSection={() =>
          addSection({
            type: FormSectionType.DROPDOWN_SELECT,
            question: "",
            options: [""],
            imageUrl: null,
            required: true,
          })
        }
        onAddImageSection={() => setShowImageSelectionDialog(true)}
        onSaveForm={handleSubmitClick}
        isFormModified={isFormModified}
        isSubmitting={isSubmitting}
      />
      {/* Desktop Left Navbar */}
      <FormDesktopEditBar
        onAddTextSection={() =>
          addSection({
            type: FormSectionType.TEXT,
            question: "",
            imageUrl: null,
            required: true,
          })
        }
        onAddDropdownSection={() =>
          addSection({
            type: FormSectionType.DROPDOWN_SELECT,
            question: "",
            options: [""],
            imageUrl: null,
            required: true,
          })
        }
        onAddImageSection={() => setShowImageSelectionDialog(true)}
        onSaveForm={handleSubmitClick}
        isFormModified={isFormModified}
        isSubmitting={isSubmitting}
      />
      {/* Main Form Area */}
      <div className="flex-1 w-full flex justify-center">
        <div className="flex-1 flex flex-col gap-5 max-w-3xl relative pb-24 pt-4 md:ml-0 md:pb-20 md:pt-0">
          {/* Form Title Card */}
          <HeaderSectionBuilder
            formTitle={form.title}
            formDescription={form.description}
            updateFormTitle={updateFormTitle}
            updateFormDescription={updateFormDescription}
          />

          <EmptyInfoSection formSectionsOrder={form.sectionsOrder} />

          {/* Questions Container */}
          <ReactSortable
            list={sortableItems}
            setList={handleSort}
            handle=".drag-handle"
            className="flex flex-col gap-6"
            animation={200}
            delay={2}
          >
            {sortableItems.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                {/* Mobile Up/Down Arrows */}
                <div className="md:hidden flex justify-center items-center gap-2 py-2 bg-gray-50 border-b border-gray-200">
                  <button
                    onClick={() => moveSectionUp(item.id)}
                    disabled={form.sectionsOrder.indexOf(item.id) === 0}
                    className="p-1 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowUpIcon className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={() => moveSectionDown(item.id)}
                    disabled={form.sectionsOrder.indexOf(item.id) === form.sectionsOrder.length - 1}
                    className="p-1 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowDownIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
                {/* Smaller Section Header with Centered Drag Handle */}
                <div
                  className="drag-handle cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors items-center justify-center h-8 bg-gray-50 rounded-t-lg border-b border-gray-200 hidden md:flex"
                  style={{ touchAction: "none" }}
                >
                  <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
                </div>
                {/* Section Content */}
                <div className="p-6">{item.section && renderSection(item.section, item.id)}</div>
              </div>
            ))}
          </ReactSortable>
        </div>
      </div>

      {/* Image Selection Dialog */}
      <ImageSelectionDialog
        isOpen={showImageSelectionDialog}
        onClose={() => setShowImageSelectionDialog(false)}
        onImageSelected={handleImageSelectionComplete}
      />
    </div>
  );
};

export default FormEditor;
