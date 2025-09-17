"use client";
import FormResponder from "@/components/forms/FormResponder";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

// This page is used to preview a form after it is built
const FormPreview = () => {
  const params = useParams();
  const formId = (typeof params?.formId === "string" ? params.formId : params.formId[0]) as FormId;
  return (
    <div className="bg-core-hover h-screen overflow-hidden">
      <div className="mt-8 sm:mt-14">
        <OrganiserNavbar currPage="FormsGallery" />
      </div>
      <div className="pt-10 pb-24 sm:pb-20 h-full overflow-y-auto">
        <FormResponder formId={formId} eventId={""} formResponseId={null} isPreview={true} />
      </div>
    </div>
  );
};

export default FormPreview;
