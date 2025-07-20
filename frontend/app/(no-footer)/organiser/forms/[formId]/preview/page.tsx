"use client";
import FormResponder from "@/components/forms/FormResponder";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const FormPreview = () => {
  const params = useParams();
  const formId = params?.formId as FormId;
  return (
    <div>
      <div className="mt-14">
        <OrganiserNavbar currPage="FormsGallery" />
      </div>
      <FormResponder formId={formId} eventId={""} formResponseId={null} isPreview={true} />;
    </div>
  );
};

export default FormPreview;
