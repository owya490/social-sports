"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import { FormPreviewCard } from "@/components/organiser/forms/FormPreviewCard";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { useUser } from "@/components/utility/UserContext";
import { EmptyForm, Form, FormId } from "@/interfaces/FormTypes";
import { getFormsForUser } from "@/services/src/forms/formsServices";
import Link from "next/link";
import { useEffect, useState } from "react";

const FormsGallery = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(true);

  const [forms, setForms] = useState<Form[]>(
    Array.from({ length: 8 }, (_, i) => ({
      ...EmptyForm,
      formId: `${i + 1}` as FormId,
    }))
  );

  useEffect(() => {
    const fetchForms = async () => {
      const forms = await getFormsForUser(user.userId);
      setForms([...forms]);
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
          {/* create form button */}
          <div className="flex justify-end mb-4">
            <Link href="/organiser/forms/create-form/editor">
              <InvertedHighlightButton text="Create Form" className="px-4 py-2" />
            </Link>
          </div>
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
