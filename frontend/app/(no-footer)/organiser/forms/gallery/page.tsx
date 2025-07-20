"use client";
import { FormPreviewCard } from "@/components/organiser/forms/FormPreviewCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { useUser } from "@/components/utility/UserContext";
import { EmptyForm, Form } from "@/interfaces/FormTypes";
import { getFormsForUser } from "@/services/src/forms/formsServices";
import { useEffect, useState } from "react";

const FormsGallery = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);
  const [forms, setForms] = useState<Form[]>(Array(8).fill(EmptyForm));

  useEffect(() => {
    const fetchForms = async () => {
      const forms = await getFormsForUser(user.userId);
      setForms(forms);
      setIsLoading(false);   
    };
    if (user.userId !== "") {
      fetchForms();
    }
  }, [user]);

  return (
    <div className="md:ml-14 mt-14">
      <OrganiserNavbar currPage="FormsGallery" />
      <div className="w-full flex justify-center">
        <div className="screen-width-primary">
          <h1 className="text-4xl md:text-5xl lg:text-6xl my-6">Form Gallery</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {forms.map((form) => {
              return (
                <FormPreviewCard
                  formDescription={form.description}
                  key={form.formId}
                  formTitle={form.title}
                  sectionsOrder={form.sectionsOrder}
                  sectionsMap={form.sectionsMap}
                  formId={form.formId}
                  lastUpdated={form.lastUpdated}
                  isLoading={isLoading}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormsGallery;

// [
//   {
//     title: "[Div 1 Mens 2025] Going Global SVL Try Outs",
//     userId: "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2",
//     formActive: true,
//     sectionsOrder: ["S123", "ABC"], // keeps track of ordering for editing forms
//     sectionsMap: new Map<SectionId, FormSection>([
//       [
//         "S123",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "What division do you play in SVL?",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//       [
//         "ABC",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "HOOO is big b brians best briend??",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//     ]),
//   },
//   {
//     title: "[Div 1 Mens 2025] Going Global SVL Try Outs",
//     userId: "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2",
//     formActive: true,
//     sectionsOrder: ["S123", "ABC"], // keeps track of ordering for editing forms
//     sectionsMap: new Map<SectionId, FormSection>([
//       [
//         "S123",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "What division do you play in SVL?",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//       [
//         "ABC",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "HOOO is big b brians best briend??",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//     ]),
//   },
//   {
//     title: "[Div 1 Mens 2025] Going Global SVL Try Outs",
//     userId: "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2",
//     formActive: true,
//     sectionsOrder: ["S123", "ABC"], // keeps track of ordering for editing forms
//     sectionsMap: new Map<SectionId, FormSection>([
//       [
//         "S123",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "What division do you play in SVL?",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//       [
//         "ABC",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "HOOO is big b brians best briend??",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//     ]),
//   },
//   {
//     title: "[Div 1 Mens 2025] Going Global SVL Try Outs",
//     userId: "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2",
//     formActive: true,
//     sectionsOrder: ["S123", "ABC"], // keeps track of ordering for editing forms
//     sectionsMap: new Map<SectionId, FormSection>([
//       [
//         "S123",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "What division do you play in SVL?",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//       [
//         "ABC",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "HOOO is big b brians best briend??",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//     ]),
//   },
//   {
//     title: "[Div 1 Mens 2025] Going Global SVL Try Outs",
//     userId: "c5vFAZ3NlSXVuHGrwlkCjJr3RXX2",
//     formActive: true,
//     sectionsOrder: ["S123", "ABC"], // keeps track of ordering for editing forms
//     sectionsMap: new Map<SectionId, FormSection>([
//       [
//         "S123",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "What division do you play in SVL?",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//       [
//         "ABC",
//         {
//           type: FormSectionType.TEXT,
//           answer: undefined,
//           question: "HOOO is big b brians best briend??",
//           imageUrl: null, // image attached to question
//           required: true,
//         },
//       ],
//     ]),
//   },
// ]
