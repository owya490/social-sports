"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { DropdownSelectSectionResponse } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionResponse";
import { FormHeaderSectionResponse } from "@/components/forms/sections/form-header-section/FormHeaderSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import Loading from "@/components/loading/Loading";
import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponseId, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { FulfilmentEntityId, FulfilmentSessionId } from "@/interfaces/FulfilmentTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { FormResponsePaths } from "@/services/src/forms/formsConstants";
import {
  createTempFormResponse,
  formsServiceLogger,
  getForm,
  getFormIdByEventId,
  getFormResponse,
  updateFormResponse,
} from "@/services/src/forms/formsServices";
import { extractFormResponseFromForm } from "@/services/src/forms/formsUtils/createFormResponseUtils";
import { findFormResponseDocRef } from "@/services/src/forms/formsUtils/formsUtils";
import { updateFulfilmentEntityWithFormResponseId } from "@/services/src/fulfilment/fulfilmentServices";
import { getPublicUserById } from "@/services/src/users/usersService";
import { ChevronUpIcon } from "@heroicons/react/24/outline";
import { FloppyDiskIcon } from "@sidekickicons/react/24/solid";
import { useRouter } from "next/navigation";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

const formResponderLogger = new Logger("formResponderLogger");

export interface FormResponderRef {
  save: () => Promise<FormResponseId | null>;
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
}

const FormResponder = forwardRef<FormResponderRef, FormResponderProps>(
  ({ formId, eventId, formResponseId, canEditForm, isPreview, fulfilmentInfo }, ref) => {
    // if we are in preview mode, we can't edit the form
    canEditForm = isPreview === true ? false : canEditForm;

    const router = useRouter();
    const [form, setForm] = useState<Form | null>(null);
    const [organiser, setOrganiser] = useState<PublicUserData>(EmptyPublicUserData);
    const [loading, setLoading] = useState<boolean>(true);
    const [canEdit, setCanEdit] = useState<boolean>(canEditForm ?? false);

    function setCanEditWrapper(canEdit: boolean) {
      setCanEdit(canEditForm ?? canEdit);
    }

    const onSave = async (): Promise<FormResponseId | null> => {
      if (!form) return null;
      if (!canEdit) return null;
      const formResponse = extractFormResponseFromForm(formId, eventId, form);
      let resultFormResponseId: FormResponseId;

      if (formResponseId === null) {
        formResponderLogger.info(
          `Form response ID is null, creating a new form response for formId: ${formId}, eventId: ${eventId}`
        );
        // Since FormResponseId is null, this is a new form response and we save it to the temp collection
        const newFormResponseId = await createTempFormResponse(formResponse);
        formResponderLogger.info(
          `New form response created with ID: ${newFormResponseId}, formId: ${formId}, eventId: ${eventId}`
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
        // Since FormResponseId is not null, this is an existing form response
        // TODO: are we allowing to edit temp form response only (and not submitted ones)?
        await updateFormResponse(formId, eventId, formResponseId, formResponse);
        resultFormResponseId = formResponseId;
      }

      return resultFormResponseId;
    };

    // Expose the save function to parent components
    useImperativeHandle(
      ref,
      () => ({
        save: onSave,
      }),
      [form, canEdit, formResponseId, fulfilmentInfo]
    );

    useEffect(() => {
      const fetchFormData = async () => {
        if (!formId) {
          router.push("/error");
          return;
        }
        console.log("BRIAN DEBUG FETCHING FORM DATA", formId, eventId, formResponseId);
        if (isPreview === false) {
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

          if (isPreview === false) {
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
        if (!formResponseId) return;
        const docRef = await findFormResponseDocRef(formId, eventId, formResponseId);
        if (docRef.path.includes(FormResponsePaths.Temp)) {
          // Since the form response is in the temp collection, we can allow the user to edit the form response
          setCanEditWrapper(true);
        }
        // Now get the form response data itself
        const formResponseData = await getFormResponse(formId, eventId, formResponseId);
        setForm((prevForm) => {
          if (!prevForm) return prevForm;
          return {
            ...prevForm,
            responseSectionsOrder: formResponseData.responseSectionsOrder,
            sectionsMap: formResponseData.responseMap,
          };
        });
      };

      fetchFormData();
    }, []);

    const stringAnswerOnChange = (sectionId: SectionId, newAnswer: string) => {
      if (!form) return;

      setForm((prevForm) => {
        if (!prevForm) return prevForm;

        // Create a new Map copy
        const newSectionsMap = prevForm.sectionsMap;

        // Get the section to update
        const section = newSectionsMap[sectionId];
        if (!section) return prevForm; // no change if section not found

        // Update the answer (create a new object to keep immutability)
        const updatedSection = { ...section, answer: newAnswer };

        // Set it back into the new Map
        newSectionsMap[sectionId] = updatedSection;

        // Return a new form object with updated Map
        return {
          ...prevForm,
          sectionsMap: newSectionsMap,
        };
      });
    };

    if (loading) {
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
            <FormHeaderSectionResponse
              formTitle={form.title}
              formDescription={form.description}
              organiser={organiser}
            />
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
                default:
                  return null;
              }
            })}
            <div className={`w-full ${canEdit ? "flex" : "hidden"}`}>
              <div className="w-fit ml-auto bg-white py-2 px-4 rounded-lg flex justify-between gap-4">
                <InvertedHighlightButton type="submit" className="border-1 px-3 bg-white ml-auto" onClick={onSave}>
                  <span className="text-sm flex items-center gap-2">
                    <FloppyDiskIcon className="h-4 w-4" /> Save
                  </span>
                </InvertedHighlightButton>
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
