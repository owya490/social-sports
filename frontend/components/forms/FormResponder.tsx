"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { DropdownSelectSectionResponse } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionResponse";
import { HeaderSectionResponse } from "@/components/forms/sections/header-section/HeaderSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import { TickboxSectionResponse } from "@/components/forms/sections/tickbox-section/TickboxSectionResponse";
import Loading from "@/components/loading/Loading";
import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponseId, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { FulfilmentEntityId, FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FormResponsePaths } from "@/services/src/forms/formsConstants";
import {
  formsServiceLogger,
  getForm,
  getFormIdByEventId,
  getFormResponse,
  saveTempFormResponse,
  updateTempFormResponse,
} from "@/services/src/forms/formsServices";
import { extractFormResponseFromForm } from "@/services/src/forms/formsUtils/createFormResponseUtils";
import { findFormResponseDocRef } from "@/services/src/forms/formsUtils/formsUtils";
import { updateFulfilmentEntityWithFormResponseId } from "@/services/src/fulfilment/fulfilmentServices";
import { getPublicUserById } from "@/services/src/users/usersService";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { ImageSectionResponse } from "./sections/image-section/ImageSectionResponse";

const formResponderLogger = new Logger("formResponderLogger");

export interface FormResponderRef {
  save: () => Promise<FormResponseId | null>;
  areAllRequiredFieldsFilled: () => boolean;
  hasUnsavedChanges: () => boolean;
}

interface FormResponderProps {
  formId: FormId;
  eventId: EventId;
  formResponseId: FormResponseId | null;
  canEditForm?: boolean;
  isPreview?: boolean;
  fulfilmentInfo?: {
    fulfilmentSessionId: FulfilmentSessionId;
    fulfilmentEntityId: FulfilmentEntityId;
  };
  onValidationChange?: (isValid: boolean) => void;
  onSaveLoadingChange?: (isLoading: boolean) => void;
}

