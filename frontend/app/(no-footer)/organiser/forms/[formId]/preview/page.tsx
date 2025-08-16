"use client";
import FormResponder from "@/components/forms/FormResponder";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const FormPreview = () => {
  const params = useParams();
  const formId = params?.formId as FormId;
  return (
    <div className="bg-core-hover h-screen overflow-hidden">
      <div className="mt-14">
        <OrganiserNavbar currPage="FormsGallery" />
      </div>
      <div className="py-20 h-full overflow-y-auto">
        <FormResponder formId={formId} eventId={""} formResponseId={null} isPreview={true} />;
      </div>
    </div>
  );
};

export default FormPreview;
