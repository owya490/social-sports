"use client";
import { BlackHighlightButton } from "@/components/elements/HighlightButton";
import { DropdownSelectSectionResponse } from "@/components/forms/sections/dropdown-select-section/DropdownSelectSectionResponse";
import { FormHeaderSectionResponse } from "@/components/forms/sections/form-header-section/FormHeaderSectionResponse";
import { MutipleChoiceSectionResponse } from "@/components/forms/sections/multiple-choice-section/MutipleChoiceSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import { Form, FormSection, FormSectionType, SectionId } from "@/interfaces/FormTypes";
import { EmptyPublicUserData, PublicUserData } from "@/interfaces/UserTypes";
import { getPublicUserById } from "@/services/src/users/usersService";
import { useEffect, useState } from "react";

const ViewForm = () => {
  const [form, setForm] = useState<Form>({
    title: "[Div 1 Mens 2025] Going Global SVL Try Outs",
    userId: "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2",
    formActive: true,
    sectionsOrder: ["brian", "S123", "S456", "S789", "ABC"], // keeps track of ordering for editing forms
    sectionsMap: new Map<SectionId, FormSection>([
      [
        "S123",
        {
          type: FormSectionType.TEXT,
          answer: undefined,
          question: "What division do you play in SVL?",
          imageUrl: null, // image attached to question
          required: true,
        },
      ],
      [
        "ABC",
        {
          type: FormSectionType.TEXT,
          answer: undefined,
          question: "HOOO is big b brians best briend??",
          imageUrl: null, // image attached to question
          required: true,
        },
      ],
      [
        "S456",
        {
          type: FormSectionType.MULTIPLE_CHOICE,
          options: ["A", "B", "C", "D"],
          answer: undefined,
          question: "Select a multiple choice?",
          imageUrl: null, // image attached to question
          required: true,
        },
      ],
      [
        "S789",
        {
          type: FormSectionType.DROPDOWN_SELECT,
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          answer: undefined,
          question: "Select a drop down option please?",
          imageUrl: null, // image attached to question
          required: true,
        },
      ],
      [
        "brian",
        {
          type: FormSectionType.DROPDOWN_SELECT,
          options: ["Option 1", "Option 2", "Option 3", "Option 4"],
          answer: undefined,
          question: "Brian want?",
          imageUrl: null, // image attached to question
          required: true,
        },
      ],
    ]),
  });
  const [organiser, setOrganiser] = useState<PublicUserData>(EmptyPublicUserData);

  useEffect(() => {
    const fetchOrganiser = async () => {
      setOrganiser(await getPublicUserById(form.userId));
    };
    fetchOrganiser();
  }, [form]);

  const stringAnswerOnChange = (sectionId: SectionId, newAnswer: string) => {
    setForm((prevForm) => {
      // Create a new Map copy
      const newSectionsMap = new Map(prevForm.sectionsMap);

      // Get the section to update
      const section = newSectionsMap.get(sectionId);
      if (!section) return prevForm; // no change if section not found

      // Update the answer (create a new object to keep immutability)
      const updatedSection = { ...section, answer: newAnswer };

      // Set it back into the new Map
      newSectionsMap.set(sectionId, updatedSection);

      // Return a new form object with updated Map
      return {
        ...prevForm,
        sectionsMap: newSectionsMap,
      };
    });
  };

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
            const section = form.sectionsMap.get(sectionId)!; // force the not undefined for now
            switch (section.type) {
              case FormSectionType.TEXT:
                return (
                  <TextSectionResponse
                    textSection={section}
                    answerOnChange={(newAnswer: string) => {
                      stringAnswerOnChange(sectionId, newAnswer);
                    }}
                  />
                );
              case FormSectionType.MULTIPLE_CHOICE:
                return (
                  <MutipleChoiceSectionResponse
                    multipleChoiceSection={section}
                    answerOnChange={(newAnswer: string) => {
                      stringAnswerOnChange(sectionId, newAnswer);
                    }}
                  />
                );
              case FormSectionType.DROPDOWN_SELECT:
                return (
                  <DropdownSelectSectionResponse
                    dropdownSelectSection={section}
                    answerOnChange={(newAnswer: string) => {
                      stringAnswerOnChange(sectionId, newAnswer);
                    }}
                  />
                );
            }
          })}
          <div className="w-full flex">
            <BlackHighlightButton type="submit" text="Submit" className="border-1 px-3 bg-white ml-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewForm;