const FormResponder = forwardRef<FormResponderRef, FormResponderProps>(
  (
    {
      formId,
      eventId,
      formResponseId,
      canEditForm,
      isPreview,
      fulfilmentInfo,
      onValidationChange,
      onSaveLoadingChange,
    },
    ref
  ) => {
    // if we are in preview mode, we can't edit the form
    canEditForm = isPreview === true ? false : canEditForm;

    const router = useRouter();
    const [form, setForm] = useState<Form | null>(null);
    const [organiser, setOrganiser] = useState<PublicUserData>(EmptyPublicUserData);
    const [loading, setLoading] = useState<boolean>(true);
    const [saveLoading, setSaveLoading] = useState<boolean>(false);
    const [canEdit, setCanEdit] = useState<boolean>(canEditForm ?? false);
    const [formResponseIdState, setFormResponseIdState] = useState<FormResponseId | null>(formResponseId);
    const [hasUnsavedChangesState, setHasUnsavedChangesState] = useState<boolean>(false);
    function setCanEditWrapper(canEdit: boolean) {
      setCanEdit(canEditForm ?? canEdit);
    }

    const onSave = async (): Promise<FormResponseId | null> => {
      formResponderLogger.info(`Saving form response for formId: ${formId}, eventId: ${eventId}`);
      if (!form) return null;
      if (!canEdit) return null;

      setSaveLoading(true);
      onSaveLoadingChange?.(true);
      try {
        const formResponse = extractFormResponseFromForm(formId, eventId, form);
        let resultFormResponseId: FormResponseId;

        if (formResponseIdState === null) {
          formResponderLogger.info(
            `Form response ID is null, creating a new form response for formId: ${formId}, eventId: ${eventId}`
          );
          const newFormResponseId = await saveTempFormResponse(formResponse);
          setFormResponseIdState(newFormResponseId);
          formResponderLogger.info(
            `New temp form response saved with ID: ${newFormResponseId}, formId: ${formId}, eventId: ${eventId}`
          );

          if (fulfilmentInfo) {
            await updateFulfilmentEntityWithFormResponseId(
              fulfilmentInfo.fulfilmentSessionId,
              fulfilmentInfo.fulfilmentEntityId,
              newFormResponseId
            );
          }
          resultFormResponseId = newFormResponseId;
        } else {
          await updateTempFormResponse(formResponse, formResponseIdState);
          resultFormResponseId = formResponseIdState;
        }

        // Reset unsaved changes state after successful save
        setHasUnsavedChangesState(false);

        return resultFormResponseId;
      } finally {
        setSaveLoading(false);
        onSaveLoadingChange?.(false);
      }
    }; // Expose the save function to parent components
    useImperativeHandle(
      ref,
      () => ({
        save: onSave,
        areAllRequiredFieldsFilled,
        hasUnsavedChanges,
      }),
      [form, canEdit, formResponseIdState, fulfilmentInfo, saveLoading, hasUnsavedChangesState]
    );

    useEffect(() => {
      const fetchFormData = async () => {
        if (!formId) {
          router.push("/error");
          return;
        }
        if (!isPreview) {
          // check the form is actually attached to the event as we are not in preview mode
          const expectedFormId = await getFormIdByEventId(eventId);
          if (expectedFormId !== formId) {
            router.push("/error");
            return;
          }
        }

        try {
          const formData = await getForm(formId);
          setForm(formData);

          // Fetch organiser data after form is loaded
          const organiserData = await getPublicUserById(formData.userId);
          setOrganiser(organiserData);

          if (!isPreview) {
            // Fetch form response data if it exists and replace the form sectionsMap with the form responseMap
            await fetchFormResponseData();
          }
        } catch (error) {
          formsServiceLogger.error(`Error fetching form: ${error}`);
          router.push("/error");
        } finally {
          setLoading(false);
        }
      };

      const fetchFormResponseData = async () => {
        if (!formResponseIdState) return;
        const docRef = await findFormResponseDocRef(formId, eventId, formResponseIdState);
        if (docRef.path.includes(FormResponsePaths.Temp)) {
          // Since the form response is in the temp collection, we can allow the user to edit the form response
          setCanEditWrapper(true);
        }
        // Now get the form response data itself
        const formResponseData = await getFormResponse(formId, eventId, formResponseIdState);
        setForm((prevForm) => {
          if (!prevForm) return prevForm;
          return {
            ...prevForm,
            sectionsOrder: formResponseData.responseSectionsOrder,
            sectionsMap: formResponseData.responseMap,
          };
        });
      };

      fetchFormData();
    }, [formResponseIdState]);

    // Function to check if all required fields are filled
    const areAllRequiredFieldsFilled = () => {
      if (!form) return false;

      return form.sectionsOrder.every((sectionId) => {
        const section = form.sectionsMap[sectionId];
        if (!section) return true; // Skip if section not found

        // If section is required, check if it has a valid answer based on type
        if (section.required) {
          switch (section.type) {
            case FormSectionType.TEXT:
            case FormSectionType.MULTIPLE_CHOICE:
            case FormSectionType.DROPDOWN_SELECT:
              return typeof section.answer === "string" && section.answer.trim() !== "";
            case FormSectionType.TICKBOX:
              return section.answer && section.answer.length > 0;
            case FormSectionType.FILE_UPLOAD:
              return section.fileUrl && section.fileUrl.trim() !== "";
            case FormSectionType.DATE_TIME:
              return section.timestamp && section.timestamp.trim() !== "";
            default:
              return false;
          }
        }

        return true; // Not required, so it's valid
      });
    };

    // Function to check if there are unsaved changes
    const hasUnsavedChanges = () => {
      return hasUnsavedChangesState;
    };

    const stringAnswerOnChange = (sectionId: SectionId, newAnswer: string) => {
      if (!form) return;

      // Mark as having unsaved changes
      setHasUnsavedChangesState(true);

      setForm((prevForm) => {
        if (!prevForm) return prevForm;

        const newSectionsMap = { ...prevForm.sectionsMap };
        const section = newSectionsMap[sectionId];
        if (!section) return prevForm;

        // Narrow the type to sections that accept a string answer
        if (
          section.type === FormSectionType.TEXT ||
          section.type === FormSectionType.MULTIPLE_CHOICE ||
          section.type === FormSectionType.DROPDOWN_SELECT
        ) {
          const updatedSection = { ...section, answer: newAnswer };
          newSectionsMap[sectionId] = updatedSection;
        }

        return {
          ...prevForm,
          sectionsMap: newSectionsMap,
        };
      });
    };

    const arrayAnswerOnChange = (sectionId: SectionId, newAnswer: string[]) => {
      if (!form) return;

      // Mark as having unsaved changes
      setHasUnsavedChangesState(true);

      setForm((prevForm) => {
        if (!prevForm) return prevForm;

        const newSectionsMap = { ...prevForm.sectionsMap };
        const section = newSectionsMap[sectionId];
        if (!section) return prevForm;

        // Narrow the type to sections that accept string[] answer (TICKBOX)
        if (section.type === FormSectionType.TICKBOX) {
          const updatedSection = { ...section, answer: newAnswer };
          newSectionsMap[sectionId] = updatedSection;
        }

        return {
          ...prevForm,
          sectionsMap: newSectionsMap,
        };
      });
    };

    // Call validation callback whenever form state changes
    useEffect(() => {
      if (onValidationChange && form) {
        const isValid = areAllRequiredFieldsFilled();
        onValidationChange(isValid);
      }
    }, [form, onValidationChange]);

    if (loading || saveLoading) {
      return <Loading />;
    }

    if (!form) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div>Form not found</div>
        </div>
      );
    }

    return (
      <div className="bg-core-hover">
        <div className="flex w-screen justify-center">
          <div className="screen-width-primary space-y-8 md:px-32">
            <HeaderSectionResponse formTitle={form.title} formDescription={form.description} organiser={organiser} />
            {form.sectionsOrder.map((sectionId) => {
              const section = form.sectionsMap[sectionId];
              if (!section) return null; // Skip if section not found

              switch (section.type) {
                case FormSectionType.TEXT:
                  return (
                    <TextSectionResponse
                      key={sectionId}
                      textSection={section}
                      answerOnChange={(newAnswer: string) => {
                        stringAnswerOnChange(sectionId, newAnswer);
                      }}
                      canEdit={canEdit}
                    />
                  );
                case FormSectionType.DROPDOWN_SELECT:
                  return (
                    <DropdownSelectSectionResponse
                      key={sectionId}
                      dropdownSelectSection={section}
                      answerOnChange={(newAnswer: string) => {
                        stringAnswerOnChange(sectionId, newAnswer);
                      }}
                      canEdit={canEdit}
                    />
                  );
                case FormSectionType.TICKBOX:
                  return (
                    <TickboxSectionResponse
                      key={sectionId}
                      tickboxSection={section}
                      answerOnChange={(newAnswer: string[]) => {
                        arrayAnswerOnChange(sectionId, newAnswer);
                      }}
                      canEdit={canEdit}
                    />
                  );
                case FormSectionType.IMAGE:
                  return <ImageSectionResponse key={sectionId} imageSection={section} />;
                default:
                  return null;
              }
            })}
            <div className={`w-full ${canEdit ? "flex" : "hidden"}`}>
              <div className="w-fit ml-auto bg-white py-2 px-4 rounded-lg flex justify-between gap-4">
                {!areAllRequiredFieldsFilled() ? (
                  <Tooltip
                    content="Please fill out all required sections before saving"
                    placement="top"
                    className="bg-gray-800 text-white text-xs"
                    animate={{
                      mount: { scale: 1, y: 0 },
                      unmount: { scale: 0, y: 25 },
                    }}
                  >
                    <div>
                      <InvertedHighlightButton
                        type="submit"
                        className="border-1 px-3 ml-auto bg-gray-100 text-gray-400 cursor-not-allowed"
                        onClick={undefined}
                        disabled={true}
                      >
                        <span className="text-sm flex items-center gap-2">
                          <FloppyDiskIcon className="h-4 w-4" /> Save
                        </span>
                      </InvertedHighlightButton>
                    </div>
                  </Tooltip>
                ) : (
                  <InvertedHighlightButton
                    type="submit"
                    className="border-1 px-3 ml-auto bg-white"
                    onClick={onSave}
                    disabled={false}
                  >
                    <span className="text-sm flex items-center gap-2">
                      <FloppyDiskIcon className="h-4 w-4" /> Save
                    </span>
                  </InvertedHighlightButton>
                )}
                <InvertedHighlightButton
                  type="submit"
                  className="border-1 px-3 bg-white ml-auto"
                  onClick={() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <span className="text-sm flex items-center gap-2">
                    <ChevronUpIcon className="h-4 w-4" /> Return to Top
                  </span>
                </InvertedHighlightButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

FormResponder.displayName = "FormResponder";

export default FormResponder;
