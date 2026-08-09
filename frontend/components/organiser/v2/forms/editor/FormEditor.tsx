"use client";

import { ImageSelectionDialog } from "@/components/forms/sections/image-section/ImageSelectionDialog";
import Loading from "@/components/loading/Loading";
import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { DropdownSelectSectionBuilder } from "@/components/organiser/v2/forms/editor/DropdownSelectSectionBuilder";
import { FormEditorHeader } from "@/components/organiser/v2/forms/editor/FormEditorHeader";
import { FormEditorToolbar } from "@/components/organiser/v2/forms/editor/FormEditorToolbar";
import { HeaderSectionBuilder } from "@/components/organiser/v2/forms/editor/HeaderSectionBuilder";
import { ImageSectionBuilder } from "@/components/organiser/v2/forms/editor/ImageSectionBuilder";
import { TextSectionBuilder } from "@/components/organiser/v2/forms/editor/TextSectionBuilder";
import { TickboxSectionBuilder } from "@/components/organiser/v2/forms/editor/TickboxSectionBuilder";
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
import { ImageType } from "@/interfaces/ImageTypes";
import { createForm, getForm, updateActiveForm } from "@/services/src/forms/formsServices";
import { getUsersFormImagesUrls, uploadFormImage } from "@/services/src/images/imageService";
import { sleep } from "@/utilities/sleepUtil";
import { ArrowDownIcon, ArrowUpIcon, Bars2Icon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ReactSortable } from "react-sortablejs";
import { v4 as uuidv4 } from "uuid";

const CREATE_FORM_ID = "create-form";
const FORMS_GALLERY = "/organiser/v2/forms/gallery";
const BLANK_FORM: Form = { ...EmptyForm, title: "Untitled Form" as FormTitle };

function formEditFingerprint(form: Form): string {
  return JSON.stringify({
    title: form.title,
    description: form.description,
    sectionsOrder: form.sectionsOrder,
    sectionsMap: form.sectionsMap,
  });
}

export type FormEditorProps = {
  formId: FormId;
};

function filterEmptyOptions(form: Form): Form {
  const filteredSectionsMap = { ...form.sectionsMap };
  const sectionsWithNoValidOptions: string[] = [];

  Object.keys(filteredSectionsMap).forEach((sectionId) => {
    const section = filteredSectionsMap[sectionId as SectionId];
    if (
      (section.type === FormSectionType.DROPDOWN_SELECT || section.type === FormSectionType.TICKBOX) &&
      "options" in section
    ) {
      const nonEmptyOptions = section.options.filter((option: string) => option.trim() !== "");
      if (nonEmptyOptions.length === 0) {
        sectionsWithNoValidOptions.push(
          section.question ||
            `Untitled ${section.type === FormSectionType.DROPDOWN_SELECT ? "dropdown" : "tickbox"} question`
        );
      } else {
        section.options = nonEmptyOptions;
      }
    }
  });

  if (sectionsWithNoValidOptions.length > 0) {
    const questionsList = sectionsWithNoValidOptions.map((q) => `"${q}"`).join(", ");
    throw new Error(
      `The following question${sectionsWithNoValidOptions.length > 1 ? "s" : ""} ${
        sectionsWithNoValidOptions.length > 1 ? "have" : "has"
      } no valid options: ${questionsList}. Please add at least one option to each question.`
    );
  }

  return { ...form, sectionsMap: filteredSectionsMap };
}

