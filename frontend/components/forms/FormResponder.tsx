"use client";
import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { DropdownSelectSectionResponse } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionResponse";
import { FormHeaderSectionResponse } from "@/components/forms/sections/form-header-section/FormHeaderSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import Loading from "@/components/loading/Loading";
import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponseId, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { FormResponsePaths } from "@/services/src/forms/formsConstants";
import {
  createFormResponse,
  formsServiceLogger,
  getForm,
  getFormIdByEventId,
  getFormResponse,
  updateFormResponse,
} from "@/services/src/forms/formsServices";
import { extractFormResponseFromForm } from "@/services/src/forms/formsUtils/createFormResponseUtils";
import { findFormResponseDocRef } from "@/services/src/forms/formsUtils/formsUtils";
import { getPublicUserById } from "@/services/src/users/usersService";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FormResponderProps {
  formId: FormId;
  eventId: EventId;
  formResponseId: FormResponseId | null;
  canEditForm?: boolean;
  isPreview?: boolean;
}

const FormResponder = ({ formId, eventId, formResponseId, canEditForm, isPreview }: FormResponderProps) => {
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

  useEffect(() => {
    const fetchFormData = async () => {
      if (!formId) {
        router.push("/error");
        return;
      }

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
          fetchFormResponseData();
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

  const onSubmit = () => {
    if (!form) return;
    if (!canEdit) return;
    const formResponse = extractFormResponseFromForm(formId, eventId, form);
    if (formResponseId === null) {
      // Since FormResponseId is null, this is a new form response and we save it to the temp collection
      createFormResponse(formResponse);
    } else {
      // Since FormResponseId is not null, this is an existing form response
      updateFormResponse(formId, eventId, formResponseId, formResponse);
    }
  };

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
    <div className="bg-core-hover min-h-screen pb-24">
      <div className="pt-20 flex w-screen justify-center">
        <div className="screen-width-primary space-y-8 md:px-32">
          <FormHeaderSectionResponse
            formTitle={form.title}
            formDescription="Welcome to the volleyball tryout registration! Please fill out this form to provide your personal details, volleyball experience, and position preferences. This information will help our coaches evaluate your skills and organize the tryouts effectively. Good luck!"
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
            <BlackHighlightButton type="submit" text="Submit" className="border-1 px-3 bg-white ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormResponder;
