"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { DropdownSelectSectionResponse } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionResponse";
import { HeaderSectionResponse } from "@/components/forms/sections/header-section/HeaderSectionResponse";
import { ImageSectionResponse } from "@/components/forms/sections/image-section/ImageSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import Loading from "@/components/loading/Loading";
import { EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { createSubmittedFormResponse, getForm } from "@/services/src/forms/formsServices";
import { extractFormResponseFromForm } from "@/services/src/forms/formsUtils/createFormResponseUtils";
import { getPublicUserById } from "@/services/src/users/usersService";
import { Tooltip } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const logger = new Logger("ManualSubmitFormLogger");

const ManualSubmitForm = ({ params }: { params: { formId: FormId; eventId: EventId } }) => {
  const { formId, eventId } = params;
  const router = useRouter();
  const [form, setForm] = useState<Form | null>(null);
  const [organiser, setOrganiser] = useState<PublicUserData>(EmptyPublicUserData);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        const formData = await getForm(formId);
        setForm(formData);

        const organiserData = await getPublicUserById(formData.userId);
        setOrganiser(organiserData);
      } catch (error) {
        logger.error(`Error fetching form: ${error}`);
        router.push("/error");
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [formId, eventId, router]);

  const areAllRequiredFieldsFilled = () => {
    if (!form) return false;

    return form.sectionsOrder.every((sectionId) => {
      const section = form.sectionsMap[sectionId];
      if (!section) return true;

      if (section.required) {
        switch (section.type) {
          case FormSectionType.TEXT:
          case FormSectionType.MULTIPLE_CHOICE:
          case FormSectionType.DROPDOWN_SELECT:
            return section.answer && section.answer.trim() !== "";
          case FormSectionType.FILE_UPLOAD:
            return section.fileUrl && section.fileUrl.trim() !== "";
          case FormSectionType.DATE_TIME:
            return section.timestamp && section.timestamp.trim() !== "";
          default:
            return false;
        }
      }

      return true;
    });
  };

  const stringAnswerOnChange = (sectionId: SectionId, newAnswer: string) => {
    if (!form) return;

    setForm((prevForm) => {
      if (!prevForm) return prevForm;

      const newSectionsMap = { ...prevForm.sectionsMap };
      const section = newSectionsMap[sectionId];
      if (!section) return prevForm;

      const updatedSection = { ...section, answer: newAnswer };
      newSectionsMap[sectionId] = updatedSection;

      return {
        ...prevForm,
        sectionsMap: newSectionsMap,
      };
    });
  };

  const onSubmit = async () => {
    if (!form) return;

    setSubmitting(true);
    try {
      const formResponse = extractFormResponseFromForm(formId, eventId, form);
      await createSubmittedFormResponse(formResponse);

      logger.info(`Successfully submitted form response for formId: ${formId}, eventId: ${eventId}`);
      router.push(`/organiser/event/${eventId}/forms`);
    } catch (error) {
      logger.error(`Error submitting form: ${error}`);
      alert("Failed to submit form response. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || submitting) {
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
        <div className="screen-width-primary space-y-8 md:px-32 py-20">
          <HeaderSectionResponse formTitle={form.title} formDescription={form.description} organiser={organiser} />
          {form.sectionsOrder.map((sectionId) => {
            const section = form.sectionsMap[sectionId];
            if (!section) return null;

            switch (section.type) {
              case FormSectionType.TEXT:
                return (
                  <TextSectionResponse
                    key={sectionId}
                    textSection={section}
                    answerOnChange={(newAnswer: string) => {
                      stringAnswerOnChange(sectionId, newAnswer);
                    }}
                    canEdit={true}
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
                    canEdit={true}
                  />
                );
              case FormSectionType.IMAGE:
                return <ImageSectionResponse key={sectionId} imageSection={section} />;
              default:
                return null;
            }
          })}
          <div className="w-full flex">
            <div className="w-fit ml-auto bg-white py-2 px-4 rounded-lg flex justify-between gap-4">
              {!areAllRequiredFieldsFilled() ? (
                <Tooltip
                  content="Please fill out all required sections before submitting"
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
                      <span className="text-sm">Submit</span>
                    </InvertedHighlightButton>
                  </div>
                </Tooltip>
              ) : (
                <InvertedHighlightButton
                  type="submit"
                  className="border-1 px-3 ml-auto bg-white"
                  onClick={onSubmit}
                  disabled={false}
                >
                  <span className="text-sm">Submit</span>
                </InvertedHighlightButton>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManualSubmitForm;