export function FormEditor({ formId }: FormEditorProps) {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState<Form>(BLANK_FORM);
  const [savedFingerprint, setSavedFingerprint] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageSelectionDialog, setShowImageSelectionDialog] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isModalClosing, setIsModalClosing] = useState(false);

  const isCreate = formId === CREATE_FORM_ID;
  const isFormModified = savedFingerprint !== null && formEditFingerprint(form) !== savedFingerprint;

  useOrganiserBreadcrumbTitle(isCreate ? "New form" : form.title?.trim() || "Edit form");

  const handleCloseErrorModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setSaveError(null);
      setIsModalClosing(false);
    }, 250);
  };

  useEffect(() => {
    const fetchForm = async () => {
      if (user.userId !== "") {
        if (isCreate) {
          const nextForm = { ...BLANK_FORM, userId: user.userId };
          setForm(nextForm);
          setSavedFingerprint(formEditFingerprint(nextForm));
        } else {
          const loaded = await getForm(formId);
          setForm(loaded);
          setSavedFingerprint(formEditFingerprint(loaded));
        }
      }
      setIsLoading(false);
    };
    void fetchForm();
  }, [user.userId, formId, isCreate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormModified) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormModified]);

  const handleSubmitClick = async () => {
    setIsSubmitting(true);
    setSaveError(null);
    try {
      if (isFormModified) {
        const formToSave = filterEmptyOptions(form);
        if (isCreate) {
          if (form.userId !== "") {
            const newFormId = await createForm(formToSave);
            router.push(`/organiser/v2/forms/${newFormId}/editor`);
          }
        } else {
          await updateActiveForm(formToSave, formId);
          setForm(formToSave);
          setSavedFingerprint(formEditFingerprint(formToSave));
        }
      }
      await sleep(1000);
    } catch (error) {
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

  const updateFormTitle = (newTitle: FormTitle) => {
    setForm((prevForm) => ({ ...prevForm, title: newTitle }));
  };

  const updateFormDescription = (newDescription: FormDescription) => {
    setForm((prevForm) => ({ ...prevForm, description: newDescription }));
  };

  const duplicateSection = (section: FormSection) => {
    const newSectionId = uuidv4() as SectionId;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: {
        ...prevForm.sectionsMap,
        [newSectionId]: JSON.parse(JSON.stringify(section)),
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
    const newSectionId = uuidv4() as SectionId;
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: [...prevForm.sectionsOrder, newSectionId],
      sectionsMap: { ...prevForm.sectionsMap, [newSectionId]: section },
    }));
  };

  const moveSectionUp = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const currentIndex = prevForm.sectionsOrder.indexOf(sectionId);
      if (currentIndex <= 0) return prevForm;
      const newOrder = [...prevForm.sectionsOrder];
      [newOrder[currentIndex], newOrder[currentIndex - 1]] = [newOrder[currentIndex - 1], newOrder[currentIndex]];
      return { ...prevForm, sectionsOrder: newOrder };
    });
  };

  const moveSectionDown = (sectionId: SectionId) => {
    setForm((prevForm) => {
      const currentIndex = prevForm.sectionsOrder.indexOf(sectionId);
      if (currentIndex >= prevForm.sectionsOrder.length - 1) return prevForm;
      const newOrder = [...prevForm.sectionsOrder];
      [newOrder[currentIndex], newOrder[currentIndex + 1]] = [newOrder[currentIndex + 1], newOrder[currentIndex]];
      return { ...prevForm, sectionsOrder: newOrder };
    });
  };

  const updateSection = (sectionId: SectionId, updatedSection: FormSection) => {
    setForm((prevForm) => ({
      ...prevForm,
      sectionsMap: { ...prevForm.sectionsMap, [sectionId]: updatedSection },
    }));
  };

  const sortableItems = form.sectionsOrder
    .map((sectionId) => ({
      id: sectionId,
      section: form.sectionsMap[sectionId],
    }))
    .filter((item) => item.section);

  const handleSort = (newOrder: { id: SectionId }[]) => {
    setForm((prevForm) => ({
      ...prevForm,
      sectionsOrder: newOrder.map((item) => item.id),
    }));
  };

  const renderSection = (section: FormSection, sectionId: SectionId) => {
    switch (section.type) {
      case FormSectionType.TEXT:
        return (
          <TextSectionBuilder
            section={section}
            sectionId={sectionId}
            onUpdate={(updated) => updateSection(sectionId, updated)}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );
      case FormSectionType.DROPDOWN_SELECT:
        return (
          <DropdownSelectSectionBuilder
            section={section}
            sectionId={sectionId}
            onUpdate={(updated) => updateSection(sectionId, updated)}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );
      case FormSectionType.TICKBOX:
        return (
          <TickboxSectionBuilder
            section={section}
            sectionId={sectionId}
            onUpdate={(updated) => updateSection(sectionId, updated)}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );
      case FormSectionType.IMAGE:
        return (
          <ImageSectionBuilder
            imageSection={section as ImageSection}
            sectionId={sectionId}
            onUpdate={(updated) => updateSection(sectionId, updated)}
            onDelete={deleteSection}
            onDuplicate={duplicateSection}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return <Loading />;
  }

  const previewHref = isCreate ? null : `/organiser/v2/forms/${formId}/preview`;
  const subtitle = isCreate
    ? isFormModified
      ? "Unsaved changes"
      : "Start from a blank form"
    : isFormModified
      ? "Unsaved changes"
      : "All changes saved";

  return (
    <div className="min-h-screen bg-surface text-foreground pb-24 md:pb-10">
      <FormEditorHeader
        subtitle={subtitle}
        previewHref={previewHref}
        onSave={() => {
          void handleSubmitClick();
        }}
        isFormModified={isFormModified}
        isSubmitting={isSubmitting}
      />

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
          <p className="text-sm text-foreground-secondary font-sans">{saveError}</p>
        </div>
      </Modal>

      <div className="mx-auto flex max-w-3xl gap-3 px-4 sm:px-6">
        <FormEditorToolbar
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
          onAddTickboxSection={() =>
            addSection({
              type: FormSectionType.TICKBOX,
              question: "",
              options: [""],
              imageUrl: null,
              required: true,
            })
          }
          onAddImageSection={() => setShowImageSelectionDialog(true)}
          onSaveForm={() => {
            void handleSubmitClick();
          }}
          isFormModified={isFormModified}
          isSubmitting={isSubmitting}
        />

        <div className="min-w-0 flex-1 space-y-3">
          <HeaderSectionBuilder
            formTitle={form.title}
            formDescription={form.description}
            updateFormTitle={updateFormTitle}
            updateFormDescription={updateFormDescription}
          />

          {form.sectionsOrder.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background px-4 py-8 text-center">
              <p className="text-sm font-medium text-foreground font-sans">No questions yet</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Use the toolbar to add text, dropdown, tickbox, or image sections.
              </p>
            </div>
          ) : (
            <ReactSortable
              list={sortableItems}
              setList={handleSort}
              handle=".drag-handle"
              className="flex flex-col gap-3"
              animation={200}
              delay={2}
            >
              {sortableItems.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-xl border border-border bg-background"
                >
                  <div className="md:hidden flex items-center justify-center gap-1 border-b border-border bg-surface py-1.5">
                    <button
                      type="button"
                      onClick={() => moveSectionUp(item.id)}
                      disabled={form.sectionsOrder.indexOf(item.id) === 0}
                      className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Move section up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSectionDown(item.id)}
                      disabled={form.sectionsOrder.indexOf(item.id) === form.sectionsOrder.length - 1}
                      className="rounded-lg p-1.5 text-foreground-muted hover:bg-surface-hover hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Move section down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <div
                    className="drag-handle hidden md:flex h-7 cursor-grab items-center justify-center border-b border-border bg-surface text-foreground-muted hover:bg-surface-hover active:cursor-grabbing"
                    style={{ touchAction: "none" }}
                  >
                    <Bars2Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="p-4">{item.section && renderSection(item.section, item.id)}</div>
                </div>
              ))}
            </ReactSortable>
          )}

          <button
            type="button"
            onClick={() => router.push(FORMS_GALLERY)}
            className="text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors"
          >
            ← Back to Forms
          </button>
        </div>
      </div>

      <ImageSelectionDialog
        isOpen={showImageSelectionDialog}
        onClose={() => setShowImageSelectionDialog(false)}
        onImageSelected={(imageUrl) => {
          addSection({
            type: FormSectionType.IMAGE,
            question: "",
            imageUrl,
            required: false,
          });
          setShowImageSelectionDialog(false);
        }}
        imageType={ImageType.FORM}
        imageUrls={[]}
        onLoadImages={() => getUsersFormImagesUrls(user.userId)}
        onUploadImage={(file: File) => uploadFormImage(user.userId, file)}
        title="Add Image Section"
        buttonText="Add Image Section"
      />
    </div>
  );
}
